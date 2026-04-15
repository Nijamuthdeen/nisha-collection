import React, { useEffect, useState, useCallback } from 'react'
import { Search, Filter, Calendar, Receipt, Eye, Printer, X, RefreshCw, TrendingUp } from 'lucide-react'
import { invoicesApi, formatCurrency, formatDate, formatDateOnly, ensureArray } from '../api'
import { LoadingScreen, EmptyState, Modal } from '../components/UI'

const CGST = 9
const SGST = 9
const PM_BADGE = { CASH:'badge-success', UPI:'badge-info', CARD:'badge-warning' }
const SHOP = { name:'Nisha Collection', address:'No:5, M.N.K Complex', city:'Arasarkulam - 614801', phone:'8838922503', email:'nishacollection@gmail.com' }

function fmtINR(v) { return '₹'+parseFloat(v||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2}) }
const ones=['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen']
const tenW=['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety']
function n2w(n){if(n<=0)return'Zero';if(n<20)return ones[n];if(n<100)return tenW[Math.floor(n/10)]+(n%10?' '+ones[n%10]:'');if(n<1000)return ones[Math.floor(n/100)]+' Hundred'+(n%100?' '+n2w(n%100):'');if(n<100000)return n2w(Math.floor(n/1000))+' Thousand'+(n%1000?' '+n2w(n%1000):'');return n2w(Math.floor(n/100000))+' Lakh'+(n%100000?' '+n2w(n%100000):'');}
function amtWords(a){const v=Math.round(parseFloat(a||0)*100)/100;const r=Math.floor(v),p=Math.round((v-r)*100);return n2w(r)+' Rupees'+(p>0?' and '+n2w(p)+' Paise':'')+' Only';}

