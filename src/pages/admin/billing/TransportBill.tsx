import { apiRequest } from "@/lib/api";
import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Eye, Printer, Plus, Edit2 } from "lucide-react";
import { TransportBillForm } from "@/components/transport/TransportBillForm";
import { toast } from "sonner";
import { useSettings } from "@/context/SettingsContext";
import { BillPrintTemplate } from "@/components/printing/BillPrintTemplate";
import { PrintPortal } from "@/components/printing/PrintPortal";
import { usePagination } from "@/hooks/usePagination";
import { CustomPagination } from "@/components/CustomPagination";

export default function TransportBill() {
  const [search, setSearch] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [editingBill, setEditingBill] = useState<any>(null);
  const [bills, setBills] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [nextBillNo, setNextBillNo] = useState("");
  const { settings } = useSettings();
  const [printData, setPrintData] = useState<any>(null);

  useEffect(() => {
    if (printData) {
      const timer = setTimeout(() => {
        window.print();
        setPrintData(null);
      }, 500);
return () => clearTimeout(timer);
    }
  }, [printData]);

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    setIsLoading(true);
    try {
      const data = await apiRequest('/estimates?billType=transport');
      if (Array.isArray(data)) {
        setBills(data);
      }
    } catch (err) {
      console.error("Error fetching transport bills:", err);
      toast.error("Failed to load transport bills");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNextBillNo = async () => {
    try {
      const data = await apiRequest('/estimates/next-bill-no?billType=transport&type=Retail');
      setNextBillNo(data.nextBillNo);
    } catch (err) {
      console.error("Error fetching next bill no:", err);
    }
  };

  const filtered = bills.filter(t => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      t.customerName?.toLowerCase().includes(s) || 
      t.billNo?.toLowerCase().includes(s) || 
      t.mobNo?.includes(search) ||
      t.vehicleNo?.toLowerCase().includes(s) ||
      t.driverName?.toLowerCase().includes(s)
    );
  });

  const { page, totalPages, setPage, startIndex, endIndex } = usePagination(filtered.length, 20);
  const paginatedData = filtered.slice(startIndex, endIndex);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Delivered": return "bg-success/10 text-success";
      case "In Transit": return "bg-info/10 text-info";
      case "Pending": return "bg-warning/10 text-warning";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const handleCreateNew = () => {
    fetchNextBillNo();
    setEditingBill(null);
    setIsCreating(true);
  };

  const handleEdit = (bill: any) => {
    setEditingBill(bill);
    setIsCreating(true);
  };

  const handlePrint = (bill: any) => {
    setPrintData(bill);
  };

  const handleSaveBill = async (data: any, printAfterSave: boolean = false) => {
    try {
      const saved = await apiRequest(editingBill ? `/estimates/${editingBill.billNo}` : '/estimates', {
        method: editingBill ? "PUT" : "POST",
        body: JSON.stringify({ ...data, billType: "transport", type: "Retail" })
      });
      
      toast.success(editingBill ? "Transport bill updated!" : "Transport bill saved!");
      if (printAfterSave) {
        handlePrint(saved);
      }
      fetchBills();
      setIsCreating(false);
      setEditingBill(null);
    } catch (err) {
      console.error("Error saving transport bill:", err);
      toast.error("Failed to save transport bill");
    }
  };

  if (isCreating) {
    return (
      <AppLayout title={editingBill ? "Edit Transport Bill" : "New Transport Bill"}>
        <TransportBillForm 
          onBack={() => { setIsCreating(false); setEditingBill(null); }} 
          onSave={handleSaveBill} 
          editData={editingBill || (nextBillNo ? { billNo: nextBillNo } : undefined)}
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Transport Bills">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search transport bills..." 
              value={search} 
              onChange={(e) => { setSearch(e.target.value); setPage(1); }} 
              className="pl-9 h-10 bg-muted border-0" 
            />
          </div>
          <Button className="h-10" onClick={handleCreateNew}>
            <Plus className="w-4 h-4 mr-2" /> New Transport Bill
          </Button>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium w-12">S.No</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Bill #</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Customer</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Vehicle</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Driver</th>
                  <th className="text-right py-3 px-4 text-muted-foreground font-medium">Pkgs</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Destination</th>
                  <th className="text-right py-3 px-4 text-muted-foreground font-medium">Amount</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Status</th>
                  <th className="text-right py-3 px-4 text-muted-foreground font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((t, idx) => (
                  <tr key={t._id || t.billNo} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4 text-muted-foreground text-xs">{startIndex + idx + 1}</td>
                    <td className="py-3 px-4 font-medium text-primary font-mono text-xs">{t.billNo}</td>
                    <td className="py-3 px-4 text-foreground">{t.customerName}</td>
                    <td className="py-3 px-4 text-muted-foreground font-mono text-xs">{t.vehicleNo}</td>
                    <td className="py-3 px-4 text-foreground">{t.driverName}</td>
                    <td className="py-3 px-4 text-right text-foreground">{t.items?.length || 0}</td>
                    <td className="py-3 px-4 text-muted-foreground">{t.toAddress}</td>
                    <td className="py-3 px-4 text-right font-semibold text-foreground">₹{t.totalAmount?.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(t.status)}`}>{t.status}</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(t)} className="h-8 w-8 text-muted-foreground hover:text-foreground"><Edit2 className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground"><Eye className="w-4 h-4" /></Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handlePrint(t)}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        >
                          <Printer className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              {filtered.length > 0 && (
                <tfoot className="bg-muted/50 font-bold border-t-2 border-primary/20">
                  <tr>
                    <td colSpan={7} className="py-3 px-4 text-right text-primary uppercase tracking-wider text-[10px]">Grand Total</td>
                    <td className="py-3 px-4 text-right text-foreground">₹{filtered.reduce((sum, t) => sum + (t.totalAmount || 0), 0).toLocaleString()}</td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
          <div className="p-4 border-t border-border">
            <CustomPagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </div>
      </div>
      {printData && (
        <PrintPortal>
          <BillPrintTemplate data={printData} settings={settings} />
        </PrintPortal>
      )}
    </AppLayout>
  );
}
