import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 5000,
        style: {
          background: '#1e1e35',
          color: '#e2e8f0',
          border: '1px solid #2a2a45',
          borderRadius: '12px',
          fontSize: '14px',
        },
        success: { iconTheme: { primary: '#22c55e', secondary: '#1e1e35' } },
        error:   { iconTheme: { primary: '#ef4444', secondary: '#1e1e35' }, duration: 7000 },
      }}
    />
    <App />
  </StrictMode>,
)