function buildPrintHTML(inv) {
  const items=ensureArray(inv?.items),sub=parseFloat(inv?.subtotal||0),cg=parseFloat(inv?.cgst||0),sg=parseFloat(inv?.sgst||0),gt=parseFloat(inv?.grandTotal||0),pm=inv?.paymentMethod||'CASH'
  const bc=`https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(inv?.invoiceNo||'NC')}&scale=2&height=10&includetext&textxalign=center`
  const qr=`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(`${SHOP.name}|${inv?.invoiceNo}|${fmtINR(gt)}`)}`
  const rows=items.map((it,i)=>`<tr><td style="padding:9px 12px;color:#999;font-weight:600;font-size:11px">${String(i+1).padStart(2,'0')}</td><td style="padding:9px 12px"><div style="font-weight:600">${it.productName}</div>${it.barcode?`<div style="font-size:9px;color:#bbb;font-family:monospace">${it.barcode}</div>`:''}</td><td style="padding:9px 12px;text-align:right">${it.quantity}</td><td style="padding:9px 12px;text-align:right">${fmtINR(it.unitPrice)}</td><td style="padding:9px 12px;text-align:right;font-weight:700">${fmtINR(it.totalPrice)}</td></tr>`).join('')
  return `<!DOCTYPE html><html><head><title>${inv?.invoiceNo}</title><style>@page{size:A4;margin:10mm}*{box-sizing:border-box;margin:0;padding:0;font-family:Arial,sans-serif}body{background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact;font-size:12px}table{width:100%;border-collapse:collapse}th{padding:8px 12px;font-size:9px;font-weight:700;color:#666;letter-spacing:1px;text-transform:uppercase;border-bottom:1px solid #e0e0e0;background:#f5f5f5}.right{text-align:right}</style></head><body>
  <div style="max-width:720px;margin:0 auto">
  <div style="background:#0f9d8c;color:#fff;padding:20px 26px;display:flex;justify-content:space-between;align-items:flex-start;border-radius:10px 10px 0 0">
    <div><div style="font-size:20px;font-weight:bold;margin-bottom:8px">${SHOP.name}</div><div style="line-height:1.8;opacity:.93;font-size:11px"><div>${SHOP.address}</div><div>${SHOP.city}</div><div>Phone: ${SHOP.phone}</div><div>Email: ${SHOP.email}</div></div></div>
    <div style="text-align:right"><div style="background:rgba(255,255,255,.2);border:1px solid rgba(255,255,255,.5);border-radius:5px;padding:4px 14px;font-weight:bold;letter-spacing:2px;font-size:12px;margin-bottom:10px">TAX INVOICE</div><div style="line-height:2;font-size:11px"><div style="font-weight:bold;font-size:13px">${inv?.invoiceNo||'—'}</div><div>${formatDateOnly(inv?.createdAt)}</div></div></div>
  </div>
  <div style="border:1px solid #e0e0e0;border-top:none;border-radius:0 0 10px 10px;overflow:hidden">
    <div style="padding:12px 24px;background:#fafafa;border-bottom:1px solid #f0f0f0"><div style="font-size:9px;font-weight:700;color:#999;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:6px">Bill To</div><div style="background:#fff;border:1px solid #eee;border-radius:7px;padding:10px 14px">${inv?.customerName?`<div style="font-weight:600;font-size:13px;margin-bottom:2px">${inv.customerName}</div>`:''}<div style="${inv?.customerMobile?'font-weight:bold;font-size:14px':'color:#aaa;font-size:12px'}">${inv?.customerMobile||'Walk-in Customer'}</div></div></div>
    <table><thead><tr><th>#</th><th>Item</th><th class="right">QTY</th><th class="right">Price</th><th class="right">Amount</th></tr></thead><tbody>${rows||'<tr><td colspan="5" style="padding:14px;text-align:center;color:#ccc">No items</td></tr>'}</tbody></table>
    <div style="display:grid;grid-template-columns:1fr 1fr;border-top:2px solid #f0f0f0;background:#fafafa">
      <div style="padding:16px 20px;border-right:1px solid #eee"><div style="font-size:9px;font-weight:700;color:#999;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:10px">Payment Breakdown</div><div style="background:#fff;border:1px solid #eee;border-radius:8px;padding:12px 16px"><div style="display:inline-block;background:#f0e8ff;color:#7c3aed;border-radius:4px;padding:2px 12px;font-size:10px;font-weight:700;margin-bottom:6px">${pm}</div><div style="font-size:20px;font-weight:bold;color:#7c3aed">${fmtINR(gt)}</div></div></div>
      <div style="padding:16px 20px"><table style="font-size:11px"><tr><td style="padding:3px 0;color:#555">Subtotal</td><td style="padding:3px 0;text-align:right">${fmtINR(sub)}</td></tr><tr><td style="padding:3px 0;color:#555">CGST (${CGST}%)</td><td style="padding:3px 0;text-align:right">${fmtINR(cg)}</td></tr><tr><td style="padding:3px 0;color:#555">SGST (${SGST}%)</td><td style="padding:3px 0;text-align:right">${fmtINR(sg)}</td></tr><tr style="border-top:2px solid #222"><td style="padding:7px 0 2px;font-weight:bold;font-size:13px">Grand Total</td><td style="padding:7px 0 2px;text-align:right;font-weight:bold;font-size:15px;color:#0f9d8c">${fmtINR(gt)}</td></tr></table></div>
    </div>
    <div style="padding:11px 24px;background:#f0fffe;border-top:1px solid #d4f0ed"><div style="font-size:9px;font-weight:700;color:#888;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:4px">Amount in Words</div><div style="font-style:italic;color:#333;font-weight:500;font-size:12px">${amtWords(gt)}</div></div>
    <div style="display:flex;justify-content:space-between;align-items:flex-end;padding:14px 26px 20px;border-top:1px solid #eee;background:#fff"><div style="text-align:center"><img src="${bc}" style="height:46px;max-width:160px" onerror="this.style.display='none'"/><div style="font-size:9px;color:#aaa;margin-top:4px;font-family:monospace">${inv?.invoiceNo||''}</div></div><div style="text-align:center"><img src="${qr}" style="width:74px;height:74px"/><div style="font-size:9px;color:#aaa;margin-top:4px">Scan for details</div></div></div>
    <div style="text-align:center;padding:10px;background:#f9f9f9;border-top:1px solid #f0f0f0;font-size:11px;color:#888">Thank you for shopping at Nisha Collection! 🙏</div>
  </div></div></body></html>`
}

