import { apiRequest } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Eye, FileCheck, Trash2, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CustomerHistoryModalProps {
  mobNo: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefreshEstimates: () => void;
}

export function CustomerHistoryModal({ 
  mobNo, 
  open, 
  onOpenChange,
  onRefreshEstimates
}: CustomerHistoryModalProps) {
  const [estimates, setEstimates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (open && mobNo) {
      fetchCustomerHistory();
    }
  }, [open, mobNo]);

  const fetchCustomerHistory = async () => {
    setIsLoading(true);
    try {
      const data = await apiRequest(`/estimates?mobNo=${mobNo}`);
      if (Array.isArray(data)) {
        setEstimates(data);
      }
    } catch (err) {
      console.error("Error fetching customer history:", err);
      toast.error("Failed to load customer history");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (billNo: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      await apiRequest(`/estimates/${billNo}`, { method: 'DELETE' });
      setEstimates(prev => prev.filter(e => e.billNo !== billNo));
      toast.success("Estimate deleted");
      onRefreshEstimates();
    } catch (err) {
      console.error("Error deleting estimate:", err);
    }
  };

  const convertToBill = async (billNo: string) => {
    try {
      await apiRequest(`/estimates/${billNo}`, {
        method: 'PUT',
        body: JSON.stringify({ billType: 'invoice' })
      });
      setEstimates(prev => prev.filter(e => e.billNo !== billNo));
      toast.success(`Estimate ${billNo} converted to invoice!`);
      onRefreshEstimates();
    } catch (err) {
      console.error("Error converting estimate:", err);
    }
  };

  const filtered = estimates.filter(e => 
    (e.billNo?.toLowerCase() || "").includes(search.toLowerCase()) ||
    (e.items?.some((item: any) => (item.name || "").toLowerCase().includes(search.toLowerCase())))
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "held": return "bg-orange-100 text-orange-700 hover:bg-orange-100";
      case "completed": return "bg-green-100 text-green-700 hover:bg-green-100";
      case "cancelled": return "bg-red-100 text-red-700 hover:bg-red-100";
      default: return "bg-blue-100 text-blue-700 hover:bg-blue-100";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center justify-between">
            <span>Customer History - {mobNo}</span>
            <Badge variant="outline" className="ml-2">{estimates.length} Estimates</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search by Bill No or Item..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="pl-9 bg-muted/50 border-0"
            />
          </div>
        </div>

        <ScrollArea className="flex-1 p-6 pt-2 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              No history found for this customer.
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((est) => (
                <div 
                  key={est.billNo} 
                  className="rounded-lg border border-border bg-card overflow-hidden transition-all hover:shadow-sm"
                >
                  <div 
                    className="p-4 flex items-center justify-between gap-4 cursor-pointer"
                    onClick={() => setExpandedId(expandedId === est.billNo ? null : est.billNo)}
                  >
                    <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Estimate #</p>
                        <p className="font-mono font-medium text-primary text-sm">{est.billNo}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Date</p>
                        <p className="text-sm">{formatDate(est.date)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Total</p>
                        <p className="text-sm font-bold">₹{est.totalAmount?.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Status</p>
                        <Badge className={`text-[10px] h-5 ${getStatusColor(est.status)}`}>
                          {est.status}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-success"
                            onClick={() => convertToBill(est.billNo)}
                            title="Convert to Invoice"
                        >
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive/70 hover:text-destructive"
                            onClick={() => handleDelete(est.billNo)}
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => setExpandedId(expandedId === est.billNo ? null : est.billNo)}
                        >
                            {expandedId === est.billNo ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                    </div>
                  </div>

                  {expandedId === est.billNo && (
                    <div className="px-4 pb-4 pt-0 border-t border-dashed border-border mt-1">
                        <div className="mt-4 space-y-2">
                           <p className="text-xs font-bold text-muted-foreground uppercase">Items Purchased</p>
                           <div className="bg-muted/30 rounded-md overflow-hidden border border-border">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="bg-muted/50 border-b border-border">
                                            <th className="text-left py-2 px-3 font-medium">Product</th>
                                            <th className="text-right py-2 px-3 font-medium">Qty</th>
                                            <th className="text-right py-2 px-3 font-medium">Price</th>
                                            <th className="text-right py-2 px-3 font-medium">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {est.items?.map((item: any, idx: number) => (
                                            <tr key={idx} className="border-b border-border/50 last:border-0 font-medium">
                                                <td className="py-2 px-3">{item.name}</td>
                                                <td className="py-2 px-3 text-right">{item.qty} {item.uom}</td>
                                                <td className="py-2 px-3 text-right">₹{item.price?.toLocaleString()}</td>
                                                <td className="py-2 px-3 text-right">₹{item.amount?.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                           </div>
                           <div className="flex justify-between items-center text-[10px] text-muted-foreground pt-2">
                                <span>Type: {est.type}</span>
                                <span>Created At: {new Date(est.createdAt).toLocaleString()}</span>
                           </div>
                        </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
