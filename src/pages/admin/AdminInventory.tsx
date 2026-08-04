import { useState, useEffect } from "react";
import { AlertTriangle, Plus, Package, Loader } from "lucide-react";
// import AdminSidebar from "@/components/layout/AdminSidebar";
import AdminNavbar from "@/components/layout/AdminNavbar";
import { getProducts } from "@/lib/api";
import { Product } from "@/data/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface InventoryItem {
  _id: string;
  name: string;
  stock: number;
  sku: string;
  category: string;
  isLowStock: boolean;
  storeStockPieces?: number;
  godownStockCases?: number;
  piecesPerCase?: number;
}

const AdminInventory = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;
  const { toast } = useToast();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);

  const [form, setForm] = useState({ productId: "", quantity: "", type: "inward" as "inward" | "outward", targetLocation: "SHOP" as "SHOP" | "GODOWN" });

  const lowStockProducts = inventory.filter((p) => p.isLowStock);
  const outOfStock = inventory.filter((p) => (p.storeStockPieces || 0) === 0);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/inventory", {
        headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` }
      });
      if (response.ok) {
        setInventory(await response.json());
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to load inventory", variant: "destructive" });
    }
    setLoading(false);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ productId: "", quantity: "", type: "inward", targetLocation: "SHOP" });
    setDialogOpen(true);
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const openEdit = (productId: string) => {
    setEditing(productId);
    const product = inventory.find((p) => p._id === productId);
    if (product) {
      setForm({ productId, quantity: "", type: "inward", targetLocation: "SHOP" });
      setDialogOpen(true);
    }
  };

  const handleSave = async () => {
    if (!form.productId || !form.quantity) {
      toast({ title: "Error", description: "Please fill all fields", variant: "destructive" });
      return;
    }

    const quantity = parseInt(form.quantity);
    const adjustmentType = form.type === "inward" ? "INCREASE" : "DECREASE";

    try {
      const response = await fetch("/api/inventory/adjust-stock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: JSON.stringify({ 
          productId: form.productId, 
          quantity, 
          adjustmentType,
          targetLocation: form.targetLocation,
          reason: editing ? "Manual adjustment" : form.type 
        }),
      });

      if (response.ok) {
        await fetchInventory();
        setDialogOpen(false);
        toast({ title: "Success", description: `Stock ${form.type === "inward" ? "added" : "removed"} successfully` });
      } else {
        const error = await response.json();
        toast({ title: "Error", description: error.message || "Failed to update stock", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to update stock", variant: "destructive" });
    }
  };
  const totalPages = Math.ceil(lowStockProducts.length / ITEMS_PER_PAGE);
  const paginatedData = lowStockProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  

  return (
    <>
      {/* <AdminNavbar /> */}
      <div className="flex min-h-screen">
        {/* <AdminSidebar /> */}
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-display text-2xl font-bold flex items-center gap-2">
                <Package className="h-6 w-6 text-primary" /> Inventory Management
              </h1>
              <p className="text-sm text-muted-foreground">{inventory.length} products tracked</p>
            </div>
            <Button onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" /> Adjust Stock
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Total Products</p>
              <p className="text-2xl font-bold">{inventory.length}</p>
            </div>
            <div className="bg-card border border-accent/30 rounded-lg p-4">
              <p className="text-sm text-accent flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Low Stock</p>
              <p className="text-2xl font-bold text-accent">{lowStockProducts.length}</p>
            </div>
            <div className="bg-card border border-destructive/30 rounded-lg p-4">
              <p className="text-sm text-destructive">Out of Stock</p>
              <p className="text-2xl font-bold text-destructive">{outOfStock.length}</p>
            </div>
          </div>

          {lowStockProducts.length > 0 && (
            <div className="bg-card border border-accent/30 rounded-lg p-4 mb-6">
              <h2 className="font-display font-bold mb-3 flex items-center gap-2 text-accent">
                <AlertTriangle className="h-4 w-4" /> Low Stock Alerts
              </h2>
              <div className="flex flex-wrap gap-2">
                {paginatedData.map((p) => (
                  <Badge key={p._id} variant="outline" className="border-accent/50 text-accent">
                    {p.name} — {(p.storeStockPieces || 0)} left
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="p-4 border-b border-border">
              <h2 className="font-display font-bold">Current Stock Levels</h2>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted border-b border-border">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Product Name</th>
                      <th className="px-4 py-3 text-left font-semibold">Category</th>
                      <th className="px-4 py-3 text-left font-semibold">Store Stock (Pcs)</th>
                      <th className="px-4 py-3 text-left font-semibold">Godown Stock (Cases)</th>
                      <th className="px-4 py-3 text-left font-semibold">Godown Stock (Pcs)</th>
                      <th className="px-4 py-3 text-left font-semibold">Status</th>
                      <th className="px-4 py-3 text-right font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.map((item) => (
                      <tr key={item._id} className="border-b border-border hover:bg-muted/50 transition-colors">
                        <td className="px-4 py-3 font-semibold">{item.name}</td>
                        <td className="px-4 py-3">{item.category}</td>
                        <td className="px-4 py-3 font-bold text-lg text-primary">{(item.storeStockPieces || 0)}</td>
                        <td className="px-4 py-3 font-medium">{(item.godownStockCases || 0)}</td>
                        <td className="px-4 py-3 font-medium text-muted-foreground">{(item.godownStockCases || 0) * (item.piecesPerCase || 1)}</td>
                        <td className="px-4 py-3">
                          {(item.storeStockPieces || 0) === 0 ? (
                            <Badge variant="destructive">Out of Stock</Badge>
                          ) : item.isLowStock ? (
                            <Badge variant="outline" className="border-accent/50 text-accent">Low Stock</Badge>
                          ) : (
                            <Badge variant="outline" className="border-green-500/50 text-green-700">In Stock</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button variant="outline" size="sm" onClick={() => openEdit(item._id)}>
                            Adjust
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 bg-card border-t border-border mt-4 rounded-b-lg">
                  <div className="text-sm text-muted-foreground">
                    Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, lowStockProducts.length)} to {Math.min(currentPage * ITEMS_PER_PAGE, lowStockProducts.length)} of {lowStockProducts.length} entries
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</Button>
                    <div className="text-sm font-medium">Page {currentPage} of {Math.max(1, totalPages)}</div>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0}>Next</Button>
                  </div>
                </div>
              )}
            </>
          )}
          </div>

          {/* Adjust Stock Dialog */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? "Adjust Stock" : "Add Stock Adjustment"}</DialogTitle>
                <DialogDescription>Record a stock inward or outward adjustment for the product.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Product</Label>
                  <Select value={form.productId} onValueChange={(v) => setForm({ ...form, productId: v })}>
                    <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                    <SelectContent>
                      {inventory.map((p) => (
                        <SelectItem key={p._id} value={p._id}>
                          {p.name} (Current: {(p.storeStockPieces || 0)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Select value={form.targetLocation} onValueChange={(v: "SHOP" | "GODOWN") => setForm({ ...form, targetLocation: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SHOP">Store (Pcs)</SelectItem>
                        <SelectItem value="GODOWN">Godown (Cases)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={form.type} onValueChange={(v: "inward" | "outward") => setForm({ ...form, type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inward">Stock In</SelectItem>
                        <SelectItem value="outward">Stock Out</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder="0" min="1" />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSave} disabled={!form.productId || !form.quantity}>Apply Adjustment</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </>
  );
};

export default AdminInventory;