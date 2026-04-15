import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Sidebar        from './components/Sidebar'
import Header         from './components/Header'
import Login          from './pages/Login'
import Dashboard      from './pages/Dashboard'
import Products       from './pages/Products'
import Billing        from './pages/Billing'
import InvoiceHistory from './pages/InvoiceHistory'
import Barcodes       from './pages/Barcodes'

function PrivateRoute({ children }) {
  return localStorage.getItem('nc_token')
    ? children
    : <Navigate to="/login" replace />
}

function Layout({ children, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={()=>setSidebarOpen(false)} onLogout={onLogout}/>
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/40 lg:hidden" onClick={()=>setSidebarOpen(false)}/>
      )}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header onMenuClick={()=>setSidebarOpen(true)} onLogout={onLogout}/>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  )
}

export default function App() {
  const [authed, setAuthed] = useState(!!localStorage.getItem('nc_token'))

  function handleLogin(token, user) {
    localStorage.setItem('nc_token', token)
    localStorage.setItem('nc_user', user)
    setAuthed(true)
  }

  function handleLogout() {
    localStorage.removeItem('nc_token')
    localStorage.removeItem('nc_user')
    setAuthed(false)
  }

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/login" element={
          authed ? <Navigate to="/dashboard" replace/> : <Login onLogin={handleLogin}/>
        }/>
        <Route path="/*" element={
          <PrivateRoute>
            <Layout onLogout={handleLogout}>
              <Routes>
                <Route index       element={<Navigate to="/dashboard" replace/>}/>
                <Route path="dashboard" element={<Dashboard/>}/>
                <Route path="products"  element={<Products/>}/>
                <Route path="billing"   element={<Billing/>}/>
                <Route path="history"   element={<InvoiceHistory/>}/>
                <Route path="barcodes"  element={<Barcodes/>}/>
                <Route path="*"         element={<Navigate to="/dashboard" replace/>}/>
              </Routes>
            </Layout>
          </PrivateRoute>
        }/>
      </Routes>

      <Toaster position="top-right" toastOptions={{
        style:{
          background:'#fff', color:'#1f2937',
          border:'1px solid #e5e7eb', borderRadius:'12px',
          fontSize:'14px', fontFamily:'Inter,sans-serif',
          boxShadow:'0 4px 20px rgba(0,0,0,0.1)',
        },
        success:{ iconTheme:{ primary:'#16a34a', secondary:'#fff' } },
        error:  { iconTheme:{ primary:'#dc2626', secondary:'#fff' } },
        duration: 3000,
      }}/>
    </BrowserRouter>
  )
}
