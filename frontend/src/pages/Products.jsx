import React, { useEffect, useState, useCallback } from 'react'
import { Plus, Search, Edit2, Trash2, Package, AlertTriangle, X, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { productsApi, formatCurrency, ensureArray } from '../api'
import { LoadingScreen, EmptyState, Modal, ConfirmDialog, FormField } from '../components/UI'

const EMPTY = { productName:'', barcode:'', price:'', stock:'', lowStockAlert:'10', category:'', description:'' }

export default function Products() {
  const [products, setProducts]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [searchQ, setSearchQ]     = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem]   = useState(null)
  const [form, setForm]           = useState(EMPTY)
  const [errors, setErrors]       = useState({})
  const [saving, setSaving]       = useState(false)
  const [deleteId, setDeleteId]   = useState(null)
  const [filterLow, setFilterLow] = useState(false)

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      const res = await productsApi.getAll()
      setProducts(ensureArray(res.data))
    } catch { setProducts([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  const filtered = products.filter(p => {
    const q = searchQ.toLowerCase()
    const match = !q || p.productName.toLowerCase().includes(q) || (p.barcode || '').toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q)
    return match && (!filterLow || p.stock <= p.lowStockAlert)
  })

  function openAdd() { setForm(EMPTY); setErrors({}); setEditItem(null); setShowModal(true) }
  function openEdit(p) {
    setForm({ productName:p.productName, barcode:p.barcode||'', price:String(p.price),
      stock:String(p.stock), lowStockAlert:String(p.lowStockAlert), category:p.category||'', description:p.description||'' })
    setErrors({}); setEditItem(p); setShowModal(true)
  }

  function validate() {
    const e = {}
    if (!form.productName.trim())                       e.productName = 'Required'
    if (!form.price || isNaN(form.price) || +form.price <= 0) e.price = 'Enter valid price'
    if (form.stock === '' || isNaN(form.stock) || +form.stock < 0) e.stock = 'Enter valid stock'
    return e
  }

  async function handleSubmit() {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setSaving(true)
    try {
      const payload = {
        productName: form.productName.trim(),
        barcode: form.barcode.trim() || undefined,
        price: parseFloat(form.price),
        stock: parseInt(form.stock),
        lowStockAlert: parseInt(form.lowStockAlert) || 10,
        category: form.category.trim() || undefined,
        description: form.description.trim() || undefined,
      }
      if (editItem) { await productsApi.update(editItem.id, payload); toast.success('Product updated!') }
      else          { await productsApi.create(payload);               toast.success('Product added!') }
      setShowModal(false); fetchProducts()
    } catch {} finally { setSaving(false) }
  }

  async function handleDelete(id) {
    try {
      await productsApi.delete(id)
      toast.success('Product deleted')
      setProducts(ps => ps.filter(p => p.id !== id))
    } catch {}
  }

  if (loading) return <LoadingScreen text="Loading products..." />

  const lowCount = products.filter(p => p.stock <= p.lowStockAlert).length

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Search name, barcode, category..."
            value={searchQ} onChange={e => setSearchQ(e.target.value)} />
          {searchQ && <button onClick={() => setSearchQ('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={14} /></button>}
        </div>
        <button onClick={() => setFilterLow(f => !f)}
          className={`btn gap-1.5 text-sm ${filterLow ? 'bg-amber-500 text-white border-amber-500' : 'btn-secondary'}`}>
          <AlertTriangle size={14} /> Low Stock {lowCount > 0 && <span className={`text-xs px-1.5 py-0.5 rounded-full ${filterLow ? 'bg-white/20' : 'bg-amber-100 text-amber-700'}`}>{lowCount}</span>}
        </button>
        <button onClick={() => fetchProducts()} className="btn-secondary gap-1.5"><RefreshCw size={14} /></button>
        <button onClick={openAdd} className="btn-primary gap-1.5"><Plus size={16} /> Add Product</button>
      </div>

      {/* Summary */}
      <div className="flex gap-2 flex-wrap">
        <span className="badge badge-gray">{products.length} Total Products</span>
        {lowCount > 0 && <span className="badge badge-warning">⚠ {lowCount} Low Stock</span>}
        <span className="badge badge-info">{new Set(products.map(p=>p.category).filter(Boolean)).size} Categories</span>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState icon={Package} title="No products found"
          description="Add your first product to get started"
          action={<button onClick={openAdd} className="btn-primary gap-2"><Plus size={16} /> Add Product</button>} />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th><th>Product</th><th>Barcode</th><th>Category</th>
                  <th>Price</th><th>Stock</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => {
                  const isLow = p.stock <= p.lowStockAlert
                  return (
                    <tr key={p.id} className={isLow && p.stock > 0 ? 'bg-amber-50/50' : p.stock === 0 ? 'bg-red-50/50' : ''}>
                      <td className="text-gray-400 text-xs">{i + 1}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-primary-100 flex items-center justify-center">
                            <Package size={13} className="text-primary-600" />
                          </div>
                          <span className="font-medium text-gray-800">{p.productName}</span>
                        </div>
                      </td>
                      <td><span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{p.barcode || '—'}</span></td>
                      <td>{p.category ? <span className="badge badge-info">{p.category}</span> : <span className="text-gray-300">—</span>}</td>
                      <td className="font-semibold text-primary-700">{formatCurrency(p.price)}</td>
                      <td>
                        <span className={`font-mono font-semibold text-sm ${p.stock === 0 ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-gray-700'}`}>
                          {p.stock}
                        </span>
                        <span className="text-gray-400 text-xs ml-1">/ min {p.lowStockAlert}</span>
                      </td>
                      <td>
                        {p.stock === 0
                          ? <span className="badge badge-danger">Out of Stock</span>
                          : isLow
                          ? <span className="badge badge-warning">Low Stock</span>
                          : <span className="badge badge-success">In Stock</span>}
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(p)} className="btn-ghost p-1.5 rounded-lg hover:text-primary-600" title="Edit"><Edit2 size={14} /></button>
                          <button onClick={() => setDeleteId(p.id)} className="btn-ghost p-1.5 rounded-lg hover:text-red-500" title="Delete"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Edit Product' : 'Add New Product'}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <FormField label="Product Name" error={errors.productName} required>
              <input className="input" placeholder="e.g. Cotton Kurti - Blue"
                value={form.productName} onChange={e => setForm(f => ({ ...f, productName: e.target.value }))} />
            </FormField>
          </div>
          <FormField label="Barcode (optional)">
            <input className="input font-mono" placeholder="Auto-generated if empty"
              value={form.barcode} onChange={e => setForm(f => ({ ...f, barcode: e.target.value }))} />
          </FormField>
          <FormField label="Category">
            <input className="input" placeholder="e.g. Kurti, Saree, Tops"
              value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
          </FormField>
          <FormField label="Price (₹)" error={errors.price} required>
            <input className="input" type="number" min="0" step="0.01" placeholder="0.00"
              value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
          </FormField>
          <FormField label="Stock Quantity" error={errors.stock} required>
            <input className="input" type="number" min="0" placeholder="0"
              value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} />
          </FormField>
          <FormField label="Low Stock Alert">
            <input className="input" type="number" min="0" placeholder="10"
              value={form.lowStockAlert} onChange={e => setForm(f => ({ ...f, lowStockAlert: e.target.value }))} />
          </FormField>
          <div className="sm:col-span-2">
            <FormField label="Description (optional)">
              <textarea className="input resize-none" rows={2} placeholder="Optional notes..."
                value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </FormField>
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-5 pt-4 border-t border-gray-100">
          <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="btn-primary min-w-24">
            {saving ? 'Saving...' : editItem ? 'Update Product' : 'Add Product'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={() => handleDelete(deleteId)}
        title="Delete Product" message="This will permanently delete the product. Cannot be undone." danger />
    </div>
  )
}
