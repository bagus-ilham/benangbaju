import { useEffect, useRef } from 'react'

export interface FocusTrapOptions {
  onClose?: () => void
  condition?: () => boolean
}

export function useFocusTrap(
  isActive: boolean,
  containerRef: React.RefObject<HTMLElement | null>,
  options: FocusTrapOptions = {}
) {
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const { onClose, condition } = options

  useEffect(() => {
    // If there's a condition function and it returns false, don't trap focus.
    if (isActive && condition && !condition()) {
      return
    }

    let originalOverflow = ''
    if (isActive) {
      originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      if (document.activeElement instanceof HTMLElement) {
        previousFocusRef.current = document.activeElement
      } else {
        previousFocusRef.current = null
      }
      setTimeout(() => containerRef.current?.focus(), 10)
    } else {
      previousFocusRef.current?.focus()
    }

    return () => {
      if (isActive && (!condition || condition())) {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [isActive, containerRef, condition])

  useEffect(() => {
    if (!isActive) return
    if (condition && !condition()) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (onClose) onClose()
        return
      }

      if (event.key !== 'Tab' || !containerRef.current) return

      const focusable = containerRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      const focusableList = Array.from(focusable).filter((el) => {
        return !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true'
      })

      if (focusableList.length === 0) {
        event.preventDefault()
        return
      }

      const first = focusableList[0]
      const last = focusableList[focusableList.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isActive, containerRef, onClose, condition])
}
