import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// iOS ignores user-scalable=no since iOS 10 — prevent pinch zoom via JS
document.addEventListener('touchmove', (e) => {
  if (e.touches.length > 1) e.preventDefault()
}, { passive: false })

document.addEventListener('gesturestart', (e) => {
  e.preventDefault()
}, { passive: false })

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