export default function InvoiceHistory() {
  const [invoices,  setInvoices]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [searchQ,   setSearchQ]   = useState('')
  const [fromDate,  setFrom]      = useState('')
  const [toDate,    setTo]        = useState('')
  const [filterPM,  setFilterPM]  = useState('')
  const [viewInv,   setViewInv]   = useState(null)

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true)
      const res = await invoicesApi.getAll()
      const data = ensureArray(res.data)
      console.log('Invoices fetched:', data.length, data)  // debug
      setInvoices(data)
    } catch(e) {
      console.error('Fetch invoices error:', e)
      setInvoices([])
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  async function applyDateFilter() {
    if (!fromDate || !toDate) { alert('Select both dates'); return }
    try {
      setLoading(true)
      const res = await invoicesApi.getByDateRange(fromDate, toDate)
      setInvoices(ensureArray(res.data))
    } catch { setInvoices([]) } finally { setLoading(false) }
  }

  function clearFilters() { setFrom(''); setTo(''); setFilterPM(''); setSearchQ(''); fetchAll() }

  const filtered = invoices.filter(inv => {
    const q = searchQ.toLowerCase()
    return (!q || (inv.invoiceNo||'').toLowerCase().includes(q) || (inv.customerName||'').toLowerCase().includes(q) || (inv.customerMobile||'').includes(q))
        && (!filterPM || inv.paymentMethod === filterPM)
  })

  const totalRev = filtered.reduce((s,i)=>s+parseFloat(i.grandTotal||0),0)

  function handlePrint(inv) {
    const w = window.open('','_blank','width=820,height=950')
    w.document.write(buildPrintHTML(inv))
    w.document.close(); w.focus()
    setTimeout(()=>{ w.print(); w.close() }, 700)
  }

  if (loading) return <LoadingScreen text="Loading invoices..."/>

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Filters */}
      <div className="card p-4 space-y-3">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input className="input pl-9" placeholder="Search invoice no, customer, mobile..."
              value={searchQ} onChange={e=>setSearchQ(e.target.value)}/>
            {searchQ&&<button onClick={()=>setSearchQ('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><X size={14}/></button>}
          </div>
          <select className="input w-auto min-w-36" value={filterPM} onChange={e=>setFilterPM(e.target.value)}>
            <option value="">All Payments</option>
            <option value="CASH">Cash</option><option value="UPI">UPI</option><option value="CARD">Card</option>
          </select>
          <button onClick={fetchAll} className="btn-secondary gap-1.5" title="Refresh"><RefreshCw size={14}/></button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Calendar size={14} className="text-gray-400 shrink-0"/>
          <input type="date" className="input w-auto text-sm" value={fromDate} onChange={e=>setFrom(e.target.value)}/>
          <span className="text-gray-400 text-xs">to</span>
          <input type="date" className="input w-auto text-sm" value={toDate} onChange={e=>setTo(e.target.value)}/>
          <button onClick={applyDateFilter} disabled={!fromDate||!toDate} className="btn-primary text-xs py-2 gap-1"><Filter size={13}/> Apply</button>
          {(fromDate||toDate||filterPM||searchQ) && <button onClick={clearFilters} className="btn-ghost text-xs py-2 text-red-500 gap-1"><X size={12}/> Clear</button>}
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-3 flex-wrap">
        <span className="badge badge-gray">{filtered.length} Invoice{filtered.length!==1?'s':''}</span>
        <span className="badge badge-success">Revenue: {formatCurrency(totalRev)}</span>
        {fromDate&&toDate&&<span className="badge badge-info">Filtered by date</span>}
      </div>

      {/* Table */}
      {filtered.length===0
        ? <EmptyState icon={Receipt} title="No invoices found" description="Create a bill — invoices appear here automatically."/>
        : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table">
                <thead><tr><th>Invoice No</th><th>Date</th><th>Customer</th><th>Items</th><th>Payment</th><th>Total</th><th>Actions</th></tr></thead>
                <tbody>
                  {filtered.map(inv=>(
                    <tr key={inv.id}>
                      <td><span className="font-mono text-xs bg-primary-50 text-primary-700 font-bold px-2 py-0.5 rounded">{inv.invoiceNo}</span></td>
                      <td className="text-xs text-gray-500 whitespace-nowrap">{formatDate(inv.createdAt)}</td>
                      <td>
                        <p className="text-sm text-gray-700 font-medium">{inv.customerName||<span className="text-gray-300 text-xs">Walk-in</span>}</p>
                        {inv.customerMobile&&<p className="text-xs text-gray-400 font-mono">{inv.customerMobile}</p>}
                      </td>
                      <td className="text-gray-500">{ensureArray(inv.items).length}</td>
                      <td><span className={PM_BADGE[inv.paymentMethod]||'badge-gray'}>{inv.paymentMethod}</span></td>
                      <td className="font-bold text-primary-700 whitespace-nowrap">{formatCurrency(inv.grandTotal)}</td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button onClick={()=>setViewInv(inv)} className="btn-ghost p-1.5 rounded-lg hover:text-primary-600" title="View"><Eye size={14}/></button>
                          <button onClick={()=>handlePrint(inv)} className="btn-ghost p-1.5 rounded-lg hover:text-blue-600" title="Print"><Printer size={14}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      }

      {/* View modal */}
      <Modal isOpen={!!viewInv} onClose={()=>setViewInv(null)} title={`Invoice — ${viewInv?.invoiceNo}`} size="lg">
        {viewInv && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-xs text-gray-400 font-semibold uppercase mb-1">Date</p><p>{formatDate(viewInv.createdAt)}</p></div>
              <div><p className="text-xs text-gray-400 font-semibold uppercase mb-1">Payment</p><span className={PM_BADGE[viewInv.paymentMethod]||'badge-gray'}>{viewInv.paymentMethod}</span></div>
              {viewInv.customerName&&<div><p className="text-xs text-gray-400 font-semibold uppercase mb-1">Customer</p><p>{viewInv.customerName}</p></div>}
              {viewInv.customerMobile&&<div><p className="text-xs text-gray-400 font-semibold uppercase mb-1">Mobile</p><p className="font-mono">{viewInv.customerMobile}</p></div>}
            </div>
            <div className="h-px bg-gray-100"/>
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="table">
                <thead><tr><th>#</th><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
                <tbody>
                  {ensureArray(viewInv.items).map((item,i)=>(
                    <tr key={i}>
                      <td className="text-gray-400">{i+1}</td>
                      <td className="font-medium text-gray-800">{item.productName}</td>
                      <td>{item.quantity}</td>
                      <td className="text-primary-700">{formatCurrency(item.unitPrice)}</td>
                      <td className="font-bold">{formatCurrency(item.totalPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
              {[['Subtotal',viewInv.subtotal],[`CGST (${CGST}%)`,viewInv.cgst],[`SGST (${SGST}%)`,viewInv.sgst]].map(([l,v])=>(
                <div key={l} className="flex justify-between text-gray-500"><span>{l}</span><span>{formatCurrency(v)}</span></div>
              ))}
              <div className="h-px bg-gray-200"/>
              <div className="flex justify-between font-bold text-base">
                <span>Grand Total</span><span className="text-primary-700">{formatCurrency(viewInv.grandTotal)}</span>
              </div>
              <div className="text-xs italic text-gray-400">{amtWords(viewInv.grandTotal)}</div>
            </div>
            <div className="flex gap-3">
              <button onClick={()=>handlePrint(viewInv)} className="btn-secondary flex-1 gap-2"><Printer size={15}/> Print Invoice</button>
              <button onClick={()=>setViewInv(null)} className="btn-primary flex-1">Close</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
