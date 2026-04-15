import React, { useState } from 'react'
import { Shirt, Eye, EyeOff, LogIn } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '../api'

export default function Login({ onLogin }) {
  const [form, setForm]       = useState({ username: '', password: '' })
  const [showPw, setShowPw]   = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.username.trim() || !form.password.trim()) {
      toast.error('Enter username and password')
      return
    }
    setLoading(true)
    try {
      const res = await authApi.login(form)
      toast.success('Welcome back!')
      onLogin(res.data.token, res.data.username)
    } catch {
      // error toast handled by interceptor
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-200">
            <Shirt size={30} className="text-white" />
          </div>
          <h1 className="font-display text-3xl font-bold text-gray-900">Nisha Collection</h1>
          <p className="text-gray-500 text-sm mt-1">Billing & Inventory Management</p>
        </div>

        {/* Card */}
        <div className="card p-8 shadow-card-lg">
          <h2 className="font-display text-xl font-semibold text-gray-800 mb-6">Admin Login</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="input-label">Username</label>
              <input
                className="input"
                type="text"
                placeholder="Enter username"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                autoFocus
                autoComplete="username"
              />
            </div>

            <div>
              <label className="input-label">Password</label>
              <div className="relative">
                <input
                  className="input pr-11"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Enter password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2 text-base">
              {loading
                ? <><span className="spinner w-4 h-4" /> Signing in...</>
                : <><LogIn size={18} /> Sign In</>}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-gray-100">
            <p className="text-xs text-center text-gray-400">
              Default: <span className="font-mono text-gray-600">admin / nisha@123</span>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">© 2025 Nisha Collection, Chennai</p>
      </div>
    </div>
  )
}
