import React from 'react'

export function Spinner({ size = 20, className = '' }) {
  return (
    <div className={`spinner flex-shrink-0 ${className}`}
      style={{ width: size, height: size, borderWidth: size > 24 ? 3 : 2 }} />
  )
}

export function LoadingScreen({ text = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <Spinner size={36} />
      <p className="text-gray-400 text-sm">{text}</p>
    </div>
  )
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-2">
          <Icon size={24} className="text-gray-400" />
        </div>
      )}
      <h3 className="font-semibold text-gray-700">{title}</h3>
      {description && <p className="text-sm text-gray-400 max-w-xs">{description}</p>}
      {action}
    </div>
  )
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  if (!isOpen) return null
  const sizes = { sm:'max-w-sm', md:'max-w-lg', lg:'max-w-2xl', xl:'max-w-4xl' }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${sizes[size]} card animate-slide-up shadow-2xl max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0">
          <h3 className="font-display font-semibold text-lg text-gray-800">{title}</h3>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg text-gray-400 hover:text-gray-700 text-lg leading-none">×</button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

export function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, danger }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="text-gray-500 text-sm mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button onClick={onClose} className="btn-secondary">Cancel</button>
        <button onClick={() => { onConfirm(); onClose() }} className={danger ? 'btn-danger' : 'btn-primary'}>
          Confirm
        </button>
      </div>
    </Modal>
  )
}

export function FormField({ label, error, required, children }) {
  return (
    <div>
      <label className="input-label">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}
