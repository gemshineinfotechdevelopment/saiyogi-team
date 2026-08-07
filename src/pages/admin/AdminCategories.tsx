import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, FolderTree, Eye, Package } from "lucide-react";
import AdminSidebar from "@/components/layout/AdminSidebar";
import AdminNavbar from "@/components/layout/AdminNavbar";
import { getCategories, getProducts, API_BASE_URL } from "@/lib/api";
import { Category } from "@/data/products";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";

const AdminCategories = () => {
  const { token } = useAuth();
  const [cats, setCats] = useState<Category[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [viewingCategory, setViewingCategory] = useState<Category | null>(null);

  const [form, setForm] = useState({ name: "", image: "", categoryCode: "100" });
  const [imageFile, setImageFile] = useState<File | null>(null);

  const openCreate = () => {
    setEditing(null);
    let maxCode = 90;
    cats.forEach((c) => {
      const num = parseInt(c.categoryCode || "", 10);
      if (!isNaN(num) && num > maxCode) {
        maxCode = num;
      }
    });
    const autoCode = (maxCode + 10).toString();

    setForm({ name: "", image: "", categoryCode: autoCode });
    setImageFile(null);
    setDialogOpen(true);
  };

  const loadCategoriesWithCounts = async () => {
    try {
      const [categoriesData, productsData] = await Promise.all([
        getCategories(),
        getProducts()
      ]);

      const safeCategories = Array.isArray(categoriesData) ? categoriesData : [];
      const safeProducts = Array.isArray(productsData) ? productsData : [];
      setAllProducts(safeProducts);

      // Count products per category
      const productCountByCategory = safeProducts.reduce((acc: Record<string, number>, product: any) => {
        const categoryId = (product.category && typeof product.category === 'object') 
          ? (product.category._id || product.category.id) 
          : product.category;
          
        if (categoryId) {
          acc[categoryId] = (acc[categoryId] || 0) + 1;
        }
        return acc;
      }, {});

      // Map categories with calculated product counts
      const categoriesWithCounts = safeCategories.map((c: any) => ({
        id: c._id || c.id || c.slug,
        name: c.name,
        categoryCode: c.categoryCode || 'N/A',
        productCount: productCountByCategory[c._id || c.id || c.slug] || 0,
        image: c.image || ''
      }));

      setCats(categoriesWithCounts);
    } catch (err) {
      console.error('Failed to load categories and products:', err);
      setCats([]);
    }
  };

  useEffect(() => {
    loadCategoriesWithCounts();
  }, []);

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setForm({ name: cat.name, image: cat.image, categoryCode: cat.categoryCode || "100" });
    setImageFile(null);
    setDialogOpen(true);
  };

  const openDelete = (cat: Category) => {
    setDeleting(cat);
    setDeleteOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    const fd = new FormData();
    fd.append('name', form.name);
    if (form.categoryCode) {
      fd.append('categoryCode', form.categoryCode);
    }
    if (imageFile) {
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (imageFile.size > maxSize) {
        toast.error('Image must be less than 5MB');
        return;
      }
      fd.append('image', imageFile);
    }

    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      if (editing) {
        console.log('Updating category:', editing.id);
        const res = await fetch(`${API_BASE_URL}/api/categories/${editing.id}`, {
          method: 'PUT',
          body: fd,
          headers,
          credentials: 'include'
        });
        const data = await res.json();

        if (!res.ok) {
          const errorMsg = data.error?.message || data.error || 'Update failed';
          console.error('Update failed:', res.status, errorMsg);
          throw new Error(errorMsg);
        }

        const updated = {
          id: data.category._id || data.category.id || data.category.slug,
          name: data.category.name,
          categoryCode: data.category.categoryCode || form.categoryCode,
          productCount: cats.find(c => c.id === (data.category._id || data.category.id || data.category.slug))?.productCount || 0,
          image: data.category.image || '',
        };
        setCats((prev) => prev.map((c) => (c.id === editing.id ? updated : c)));
        toast.success('Category updated');

        setTimeout(() => {
          loadCategoriesWithCounts();
        }, 500);
      } else {
        console.log('Creating new category');
        const res = await fetch(`${API_BASE_URL}/api/categories`, {
          method: 'POST',
          body: fd,
          headers,
          credentials: 'include'
        });
        const data = await res.json();

        if (!res.ok) {
          const errorMsg = data.error?.message || data.error || 'Create failed';
          console.error('Create failed:', res.status, errorMsg);
          throw new Error(errorMsg);
        }

        const created = {
          id: data.category._id || data.category.id || data.category.slug,
          name: data.category.name,
          categoryCode: data.category.categoryCode || form.categoryCode,
          productCount: 0,
          image: data.category.image || '',
        };
        setCats((prev) => [...prev, created]);
        toast.success('Category created');

        setTimeout(() => {
          loadCategoriesWithCounts();
        }, 500);
      }
      setDialogOpen(false);
      setForm({ name: '', image: '', categoryCode: '100' });
      setImageFile(null);
    } catch (err) {
      console.error('Save error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Save failed';
      toast.error(errorMessage);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;

    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      console.log('Deleting category:', deleting.id);
      const res = await fetch(`${API_BASE_URL}/api/categories/${deleting.id}`, {
        method: 'DELETE',
        headers,
        credentials: 'include'
      });

      if (!res.ok) {
        const data = await res.json();
        const errorMsg = data.error?.message || data.error || 'Delete failed';
        if (res.status === 400 && errorMsg.includes('products')) {
          throw new Error('Cannot delete: This category contains products. Please delete or move them first.');
        }
        throw new Error(errorMsg);
      }

      setCats((prev) => prev.filter((c) => c.id !== deleting.id));
      toast.success(`"${deleting.name}" deleted successfully`);
    } catch (err) {
      console.error('Delete error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to delete category');
    } finally {
      setDeleteOpen(false);
      setDeleting(null);
    }
  };

  return (
    <>
      <AdminNavbar />
      <div className="flex min-h-screen">
        <AdminSidebar />
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-display text-2xl font-bold flex items-center gap-2">
                <FolderTree className="h-6 w-6 text-primary" /> Categories
              </h1>
              <p className="text-sm text-muted-foreground">
                {cats.length} categories. Click on any row or view icon to see products inside that category.
              </p>
            </div>
            <Button onClick={openCreate} className="gap-2 bg-red-600 hover:bg-red-700 text-white font-bold">
              <Plus className="h-4 w-4" /> New Category
            </Button>
          </div>

          <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="font-extrabold text-xs text-gray-700 uppercase">Code</TableHead>
                  <TableHead className="font-extrabold text-xs text-gray-700 uppercase">Category Name</TableHead>
                  <TableHead className="font-extrabold text-xs text-gray-700 uppercase">Products</TableHead>
                  <TableHead className="font-extrabold text-xs text-gray-700 uppercase">Image</TableHead>
                  <TableHead className="font-extrabold text-xs text-gray-700 uppercase text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100">
                {cats.map((cat) => (
                  <TableRow 
                    key={cat.id} 
                    onClick={() => setViewingCategory(cat)}
                    className="hover:bg-red-50/40 cursor-pointer transition-colors"
                  >
                    <TableCell className="py-2.5">
                      <Badge variant="outline" className="font-mono font-bold text-red-700 bg-red-50 border-red-200">
                        {cat.categoryCode}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-bold text-gray-900 py-2.5">{cat.name}</TableCell>
                    <TableCell className="py-2.5">
                      <Badge variant="secondary" className="font-bold">
                        {cat.productCount} Items
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2.5">
                      {cat.image ? (
                        <img src={cat.image} alt={cat.name} className="w-12 h-12 rounded-lg object-cover border border-gray-200 shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-[10px] text-gray-400">No Image</div>
                      )}
                    </TableCell>
                    <TableCell className="py-2.5 text-right">
                      <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setViewingCategory(cat)}
                          className="h-8 w-8 p-0 text-gray-700 border-gray-200 hover:bg-gray-100 hover:text-red-700"
                          title="View Products"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => openEdit(cat)}
                          className="h-8 w-8 p-0 text-blue-600 border-blue-200 hover:bg-blue-50"
                          title="Edit Category"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => openDelete(cat)}
                          className="h-8 w-8 p-0"
                          title="Delete Category"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Create / Edit Dialog */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? "Edit Category" : "New Category"}</DialogTitle>
                <DialogDescription>{editing ? "Rename or update this category." : "Add a new product category."}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-gray-700">Category Code (Auto Generated)</Label>
                  <Input
                    value={editing ? (editing.categoryCode || 'N/A') : `${form.categoryCode} (Auto Created)`}
                    disabled
                    className="font-mono font-bold bg-gray-100 text-red-700 border-red-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category Name</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Fancy Lights" />
                </div>
                <div className="space-y-2">
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
                  }} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSave} disabled={!form.name.trim()} className="bg-red-600 hover:bg-red-700 text-white font-bold">{editing ? "Save Changes" : "Create"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* View Category Products Modal */}
          <Dialog open={!!viewingCategory} onOpenChange={(open) => !open && setViewingCategory(null)}>
            <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
              <DialogHeader className="border-b pb-4">
                <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
                  {viewingCategory?.image ? (
                    <img src={viewingCategory.image} alt={viewingCategory.name} className="w-12 h-12 rounded-lg object-cover border p-0.5 shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gray-100 border flex items-center justify-center text-xs text-gray-400 shrink-0">No Image</div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span>{viewingCategory?.name}</span>
                      <Badge variant="outline" className="font-mono text-xs font-bold text-red-700 bg-red-50 border-red-200">
                        Code: {viewingCategory?.categoryCode}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 font-normal mt-0.5">
                      Showing all products under {viewingCategory?.name}
                    </p>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto py-4">
                {(() => {
                  const categoryProducts = allProducts.filter(p => {
                    const pCatId = (p.category && typeof p.category === 'object') ? (p.category._id || p.category.id) : p.category;
                    const pCatName = (p.category && typeof p.category === 'object') ? p.category.name : p.category;
                    return pCatId === viewingCategory?.id || pCatName === viewingCategory?.name || (p.sku && viewingCategory?.categoryCode && p.sku.startsWith(viewingCategory.categoryCode));
                  });

                  if (categoryProducts.length === 0) {
                    return (
                      <div className="p-8 text-center text-gray-500 space-y-2">
                        <Package className="h-10 w-10 text-gray-300 mx-auto" />
                        <p className="font-semibold text-sm">No products found under "{viewingCategory?.name}"</p>
                        <p className="text-xs text-gray-400">Add products and select "{viewingCategory?.name}" as the category in Products page.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold text-gray-600 uppercase px-1">
                        <span>Products List ({categoryProducts.length})</span>
                      </div>
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader className="bg-gray-50">
                            <TableRow>
                              <TableHead className="text-xs font-bold uppercase">SKU</TableHead>
                              <TableHead className="text-xs font-bold uppercase">Product</TableHead>
                              <TableHead className="text-xs font-bold uppercase">Retail Price</TableHead>
                              <TableHead className="text-xs font-bold uppercase">Net Rate</TableHead>
                              <TableHead className="text-xs font-bold uppercase">Stock (Pcs)</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody className="divide-y divide-gray-100">
                            {categoryProducts.map((p) => (
                              <TableRow key={p.id || p._id} className="hover:bg-gray-50">
                                <TableCell className="py-2.5 font-mono text-xs text-red-700 font-bold">
                                  {p.sku || p.code || 'N/A'}
                                </TableCell>
                                <TableCell className="py-2.5">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded border p-1 bg-white flex items-center justify-center shrink-0">
                                      <img src={p.image || "/sky_rocket_box.png"} alt={p.name} className="max-w-full max-h-full object-contain" />
                                    </div>
                                    <div>
                                      <p className="font-bold text-sm text-gray-900">{p.name}</p>
                                      {p.brand && <p className="text-[10px] text-gray-500 font-medium">Brand: {p.brand}</p>}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="py-2.5 font-bold text-red-700">₹{p.price}</TableCell>
                                <TableCell className="py-2.5 font-medium text-gray-700">{p.netRate ? `₹${p.netRate}` : '-'}</TableCell>
                                <TableCell className="py-2.5">
                                  <Badge variant={p.stock > 0 ? "outline" : "destructive"} className="text-xs font-bold">
                                    {p.stock > 0 ? `${p.stock} Pcs` : "Out of Stock"}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <DialogFooter className="border-t pt-3">
                <Button variant="outline" onClick={() => setViewingCategory(null)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation */}
          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Category</DialogTitle>
                <DialogDescription>Are you sure you want to delete "{deleting?.name}"? This action cannot be undone.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
                <Button variant="destructive" onClick={handleDelete}>Delete</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </>
  );
};

export default AdminCategories;
