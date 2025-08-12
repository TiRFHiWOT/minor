import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    // Guard for environments without window or matchMedia
    if (typeof window === "undefined") {
      setIsMobile(false)
      return
    }

    const onChange = () => {
      console.log('📱 Mobile hook: window width:', window.innerWidth, 'breakpoint:', MOBILE_BREAKPOINT);
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }

    try {
      // Initialize immediately
      onChange()

      const mql = typeof window.matchMedia === "function"
        ? window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
        : null

      if (mql) {
        // Prefer modern API
        if (typeof (mql as any).addEventListener === "function") {
          (mql as any).addEventListener("change", onChange)
          return () => (mql as any).removeEventListener?.("change", onChange)
        }
        // Fallback for older Safari/iOS
        if (typeof (mql as any).addListener === "function") {
          ;(mql as any).addListener(onChange)
          return () => (mql as any).removeListener?.(onChange)
        }
      }

      // Last-resort: window resize listener
      window.addEventListener("resize", onChange)
      return () => window.removeEventListener("resize", onChange)
    } catch {
      // Very old browsers: rely on resize
      window.addEventListener("resize", onChange)
      onChange()
      return () => window.removeEventListener("resize", onChange)
    }
  }, [])

  return !!isMobile
}
