import { useState, useCallback, createContext, useContext, ReactNode } from 'react'
import { ToastNotification } from '@carbon/react'
import { createPortal } from 'react-dom'

interface Toast {
  id: number
  title: string
  subtitle?: string
  kind: 'success' | 'error' | 'info' | 'warning'
}

interface ToastContextValue {
  showToast: (toast: Omit<Toast, 'id'>) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

let toastId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = ++toastId
    setToasts((prev) => [...prev, { ...toast, id }])

    // Auto dismiss after 3s
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }, [])

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {typeof document !== 'undefined' &&
        createPortal(
          <div className="toast-container">
            {toasts.map((toast) => (
              <ToastNotification
                key={toast.id}
                kind={toast.kind}
                title={toast.title}
                subtitle={toast.subtitle}
                onClose={() => removeToast(toast.id)}
                lowContrast
                className="toast-notification"
              />
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) {
    // Return a no-op if no provider (for graceful degradation)
    return {
      showToast: () => {
        console.warn('useToast: ToastProvider not found')
      },
    }
  }
  return context
}
