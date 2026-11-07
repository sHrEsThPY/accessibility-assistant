"""
Real Google + GitHub OAuth, plus email/password accounts.

Google: frontend GIS access token → POST /auth/google (verified with Google userinfo).
GitHub: browser redirect → /auth/github → GitHub → /auth/github/callback → frontend JWT.
"""

from __future__ import annotations

import os
import sqlite3
import threading
import uuid
from datetime import datetime, timedelta, timezone
from functools import wraps
from urllib.parse import urlencode

import jwt
import requests
from flask import jsonify, redirect, request
from werkzeug.security import check_password_hash, generate_password_hash

logger = None  # set in init_auth

_DB_LOCK = threading.Lock()
_DB_PATH = os.path.join(os.path.dirname(__file__), "data", "users.db")

JWT_ALG = "HS256"
JWT_TTL_HOURS = 72


def _jwt_secret() -> str:
    return os.environ.get("JWT_SECRET") or "dev-insecure-change-me"


def _frontend_origin() -> str:
    url = (os.environ.get("FRONTEND_URL") or "").strip()
    if not url or url == "*":
        return "http://localhost:5173"
    return url.rstrip("/")


def _backend_public_url() -> str:
    explicit = (
        os.environ.get("BACKEND_PUBLIC_URL")
        or os.environ.get("RENDER_EXTERNAL_URL")
        or ""
    ).strip()
    if explicit:
        return explicit.rstrip("/")
    return request.url_root.rstrip("/")


def _google_client_id() -> str:
    return (os.environ.get("GOOGLE_CLIENT_ID") or "").strip()


def _github_client_id() -> str:
    return (os.environ.get("GITHUB_CLIENT_ID") or "").strip()


def _github_client_secret() -> str:
    return (os.environ.get("GITHUB_CLIENT_SECRET") or "").strip()


