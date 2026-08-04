import { useState, useEffect } from "react";
import { formatDate } from "@/lib/utils";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Pencil, Trash2, Printer, ClipboardCheck, Users } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useSettings } from "@/context/SettingsContext";
import { BillPrintTemplate } from "@/components/printing/BillPrintTemplate";
import { PrintPortal } from "@/components/printing/PrintPortal";
import { usePagination } from "@/hooks/usePagination";
import { CustomPagination } from "@/components/CustomPagination";

export interface EstimateRecord {
  billNo: string;
  date: string;
  customerName: string;
  mobNo: string;
  totalAmount: number;
  cashStatus: string;
  status: string;
  [key: string]: any;
}

interface EstimateListViewProps {
  type: "Retail" | "Wholesale" | "Net-Rate";
  estimates: EstimateRecord[];
  onNew?: () => void;
  onMultiNew: (names: string[]) => void;
  onEdit: (est: EstimateRecord) => void;
  onDelete: (billNo: string) => void;
  onConvert: (billNo: string) => void;
  title?: string;
  convertIcon?: React.ReactNode;
  convertToast?: string;
}

export function EstimateListView({ 
  type, estimates, onNew, onMultiNew, onEdit, onDelete, onConvert, title = "Bill",
  convertIcon, convertToast
}: EstimateListViewProps) {
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [cashStatusFilter, setCashStatusFilter] = useState("all");
  const [multiNames, setMultiNames] = useState("");
  const [isMultiDialogOpen, setIsMultiDialogOpen] = useState(false);
  const { settings } = useSettings();
  const [printData, setPrintData] = useState<any>(null);

  useEffect(() => {
    if (printData) {
      const timer = setTimeout(() => {
        window.print();
        // Clear print data after the dialog closes to avoid re-triggering if the component re-renders
        // Note: window.print() is blocking in most browsers, so this happens after dialog closes
        setPrintData(null);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [printData]);

  const handlePrint = (est: EstimateRecord) => {
    setPrintData(est);
  };

  const filtered = estimates.filter(e => {
    const matchSearch = !search || 
      (e.customerName?.toLowerCase().includes(search.toLowerCase())) || 
      (e.billNo?.toLowerCase().includes(search.toLowerCase())) || 
      (e.mobNo?.includes(search));
    const matchStatus = statusFilter === "all" || e.status === statusFilter;
    const matchCash = cashStatusFilter === "all" || e.cashStatus === cashStatusFilter;
    const matchDateFrom = !dateFrom || e.date >= dateFrom;
    const matchDateTo = !dateTo || e.date <= dateTo;
    return matchSearch && matchStatus && matchCash && matchDateFrom && matchDateTo;
  });

  const { page, totalPages, setPage, startIndex, endIndex } = usePagination(filtered.length, 20);
  const paginatedData = filtered.slice(startIndex, endIndex);

  const handleMultiSubmit = () => {
    const names = multiNames.split("\n").map(n => n.trim()).filter(n => n !== "");
    if (names.length === 0) {
      toast.error("Please enter at least one customer name");
      return;
    }
    onMultiNew(names);
    setMultiNames("");
    setIsMultiDialogOpen(false);
    toast.success(`Created ${names.length} estimates!`);
  };


  return (
    <div className="space-y-4">
      <div className="bg-card rounded-xl border border-border shadow-card p-4 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Search by the criteria below:</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div><label className="text-xs text-muted-foreground mb-1 block">Date From</label><Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-8 text-xs bg-muted border-0" /></div>
          <div><label className="text-xs text-muted-foreground mb-1 block">Date To</label><Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-8 text-xs bg-muted border-0" /></div>
          <div><label className="text-xs text-muted-foreground mb-1 block">Bill No / Customer / Mobile</label>
            <div className="relative"><Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" /><Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="h-8 pl-8 text-xs bg-muted border-0" /></div></div>
          <div><label className="text-xs text-muted-foreground mb-1 block">Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="h-8 text-xs bg-muted border-0"><SelectValue /></SelectTrigger><SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="held">Held</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent></Select></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div><label className="text-xs text-muted-foreground mb-1 block">Cash Status</label>
            <Select value={cashStatusFilter} onValueChange={setCashStatusFilter}><SelectTrigger className="h-8 text-xs bg-muted border-0"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="paid">Paid</SelectItem><SelectItem value="unpaid">Unpaid</SelectItem><SelectItem value="partial">Partial</SelectItem></SelectContent></Select></div>
        </div>
      </div>

      {onNew && (
        <div className="flex items-center gap-3">
          <Button onClick={onNew} className="h-10 px-5 font-semibold"><Plus className="w-4 h-4 mr-2" /> New {title}</Button>
        </div>
      )}

      <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-primary/10 border-b border-border">
              <th className="text-left py-3 px-4 text-primary font-semibold text-xs w-12">S.No</th>
              <th className="text-left py-3 px-4 text-primary font-semibold text-xs">Bill No</th>
              <th className="text-left py-3 px-4 text-primary font-semibold text-xs">Date</th>
              <th className="text-left py-3 px-4 text-primary font-semibold text-xs">Type</th>
              <th className="text-left py-3 px-4 text-primary font-semibold text-xs">Customer Name</th>
              <th className="text-left py-3 px-4 text-primary font-semibold text-xs">Mob No</th>
              <th className="text-right py-3 px-4 text-primary font-semibold text-xs">Amount</th>
              <th className="text-center py-3 px-4 text-primary font-semibold text-xs">Edit</th>
              <th className="text-center py-3 px-4 text-primary font-semibold text-xs">Delete</th>
              <th className="text-center py-3 px-4 text-primary font-semibold text-xs">Print</th>
              <th className="text-center py-3 px-4 text-primary font-semibold text-xs">Convert</th>
            </tr></thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr><td colSpan={11} className="text-center py-8 text-muted-foreground text-sm">No {title.toLowerCase()}s found. Click "New" to create one.</td></tr>
              ) : paginatedData.map((est, idx) => (
                <tr key={est.billNo} className={`border-b border-border last:border-0 transition-colors ${idx % 2 === 0 ? "bg-muted/10" : "bg-muted/30"} hover:bg-primary/5`}>
                  <td className="py-3 px-4 text-muted-foreground text-xs">{startIndex + idx + 1}</td>
                  <td className="py-3 px-4 font-mono text-xs font-medium text-primary">{est.billNo}</td>
                  <td className="py-3 px-4 text-muted-foreground text-xs">{formatDate(est.date)}</td>
                  <td className="py-3 px-4 text-muted-foreground text-xs uppercase font-medium">{(est.billType || "—").replace("bill", "")}</td>
                  <td className="py-3 px-4 text-foreground font-medium">{est.customerName}</td>
                  <td className="py-3 px-4 text-muted-foreground text-xs">{est.mobNo || "—"}</td>
                  <td className="py-3 px-4 text-right font-semibold text-foreground">₹{est.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                  <td className="py-3 px-4 text-center"><Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => onEdit(est)}><Pencil className="w-4 h-4" /></Button></td>
                  <td className="py-3 px-4 text-center"><Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => { onDelete(est.billNo); toast.success(`Estimate ${est.billNo} deleted`); }}><Trash2 className="w-4 h-4" /></Button></td>
                  <td className="py-3 px-4 text-center"><Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => handlePrint(est)}><Printer className="w-4 h-4" /></Button></td>
                  <td className="py-3 px-4 text-center">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-success" 
                      onClick={() => { 
                        onConvert(est.billNo); 
                        if (convertToast) toast.success(convertToast.replace('{id}', est.billNo));
                        else toast.success(`${est.billNo} converted to bill!`); 
                      }}
                      title={convertToast ? convertToast.replace('{id}', est.billNo) : "Convert"}
                    >
                      {convertIcon || <ClipboardCheck className="w-4 h-4" />}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
            {filtered.length > 0 && (
              <tfoot className="bg-primary/5 font-black border-t-2 border-primary/20">
                <tr>
                  <td colSpan={5} className="py-4 px-4 text-right text-primary uppercase tracking-widest text-[10px]">Grand Total</td>
                  <td className="py-4 px-4 text-right tabular-nums text-primary text-base">₹{filtered.reduce((sum, e) => sum + (e.totalAmount || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td colSpan={4}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
      <CustomPagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />

      {printData && (
        <PrintPortal>
          <BillPrintTemplate data={printData} settings={settings} />
        </PrintPortal>
      )}
    </div>
  );
}
