'use client'

import { cn } from '@/lib/utils'
import { createContext, useCallback, useContext, useState, useEffect } from 'react'

interface ToastData {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastData['type']) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([])

  const showToast = useCallback((message: string, type: ToastData['type'] = 'success') => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={cn(
              'px-4 py-2.5 rounded-lg text-sm font-medium text-white shadow-lg',
              'animate-in fade-in slide-in-from-bottom-2',
              {
                'bg-green-500': toast.type === 'success',
                'bg-red-500': toast.type === 'error',
                'bg-gray-800': toast.type === 'info',
              }
            )}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

// Simple Toast component for standalone usage
interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info'
  onClose: () => void
  duration?: number
}

export function Toast({ message, type = 'success', onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [onClose, duration])

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <div
        className={cn(
          'px-4 py-2.5 rounded-lg text-sm font-medium text-white shadow-lg',
          'animate-in fade-in slide-in-from-bottom-2',
          {
            'bg-green-500': type === 'success',
            'bg-red-500': type === 'error',
            'bg-gray-800': type === 'info',
          }
        )}
      >
        {message}
      </div>
    </div>
  )
}
