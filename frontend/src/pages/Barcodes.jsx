import React, { useEffect, useState, useRef } from 'react'
import { Search, Printer, Download, Package, X, RefreshCw } from 'lucide-react'
import { productsApi, formatCurrency, ensureArray } from '../api'
import { LoadingScreen, EmptyState } from '../components/UI'

export default function Barcodes() {
  const [products, setProducts] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [searchQ,  setSearchQ]  = useState('')
  const [selected, setSelected] = useState([])
  const [copies,   setCopies]   = useState(1)
  const printRef = useRef(null)

  useEffect(() => { fetchProducts() }, [])

  async function fetchProducts() {
    try {
      setLoading(true)
      const res = await productsApi.getAll()
      setProducts(ensureArray(res.data))
    } catch { setProducts([]) }
    finally { setLoading(false) }
  }

  const filtered = products.filter(p => {
    const q = searchQ.toLowerCase()
    return !q || p.productName.toLowerCase().includes(q) || (p.barcode||'').toLowerCase().includes(q)
  })

  function toggleSelect(id) {
    setSelected(prev => prev.includes(id) ? prev.filter(i=>i!==id) : [...prev, id])
  }
  function selectAll() { setSelected(filtered.map(p=>p.id)) }
  function clearAll()  { setSelected([]) }

  const selectedProducts = products.filter(p => selected.includes(p.id))

  function handlePrint() {
    if (!selectedProducts.length) { alert('Select at least one product'); return }
    const labels = selectedProducts.flatMap(p =>
      Array(parseInt(copies)||1).fill(0).map((_,i) => `
        <div class="label">
          <div class="shop-name">NISHA COLLECTION</div>
          <div class="product-name">${p.productName}</div>
          <img
            src="https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(p.barcode||p.id)}&scale=2&height=10&includetext&textxalign=center"
            alt="${p.barcode||''}" onerror="this.style.display='none'"
          />
          <div class="barcode-text">${p.barcode||'N/A'}</div>
          <div class="price">₹${parseFloat(p.price).toFixed(2)}</div>
          ${p.category?`<div class="category">${p.category}</div>`:''}
        </div>`)
    ).join('')

    const w = window.open('','_blank','width=900,height=700')
    w.document.write(`<!DOCTYPE html><html><head><title>Barcodes - Nisha Collection</title>
    <style>
      @page { size: A4; margin: 8mm; }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: Arial, sans-serif; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .grid { display: flex; flex-wrap: wrap; gap: 6px; padding: 4px; }
      .label {
        width: 90mm; border: 1px solid #ccc; border-radius: 6px;
        padding: 8px 12px; text-align: center; background: #fff;
        page-break-inside: avoid;
      }
      .shop-name { font-size: 9px; font-weight: bold; color: #0f9d8c; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 3px; }
      .product-name { font-size: 11px; font-weight: bold; color: #111; margin-bottom: 5px; line-height: 1.3; }
      img { height: 40px; max-width: 150px; display: block; margin: 0 auto 3px; }
      .barcode-text { font-size: 8px; font-family: monospace; color: #555; margin-bottom: 4px; }
      .price { font-size: 14px; font-weight: bold; color: #0f9d8c; margin-bottom: 2px; }
      .category { font-size: 9px; color: #888; }
      @media print { .no-print { display: none !important; } }
    </style></head><body>
    <div class="grid">${labels}</div>
    </body></html>`)
    w.document.close()
    w.focus()
    setTimeout(() => { w.print(); w.close() }, 700)
  }

  if (loading) return <LoadingScreen text="Loading products..." />

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Controls */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input className="input pl-9" placeholder="Search products..."
              value={searchQ} onChange={e=>setSearchQ(e.target.value)}/>
            {searchQ && <button onClick={()=>setSearchQ('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={14}/></button>}
          </div>
          <button onClick={fetchProducts} className="btn-secondary gap-1.5"><RefreshCw size={14}/></button>
          <button onClick={selectAll} className="btn-secondary text-sm">Select All</button>
          {selected.length>0 && <button onClick={clearAll} className="btn-ghost text-sm text-red-500">Clear ({selected.length})</button>}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 font-medium">Copies per label:</label>
            <input type="number" min="1" max="20" value={copies}
              onChange={e=>setCopies(Math.max(1,parseInt(e.target.value)||1))}
              className="input w-20 text-center"/>
          </div>
          <button onClick={handlePrint} disabled={!selected.length}
            className="btn-primary gap-2">
            <Printer size={16}/> Print {selected.length>0?`${selected.length} Label${selected.length>1?'s':''}`:'Labels'}
          </button>
        </div>
      </div>

      {/* Product grid */}
      {filtered.length === 0
        ? <EmptyState icon={Package} title="No products found" description="Add products first to generate barcodes"/>
        : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(p => {
              const isSelected = selected.includes(p.id)
              const barcodeUrl = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(p.barcode||String(p.id))}&scale=2&height=10&includetext&textxalign=center`
              return (
                <div key={p.id} onClick={()=>toggleSelect(p.id)}
                  className={`card p-4 cursor-pointer transition-all duration-150 ${
                    isSelected
                      ? 'border-2 border-primary-500 bg-primary-50 shadow-md'
                      : 'hover:border-gray-300 hover:shadow-card-md'}`}>
                  {/* Checkbox */}
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                      isSelected ? 'bg-primary-600 border-primary-600' : 'border-gray-300'}`}>
                      {isSelected && <span className="text-white text-xs font-bold">✓</span>}
                    </div>
                    {p.category && <span className="badge badge-info text-xs">{p.category}</span>}
                  </div>

                  {/* Product name */}
                  <p className="font-semibold text-gray-800 text-sm mb-1 leading-snug">{p.productName}</p>
                  <p className="text-primary-700 font-bold text-base mb-3">{formatCurrency(p.price)}</p>

                  {/* Barcode preview */}
                  <div className="bg-white border border-gray-100 rounded-lg p-3 text-center">
                    <div className="text-xs text-gray-400 font-semibold uppercase tracking-widest mb-2">NISHA COLLECTION</div>
                    <img src={barcodeUrl} alt={p.barcode||''} className="h-10 mx-auto block"
                      onError={e=>{e.target.style.display='none'}}/>
                    <p className="text-xs text-gray-500 font-mono mt-1">{p.barcode||'Auto ID'}</p>
                  </div>

                  {/* Stock */}
                  <div className="mt-2 flex items-center justify-between">
                    <span className={`text-xs ${p.stock<=p.lowStockAlert?'text-amber-600':'text-gray-400'}`}>
                      Stock: {p.stock}
                    </span>
                    <span className="text-xs text-gray-400">ID: {p.id}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )
      }
    </div>
  )
}
