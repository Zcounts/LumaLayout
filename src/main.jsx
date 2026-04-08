import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { installGlobalDiagnostics, recordDiagnostic } from './diagnostics/runtimeDiagnostics'

installGlobalDiagnostics()
recordDiagnostic('app-bootstrap', {
  userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
