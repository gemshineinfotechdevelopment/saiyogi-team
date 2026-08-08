import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import AdminSidebar from "@/components/layout/AdminSidebar";
import AdminNavbar from "@/components/layout/AdminNavbar";
import { getProducts, getCategories, getBrands, API_BASE_URL, Brand } from "@/lib/api";
import { Product, Category } from "@/data/products";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";

const AdminProducts = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;
  const { token } = useAuth();
  const [productList, setProductList] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  const [form, setForm] = useState({ name: "", sku: "", price: "", wholesalePrice: "", netRate: "", stock: "", brand: "", category: "", description: "", quantity: "", hasDiscount: false, displayNetRate: false, storeStockPieces: "0", godownStockCases: "0", piecesPerCase: "1" });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);

  const getCategoryName = (category: string | any) => {
    if (!category) return 'N/A';
    if (typeof category === 'object' && category !== null) {
      return category.name || category.slug || 'N/A';
    }
    const cat = categories.find((c) => c.id === category || (c as any)._id === category);
    return cat?.name || String(category);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    const brandName = typeof product.brand === 'object' && product.brand !== null 
      ? (product.brand as any).name || "" 
      : product.brand || "";
    const catId = product.category && typeof product.category === 'object' 
      ? (product.category as any)._id || (product.category as any).id || "" 
      : product.category || "";

    setForm({
      name: product.name || "",
      sku: product.sku || product.code || "",
      price: (product.price ?? "").toString(),
      stock: (product.stock ?? "").toString(),
      brand: brandName,
      category: catId,
      description: product.description || "",
      quantity: product.quantity || "",
      hasDiscount: product.hasDiscount || false,
      displayNetRate: product.displayNetRate || false,
      netRate: (product.netRate ?? "").toString(),
      wholesalePrice: (product.wholesalePrice ?? "").toString(),
      storeStockPieces: (product.storeStockPieces ?? 0).toString(),
      godownStockCases: (product.godownStockCases ?? 0).toString(),
      piecesPerCase: (product.piecesPerCase ?? 1).toString()
    });
    setImageFile(null);
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", sku: "", price: "", wholesalePrice: "", netRate: "", stock: "", brand: "", category: "", description: "", quantity: "", hasDiscount: false, displayNetRate: false, storeStockPieces: "0", godownStockCases: "0", piecesPerCase: "1" });
    setImageFile(null);
    setDialogOpen(true);
  };

  useEffect(() => {
    const loadAll = () => {
      getProducts()
        .then((data) => {
          const safeData = Array.isArray(data) ? data : [];
          const mappedProducts = safeData.map((p: any) => ({
            ...p,
            id: p._id || p.id,
          }));
          setProductList(mappedProducts);
        })
        .catch((err) => {
          console.error('Failed to fetch products (AdminProducts):', err);
        });

      getCategories()
        .then((arr) => {
          const safeArr = Array.isArray(arr) ? arr : [];
          setCategories(safeArr.map((c: any) => ({
            id: c._id || c.id || c.slug,
            name: c.name,
            categoryCode: c.categoryCode || '',
            productCount: c.productCount || 0,
            image: c.image || ''
          })));
        })
        .catch((err) => {
          console.error('Failed to fetch categories (AdminProducts):', err);
        });

      getBrands()
        .then((arr) => {
          setBrands(Array.isArray(arr) ? arr : []);
        })
        .catch(() => {});
    };

    loadAll();

    // Auto sync from MongoDB Atlas every 15s or on window focus
    const interval = setInterval(loadAll, 15000);
    const onFocus = () => loadAll();
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const filtered = productList.filter((p) => {
    if (!p) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;

    const name = String(p.name || "").toLowerCase();

    let brandStr = "";
    if (p.brand) {
      if (typeof p.brand === 'object' && p.brand !== null) {
        brandStr = String((p.brand as any).name || (p.brand as any).brandId || "").toLowerCase();
      } else {
        brandStr = String(p.brand).toLowerCase();
      }
    }

    const skuStr = String(p.sku || p.code || "").toLowerCase();

    let catStr = "";
    if (p.category) {
      if (typeof p.category === 'object' && p.category !== null) {
        catStr = String((p.category as any).name || (p.category as any).slug || "").toLowerCase();
      } else {
        const catObj = categories.find((c) => c.id === p.category || (c as any)._id === p.category);
        catStr = String(catObj?.name || p.category).toLowerCase();
      }
    }

    return name.includes(q) || brandStr.includes(q) || skuStr.includes(q) || catStr.includes(q);
  });

  const handleDelete = async (id: string) => {
    console.log('Attempting to delete product with ID:', id);
    if (!id) {
      toast.error("Error: Invalid product ID");
      return;
    }
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE_URL}/api/products/${id}`, {
        method: 'DELETE',
        headers,
        credentials: 'include'
      });

      if (!res.ok) {
        const data = await res.json();
        const errorMsg = data.error?.message || data.error || 'Delete failed';
        throw new Error(errorMsg);
      }

      setProductList((prev) => prev.filter((p) => p.id !== id));
      toast.success("Product deleted");
    } catch (err) {
      console.error('Delete error:', err);
      const msg = err instanceof Error ? err.message : "Failed to delete product";
      toast.error(msg);
    }
  };
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedData = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  

  return (
    <>
      <AdminNavbar />
      <div className="flex min-h-screen">
        <AdminSidebar />
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="flex items-start justify-between w-full md:w-auto">
              <div>
                <h1 className="font-display text-2xl font-bold">Products</h1>
                <p className="text-sm text-muted-foreground">{productList.length} products total</p>
              </div>
              <Link to="/" className="text-sm text-primary hover:underline lg:hidden mt-1">← Store</Link>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={openCreate} className="w-full md:w-auto bg-red-600 hover:bg-red-700 text-white font-bold gap-2"><Plus className="h-4 w-4" /> Add Product</Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle className="font-display flex justify-between items-center">
                      <span>{editing ? 'Edit Product' : 'Add New Product'}</span>
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                      {editing ? 'Update product details and inventory' : 'Create a new product in the store catalog'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 max-h-[85vh] overflow-y-auto pr-2 custom-scrollbar">
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>Product Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Enter product name" /></div>
                      <div>
                        <Label className="text-xs font-bold uppercase text-gray-700">SKU / Code (Auto Generated)</Label>
                        <Input 
                          value={editing ? (editing.sku || editing.code || 'N/A') : (form.sku || 'Select category to generate SKU')} 
                          disabled 
                          className="mt-1 font-mono font-bold bg-gray-100 text-red-700 border-red-200" 
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>Retail Price (₹)</Label><Input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} type="number" placeholder="0" /></div>
                      <div><Label>Net-Rate (₹)</Label><Input value={form.netRate} onChange={(e) => setForm({ ...form, netRate: e.target.value })} type="number" placeholder="0" /></div>
                    </div>
                    <div>
                      <Label>Shop Stock (Pcs)</Label>
                      <Input value={form.storeStockPieces} onChange={(e) => {
                        const val = e.target.value;
                        setForm({ ...form, storeStockPieces: val, stock: val });
                      }} type="number" placeholder="0" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Brand</Label>
                        <select
                          value={form.brand}
                          onChange={(e) => setForm({ ...form, brand: e.target.value })}
                          className="w-full mt-1 rounded-md border border-gray-300 bg-white p-2.5 text-sm text-gray-900 focus:border-red-600 focus:ring-1 focus:ring-red-600 outline-none font-medium shadow-xs"
                        >
                          <option value="">Select brand</option>
                          {brands.filter((b) => b.isActive !== false).map((b) => (
                            <option key={b._id || b.id} value={b.name}>
                              {b.name} ({b.brandId})
                            </option>
                          ))}
                          {form.brand && !brands.some((b) => b.name === form.brand) && (
                            <option value={form.brand}>{form.brand}</option>
                          )}
                        </select>
                      </div>
                      <div className="flex flex-col gap-2 pt-6">
                        <div className="flex items-center gap-2">
                          <Checkbox 
                            id="hasDiscount" 
                            checked={form.hasDiscount && !form.displayNetRate} 
                            disabled={form.displayNetRate}
                            onCheckedChange={(checked) => setForm({ ...form, hasDiscount: !!checked })} 
                          />
                          <Label htmlFor="hasDiscount" className={`cursor-pointer ${form.displayNetRate ? 'opacity-50' : ''}`}>
                            Has Discount
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox 
                            id="displayNetRate" 
                            checked={form.displayNetRate} 
                            onCheckedChange={(checked) => {
                              const isChecked = !!checked;
                              setForm({ 
                                ...form, 
                                displayNetRate: isChecked,
                                hasDiscount: isChecked ? false : form.hasDiscount
                              });
                            }} 
                          />
                          <Label htmlFor="displayNetRate" className="cursor-pointer">
                            Display Net Rate on Shop
                          </Label>
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label>Category</Label>
                      <select 
                        value={form.category} 
                        onChange={(e) => {
                          const selectedCatId = e.target.value;
                          const selectedCat = categories.find(c => (c.id === selectedCatId || (c as any)._id === selectedCatId));
                          let calculatedSku = form.sku || '';

                          if (selectedCat && selectedCat.categoryCode && selectedCat.categoryCode !== 'N/A' && !editing) {
                            const code = selectedCat.categoryCode;
                            let maxSeq = 0;
                            productList.forEach(p => {
                              if (p.sku && p.sku.startsWith(code)) {
                                const seqStr = p.sku.substring(code.length).trim();
                                const seqNum = parseInt(seqStr, 10);
                                if (!isNaN(seqNum) && seqNum > maxSeq) {
                                  maxSeq = seqNum;
                                }
                              }
                            });
                            calculatedSku = `${code}${maxSeq + 1}`;
                          }

                          setForm({ 
                            ...form, 
                            category: selectedCatId,
                            sku: calculatedSku
                          });
                        }} 
                        className="w-full mt-1 rounded-md border border-gray-300 bg-white p-2.5 text-sm text-gray-900 focus:border-red-600 focus:ring-1 focus:ring-red-600 outline-none font-medium shadow-xs"
                      >
                        <option value="">Select category</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} {c.categoryCode && c.categoryCode !== 'N/A' ? `(Code: ${c.categoryCode})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Image (Max 1200x1600px, 5MB)</Label>
                      <input type="file" accept="image/*" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) {
                          setImageFile(null);
                          return;
                        }
                        const img = new Image();
                        const url = URL.createObjectURL(file);
                        img.onload = () => {
                          if (img.width > 1200 || img.height > 1600) {
                            toast.error("Image dimensions must not exceed 1200x1600 pixels");
                            setImageFile(null);
                            e.target.value = '';
                          } else {
                            setImageFile(file);
                          }
                          URL.revokeObjectURL(url);
                        };
                        img.src = url;
                      }} className="mt-1 block w-full text-xs text-gray-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100 cursor-pointer" />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <textarea 
                        value={form.description} 
                        onChange={(e) => setForm({ ...form, description: e.target.value })} 
                        className="w-full mt-1 rounded-md border border-gray-300 bg-white p-2.5 text-sm text-gray-900 focus:border-red-600 focus:ring-1 focus:ring-red-600 outline-none font-medium shadow-xs min-h-[90px]" 
                        placeholder="Product description..." 
                      />
                    </div>
                    <Button className="w-full" onClick={async () => {
                      // basic client-side validation
                      if (!form.name.trim()) return toast.error('Name required');
                      const maxSize = 5 * 1024 * 1024; // 5MB
                      if (imageFile && imageFile.size > maxSize) return toast.error('Image must be less than 5MB');

                      const fd = new FormData();
                      fd.append('name', form.name);
                      if (form.sku) {
                        fd.append('sku', form.sku);
                        fd.append('code', form.sku);
                      }
                      fd.append('price', form.price);
                      fd.append('stock', form.stock);
                      fd.append('brand', form.brand);
                      fd.append('category', form.category);
                      fd.append('description', form.description);
                      fd.append('quantity', form.quantity);
                      fd.append('wholesalePrice', form.wholesalePrice || "");
                      fd.append('netRate', form.netRate || "");
                      fd.append('hasDiscount', form.hasDiscount.toString());
                      fd.append('displayNetRate', form.displayNetRate.toString());
                      fd.append('storeStockPieces', form.storeStockPieces);
                      fd.append('godownStockCases', form.godownStockCases);
                      fd.append('piecesPerCase', form.piecesPerCase);
                      if (imageFile) {
                        fd.append('image', imageFile);
                      }

                      try {
                        const headers: Record<string, string> = {};
                        if (token) {
                          headers['Authorization'] = `Bearer ${token}`;
                        }

                        const url = editing ? `${API_BASE_URL}/api/products/${editing.id}` : `${API_BASE_URL}/api/products`;
                        const method = editing ? 'PUT' : 'POST';

                        const res = await fetch(url, {
                          method,
                          body: fd,
                          headers,
                          credentials: 'include'
                        });

                        if (!res.ok) {
                          const data = await res.json();
                          const errorMsg = data.error?.message || 'Upload failed';
                          throw new Error(errorMsg);
                        }

                        setDialogOpen(false);
                        setForm({ name: '', sku: '', price: '', wholesalePrice: '', netRate: '', stock: '', brand: '', category: '', description: '', quantity: '', hasDiscount: false, displayNetRate: false, storeStockPieces: '0', godownStockCases: '0', piecesPerCase: '1' });
                        setImageFile(null);
                        setEditing(null);
                        toast.success(editing ? 'Product updated!' : 'Product added!');

                        // refresh products
                        getProducts().then((d) => {
                          const safeData = Array.isArray(d) ? d : [];
                          const mappedProducts = safeData.map((p: any) => ({
                            ...p,
                            id: p._id || p.id,
                          }));
                          setProductList(mappedProducts);
                        }).catch(() => { });
                      } catch (err) {
                        const errorMsg = err instanceof Error ? err.message : 'Failed to save product';
                        console.error('Product save error:', err);
                        toast.error(errorMsg);
                      }
                    }}>{editing ? 'Update Product' : 'Save Product'}</Button>
                    <Button variant="outline" className="w-full mt-2" onClick={() => setDialogOpen(false)}>Close</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Search Card */}
          <Card className="shadow-sm border-gray-200 mb-6">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  value={search} 
                  onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} 
                  placeholder="Search products..." 
                  className="pl-9" 
                />
              </div>
            </CardContent>
          </Card>

          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50">
                  <tr className="border-b border-gray-200">
                    <th className="font-extrabold text-xs text-gray-700 uppercase p-4">SKU</th>
                    <th className="font-extrabold text-xs text-gray-700 uppercase p-4">Product</th>
                    <th className="font-extrabold text-xs text-gray-700 uppercase p-4 hidden sm:table-cell">Category</th>
                    <th className="font-extrabold text-xs text-gray-700 uppercase p-4 text-right">Price</th>
                    <th className="font-extrabold text-xs text-gray-700 uppercase p-4 text-right">Net Rate</th>
                    <th className="font-extrabold text-xs text-gray-700 uppercase p-4 text-center hidden md:table-cell">Discount</th>
                    <th className="font-extrabold text-xs text-gray-700 uppercase p-4 text-right hidden md:table-cell">Stock</th>
                    <th className="font-extrabold text-xs text-gray-700 uppercase p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedData.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center p-8 text-muted-foreground">
                        {search ? `No products found matching "${search}"` : 'No products found'}
                      </td>
                    </tr>
                  ) : (
                    paginatedData.map((p) => (
                      <tr key={p.id || p._id} className="hover:bg-red-50/40 transition-colors">
                        <td className="p-4 font-mono text-xs text-gray-500">{p.sku || p.code || 'N/A'}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img src={p.image || '/placeholder.svg'} alt={p.name || 'Product'} className="w-10 h-10 rounded-lg object-cover border border-gray-200" />
                            <div>
                              <p className="font-bold text-gray-900">{p.name}</p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {typeof p.brand === 'object' && p.brand !== null ? (p.brand as any).name : (p.brand || 'N/A')}
                              </p>
                            </div>
                          </div>
                        </td>
                      <td className="p-3 hidden sm:table-cell capitalize text-muted-foreground">{getCategoryName(p.category)}</td>
                      <td className="p-3 text-right">
                        <span className="font-bold text-primary">₹{p.price}</span>
                      </td>
                      <td className="p-3 text-right font-bold text-red-600">
                        ₹{p.netRate || 0}
                      </td>
                      <td className="p-3 text-center hidden md:table-cell">
                        <Checkbox
                          checked={p.hasDiscount && !p.displayNetRate}
                          disabled={p.displayNetRate}
                          onCheckedChange={async (checked) => {
                            try {
                              const newStatus = !!checked;
                              // Optimistic update
                              setProductList((prev) =>
                                prev.map((prod) =>
                                  prod.id === p.id ? { ...prod, hasDiscount: newStatus } : prod
                                )
                              );

                              const headers: Record<string, string> = {
                                'Content-Type': 'application/json'
                              };
                              if (token) headers['Authorization'] = `Bearer ${token}`;

                              const res = await fetch(`${API_BASE_URL}/api/products/${p.id}`, {
                                method: 'PUT',
                                headers,
                                body: JSON.stringify({ hasDiscount: newStatus }),
                                credentials: 'include'
                              });

                              if (!res.ok) throw new Error('Update failed');
                              toast.success(`Discount ${newStatus ? 'enabled' : 'disabled'}`);
                            } catch (err) {
                              console.error('Update error:', err);
                              toast.error('Failed to update discount status');
                              // Revert on error
                              setProductList((prev) =>
                                prev.map((prod) =>
                                  prod.id === p.id ? { ...prod, hasDiscount: !checked } : prod
                                )
                              );
                            }
                          }}
                        />
                      </td>
                      <td className="p-3 text-right hidden md:table-cell">
                        <span className={(p.storeStockPieces || 0) < 30 ? "text-accent font-bold" : ""}>{p.storeStockPieces || 0}</span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button className="p-1.5 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-primary" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></button>
                          <button className="p-1.5 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-destructive" onClick={() => handleDelete(String(p._id || p.id))}><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
                </tbody>
              </table>
            </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 bg-card border-t border-border mt-4 rounded-b-lg">
              <div className="text-sm text-muted-foreground">
                Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filtered.length)} to {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} entries
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</Button>
                <div className="text-sm font-medium">Page {currentPage} of {Math.max(1, totalPages)}</div>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0}>Next</Button>
              </div>
            </div>
          )}
          </div>
        </main>
      </div>
    </>
  );
};

export default AdminProducts;
