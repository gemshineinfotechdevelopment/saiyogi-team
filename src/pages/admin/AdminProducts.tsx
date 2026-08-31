import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Search, CheckCircle, FileArchive } from "lucide-react";
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
import BulkImportModal from "@/components/admin/BulkImportModal";

const AdminProducts = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;
  const { token } = useAuth();
  const [productList, setProductList] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [crackerTypeFilter, setCrackerTypeFilter] = useState("All");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  const [form, setForm] = useState({ name: "", sku: "", price: "", wholesalePrice: "", netRate: "", stock: "", brand: "", category: "", description: "", quantity: "", rating: "5", hasDiscount: false, displayNetRate: false, isSaiYogiVerified: true, storeStockPieces: "0", godownStockCases: "0", piecesPerCase: "1", crackerType: "Day Crackers" });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      rating: (product.rating ?? 5).toString(),
      hasDiscount: product.hasDiscount || false,
      displayNetRate: product.displayNetRate || false,
      isSaiYogiVerified: product.isSaiYogiVerified || false,
      netRate: (product.netRate ?? "").toString(),
      wholesalePrice: (product.wholesalePrice ?? "").toString(),
      storeStockPieces: (product.storeStockPieces ?? 0).toString(),
      godownStockCases: (product.godownStockCases ?? 0).toString(),
      piecesPerCase: (product.piecesPerCase ?? 1).toString(),
      crackerType: product.crackerType || "Day Crackers"
    });
    setImageFile(null);
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", sku: "", price: "", wholesalePrice: "", netRate: "", stock: "", brand: "", category: "", description: "", quantity: "", rating: "5", hasDiscount: false, displayNetRate: false, isSaiYogiVerified: true, storeStockPieces: "0", godownStockCases: "0", piecesPerCase: "1", crackerType: "Day Crackers" });
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
          mappedProducts.sort((a: any, b: any) => {
            const skuA = String(a.sku || a.code || '');
            const skuB = String(b.sku || b.code || '');
            const numA = parseInt(skuA, 10);
            const numB = parseInt(skuB, 10);
            if (!isNaN(numA) && !isNaN(numB)) {
              return numA - numB;
            }
            return skuA.localeCompare(skuB, undefined, { numeric: true });
          });
          setProductList(mappedProducts);
        })
        .catch((err) => {
          console.error('Failed to fetch products (AdminProducts):', err);
        });

      getCategories()
        .then((arr) => {
          const safeArr = Array.isArray(arr) ? arr : [];
          const mappedCats = safeArr.map((c: any) => ({
            id: c._id || c.id || c.slug,
            name: c.name,
            categoryCode: c.categoryCode || '',
            productCount: c.productCount || 0,
            image: c.image || ''
          }));
          mappedCats.sort((a: any, b: any) => {
            const codeA = parseInt(a.categoryCode || '', 10);
            const codeB = parseInt(b.categoryCode || '', 10);
            if (!isNaN(codeA) && !isNaN(codeB)) {
              return codeA - codeB;
            }
            return String(a.categoryCode || '').localeCompare(String(b.categoryCode || ''), undefined, { numeric: true });
          });
          setCategories(mappedCats);
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

    if (crackerTypeFilter !== "All") {
      const pType = p.crackerType || "Day Crackers";
      if (pType !== crackerTypeFilter) return false;
    }

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

    if (isSubmitting) return;
    setIsSubmitting(true);
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

      if (!res.ok && res.status !== 404) {
        const data = await res.json().catch(() => ({}));
        const errorMsg = data.error?.message || data.error || data.message || 'Delete failed';
        throw new Error(errorMsg);
      }

      setProductList((prev) => prev.filter((p) => p.id !== id && (p as any)._id !== id));
      toast.success("Product deleted");
    } catch (err) {
      console.error('Delete error:', err);
      const msg = err instanceof Error ? err.message : "Failed to delete product";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedData = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  

  return (
    <>
      <AdminNavbar />
      <div className="flex min-h-screen">
        <AdminSidebar />
        <main className="flex-1 p-6 lg:p-8 overflow-auto pb-32">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div className="flex items-start justify-between w-full md:w-auto">
              <div>
                <h1 className="font-display text-2xl font-bold">Products</h1>
                <p className="text-sm text-muted-foreground">{productList.length} products total</p>
              </div>
              <Link to="/" className="text-sm text-primary hover:underline lg:hidden mt-1">← Store</Link>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Button
                onClick={() => setIsBulkImportOpen(true)}
                variant="outline"
                className="w-full md:w-auto border-amber-400 bg-amber-50/50 hover:bg-amber-100/80 text-amber-900 font-bold gap-2 shadow-xs"
              >
                <FileArchive className="h-4 w-4 text-[#A80000]" />
                Bulk Import
              </Button>

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
                  <div className="space-y-4 max-h-[85vh] overflow-y-auto p-1.5 pr-3 custom-scrollbar">
                    <div className="grid grid-cols-2 gap-4 items-start">
                      <div>
                        <Label className="text-xs font-bold uppercase text-gray-700">Product Name *</Label>
                        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Enter product name" className="mt-1" />
                      </div>
                      <div>
                        <Label className="text-xs font-bold uppercase text-gray-700">SKU / Code (Auto Generated)</Label>
                        <Input 
                          value={editing ? (editing.sku || editing.code || 'N/A') : (form.sku || 'Select category to generate SKU')} 
                          disabled 
                          className="mt-1 font-mono font-bold bg-gray-100 text-red-700 border-red-200" 
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 items-start">
                      <div>
                        <Label className="text-xs font-bold uppercase text-gray-700">Retail Price (₹)</Label>
                        <Input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} type="number" placeholder="0" className="mt-1" />
                      </div>
                      <div>
                        <Label className="text-xs font-bold uppercase text-gray-700">Net-Rate (₹)</Label>
                        <Input value={form.netRate} onChange={(e) => setForm({ ...form, netRate: e.target.value })} type="number" placeholder="0" className="mt-1" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 items-start">
                      <div>
                        <Label className="text-xs font-bold uppercase text-gray-700">Shop Stock (Pcs)</Label>
                        <Input value={form.storeStockPieces} onChange={(e) => {
                          const val = e.target.value;
                          setForm({ ...form, storeStockPieces: val, stock: val });
                        }} type="number" placeholder="0" className="mt-1" />
                      </div>
                      <div>
                        <Label className="text-xs font-bold uppercase text-gray-700">Star Rating (1 - 5 ⭐)</Label>
                        <Input 
                          value={form.rating} 
                          onChange={(e) => {
                            const val = e.target.value;
                            const num = parseFloat(val);
                            const hasRating = val.trim() !== "" && !isNaN(num) && num > 0;
                            setForm({ 
                              ...form, 
                              rating: val,
                              isSaiYogiVerified: hasRating ? true : form.isSaiYogiVerified
                            });
                          }} 
                          type="number" 
                          min="1" 
                          max="5" 
                          step="0.1" 
                          placeholder="5" 
                          className="mt-1" 
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs font-bold uppercase text-gray-700">Content / Items Count (e.g. 10Pcs, 36 Items)</Label>
                      <Input value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} type="text" placeholder="e.g. 10Pcs or 36 Items" className="mt-1" />
                    </div>
                    <div className="grid grid-cols-2 gap-4 items-start">
                      <div>
                        <Label className="text-xs font-bold uppercase text-gray-700">Brand</Label>
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
                      <div>
                        <Label className="text-xs font-bold uppercase text-gray-700">Crackers Type *</Label>
                        <select
                          value={form.crackerType}
                          onChange={(e) => setForm({ ...form, crackerType: e.target.value })}
                          className="w-full mt-1 rounded-md border border-gray-300 bg-white p-2.5 text-sm text-gray-900 focus:border-red-600 focus:ring-1 focus:ring-red-600 outline-none font-medium shadow-xs"
                        >
                          <option value="Day Crackers">☀️ Day Crackers</option>
                          <option value="Night Crackers">🌙 Night Crackers</option>
                          <option value="Kids Crackers">🎈 Kids Crackers</option>
                          <option value="Gift Box">🎁 Gift Box</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 pt-2">
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

                    {/* Dedicated Full-Width Verified by Sai Yogi Option */}
                    <div className="p-3 bg-emerald-50 border-2 border-emerald-200 rounded-xl flex items-center justify-between shadow-xs my-1">
                      <div className="flex items-center gap-2.5">
                        <Checkbox 
                          id="isSaiYogiVerified" 
                          checked={form.isSaiYogiVerified} 
                          onCheckedChange={(checked) => setForm({ ...form, isSaiYogiVerified: !!checked })} 
                          className="w-5 h-5 border-emerald-600 data-[state=checked]:bg-emerald-600 data-[state=checked]:text-white"
                        />
                        <Label htmlFor="isSaiYogiVerified" className="cursor-pointer font-extrabold text-emerald-900 text-sm flex items-center gap-1.5 select-none">
                          <CheckCircle className="w-5 h-5 text-emerald-600 fill-emerald-100 shrink-0" />
                          <span>Verified by Sai Yogi</span>
                        </Label>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-300">
                        Shows Verified Tag on User Side
                      </span>
                    </div>
                    <div>
                      <Label className="text-xs font-bold uppercase text-gray-700">Category</Label>
                      <select 
                        value={form.category} 
                        onChange={(e) => {
                          const selectedCatId = e.target.value;
                          const selectedCat = categories.find(c => (c.id === selectedCatId || (c as any)._id === selectedCatId));
                          let calculatedSku = form.sku || '';

                          if (selectedCat && selectedCat.categoryCode && selectedCat.categoryCode !== 'N/A' && !editing) {
                            const code = selectedCat.categoryCode;
                            const catNum = parseInt(code, 10);
                            const isNumericCat = !isNaN(catNum);
                            const base = isNumericCat ? (code.length === 3 ? catNum * 10 : catNum) : null;
                            let maxSeq = 0;

                            productList.forEach(p => {
                              if (p.sku) {
                                if (isNumericCat && base !== null) {
                                  const pSkuNum = parseInt(p.sku, 10);
                                  if (!isNaN(pSkuNum) && pSkuNum > base && pSkuNum < base + 100) {
                                    const seqNum = pSkuNum - base;
                                    if (seqNum > maxSeq) maxSeq = seqNum;
                                  }
                                } else if (p.sku.startsWith(code)) {
                                  const seqStr = p.sku.substring(code.length).trim();
                                  const seqNum = parseInt(seqStr, 10);
                                  if (!isNaN(seqNum) && seqNum > maxSeq) {
                                    maxSeq = seqNum;
                                  }
                                }
                              }
                            });

                            if (isNumericCat && base !== null) {
                              calculatedSku = (base + maxSeq + 1).toString();
                            } else {
                              calculatedSku = `${code}${maxSeq + 1}`;
                            }
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
                      <Label className="text-xs font-bold uppercase text-gray-700">Image (Max 1200x1600px, Max 1MB)</Label>
                      <input type="file" accept="image/*" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) {
                          setImageFile(null);
                          return;
                        }
                        if (file.size > 1 * 1024 * 1024) {
                          toast.error("Image file size must be less than 1MB");
                          setImageFile(null);
                          e.target.value = '';
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
                      <Label className="text-xs font-bold uppercase text-gray-700">Description</Label>
                      <textarea 
                        value={form.description} 
                        onChange={(e) => setForm({ ...form, description: e.target.value })} 
                        className="w-full mt-1 rounded-md border border-gray-300 bg-white p-2.5 text-sm text-gray-900 focus:border-red-600 focus:ring-1 focus:ring-red-600 outline-none font-medium shadow-xs min-h-[90px]" 
                        placeholder="Product description..." 
                      />
                    </div>
                    <Button className="w-full bg-red-600 hover:bg-red-700 text-white font-bold" disabled={isSubmitting} onClick={async () => {
                      if (isSubmitting) return;
                      // basic client-side validation
                      if (!form.name.trim()) return toast.error('Name required');
                      const maxSize = 1 * 1024 * 1024; // 1MB
                      if (imageFile && imageFile.size > maxSize) return toast.error('Image must be less than 1MB');

                      setIsSubmitting(true);
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
                      fd.append('rating', form.rating || "5");
                      fd.append('wholesalePrice', form.wholesalePrice || "");
                      fd.append('netRate', form.netRate || "");
                      fd.append('hasDiscount', String(form.hasDiscount));
                      fd.append('displayNetRate', String(form.displayNetRate));
                      fd.append('isSaiYogiVerified', String(form.isSaiYogiVerified));
                      fd.append('storeStockPieces', form.storeStockPieces);
                      fd.append('godownStockCases', form.godownStockCases);
                      fd.append('piecesPerCase', form.piecesPerCase);
                      fd.append('crackerType', form.crackerType || 'Day Crackers');
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
                        setForm({ name: '', sku: '', price: '', wholesalePrice: '', netRate: '', stock: '', brand: '', category: '', description: '', quantity: '', rating: '5', hasDiscount: false, displayNetRate: false, isSaiYogiVerified: true, storeStockPieces: '0', godownStockCases: '0', piecesPerCase: '1', crackerType: 'Day Crackers' });
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
                      } finally {
                        setIsSubmitting(false);
                      }
                    }}>
                      {isSubmitting ? (editing ? 'Updating Product...' : 'Saving Product...') : (editing ? 'Update Product' : 'Save Product')}
                    </Button>
                    <Button variant="outline" className="w-full mt-2" disabled={isSubmitting} onClick={() => setDialogOpen(false)}>Close</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Search & Filter Card */}
          <Card className="shadow-sm border-gray-200 mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-3 items-center">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    value={search} 
                    onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} 
                    placeholder="Search products by name, brand, SKU..." 
                    className="pl-9" 
                  />
                </div>
                <div className="w-full sm:w-56">
                  <select
                    value={crackerTypeFilter}
                    onChange={(e) => { setCrackerTypeFilter(e.target.value); setCurrentPage(1); }}
                    className="w-full rounded-md border border-gray-300 bg-white p-2.5 text-xs font-extrabold text-gray-800 focus:border-red-600 outline-none shadow-xs"
                  >
                    <option value="All">All Cracker Types</option>
                    <option value="Day Crackers">☀️ Day Crackers</option>
                    <option value="Night Crackers">🌙 Night Crackers</option>
                    <option value="Kids Crackers">🎈 Kids Crackers</option>
                    <option value="Gift Box">🎁 Gift Box</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="bg-card border border-border rounded-lg overflow-hidden mb-24">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50">
                  <tr className="border-b border-gray-200">
                    <th className="font-extrabold text-xs text-gray-700 uppercase p-4">SKU</th>
                    <th className="font-extrabold text-xs text-gray-700 uppercase p-4">Product</th>
                    <th className="font-extrabold text-xs text-gray-700 uppercase p-4 hidden sm:table-cell">Category</th>
                    <th className="font-extrabold text-xs text-gray-700 uppercase p-4 hidden md:table-cell">Type</th>
                    <th className="font-extrabold text-xs text-gray-700 uppercase p-4 text-right">Price</th>
                    <th className="font-extrabold text-xs text-gray-700 uppercase p-4 text-right">Net Rate</th>
                    <th className="font-extrabold text-xs text-gray-700 uppercase p-4 text-center hidden md:table-cell">Discount</th>
                    <th className="font-extrabold text-xs text-gray-700 uppercase p-4 text-center hidden md:table-cell">Verified</th>
                    <th className="font-extrabold text-xs text-gray-700 uppercase p-4 text-right hidden md:table-cell">Stock</th>
                    <th className="font-extrabold text-xs text-gray-700 uppercase p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedData.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center p-8 text-muted-foreground">
                        {search ? `No products found matching "${search}"` : 'No products found'}
                      </td>
                    </tr>
                  ) : (
                    paginatedData.map((p) => (
                      <tr key={p.id || p._id} className="hover:bg-red-50/40 transition-colors">
                        <td className="p-4 font-mono text-xs text-gray-500 whitespace-nowrap">{p.sku || p.code || 'N/A'}</td>
                        <td className="p-4 whitespace-nowrap">
                          <div className="flex items-center gap-4 pr-6">
                            <img src={p.image || '/placeholder.svg'} alt={p.name || 'Product'} className="w-12 h-12 rounded-lg object-cover border border-gray-200 shrink-0 shadow-sm" />
                            <div>
                              <p className="font-bold text-gray-900 text-base tracking-tight">{p.name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <p className="text-xs font-medium text-gray-500">
                                  {typeof p.brand === 'object' && p.brand !== null ? (p.brand as any).name : (p.brand || 'N/A')}
                                </p>
                                {p.quantity && (
                                  <span className="bg-red-50 text-[#A80000] border border-red-200/80 text-[10px] font-black px-2 py-0.5 rounded-md">
                                    {p.quantity}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                      <td className="p-3 hidden sm:table-cell capitalize text-muted-foreground">{getCategoryName(p.category)}</td>
                      <td className="p-3 hidden md:table-cell">
                        <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full border inline-flex items-center gap-1 ${
                          p.crackerType === 'Night Crackers'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : p.crackerType === 'Kids Crackers'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : p.crackerType === 'Gift Box'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {p.crackerType === 'Night Crackers'
                            ? '🌙 Night'
                            : p.crackerType === 'Kids Crackers'
                            ? '🎈 Kids'
                            : p.crackerType === 'Gift Box'
                            ? '🎁 Gift Box'
                            : '☀️ Day'}
                        </span>
                      </td>
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
                      <td className="p-3 text-center hidden md:table-cell">
                        <div className="flex items-center justify-center gap-1.5">
                          <Checkbox
                            checked={!!p.isSaiYogiVerified}
                            onCheckedChange={async (checked) => {
                              try {
                                const newStatus = !!checked;
                                // Optimistic update
                                setProductList((prev) =>
                                  prev.map((prod) =>
                                    prod.id === p.id ? { ...prod, isSaiYogiVerified: newStatus } : prod
                                  )
                                );

                                const headers: Record<string, string> = {
                                  'Content-Type': 'application/json'
                                };
                                if (token) headers['Authorization'] = `Bearer ${token}`;

                                const res = await fetch(`${API_BASE_URL}/api/products/${p.id}`, {
                                  method: 'PUT',
                                  headers,
                                  body: JSON.stringify({ isSaiYogiVerified: newStatus }),
                                  credentials: 'include'
                                });

                                if (!res.ok) throw new Error('Update failed');
                                toast.success(`Verified by Sai Yogi ${newStatus ? 'enabled' : 'disabled'}`);
                              } catch (err) {
                                console.error('Update error:', err);
                                toast.error('Failed to update verified status');
                                // Revert on error
                                setProductList((prev) =>
                                  prev.map((prod) =>
                                    prod.id === p.id ? { ...prod, isSaiYogiVerified: !checked } : prod
                                  )
                                );
                              }
                            }}
                          />
                        </div>
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
          <BulkImportModal
            open={isBulkImportOpen}
            onOpenChange={setIsBulkImportOpen}
            onImportComplete={() => {
              // Reload products on import complete
              getProducts()
                .then((data) => {
                  const safeData = Array.isArray(data) ? data : [];
                  setProductList(safeData.map((p: any) => ({ ...p, id: p._id || p.id })));
                })
                .catch(() => {});
            }}
          />
        </main>
      </div>
    </>
  );
};

export default AdminProducts;
