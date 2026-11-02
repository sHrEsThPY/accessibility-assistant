#!/usr/bin/env bash
# build.sh — Render Build Script for Backend
# This script is run by Render during the build phase.
# Set this as the "Build Command" in Render's dashboard.

set -o errexit   # Exit on error
set -o pipefail  # Catch errors in pipelines

echo ">>> Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo ">>> Build complete!"
