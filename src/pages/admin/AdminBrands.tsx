import { useState, useEffect } from "react";
import AdminSidebar from "@/components/layout/AdminSidebar";
import AdminNavbar from "@/components/layout/AdminNavbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit2, Trash2, Tag, CheckCircle, XCircle, Eye, Package } from "lucide-react";
import { toast } from "sonner";
import { getBrands, getNextBrandId, createBrand, updateBrand, deleteBrand, getProducts, Brand } from "@/lib/api";
import { Product } from "@/data/products";

const PRESET_LOGOS = [
  "/sky_rocket_box.png",
  "/flower_pots.png",
  "/family_star_kit.png",
  "/bestseller_pack.png",
  "/grand_sky_delight.png",
  "/royal_celebration.png",
  "/1.png"
];

const AdminBrands = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [nextAutoId, setNextAutoId] = useState("B0001");
  
  // Modal state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [viewingBrand, setViewingBrand] = useState<Brand | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State (Phone Number and manual Items Count removed)
  const [formData, setFormData] = useState({
    name: "",
    logo: "/sky_rocket_box.png",
    description: "",
    isActive: true
  });

  const loadBrandsAndProducts = async () => {
    setLoading(true);
    try {
      const [brandsData, productsData] = await Promise.all([
        getBrands(),
        getProducts().catch(() => [])
      ]);
      setBrands(Array.isArray(brandsData) ? brandsData : []);
      setProducts(Array.isArray(productsData) ? productsData : []);
    } catch (error) {
      toast.error("Failed to load brands");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBrandsAndProducts();
  }, []);

  const handleOpenAddDialog = async () => {
    setEditingBrand(null);
    try {
      const nextId = await getNextBrandId();
      setNextAutoId(nextId);
    } catch (e) {
      setNextAutoId("B0001");
    }
    setFormData({
      name: "",
      logo: "/sky_rocket_box.png",
      description: "",
      isActive: true
    });
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (brand: Brand) => {
    setEditingBrand(brand);
    setFormData({
      name: brand.name || "",
      logo: brand.logo || "/sky_rocket_box.png",
      description: brand.description || "",
      isActive: brand.isActive !== false
    });
    setIsDialogOpen(true);
  };

  const handleOpenViewProductsDialog = (brand: Brand) => {
    setViewingBrand(brand);
  };

  // Image Upload handler: Resizes uploaded image to intrinsic size 1024x1024px canvas
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const targetWidth = 1024;
        const targetHeight = 1024;

        const canvas = document.createElement("canvas");
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext("2d");

        if (ctx) {
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, targetWidth, targetHeight);

          // Fit image nicely into 1024x1024 maintaining aspect ratio
          const scale = Math.min(targetWidth / img.width, targetHeight / img.height);
          const drawW = img.width * scale;
          const drawH = img.height * scale;
          const offsetX = (targetWidth - drawW) / 2;
          const offsetY = (targetHeight - drawH) / 2;

          ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
          const dataUrl = canvas.toDataURL("image/png");
          setFormData((prev) => ({ ...prev, logo: dataUrl }));
          toast.success("Image uploaded & scaled to 1024x1024px intrinsic size!");
        }
      };
      if (typeof event.target?.result === "string") {
        img.src = event.target.result;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Please enter a brand name");
      return;
    }

    setSubmitting(true);
    try {
      if (editingBrand) {
        const id = editingBrand._id || editingBrand.id || "";
        await updateBrand(id, formData);
        toast.success(`Brand updated successfully!`);
      } else {
        const newBrand = await createBrand(formData);
        toast.success(`Brand ${newBrand.brandId} created successfully!`);
      }
      setIsDialogOpen(false);
      loadBrandsAndProducts();
    } catch (error: any) {
      toast.error(error.message || "Failed to save brand");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (brand: Brand) => {
    const id = brand._id || brand.id || "";
    if (!id) return;
    
    if (confirm(`Are you sure you want to delete brand "${brand.name}" (${brand.brandId})?`)) {
      try {
        await deleteBrand(id);
        toast.success("Brand deleted successfully");
        loadBrandsAndProducts();
      } catch (error: any) {
        toast.error(error.message || "Failed to delete brand");
      }
    }
  };

  const filteredBrands = brands.filter((b) =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (b.brandId && b.brandId.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (b.description && b.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <AdminNavbar />

        <div className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Tag className="h-6 w-6 text-red-600" />
                Brand Management
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Add and manage cracker brands. Click on any brand row or view icon to see its items.
              </p>
            </div>
            <Button onClick={handleOpenAddDialog} className="bg-red-600 hover:bg-red-700 text-white font-bold gap-2">
              <Plus className="h-4 w-4" /> Add New Brand
            </Button>
          </div>

          {/* Search Card */}
          <Card className="shadow-sm border-gray-200">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by Brand ID (e.g. B0001), Brand Name, or Description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardContent>
          </Card>

          {/* Brands Table */}
          <Card className="shadow-sm border-gray-200 overflow-hidden">
            <CardHeader className="bg-gray-50 border-b border-gray-200 py-4 px-6 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold text-gray-800">
                All Brands ({filteredBrands.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-12 text-center text-gray-400 font-medium">Loading brands...</div>
              ) : filteredBrands.length === 0 ? (
                <div className="p-12 text-center text-gray-500 font-medium">
                  No brands found. Click "Add New Brand" to create one.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="font-extrabold text-xs text-gray-700 uppercase">Brand ID</TableHead>
                        <TableHead className="font-extrabold text-xs text-gray-700 uppercase">Logo</TableHead>
                        <TableHead className="font-extrabold text-xs text-gray-700 uppercase">Brand Name</TableHead>
                        <TableHead className="font-extrabold text-xs text-gray-700 uppercase">Items Count</TableHead>
                        <TableHead className="font-extrabold text-xs text-gray-700 uppercase">Status</TableHead>
                        <TableHead className="font-extrabold text-xs text-gray-700 uppercase text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-gray-100">
                      {filteredBrands.map((brand) => {
                        const itemsCount = products.filter(p => {
                          const pBrand = p.brand?.trim().toLowerCase();
                          return pBrand && (pBrand === brand.name?.trim().toLowerCase() || pBrand === brand.brandId?.trim().toLowerCase());
                        }).length;

                        return (
                          <TableRow 
                            key={brand._id || brand.id} 
                            onClick={() => handleOpenViewProductsDialog(brand)}
                            className="hover:bg-red-50/40 cursor-pointer transition-colors"
                          >
                            <TableCell className="py-2.5">
                              <Badge variant="outline" className="font-mono font-bold text-red-700 bg-red-50 border-red-200">
                                {brand.brandId}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-2.5">
                              {/* Compact Logo Thumbnail for neat row height */}
                              <div className="w-12 h-12 rounded-lg bg-gray-50 border border-gray-200 p-1 flex items-center justify-center overflow-hidden shrink-0">
                                <img src={brand.logo || "/sky_rocket_box.png"} alt={brand.name} className="max-w-full max-h-full object-contain" />
                              </div>
                            </TableCell>
                            <TableCell className="py-2.5 font-bold text-gray-900 text-sm">
                              {brand.name}
                              {brand.description && (
                                <p className="text-xs font-normal text-gray-500 mt-0.5 line-clamp-1">{brand.description}</p>
                              )}
                            </TableCell>
                            <TableCell className="py-2.5">
                              <Badge variant="secondary" className="font-bold">
                                {itemsCount} Items
                              </Badge>
                            </TableCell>
                            <TableCell className="py-2.5">
                              {brand.isActive !== false ? (
                                <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200 gap-1">
                                  <CheckCircle className="h-3 w-3" /> Active
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-300 gap-1">
                                  <XCircle className="h-3 w-3" /> Inactive
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="py-2.5 text-right">
                              <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOpenViewProductsDialog(brand)}
                                  className="h-8 w-8 p-0 text-gray-700 border-gray-200 hover:bg-gray-100 hover:text-red-700"
                                  title="View Brand Products"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOpenEditDialog(brand)}
                                  className="h-8 w-8 p-0 text-blue-600 border-blue-200 hover:bg-blue-50"
                                  title="Edit Brand"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDelete(brand)}
                                  className="h-8 w-8 p-0 text-red-600 border-red-200 hover:bg-red-50"
                                  title="Delete Brand"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Tag className="h-5 w-5 text-red-600" />
              {editingBrand ? `Edit Brand (${editingBrand.brandId})` : "Add New Brand"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            {/* Auto Generated Brand ID */}
            <div>
              <Label className="text-xs font-bold text-gray-700 uppercase">Brand ID (Auto Generated)</Label>
              <Input
                value={editingBrand ? editingBrand.brandId : `${nextAutoId} (Auto Created)`}
                disabled
                className="mt-1 font-mono font-bold bg-gray-100 text-red-700 border-red-200"
              />
            </div>

            <div>
              <Label className="text-xs font-bold text-gray-700 uppercase">Brand Name *</Label>
              <Input
                placeholder="e.g. Standard Fireworks"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="mt-1"
              />
            </div>

            {/* File Upload & Presets */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-gray-700 uppercase flex items-center justify-between">
                <span>Brand Logo / Image</span>
                <span className="text-[10px] text-gray-400 font-normal">Intrinsic size: 1024x1024px</span>
              </Label>
              
              {/* File upload input */}
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="cursor-pointer text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                />
              </div>

              {/* Preview */}
              {formData.logo && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 border rounded-md">
                  <div className="w-16 h-16 rounded border bg-white p-2 flex items-center justify-center shrink-0">
                    <img src={formData.logo} alt="Preview" className="max-w-full max-h-full object-contain" />
                  </div>
                  <div className="text-xs text-gray-600 font-medium truncate flex-1">
                    <p className="font-bold text-gray-800 mb-0.5">Logo Preview</p>
                    <p className="text-[11px] text-gray-500">Auto-scaled to 1024x1024px intrinsic canvas</p>
                  </div>
                </div>
              )}

              {/* Preset buttons */}
              <div className="pt-1">
                <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Preset Logos:</span>
                <div className="flex gap-2 items-center overflow-x-auto pb-1">
                  {PRESET_LOGOS.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormData({ ...formData, logo: url })}
                      className={`w-10 h-10 rounded border p-1 shrink-0 bg-gray-50 overflow-hidden ${formData.logo === url ? 'border-red-600 ring-2 ring-red-200' : 'border-gray-200'}`}
                    >
                      <img src={url} alt="preset" className="w-full h-full object-contain" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold text-gray-700 uppercase">Status</Label>
              <select
                value={formData.isActive ? "active" : "inactive"}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.value === "active" })}
                className="w-full mt-1 border border-gray-300 rounded-md p-2 text-sm bg-white"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div>
              <Label className="text-xs font-bold text-gray-700 uppercase">Description / Tagline</Label>
              <Input
                placeholder="e.g. Sivakasi Premium Sparklers & Rockets"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1"
              />
            </div>

            <DialogFooter className="pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-bold" disabled={submitting}>
                {submitting ? "Saving..." : editingBrand ? "Update Brand" : "Save Brand"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Brand Products Modal */}
      <Dialog open={!!viewingBrand} onOpenChange={(open) => !open && setViewingBrand(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gray-50 border p-1 flex items-center justify-center shrink-0">
                <img src={viewingBrand?.logo || "/sky_rocket_box.png"} alt={viewingBrand?.name} className="max-w-full max-h-full object-contain" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span>{viewingBrand?.name}</span>
                  <Badge variant="outline" className="font-mono text-xs font-bold text-red-700 bg-red-50 border-red-200">
                    {viewingBrand?.brandId}
                  </Badge>
                </div>
                {viewingBrand?.description && (
                  <p className="text-xs text-gray-500 font-normal mt-0.5">{viewingBrand.description}</p>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4">
            {(() => {
              const brandProducts = products.filter(p => {
                const pBrand = p.brand?.trim().toLowerCase();
                return pBrand && (pBrand === viewingBrand?.name?.trim().toLowerCase() || pBrand === viewingBrand?.brandId?.trim().toLowerCase());
              });

              if (brandProducts.length === 0) {
                return (
                  <div className="p-8 text-center text-gray-500 space-y-2">
                    <Package className="h-10 w-10 text-gray-300 mx-auto" />
                    <p className="font-semibold text-sm">No products found under "{viewingBrand?.name}"</p>
                    <p className="text-xs text-gray-400">Add products and select "{viewingBrand?.name}" as the brand in the Products Admin page.</p>
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-600 uppercase px-1">
                    <span>Products List ({brandProducts.length})</span>
                  </div>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead className="text-xs font-bold uppercase">Product</TableHead>
                          <TableHead className="text-xs font-bold uppercase">Retail Price</TableHead>
                          <TableHead className="text-xs font-bold uppercase">Net Rate</TableHead>
                          <TableHead className="text-xs font-bold uppercase">Stock (Pcs)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y divide-gray-100">
                        {brandProducts.map((p) => (
                          <TableRow key={p.id || p._id} className="hover:bg-gray-50">
                            <TableCell className="py-2.5">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded border p-1 bg-white flex items-center justify-center shrink-0">
                                  <img src={p.image || "/sky_rocket_box.png"} alt={p.name} className="max-w-full max-h-full object-contain" />
                                </div>
                                <div>
                                  <p className="font-bold text-sm text-gray-900">{p.name}</p>
                                  {p.sku && <p className="text-[10px] text-gray-400 font-mono">SKU: {p.sku}</p>}
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
            <Button variant="outline" onClick={() => setViewingBrand(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBrands;
