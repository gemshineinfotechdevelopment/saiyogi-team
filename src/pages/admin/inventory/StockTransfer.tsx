import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/api";
import AdminSidebar from "@/components/layout/AdminSidebar";
import AdminNavbar from "@/components/layout/AdminNavbar";
import { toast } from "sonner";
import { ArrowRightLeft, Warehouse, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function StockTransfer() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState("");
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const data = await apiRequest("/api/inventory");
      setInventory(data);
    } catch (err) {
      toast.error("Failed to load inventory");
    }
  };

  const selectedItem = inventory.find(i => i._id === selectedProduct);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !quantity || parseInt(quantity) <= 0) {
      return toast.error("Please select a product and enter a valid quantity");
    }

    if (selectedItem && parseInt(quantity) > selectedItem.godownStock) {
      return toast.error("Insufficient stock in Godown!");
    }

    setLoading(true);
    try {
      await apiRequest("/api/inventory/transfer", {
        method: "POST",
        body: JSON.stringify({
          productId: selectedProduct,
          quantity: parseInt(quantity),
          remarks
        })
      });
      toast.success("Stock transferred successfully!");
      setQuantity("");
      setRemarks("");
      setSelectedProduct("");
      fetchInventory();
    } catch (err: any) {
      toast.error(err.message || "Failed to transfer stock");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AdminNavbar />
      <div className="flex min-h-screen">
        <AdminSidebar />
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
      <div className="max-w-3xl mx-auto">
        <Card className="border-t-4 border-t-sidebar-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-sidebar-primary" />
              Transfer Stock
            </CardTitle>
            <CardDescription>Move stock from Godown directly to the Shop inventory</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleTransfer} className="space-y-6">
              
              <div className="space-y-2">
                <Label>Select Product</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  required
                >
                  <option value="">-- Choose Product --</option>
                  {inventory.map(item => (
                    <option key={item._id} value={item._id}>
                      {item.name} (Godown: {item.godownStock} | Shop: {item.shopStock})
                    </option>
                  ))}
                </select>
              </div>

              {selectedItem && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg border border-border">
                  <div className="flex flex-col items-center justify-center p-3 bg-white rounded shadow-sm border border-border/50">
                    <Warehouse className="w-5 h-5 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground font-semibold uppercase">Godown Stock</span>
                    <span className="text-2xl font-black text-sidebar-primary">{selectedItem.godownStock}</span>
                  </div>
                  <div className="flex flex-col items-center justify-center p-3 bg-white rounded shadow-sm border border-border/50">
                    <Store className="w-5 h-5 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground font-semibold uppercase">Shop Stock</span>
                    <span className="text-2xl font-black text-green-600">{selectedItem.shopStock}</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Transfer Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="e.g. 50"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Remarks / Notes (Optional)</Label>
                  <Input
                    type="text"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="e.g. Diwali refill"
                  />
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end">
                <Button type="submit" disabled={loading || !selectedProduct} className="bg-sidebar-primary text-white w-full sm:w-auto">
                  {loading ? "Transferring..." : "Confirm Transfer"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
        </main>
      </div>
    </>
  );
}