def _ensure_db():
    os.makedirs(os.path.dirname(_DB_PATH), exist_ok=True)
    with _DB_LOCK:
        conn = sqlite3.connect(_DB_PATH)
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT NOT NULL,
                name TEXT,
                avatar TEXT,
                provider TEXT NOT NULL,
                provider_id TEXT,
                password_hash TEXT,
                created_at TEXT NOT NULL,
                UNIQUE(provider, provider_id)
            )
            """
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)"
        )
        conn.commit()
        conn.close()


def _connect():
    conn = sqlite3.connect(_DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def _row_to_user(row: sqlite3.Row) -> dict:
    return {
        "id": row["id"],
        "name": row["name"] or row["email"].split("@")[0],
        "email": row["email"],
        "avatar": row["avatar"],
        "provider": row["provider"],
    }


def _find_user(conn, *, email=None, provider=None, provider_id=None, user_id=None):
    if user_id:
        return conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    if provider and provider_id:
        row = conn.execute(
            "SELECT * FROM users WHERE provider = ? AND provider_id = ?",
            (provider, provider_id),
        ).fetchone()
        if row:
            return row
    if email:
        return conn.execute(
            "SELECT * FROM users WHERE lower(email) = lower(?) ORDER BY created_at ASC",
            (email,),
        ).fetchone()
    return None


def _upsert_oauth_user(*, email: str, name: str, avatar: str | None, provider: str, provider_id: str) -> dict:
    email = (email or "").strip().lower()
    if not email:
        raise ValueError("The account did not share an email address.")

    name = (name or email.split("@")[0]).strip()
    now = datetime.now(timezone.utc).isoformat()

    with _DB_LOCK:
        conn = _connect()
        try:
            existing = _find_user(conn, provider=provider, provider_id=provider_id, email=email)
            if existing:
                conn.execute(
                    """
                    UPDATE users
                    SET name = ?, avatar = COALESCE(?, avatar), email = ?
                    WHERE id = ?
                    """,
                    (name, avatar, email, existing["id"]),
                )
                conn.commit()
                row = _find_user(conn, user_id=existing["id"])
                return _row_to_user(row)

            user_id = str(uuid.uuid4())
            conn.execute(
                """
                INSERT INTO users (id, email, name, avatar, provider, provider_id, password_hash, created_at)
                VALUES (?, ?, ?, ?, ?, ?, NULL, ?)
                """,
                (user_id, email, name, avatar, provider, provider_id, now),
            )
            conn.commit()
            row = _find_user(conn, user_id=user_id)
            return _row_to_user(row)
        finally:
            conn.close()


def _issue_token(user: dict) -> str:
    payload = {
        "sub": user["id"],
        "email": user["email"],
        "name": user["name"],
        "provider": user["provider"],
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_TTL_HOURS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, _jwt_secret(), algorithm=JWT_ALG)


def _decode_token(token: str) -> dict:
    return jwt.decode(token, _jwt_secret(), algorithms=[JWT_ALG])


def _auth_payload(user: dict) -> dict:
    return {"token": _issue_token(user), "user": user}


def _google_profile_from_access_token(access_token: str) -> dict:
    resp = requests.get(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        headers={"Authorization": f"Bearer {access_token}"},
        timeout=15,
    )
    if resp.status_code != 200:
        raise ValueError("Google could not verify this sign-in. Please try again.")
    info = resp.json()
    if info.get("email_verified") is False:
        raise ValueError("Google email is not verified.")
    if not info.get("email"):
        raise ValueError("Google did not return an email address.")
    return {
        "email": info["email"],
        "name": info.get("name") or info.get("given_name") or info["email"].split("@")[0],
        "avatar": info.get("picture"),
        "provider_id": info.get("sub") or info["email"],
    }


def _google_profile_from_id_token(credential: str) -> dict:
    resp = requests.get(
        "https://oauth2.googleapis.com/tokeninfo",
        params={"id_token": credential},
        timeout=15,
    )
    if resp.status_code != 200:
        raise ValueError("Google ID token is invalid or expired.")
    info = resp.json()
    client_id = _google_client_id()
    if client_id and info.get("aud") != client_id:
        raise ValueError("Google token was issued for a different app.")
    if str(info.get("email_verified")).lower() not in ("true", "1"):
        raise ValueError("Google email is not verified.")
    if not info.get("email"):
        raise ValueError("Google did not return an email address.")
    return {
        "email": info["email"],
        "name": info.get("name") or info.get("given_name") or info["email"].split("@")[0],
        "avatar": info.get("picture"),
        "provider_id": info.get("sub") or info["email"],
    }


def current_user_from_request():
    header = request.headers.get("Authorization") or ""
    if not header.startswith("Bearer "):
        return None
    token = header[7:].strip()
    if not token:
        return None
    try:
        payload = _decode_token(token)
    except jwt.PyJWTError:
        return None
    with _DB_LOCK:
        conn = _connect()
        try:
            row = _find_user(conn, user_id=payload.get("sub"))
            return _row_to_user(row) if row else None
        finally:
            conn.close()


def require_auth(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        user = current_user_from_request()
        if not user:
            return jsonify({"error": "Please sign in to continue."}), 401
        request.current_user = user
        return fn(*args, **kwargs)

    return wrapper


def init_auth(app):
    global logger
    logger = app.logger
    _ensure_db()

    @app.get("/auth/config")
    def auth_config():
        google_id = _google_client_id()
        github_ok = bool(_github_client_id() and _github_client_secret())
        return jsonify({
            "google": bool(google_id),
            "github": github_ok,
            "google_client_id": google_id,
        })

    @app.get("/auth/me")
    def auth_me():
        user = current_user_from_request()
        if not user:
            return jsonify({"error": "Not signed in."}), 401
        return jsonify({"user": user})

    @app.post("/auth/signup")
    def auth_signup():
        payload = request.get_json(silent=True) or {}
        name = (payload.get("name") or "").strip()
        email = (payload.get("email") or "").strip().lower()
        password = payload.get("password") or ""
        if not name or not email or not password:
            return jsonify({"error": "Please fill in all fields."}), 400
        if len(password) < 6:
            return jsonify({"error": "Password must be at least 6 characters."}), 400

        now = datetime.now(timezone.utc).isoformat()
        with _DB_LOCK:
            conn = _connect()
            try:
                existing = conn.execute(
                    "SELECT * FROM users WHERE lower(email) = lower(?)",
                    (email,),
                ).fetchone()
                if existing:
                    return jsonify({"error": "An account with this email already exists. Sign in instead."}), 409
                user_id = str(uuid.uuid4())
                conn.execute(
                    """
                    INSERT INTO users (id, email, name, avatar, provider, provider_id, password_hash, created_at)
                    VALUES (?, ?, ?, NULL, 'email', ?, ?, ?)
                    """,
                    (user_id, email, name, email, generate_password_hash(password), now),
                )
                conn.commit()
                user = _row_to_user(_find_user(conn, user_id=user_id))
            finally:
                conn.close()
        return jsonify(_auth_payload(user)), 201

    @app.post("/auth/login")
    def auth_login():
        payload = request.get_json(silent=True) or {}
        email = (payload.get("email") or "").strip().lower()
        password = payload.get("password") or ""
        if not email or not password:
            return jsonify({"error": "Please fill in all fields."}), 400

        with _DB_LOCK:
            conn = _connect()
            try:
                row = conn.execute(
                    "SELECT * FROM users WHERE lower(email) = lower(?) AND provider = 'email'",
                    (email,),
                ).fetchone()
            finally:
                conn.close()

        if not row or not row["password_hash"] or not check_password_hash(row["password_hash"], password):
            return jsonify({"error": "Invalid email or password."}), 401
        return jsonify(_auth_payload(_row_to_user(row)))

    @app.post("/auth/google")
    def auth_google():
        if not _google_client_id():
            return jsonify({
                "error": "Google sign-in is not configured. Set GOOGLE_CLIENT_ID on the server."
            }), 503

        payload = request.get_json(silent=True) or {}
        access_token = payload.get("access_token")
        credential = payload.get("credential")
        try:
            if access_token:
                profile = _google_profile_from_access_token(access_token)
            elif credential:
                profile = _google_profile_from_id_token(credential)
            else:
                return jsonify({"error": "Missing Google access token."}), 400
        except ValueError as exc:
            return jsonify({"error": str(exc)}), 401
        except requests.RequestException:
            logger.exception("Google userinfo request failed")
            return jsonify({"error": "Could not reach Google. Please try again."}), 503

        user = _upsert_oauth_user(
            email=profile["email"],
            name=profile["name"],
            avatar=profile["avatar"],
            provider="google",
            provider_id=str(profile["provider_id"]),
        )
        logger.info("Google sign-in | email=%s", user["email"])
        return jsonify(_auth_payload(user))

    @app.get("/auth/github")
    def auth_github_start():
        if not (_github_client_id() and _github_client_secret()):
            return jsonify({
                "error": "GitHub sign-in is not configured. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET."
            }), 503

        state = jwt.encode(
            {"exp": datetime.now(timezone.utc) + timedelta(minutes=10), "p": "github"},
            _jwt_secret(),
            algorithm=JWT_ALG,
        )
        params = {
            "client_id": _github_client_id(),
            "redirect_uri": f"{_backend_public_url()}/auth/github/callback",
            "scope": "read:user user:email",
            "state": state,
            "allow_signup": "true",
        }
        return redirect(f"https://github.com/login/oauth/authorize?{urlencode(params)}")

    @app.get("/auth/github/callback")
    def auth_github_callback():
        frontend = _frontend_origin()
        error = request.args.get("error")
        if error:
            return redirect(f"{frontend}/auth/callback?error={error}")

        state = request.args.get("state") or ""
        code = request.args.get("code") or ""
        try:
            jwt.decode(state, _jwt_secret(), algorithms=[JWT_ALG])
        except jwt.PyJWTError:
            return redirect(f"{frontend}/auth/callback?error=invalid_state")

        if not code:
            return redirect(f"{frontend}/auth/callback?error=missing_code")

        try:
            token_resp = requests.post(
                "https://github.com/login/oauth/access_token",
                headers={"Accept": "application/json"},
                data={
                    "client_id": _github_client_id(),
                    "client_secret": _github_client_secret(),
                    "code": code,
                    "redirect_uri": f"{_backend_public_url()}/auth/github/callback",
                },
                timeout=15,
            )
            token_resp.raise_for_status()
            token_data = token_resp.json()
            access_token = token_data.get("access_token")
            if not access_token:
                desc = token_data.get("error_description") or token_data.get("error") or "token_exchange_failed"
                return redirect(f"{frontend}/auth/callback?error={desc}")

            headers = {
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
            }
            user_resp = requests.get("https://api.github.com/user", headers=headers, timeout=15)
            user_resp.raise_for_status()
            gh_user = user_resp.json()

            email = gh_user.get("email")
            if not email:
                emails_resp = requests.get("https://api.github.com/user/emails", headers=headers, timeout=15)
                emails_resp.raise_for_status()
                emails_payload = emails_resp.json()
                emails = emails_payload if isinstance(emails_payload, list) else []
                primary = next((e for e in emails if e.get("primary") and e.get("verified")), None)
                verified = next((e for e in emails if e.get("verified")), None)
                email = (primary or verified or (emails[0] if emails else {})).get("email")

            if not email:
                return redirect(f"{frontend}/auth/callback?error=no_github_email")

            user = _upsert_oauth_user(
                email=email,
                name=gh_user.get("name") or gh_user.get("login") or email.split("@")[0],
                avatar=gh_user.get("avatar_url"),
                provider="github",
                provider_id=str(gh_user.get("id")),
            )
            token = _issue_token(user)
            logger.info("GitHub sign-in | email=%s", user["email"])
            return redirect(f"{frontend}/auth/callback?token={token}")
        except requests.RequestException:
            logger.exception("GitHub OAuth failed")
            return redirect(f"{frontend}/auth/callback?error=github_failed")
