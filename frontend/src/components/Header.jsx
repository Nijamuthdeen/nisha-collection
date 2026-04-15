import React from 'react'
import { useLocation } from 'react-router-dom'
import { Menu, LogOut } from 'lucide-react'

const TITLES = {
  'dashboard': { title:'Dashboard',       sub:"Today's overview" },
  'products':  { title:'Products',        sub:'Manage inventory' },
  'billing':   { title:'New Bill',        sub:'Create invoice'   },
  'history':   { title:'Invoice History', sub:'All past invoices'},
  'barcodes':  { title:'Barcode Manager', sub:'Print product barcodes'},
}

export default function Header({ onMenuClick, onLogout }) {
  const { pathname } = useLocation()
  const key  = pathname.split('/')[1] || 'dashboard'
  const page = TITLES[key] || { title:'Nisha Collection', sub:'' }
  const dateStr = new Date().toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short',year:'numeric'})

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shadow-sm shrink-0 no-print">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="lg:hidden btn-ghost p-2 rounded-lg">
          <Menu size={20}/>
        </button>
        <div>
          <h2 className="font-display font-bold text-base text-gray-900 leading-none">{page.title}</h2>
          <p className="text-xs text-gray-400 mt-0.5">{page.sub}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden sm:block text-xs text-gray-400 font-medium">{dateStr}</span>
        <button onClick={onLogout}
          className="btn text-xs py-2 px-3 text-red-500 hover:bg-red-50 hover:text-red-600 border border-red-100 rounded-lg gap-1.5">
          <LogOut size={13}/> <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  )
}
