import React, { useState, useRef, useCallback } from 'react'
import { Search, Plus, Trash2, Receipt, Printer, X, ShoppingCart, User, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { productsApi, invoicesApi, formatCurrency, formatDateOnly, ensureArray } from '../api'
import { Spinner } from '../components/UI'

const CGST_RATE = 9
const SGST_RATE = 9

const SHOP = {
  name:    'Nisha Collection',
  address: 'No:5, M.N.K Complex',
  city:    'Arasarkulam - 614801',
  phone:   '8838922503',
  email:   'nishacollection@gmail.com',
}

const PAYMENT_METHODS = [
  { value:'CASH', label:'💵 Cash' },
  { value:'UPI',  label:'📱 UPI'  },
  { value:'CARD', label:'💳 Card' },
]

/* ─── Amount in words ─────────────────────── */
const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven',
  'Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen']
const tenWords = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety']
function n2w(n) {
  if (n <= 0) return 'Zero'
  if (n < 20)  return ones[n]
  if (n < 100) return tenWords[Math.floor(n/10)] + (n%10 ? ' '+ones[n%10] : '')
  if (n < 1000) return ones[Math.floor(n/100)]+' Hundred'+(n%100?' '+n2w(n%100):'')
  if (n < 100000) return n2w(Math.floor(n/1000))+' Thousand'+(n%1000?' '+n2w(n%1000):'')
  if (n < 10000000) return n2w(Math.floor(n/100000))+' Lakh'+(n%100000?' '+n2w(n%100000):'')
  return n2w(Math.floor(n/10000000))+' Crore'+(n%10000000?' '+n2w(n%10000000):'')
}
function amountInWords(amount) {
  const v = Math.round(parseFloat(amount||0)*100)/100
  const r = Math.floor(v), p = Math.round((v-r)*100)
  return n2w(r)+' Rupees'+(p>0?' and '+n2w(p)+' Paise':'')+' Only'
}

function fmtINR(v) {
  const n = parseFloat(v||0)
  return '₹'+n.toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})
}

