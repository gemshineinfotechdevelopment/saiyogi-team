import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, FolderTree } from "lucide-react";
import AdminSidebar from "@/components/layout/AdminSidebar"; import AdminNavbar from "@/components/layout/AdminNavbar"; import { getCategories, getProducts, API_BASE_URL } from "@/lib/api";
import { Category } from "@/data/products";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";

const AdminCategories = () => {
  const { token } = useAuth();
  const [cats, setCats] = useState<Category[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: "", image: "" });
  const [imageFile, setImageFile] = useState<File | null>(null);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", image: "" });
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
    setForm({ name: cat.name, image: cat.image });
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
          productCount: cats.find(c => c.id === (data.category._id || data.category.id || data.category.slug))?.productCount || 0,
          image: data.category.image || '',
        };
        setCats((prev) => prev.map((c) => (c.id === editing.id ? updated : c)));
        toast.success('Category updated');

        // Refresh data from server to ensure consistency
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
          categoryCode: data.category.categoryCode || 'N/A',
          productCount: 0,
          image: data.category.image || '',
        };
        setCats((prev) => [...prev, created]);
        toast.success('Category created');

        // Refresh data from server to ensure consistency
        setTimeout(() => {
          loadCategoriesWithCounts();
        }, 500);
      }
      setDialogOpen(false);
      setForm({ name: '', image: '' });
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
        // Handle specific business rule error
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
              <p className="text-sm text-muted-foreground">{cats.length} categories</p>
            </div>
            <Button onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" /> New Category
            </Button>
          </div>

          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cats.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell className="font-mono text-xs bg-white text-black border px-2 rounded w-min mt-2 inline-block ml-3">{cat.categoryCode}</TableCell>
                    <TableCell className="font-semibold">{cat.name}</TableCell>
                    <TableCell>{cat.productCount}</TableCell>
                    <TableCell>
                      <img src={cat.image} alt={cat.name} className="w-16 h-10 rounded object-cover" />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(cat)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => openDelete(cat)}>
                          <Trash2 className="h-3 w-3" />
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
                  <Label>Category Name</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Fancy Lights" />
                </div>
                <div className="space-y-2">
                  <Label>Image (Max 5MB, optional)</Label>
                  <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSave} disabled={!form.name.trim()}>{editing ? "Save Changes" : "Create"}</Button>
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
