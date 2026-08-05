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
import { Plus, Search, Edit2, Trash2, Tag, Phone, Image as ImageIcon, CheckCircle, XCircle, Upload } from "lucide-react";
import { toast } from "sonner";
import { getBrands, getNextBrandId, createBrand, updateBrand, deleteBrand, Brand } from "@/lib/api";

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
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [nextAutoId, setNextAutoId] = useState("B0001");
  
  // Modal state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    logo: "/sky_rocket_box.png",
    description: "",
    itemsCount: 0,
    isActive: true
  });

  const loadBrands = async () => {
    setLoading(true);
    try {
      const data = await getBrands();
      setBrands(data);
    } catch (error) {
      toast.error("Failed to load brands");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBrands();
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
      phone: "",
      logo: "/sky_rocket_box.png",
      description: "",
      itemsCount: 0,
      isActive: true
    });
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (brand: Brand) => {
    setEditingBrand(brand);
    setFormData({
      name: brand.name || "",
      phone: brand.phone || "",
      logo: brand.logo || "/sky_rocket_box.png",
      description: brand.description || "",
      itemsCount: brand.itemsCount || 0,
      isActive: brand.isActive !== false
    });
    setIsDialogOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setFormData((prev) => ({ ...prev, logo: reader.result as string }));
          toast.success("Image selected & ready!");
        }
      };
      reader.readAsDataURL(file);
    }
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
      loadBrands();
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
        loadBrands();
      } catch (error: any) {
        toast.error(error.message || "Failed to delete brand");
      }
    }
  };

  const filteredBrands = brands.filter((b) =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (b.brandId && b.brandId.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (b.phone && b.phone.includes(searchQuery))
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
                Add and manage cracker brands. Brand IDs are auto-generated (e.g. b0001, b0002) and displayed on the store front.
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
                  placeholder="Search by Brand ID (e.g. b0001), Brand Name, or Phone Number..."
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
                        <TableHead className="font-extrabold text-xs text-gray-700 uppercase">Phone Number</TableHead>
                        <TableHead className="font-extrabold text-xs text-gray-700 uppercase">Items Count</TableHead>
                        <TableHead className="font-extrabold text-xs text-gray-700 uppercase">Status</TableHead>
                        <TableHead className="font-extrabold text-xs text-gray-700 uppercase text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-gray-100">
                      {filteredBrands.map((brand) => (
                        <TableRow key={brand._id || brand.id} className="hover:bg-gray-50/50">
                          <TableCell>
                            <Badge variant="outline" className="font-mono font-bold text-red-700 bg-red-50 border-red-200">
                              {brand.brandId}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-200 p-1 flex items-center justify-center overflow-hidden">
                              <img src={brand.logo || "/sky_rocket_box.png"} alt={brand.name} className="max-w-full max-h-full object-contain" />
                            </div>
                          </TableCell>
                          <TableCell className="font-bold text-gray-900 text-sm">
                            {brand.name}
                            {brand.description && (
                              <p className="text-xs font-normal text-gray-500 mt-0.5 line-clamp-1">{brand.description}</p>
                            )}
                          </TableCell>
                          <TableCell className="text-sm font-medium text-gray-700">
                            {brand.phone ? (
                              <span className="flex items-center gap-1.5 text-gray-800 font-semibold">
                                <Phone className="h-3.5 w-3.5 text-green-600" />
                                {brand.phone}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="font-bold">
                              {brand.itemsCount || 0} Items
                            </Badge>
                          </TableCell>
                          <TableCell>
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
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenEditDialog(brand)}
                                className="h-8 px-2.5 text-blue-600 border-blue-200 hover:bg-blue-50"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(brand)}
                                className="h-8 px-2.5 text-red-600 border-red-200 hover:bg-red-50"
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

            <div>
              <Label className="text-xs font-bold text-gray-700 uppercase">Phone Number</Label>
              <Input
                placeholder="e.g. +91 94880 73004"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="mt-1"
              />
            </div>

            {/* File Upload & Presets */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-gray-700 uppercase flex items-center justify-between">
                <span>Brand Logo / Image</span>
                <span className="text-[10px] text-gray-400 font-normal">Upload or select preset</span>
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
                <div className="flex items-center gap-3 p-2 bg-gray-50 border rounded-md">
                  <div className="w-10 h-10 rounded border bg-white p-1 flex items-center justify-center shrink-0">
                    <img src={formData.logo} alt="Preview" className="max-w-full max-h-full object-contain" />
                  </div>
                  <span className="text-xs text-gray-600 font-medium truncate flex-1">
                    {formData.logo.startsWith("data:") ? "Uploaded Image File" : formData.logo}
                  </span>
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
                      className={`w-8 h-8 rounded border p-0.5 shrink-0 bg-gray-50 overflow-hidden ${formData.logo === url ? 'border-red-600 ring-2 ring-red-200' : 'border-gray-200'}`}
                    >
                      <img src={url} alt="preset" className="w-full h-full object-contain" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-bold text-gray-700 uppercase">Items Count</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.itemsCount}
                  onChange={(e) => setFormData({ ...formData, itemsCount: parseInt(e.target.value) || 0 })}
                  className="mt-1"
                />
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
    </div>
  );
};

export default AdminBrands;
