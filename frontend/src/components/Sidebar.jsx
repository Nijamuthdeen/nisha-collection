import React from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Package, Receipt, History, Shirt, LogOut, X, Barcode } from 'lucide-react'

const NAV = [
  { to:'/dashboard', icon:LayoutDashboard, label:'Dashboard'      },
  { to:'/products',  icon:Package,         label:'Products'       },
  { to:'/billing',   icon:Receipt,         label:'New Bill'       },
  { to:'/history',   icon:History,         label:'History'        },
  { to:'/barcodes',  icon:Barcode,         label:'Barcodes'       },
]

export default function Sidebar({ isOpen, onClose, onLogout }) {
  return (
    <>
      <aside className="hidden lg:flex flex-col w-60 bg-white border-r border-gray-200 shrink-0 shadow-sm">
        <SidebarContent onLogout={onLogout} />
      </aside>
      <aside className={`fixed inset-y-0 left-0 z-30 flex flex-col w-60 bg-white border-r border-gray-200 shadow-xl
        transform transition-transform duration-300 lg:hidden
        ${isOpen?'translate-x-0':'-translate-x-full'}`}>
        <button onClick={onClose} className="absolute top-3 right-3 btn-ghost p-2 rounded-lg z-10">
          <X size={18}/>
        </button>
        <SidebarContent onLogout={onLogout} />
      </aside>
    </>
  )
}

function SidebarContent({ onLogout }) {
  const user = localStorage.getItem('nc_user') || 'Admin'
  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-sm shrink-0">
            <Shirt size={20} className="text-white"/>
          </div>
          <div className="min-w-0">
            <h1 className="font-display font-bold text-base text-gray-900 leading-tight truncate">Nisha Collection</h1>
            <p className="text-xs text-primary-600 font-semibold tracking-wide">Billing System</p>
          </div>
        </div>
        <div className="h-px bg-gray-100 mt-4"/>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-3 mb-2">Menu</p>
        {NAV.map(({ to, icon:Icon, label }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'nav-item-active' : ''}`}>
            <Icon size={17}/>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User & Logout */}
      <div className="p-3 border-t border-gray-100">
        <div className="flex items-center gap-3 px-2 py-2 mb-1">
          <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center shrink-0">
            <span className="text-primary-700 text-sm font-bold uppercase">{user[0]}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-700 truncate capitalize">{user}</p>
            <p className="text-xs text-gray-400">Administrator</p>
          </div>
        </div>
        <button onClick={onLogout}
          className="nav-item w-full text-red-500 hover:bg-red-50 hover:text-red-600">
          <LogOut size={16}/> Logout
        </button>
      </div>
    </div>
  )
}
