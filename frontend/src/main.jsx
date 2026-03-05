import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { RealtimeProvider } from './contexts/RealtimeContext'
import { CaptchaProvider } from './lib/useCaptcha'
import { NotificationsProvider } from './contexts/NotificationsContext'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <CaptchaProvider>
        <AuthProvider>
          <RealtimeProvider>
            <NotificationsProvider>
              <App />
            </NotificationsProvider>
          </RealtimeProvider>
        </AuthProvider>
      </CaptchaProvider>
    </BrowserRouter>
  </StrictMode>,
)
