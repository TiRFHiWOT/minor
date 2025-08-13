import * as React from "react"

// Align with Tailwind's 'sm' breakpoint (640px)
const MOBILE_BREAKPOINT = 640

// Server-side safe initial state
const getInitialIsMobile = () => {
  if (typeof window === 'undefined') return false
  return window.innerWidth < MOBILE_BREAKPOINT
}

export function useIsMobile() {
  // Initialize with actual state instead of undefined to prevent layout shifts
  const [isMobile, setIsMobile] = React.useState(getInitialIsMobile)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    
    // Set initial state immediately
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isMobile
}
