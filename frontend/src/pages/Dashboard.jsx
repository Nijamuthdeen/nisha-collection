import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  IndianRupee, ShoppingBag, Package, AlertTriangle,
  ArrowRight, Receipt, RefreshCw, TrendingUp, Clock
} from 'lucide-react'
import { dashboardApi, formatCurrency, formatDate, ensureArray } from '../api'
import { LoadingScreen } from '../components/UI'

const PM_BADGE = { CASH:'badge-success', UPI:'badge-info', CARD:'badge-warning' }

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return '🌅 Good Morning'
  if (h < 17) return '☀️ Good Afternoon'
  return '🌙 Good Evening'
}

export default function Dashboard() {
  const [stats,      setStats]      = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(null)

  const fetchStats = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      else setRefreshing(true)
      const res = await dashboardApi.getStats()
      setStats(res.data)
      setLastUpdate(new Date())
    } catch { /* interceptor handles */ }
    finally { setLoading(false); setRefreshing(false) }
  }, [])

  useEffect(() => {
    fetchStats()
    const t = setInterval(() => fetchStats(true), 30000)   // auto-refresh every 30s
    return () => clearInterval(t)
  }, [fetchStats])

  if (loading) return <LoadingScreen text="Loading dashboard..."/>

  const recentInvoices = ensureArray(stats?.recentInvoices)
  const todaySales     = parseFloat(stats?.todaySales || 0)
  const billsToday     = stats?.todayBillsCount ?? 0
  const totalProducts  = stats?.totalProducts ?? 0
  const lowStockCount  = stats?.lowStockCount ?? 0

  const statCards = [
    {
      label:'Today\'s Sales', value: formatCurrency(todaySales),
      icon:IndianRupee, bg:'bg-primary-50', color:'text-primary-600', border:'border-primary-100',
      sub: billsToday > 0 ? `From ${billsToday} bill${billsToday>1?'s':''}` : 'No bills yet today',
    },
    {
      label:'Bills Today', value: billsToday,
      icon:ShoppingBag, bg:'bg-blue-50', color:'text-blue-600', border:'border-blue-100',
      sub:'Invoices generated today',
    },
    {
      label:'Total Products', value: totalProducts,
      icon:Package, bg:'bg-violet-50', color:'text-violet-600', border:'border-violet-100',
      sub:'Items in inventory',
    },
    {
      label:'Low Stock', value: lowStockCount,
      icon:AlertTriangle,
      bg: lowStockCount>0 ? 'bg-red-50'  : 'bg-gray-50',
      color: lowStockCount>0 ? 'text-red-500' : 'text-gray-400',
      border: lowStockCount>0 ? 'border-red-200' : 'border-gray-100',
      sub: lowStockCount>0 ? 'Need restocking now!' : 'All stocked well',
      alert: lowStockCount>0,
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Top row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm text-gray-500 font-medium">{getGreeting()},</p>
          <h2 className="font-display text-2xl font-bold text-gray-900">
            {localStorage.getItem('nc_user') || 'Admin'}
            <span className="text-primary-600"> 👋</span>
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdate && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Clock size={11}/> Updated {lastUpdate.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}
            </span>
          )}
          <button onClick={()=>fetchStats(true)} disabled={refreshing} className="btn-secondary gap-2 text-xs">
            <RefreshCw size={13} className={refreshing?'animate-spin':''}/> Refresh
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((c,i)=>{
          const Icon = c.icon
          return (
            <div key={i}
              className={`stat-card border ${c.border} ${c.alert?'ring-1 ring-red-200 animate-pulse':''}`}
              style={{animationDelay:`${i*60}ms`}}>
              <div className={`stat-icon ${c.bg}`}>
                <Icon size={20} className={c.color}/>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-400 font-medium">{c.label}</p>
                <p className="text-xl font-bold text-gray-900 font-display truncate mt-0.5">{c.value}</p>
                <p className={`text-xs mt-0.5 ${c.alert?'text-red-500 font-medium':'text-gray-400'}`}>{c.sub}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Low stock alert banner */}
      {lowStockCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
            <AlertTriangle size={20} className="text-amber-600"/>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-amber-800 text-sm">
              ⚠️ {lowStockCount} product{lowStockCount>1?'s are':' is'} running low on stock!
            </p>
            <p className="text-xs text-amber-600 mt-0.5">Restock soon to avoid billing failures</p>
          </div>
          <Link to="/products" className="btn text-xs py-2 bg-amber-500 hover:bg-amber-600 text-white shrink-0">
            View Products →
          </Link>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { to:'/billing',  icon:Receipt,  label:'Create New Bill',   sub:'Start a new invoice',    color:'text-primary-600', bg:'bg-primary-50' },
          { to:'/products', icon:Package,  label:'Manage Products',   sub:'Add or edit inventory',  color:'text-violet-600',  bg:'bg-violet-50'  },
        ].map(item=>{
          const Icon = item.icon
          return (
            <Link key={item.to} to={item.to}
              className="card-hover p-4 flex items-center justify-between group cursor-pointer">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 ${item.bg} rounded-xl flex items-center justify-center shrink-0`}>
                  <Icon size={20} className={item.color}/>
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{item.label}</p>
                  <p className="text-xs text-gray-400">{item.sub}</p>
                </div>
              </div>
              <ArrowRight size={16} className="text-gray-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all shrink-0"/>
            </Link>
          )
        })}
      </div>

      {/* Recent invoices */}
      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="section-title flex items-center gap-2">
            <TrendingUp size={17} className="text-primary-600"/> Recent Invoices
          </h3>
          <Link to="/history" className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1 font-semibold">
            View all <ArrowRight size={12}/>
          </Link>
        </div>

        {recentInvoices.length === 0
          ? (
            <div className="py-16 text-center">
              <Receipt size={36} className="text-gray-200 mx-auto mb-3"/>
              <p className="text-gray-400 font-medium">No invoices yet today</p>
              <p className="text-xs text-gray-300 mt-1">Create your first bill to see it here</p>
              <Link to="/billing" className="btn-primary mt-4 inline-flex gap-2 text-sm">
                <Receipt size={15}/> Create Bill
              </Link>
            </div>
          )
          : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Invoice No</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Payment</th>
                    <th>Total</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentInvoices.map(inv=>(
                    <tr key={inv.id}>
                      <td><span className="font-mono text-xs bg-primary-50 text-primary-700 font-bold px-2 py-0.5 rounded">{inv.invoiceNo}</span></td>
                      <td className="text-gray-600 text-sm">{inv.customerName||<span className="text-gray-300 text-xs">Walk-in</span>}</td>
                      <td className="text-gray-500 text-sm">{ensureArray(inv.items).length} item{ensureArray(inv.items).length!==1?'s':''}</td>
                      <td><span className={PM_BADGE[inv.paymentMethod]||'badge-gray'}>{inv.paymentMethod}</span></td>
                      <td className="font-bold text-primary-700">{formatCurrency(inv.grandTotal)}</td>
                      <td className="text-xs text-gray-400 whitespace-nowrap">{formatDate(inv.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </div>
    </div>
  )
}
