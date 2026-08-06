import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import AdminSidebar from "@/components/layout/AdminSidebar";
import AdminNavbar from "@/components/layout/AdminNavbar";
import { getProducts, getCategories, API_BASE_URL } from "@/lib/api";
import { Product, Category } from "@/data/products";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const AdminProducts = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;
  const { token } = useAuth();
  const [productList, setProductList] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const [form, setForm] = useState({ name: "", price: "", wholesalePrice: "", netRate: "", stock: "", brand: "", category: "", description: "", quantity: "", hasDiscount: false, displayNetRate: false, storeStockPieces: "0", godownStockCases: "0", piecesPerCase: "1" });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);

  const getCategoryName = (category: string | any) => {
    if (category && typeof category === 'object') {
      return category.name || category.slug;
    }
    const cat = categories.find((c) => c.id === category);
    return cat?.name || category;
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    setForm({
      name: product.name,
      price: product.price.toString(),
      stock: product.stock.toString(),
      brand: product.brand,
      category: (product.category && typeof product.category === 'object') ? (product.category as any)._id || (product.category as any).id || "" : product.category || "",
      description: product.description,
      quantity: product.quantity || "",
      hasDiscount: product.hasDiscount || false,
      displayNetRate: product.displayNetRate || false,
      netRate: product.netRate?.toString() || "",
      wholesalePrice: product.wholesalePrice?.toString() || "",
      storeStockPieces: product.storeStockPieces?.toString() || "0",
      godownStockCases: product.godownStockCases?.toString() || "0",
      piecesPerCase: product.piecesPerCase?.toString() || "1"
    });
    setImageFile(null);
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", price: "", wholesalePrice: "", netRate: "", stock: "", brand: "", category: "", description: "", quantity: "", hasDiscount: false, displayNetRate: false, storeStockPieces: "0", godownStockCases: "0", piecesPerCase: "1" });
    setImageFile(null);
    setDialogOpen(true);
  };

  useEffect(() => {
    getProducts()
      .then((data) => {
        console.log('Products loaded (AdminProducts):', data, Array.isArray(data));
        const safeData = Array.isArray(data) ? data : [];
        const mappedProducts = safeData.map((p: any) => ({
          ...p,
          id: p._id || p.id,
        }));
        setProductList(mappedProducts);
      })
      .catch((err) => {
        console.error('Failed to fetch products (AdminProducts):', err);
        setProductList([]);
      });

    getCategories()
      .then((arr) => {
        console.log('Categories loaded (AdminProducts):', arr, Array.isArray(arr));
        const safeArr = Array.isArray(arr) ? arr : [];
        setCategories(safeArr.map((c: any) => ({
          id: c._id || c.id || c.slug,
          name: c.name,
          productCount: c.productCount || 0,
          image: c.image || ''
        })));
      })
      .catch((err) => {
        console.error('Failed to fetch categories (AdminProducts):', err);
        setCategories([]);
      });
  }, []);

  const filtered = productList.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.brand.toLowerCase().includes(search.toLowerCase())
  );

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
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-display text-2xl font-bold">Products</h1>
              <p className="text-sm text-muted-foreground">{productList.length} products total</p>
            </div>
            <div className="flex gap-2">
              <Link to="/" className="text-sm text-primary hover:underline lg:hidden self-center">← Store</Link>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> Add Product</Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle className="font-display flex justify-between items-center">
                      <span>{editing ? 'Edit Product' : 'Add New Product'}</span>
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 max-h-[85vh] overflow-y-auto pr-2 custom-scrollbar">
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>Product Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Enter product name" /></div>
                      <div><Label>SKU / Code</Label><Input value={editing?.sku || 'Auto-generated on save'} disabled className="bg-muted" /></div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div><Label>Retail Price (₹)</Label><Input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} type="number" placeholder="0" /></div>
                      <div><Label>Wholesale Price (₹)</Label><Input value={form.wholesalePrice} onChange={(e) => setForm({ ...form, wholesalePrice: e.target.value })} type="number" placeholder="0" /></div>
                      <div><Label>Net-Rate (₹)</Label><Input value={form.netRate} onChange={(e) => setForm({ ...form, netRate: e.target.value })} type="number" placeholder="0" /></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div><Label>Shop Stock (Pcs)</Label><Input value={form.storeStockPieces} onChange={(e) => {
                        const val = e.target.value;
                        setForm({ ...form, storeStockPieces: val, stock: val });
                      }} type="number" placeholder="0" /></div>
                      <div><Label>Godown (Cases)</Label><Input value={form.godownStockCases} onChange={(e) => {
                        const val = e.target.value;
                        setForm({ ...form, godownStockCases: val });
                      }} type="number" placeholder="0" /></div>
                      <div><Label>Pcs / Case</Label><Input value={form.piecesPerCase} onChange={(e) => {
                        const val = e.target.value;
                        setForm({ ...form, piecesPerCase: val });
                      }} type="number" placeholder="1" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>Brand</Label><Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="Brand name" /></div>
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
                    <div><Label>Category</Label>
                      <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full rounded-lg border border-border bg-secondary p-2 text-sm text-foreground">
                        <option value="">Select category</option>
                        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <Label>Image (Max 5MB, optional)</Label>
                      <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
                    </div>
                    <div><Label>Description</Label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-lg border border-border bg-secondary p-2 text-sm min-h-[80px] text-foreground" placeholder="Product description..." /></div>
                    <Button className="w-full" onClick={async () => {
                      // basic client-side validation
                      if (!form.name.trim()) return toast.error('Name required');
                      const maxSize = 5 * 1024 * 1024; // 5MB
                      if (imageFile && imageFile.size > maxSize) return toast.error('Image must be less than 5MB');

                      const fd = new FormData();
                      fd.append('name', form.name);
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
                        setForm({ name: '', price: '', wholesalePrice: '', netRate: '', stock: '', brand: '', category: '', description: '', quantity: '', hasDiscount: false, displayNetRate: false, storeStockPieces: '0', godownStockCases: '0', piecesPerCase: '1' });
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

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} placeholder="Search products..." className="pl-10 bg-secondary" />
          </div>

          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="text-left p-3">SKU</th>
                    <th className="text-left p-3">Product</th>
                    <th className="text-left p-3 hidden sm:table-cell">Category</th>
                    <th className="text-right p-3">Price</th>
                    <th className="text-right p-3">Net Rate</th>
                    <th className="text-center p-3 hidden md:table-cell">Discount</th>
                    <th className="text-right p-3 hidden md:table-cell">Stock</th>
                    <th className="text-right p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((p) => (
                    <tr key={p.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                      <td className="p-3 font-mono text-xs text-muted-foreground">{p.sku || p.code || 'N/A'}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <img src={p.image} alt={p.name} className="w-10 h-10 rounded object-cover" />
                          <div>
                            <p className="font-semibold">{p.name}</p>
                            <p className="text-xs text-muted-foreground">{p.brand}</p>
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
                          <button className="p-1.5 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-destructive" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
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
