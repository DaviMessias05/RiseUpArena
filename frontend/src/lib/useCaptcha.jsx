import { createContext, useContext, useCallback } from 'react'
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from 'react-google-recaptcha-v3'

const CaptchaContext = createContext({ executeRecaptcha: null })

function InnerCaptchaProvider({ children }) {
  const { executeRecaptcha } = useGoogleReCaptcha()
  return (
    <CaptchaContext.Provider value={{ executeRecaptcha }}>
      {children}
    </CaptchaContext.Provider>
  )
}

function NoopCaptchaProvider({ children }) {
  return (
    <CaptchaContext.Provider value={{ executeRecaptcha: null }}>
      {children}
    </CaptchaContext.Provider>
  )
}

export function CaptchaProvider({ children }) {
  const recaptchaKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY
  if (recaptchaKey) {
    return (
      <GoogleReCaptchaProvider reCaptchaKey={recaptchaKey}>
        <InnerCaptchaProvider>{children}</InnerCaptchaProvider>
      </GoogleReCaptchaProvider>
    )
  }
  return <NoopCaptchaProvider>{children}</NoopCaptchaProvider>
}

export function useCaptcha() {
  return useContext(CaptchaContext)
}
