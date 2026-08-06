import { apiRequest } from "@/lib/api";
import { getLocalDate } from "@/lib/utils";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PurchaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  purchase?: any;
}

export function PurchaseModal({ open, onOpenChange, onSuccess, purchase }: PurchaseModalProps) {
  const [formData, setFormData] = useState({
    poNo: "",
    billNo: "",
    supplier: "",
    date: getLocalDate(),
    supplierName: "",
    totalAmount: 0,
    itemsCount: 0,
    status: "Pending",
    notes: "",
  });
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  useEffect(() => {
    if (purchase) {
      setFormData({
        poNo: purchase.poNo || "",
        billNo: purchase.billNo || "",
        supplier: purchase.supplier?._id || purchase.supplier || "",
        date: purchase.date ? (purchase.date.includes("T") ? purchase.date.split("T")[0] : purchase.date) : getLocalDate(),
        supplierName: purchase.supplierName || "",
        totalAmount: purchase.totalAmount || 0,
        itemsCount: purchase.itemsCount || 0,
        status: purchase.status || "Pending",
        notes: purchase.notes || "",
      });
    } else {
      setFormData({
        poNo: "",
        billNo: "",
        supplier: "",
        date: getLocalDate(),
        supplierName: "",
        totalAmount: 0,
        itemsCount: 0,
        status: "Pending",
        notes: "",
      });
    }
  }, [purchase, open]);

  const fetchSuppliers = async () => {
    try {
      const data = await apiRequest('/suppliers');
      if (Array.isArray(data)) setSuppliers(data);
    } catch (err) {
      console.error("Error fetching suppliers:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.supplier) {
        toast.error("Please select a supplier");
        return;
    }
    setIsSubmitting(true);
    try {
      await apiRequest(purchase ? `/purchases/${purchase._id}` : '/purchases', {
        method: purchase ? "PUT" : "POST",
        body: JSON.stringify(formData),
      });

      toast.success(`Purchase ${purchase ? "updated" : "added"} successfully`);
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving purchase:", error);
      toast.error("Failed to save purchase");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>{purchase ? "Edit Purchase Order" : "New Purchase Order"}</DialogTitle>
          <DialogDescription>{purchase ? "Update purchase order details and supplier information." : "Create a new purchase order for stock."}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <ScrollArea className="flex-1 px-6 py-4">
            <div className="grid grid-cols-2 gap-4 pb-4">
              <div className="space-y-2 col-span-2">
                <Label>Supplier *</Label>
                <Select 
                  value={formData.supplier} 
                  onValueChange={(val) => setFormData({ ...formData, supplier: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map(s => (
                      <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>PO Number (Optional)</Label>
                <Input
                  value={formData.poNo}
                  onChange={(e) => setFormData({ ...formData, poNo: e.target.value })}
                  placeholder="Auto-generated if empty"
                />
              </div>

              <div className="space-y-2">
                <Label>Order Date</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Items Count</Label>
                <Input
                  type="number"
                  value={formData.itemsCount}
                  onChange={(e) => setFormData({ ...formData, itemsCount: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label>Total Amount (₹) *</Label>
                <Input
                  type="number"
                  required
                  value={formData.totalAmount}
                  onChange={(e) => setFormData({ ...formData, totalAmount: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(val) => setFormData({ ...formData, status: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Received">Received</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 col-span-2">
                <Label>Notes</Label>
                <Input
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Reference or notes"
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label>Invoice Attachment</Label>
                <div className="border border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors">
                  <Upload className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
                  <p className="text-[10px] text-muted-foreground">Upload Invoice (Feature coming soon)</p>
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="p-6 pt-2 border-t border-border bg-muted/20">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : purchase ? "Update Purchase" : "Save Purchase"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