/* ─── Invoice layout component ─────────────── */
function InvoiceView({ inv }) {
  const items      = ensureArray(inv?.items)
  const subtotal   = parseFloat(inv?.subtotal   || 0)
  const cgst       = parseFloat(inv?.cgst       || 0)
  const sgst       = parseFloat(inv?.sgst       || 0)
  const grandTotal = parseFloat(inv?.grandTotal || 0)
  const payMethod  = inv?.paymentMethod || 'CASH'
  const dateStr    = formatDateOnly(inv?.createdAt)
  const invNo      = inv?.invoiceNo || '—'

  const barcodeUrl = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(invNo)}&scale=2&height=10&includetext&textxalign=center`
  const qrUrl      = `https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(`${SHOP.name}|${invNo}|${fmtINR(grandTotal)}`)}`

  return (
    <div className="invoice-root" style={{fontFamily:"Arial,'Helvetica Neue',sans-serif",background:'#fff',color:'#111',maxWidth:720,margin:'0 auto',fontSize:13}}>
      {/* Teal header */}
      <div style={{background:'#0f9d8c',color:'#fff',padding:'22px 28px',display:'flex',justifyContent:'space-between',alignItems:'flex-start',borderRadius:'12px 12px 0 0'}}>
        <div>
          <div style={{fontSize:24,fontWeight:'bold',marginBottom:10}}>{SHOP.name}</div>
          <div style={{lineHeight:1.9,opacity:0.93,fontSize:12.5}}>
            <div>{SHOP.address}</div>
            <div>{SHOP.city}</div>
            <div>Phone: {SHOP.phone}</div>
            <div>Email: {SHOP.email}</div>
          </div>
        </div>
        <div style={{textAlign:'right'}}>
          <div style={{background:'rgba(255,255,255,0.2)',border:'1.5px solid rgba(255,255,255,0.5)',borderRadius:6,padding:'5px 18px',fontWeight:'bold',letterSpacing:2,fontSize:13,marginBottom:12}}>TAX INVOICE</div>
          <div style={{opacity:0.95,lineHeight:2,fontSize:12}}>
            <div style={{fontWeight:'bold',fontSize:14}}>{invNo}</div>
            <div>{dateStr}</div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{border:'1px solid #e0e0e0',borderTop:'none',borderRadius:'0 0 12px 12px',overflow:'hidden'}}>

        {/* Bill To */}
        <div style={{padding:'14px 26px',borderBottom:'1px solid #f0f0f0',background:'#fafafa'}}>
          <div style={{fontSize:9,fontWeight:700,color:'#999',letterSpacing:1.5,textTransform:'uppercase',marginBottom:6}}>Bill To</div>
          <div style={{background:'#fff',border:'1px solid #eee',borderRadius:8,padding:'11px 16px'}}>
            {inv?.customerName && <div style={{fontWeight:600,fontSize:14,marginBottom:3}}>{inv.customerName}</div>}
            {inv?.customerMobile
              ? <div style={{fontWeight:'bold',fontSize:15}}>{inv.customerMobile}</div>
              : <div style={{color:'#aaa',fontSize:13}}>Walk-in Customer</div>}
          </div>
        </div>

        {/* Items table */}
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead>
            <tr style={{background:'#f5f5f5'}}>
              {['#','Item','QTY','Price','Amount'].map((h,i)=>(
                <th key={h} style={{padding:'9px 14px',textAlign:i>1?'right':'left',fontSize:10,fontWeight:700,color:'#666',letterSpacing:1,textTransform:'uppercase',borderBottom:'1px solid #e0e0e0'}}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.length === 0
              ? <tr><td colSpan={5} style={{padding:'18px',textAlign:'center',color:'#ccc',fontSize:13}}>No items</td></tr>
              : items.map((item,i)=>(
                <tr key={i} style={{borderBottom:'1px solid #f5f5f5'}}>
                  <td style={{padding:'11px 14px',color:'#999',fontWeight:600,fontSize:11}}>{String(i+1).padStart(2,'0')}</td>
                  <td style={{padding:'11px 14px'}}>
                    <div style={{fontWeight:600,color:'#111'}}>{item.productName}</div>
                    {item.barcode && <div style={{fontSize:10,color:'#bbb',fontFamily:'monospace',marginTop:2}}>{item.barcode}</div>}
                  </td>
                  <td style={{padding:'11px 14px',textAlign:'right',color:'#444'}}>{item.quantity}</td>
                  <td style={{padding:'11px 14px',textAlign:'right',color:'#444'}}>{fmtINR(item.unitPrice)}</td>
                  <td style={{padding:'11px 14px',textAlign:'right',fontWeight:700,color:'#111'}}>{fmtINR(item.totalPrice)}</td>
                </tr>
              ))
            }
          </tbody>
        </table>

        {/* Payment breakdown */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',borderTop:'2px solid #f0f0f0',background:'#fafafa'}}>
          <div style={{padding:'18px 22px',borderRight:'1px solid #eee'}}>
            <div style={{fontSize:9,fontWeight:700,color:'#999',letterSpacing:1.5,textTransform:'uppercase',marginBottom:12}}>Payment Breakdown</div>
            <div style={{background:'#fff',border:'1px solid #eee',borderRadius:9,padding:'14px 18px'}}>
              <div style={{display:'inline-block',background:'#f0e8ff',color:'#7c3aed',borderRadius:4,padding:'3px 12px',fontSize:11,fontWeight:700,marginBottom:8}}>{payMethod}</div>
              <div style={{fontSize:24,fontWeight:'bold',color:'#7c3aed'}}>{fmtINR(grandTotal)}</div>
            </div>
          </div>
          <div style={{padding:'18px 22px'}}>
            <div style={{fontSize:9,fontWeight:700,color:'#999',letterSpacing:1.5,textTransform:'uppercase',marginBottom:12}}>Summary</div>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
              <tbody>
                {[['Subtotal',subtotal],[`CGST (${CGST_RATE}%)`,cgst],[`SGST (${SGST_RATE}%)`,sgst]].map(([l,v])=>(
                  <tr key={l}>
                    <td style={{padding:'4px 0',color:'#555'}}>{l}</td>
                    <td style={{padding:'4px 0',textAlign:'right',color:'#333'}}>{fmtINR(v)}</td>
                  </tr>
                ))}
                <tr style={{borderTop:'2px solid #222'}}>
                  <td style={{padding:'9px 0 3px',fontWeight:'bold',fontSize:15}}>Grand Total</td>
                  <td style={{padding:'9px 0 3px',textAlign:'right',fontWeight:'bold',fontSize:17,color:'#0f9d8c'}}>{fmtINR(grandTotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Amount in words */}
        <div style={{padding:'13px 26px',background:'#f0fffe',borderTop:'1px solid #d4f0ed'}}>
          <div style={{fontSize:9,fontWeight:700,color:'#888',letterSpacing:1.5,textTransform:'uppercase',marginBottom:5}}>Amount in Words</div>
          <div style={{fontStyle:'italic',color:'#333',fontWeight:500,fontSize:13.5}}>{amountInWords(grandTotal)}</div>
        </div>

        {/* Barcode + QR */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',padding:'16px 28px 22px',borderTop:'1px solid #eee',background:'#fff'}}>
          <div style={{textAlign:'center'}}>
            <img src={barcodeUrl} alt="barcode" style={{height:50,maxWidth:170}}
              onError={e=>{e.target.style.display='none'}}/>
            <div style={{fontSize:9,color:'#aaa',marginTop:4,fontFamily:'monospace'}}>{invNo}</div>
          </div>
          <div style={{textAlign:'center'}}>
            <img src={qrUrl} alt="QR" style={{width:78,height:78}}/>
            <div style={{fontSize:9,color:'#aaa',marginTop:4}}>Scan for details</div>
          </div>
        </div>

        {/* Thank you */}
        <div style={{textAlign:'center',padding:'11px',background:'#f9f9f9',borderTop:'1px solid #f0f0f0',fontSize:12,color:'#888'}}>
          Thank you for shopping at Nisha Collection! 🙏
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   BILLING PAGE
═══════════════════════════════════════════ */
export default function Billing() {
  const [items,        setItems]        = useState([])
  const [query,        setQuery]        = useState('')
  const [results,      setResults]      = useState([])
  const [searching,    setSearching]    = useState(false)
  const [customer,     setCustomer]     = useState({ name:'', mobile:'' })
  const [payMethod,    setPayMethod]    = useState('CASH')
  const [submitting,   setSubmitting]   = useState(false)
  const [savedInvoice, setSavedInvoice] = useState(null)
  const searchTimer = useRef(null)
  const invoiceRef  = useRef(null)

  const subtotal   = items.reduce((s,i)=>s+i.unitPrice*i.quantity, 0)
  const cgstAmt    = parseFloat((subtotal*CGST_RATE/100).toFixed(2))
  const sgstAmt    = parseFloat((subtotal*SGST_RATE/100).toFixed(2))
  const grandTotal = parseFloat((subtotal+cgstAmt+sgstAmt).toFixed(2))

  const handleSearch = useCallback((q) => {
    setQuery(q)
    clearTimeout(searchTimer.current)
    if (!q.trim()) { setResults([]); return }
    searchTimer.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await productsApi.search(q)
        setResults(ensureArray(res.data).slice(0,6))
      } catch { setResults([]) }
      finally { setSearching(false) }
    }, 300)
  }, [])

  function addProduct(product) {
    if (product.stock === 0) { toast.error('Out of stock!'); return }
    setItems(prev => {
      const ex = prev.find(i=>i.productId===product.id)
      if (ex) {
        if (ex.quantity >= product.stock) { toast.error(`Max: ${product.stock}`); return prev }
        return prev.map(i=>i.productId===product.id?{...i,quantity:i.quantity+1}:i)
      }
      return [...prev, {
        productId:   product.id,
        productName: product.productName,
        barcode:     product.barcode||'',
        unitPrice:   parseFloat(product.price),
        quantity:    1,
        maxStock:    product.stock,
      }]
    })
    setQuery(''); setResults([])
    toast.success(`${product.productName} added`, { duration:1500, icon:'✅' })
  }

  function updateQty(productId, qty) {
    const n = parseInt(qty)||1
    setItems(prev=>prev.map(i=>{
      if (i.productId!==productId) return i
      if (n<1) return i
      if (n>i.maxStock) { toast.error(`Max: ${i.maxStock}`); return i }
      return {...i, quantity:n}
    }))
  }

  async function handleSubmit() {
    if (!items.length) { toast.error('Add at least one item'); return }
    if (customer.mobile && !/^\d{10}$/.test(customer.mobile)) {
      toast.error('Mobile must be 10 digits'); return
    }
    setSubmitting(true)
    try {
      const payload = {
        customerName:   customer.name.trim()||null,
        customerMobile: customer.mobile||null,
        paymentMethod:  payMethod,
        cgstRate: CGST_RATE,
        sgstRate: SGST_RATE,
        items: items.map(i=>({ productId:i.productId, quantity:i.quantity })),
      }
      const res = await invoicesApi.create(payload)
      const inv = res.data
      console.log('Invoice created:', inv)   // debug
      setSavedInvoice(inv)
      toast.success(`Invoice ${inv.invoiceNo} created! 🎉`)
    } catch(err) {
      console.error('Create invoice error:', err?.response?.data || err)
    } finally { setSubmitting(false) }
  }

  function handlePrint() {
    const content = invoiceRef.current?.innerHTML
    if (!content) return
    const w = window.open('','_blank','width=820,height=950')
    w.document.write(`<!DOCTYPE html><html><head><title>${savedInvoice?.invoiceNo}</title>
      <style>
        @page{size:A4;margin:10mm}
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
      </style></head><body>${content}</body></html>`)
    w.document.close()
    w.focus()
    setTimeout(()=>{ w.print(); w.close() }, 600)
  }

  /* ─── Invoice view (after creation) ──────── */
  if (savedInvoice) {
    return (
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-5 no-print">
          <button onClick={()=>{setSavedInvoice(null); setItems([]); setCustomer({name:'',mobile:''}); setPayMethod('CASH')}}
            className="btn-secondary gap-2">
            <ArrowLeft size={16}/> New Bill
          </button>
          <button onClick={handlePrint} className="btn-primary gap-2">
            <Printer size={16}/> Print Invoice
          </button>
        </div>
        <div ref={invoiceRef}>
          <InvoiceView inv={savedInvoice}/>
        </div>
      </div>
    )
  }

  /* ─── Billing form ────────────────────────── */
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 animate-fade-in">

      {/* Left: cart */}
      <div className="lg:col-span-3 space-y-4">
        {/* Search */}
        <div className="card p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <ShoppingCart size={16} className="text-primary-600"/> Add Items to Bill
          </h3>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input className="input pl-9 pr-9" placeholder="Search product name or scan barcode..."
              value={query} onChange={e=>handleSearch(e.target.value)} autoFocus/>
            {searching && <Spinner size={15} className="absolute right-3 top-1/2 -translate-y-1/2"/>}
            {query && !searching && (
              <button onClick={()=>{setQuery('');setResults([])}}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><X size={14}/></button>
            )}
          </div>

          {results.length>0 && (
            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-card-lg divide-y divide-gray-100">
              {results.map(p=>(
                <button key={p.id} onClick={()=>addProduct(p)} disabled={p.stock===0}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-primary-50 transition-colors text-left disabled:opacity-40 disabled:cursor-not-allowed">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{p.productName}</p>
                    <p className="text-xs text-gray-400 font-mono">{p.barcode||'No barcode'} • {p.category||''}</p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="font-bold text-primary-700">{formatCurrency(p.price)}</p>
                    <p className={`text-xs ${p.stock===0?'text-red-500':p.stock<=p.lowStockAlert?'text-amber-500':'text-gray-400'}`}>
                      {p.stock===0?'Out of stock':`${p.stock} in stock`}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Cart */}
        {items.length===0
          ? (
            <div className="card p-12 text-center">
              <ShoppingCart size={40} className="text-gray-200 mx-auto mb-3"/>
              <p className="text-gray-400 font-medium">Cart is empty</p>
              <p className="text-xs text-gray-300 mt-1">Search products above</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                <span className="text-sm font-semibold text-gray-700">{items.length} Item{items.length>1?'s':''}</span>
                <button onClick={()=>setItems([])} className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1"><X size={12}/> Clear all</button>
              </div>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead><tr><th>Product</th><th>Price</th><th>Qty</th><th>Total</th><th></th></tr></thead>
                  <tbody>
                    {items.map(item=>(
                      <tr key={item.productId}>
                        <td>
                          <p className="font-semibold text-gray-800 text-sm">{item.productName}</p>
                          {item.barcode&&<p className="text-xs text-gray-400 font-mono">{item.barcode}</p>}
                        </td>
                        <td className="text-primary-700 font-semibold">{formatCurrency(item.unitPrice)}</td>
                        <td>
                          <div className="flex items-center gap-1">
                            <button onClick={()=>updateQty(item.productId,item.quantity-1)}
                              className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold flex items-center justify-center">−</button>
                            <input type="number" min="1" max={item.maxStock} value={item.quantity}
                              onChange={e=>updateQty(item.productId,e.target.value)}
                              className="w-12 text-center border border-gray-200 rounded-lg py-1 text-sm focus:outline-none focus:border-primary-500"/>
                            <button onClick={()=>updateQty(item.productId,item.quantity+1)}
                              className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold flex items-center justify-center">+</button>
                          </div>
                        </td>
                        <td className="font-bold text-gray-900">{formatCurrency(item.unitPrice*item.quantity)}</td>
                        <td>
                          <button onClick={()=>setItems(p=>p.filter(i=>i.productId!==item.productId))}
                            className="btn-ghost p-1.5 rounded-lg hover:text-red-500"><Trash2 size={14}/></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        }
      </div>

      {/* Right: summary */}
      <div className="lg:col-span-2 space-y-4">
        {/* Customer */}
        <div className="card p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <User size={15} className="text-primary-600"/> Customer (optional)
          </h3>
          <input className="input" placeholder="Customer name"
            value={customer.name} onChange={e=>setCustomer(c=>({...c,name:e.target.value}))}/>
          <input className="input font-mono" placeholder="Mobile (10 digits)" maxLength={10}
            value={customer.mobile} onChange={e=>setCustomer(c=>({...c,mobile:e.target.value.replace(/\D/g,'')}))}/>
        </div>

        {/* Payment method */}
        <div className="card p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Payment Method</h3>
          <div className="grid grid-cols-3 gap-2">
            {PAYMENT_METHODS.map(m=>(
              <button key={m.value} onClick={()=>setPayMethod(m.value)}
                className={`py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                  payMethod===m.value
                    ?'bg-primary-600 text-white border-primary-600 shadow-sm'
                    :'bg-white text-gray-600 border-gray-200 hover:border-primary-300'}`}>
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="card p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Bill Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
            <div className="flex justify-between text-gray-500"><span>CGST ({CGST_RATE}%)</span><span>{formatCurrency(cgstAmt)}</span></div>
            <div className="flex justify-between text-gray-500"><span>SGST ({SGST_RATE}%)</span><span>{formatCurrency(sgstAmt)}</span></div>
            <div className="h-px bg-gray-100"/>
            <div className="flex justify-between font-bold text-base">
              <span className="text-gray-800">Grand Total</span>
              <span className="text-primary-700">{formatCurrency(grandTotal)}</span>
            </div>
            {grandTotal>0 && <div className="text-xs italic text-gray-400">{amountInWords(grandTotal)}</div>}
          </div>
        </div>

        <button onClick={handleSubmit} disabled={submitting||items.length===0} className="btn-primary w-full py-3.5 text-base">
          {submitting ? <><Spinner size={18}/> Processing...</> : <><Receipt size={18}/> Generate Invoice</>}
        </button>
      </div>
    </div>
  )
}
