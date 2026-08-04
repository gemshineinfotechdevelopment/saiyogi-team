import { apiRequest } from "@/lib/api";
import { getLocalDate } from "@/lib/utils";
import { useState, useEffect } from "react";
import { EstimateListView, EstimateRecord } from "@/components/estimates/EstimateListView";
import { EstimateForm } from "@/components/estimates/EstimateForm";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { useSettings } from "@/context/SettingsContext";
import { BillPrintTemplate } from "@/components/printing/BillPrintTemplate";
import { PrintPortal } from "@/components/printing/PrintPortal";

export default function WholesaleEstimate() {
  const [activeTab, setActiveTab] = useState<string>("list");
  const [estimates, setEstimates] = useState<EstimateRecord[]>([]);
  const [openBills, setOpenBills] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { settings } = useSettings();
  const [printData, setPrintData] = useState<any>(null);

  const fetchEstimates = async () => {
    try {
      const data = await apiRequest('/estimates?type=Wholesale');
      if (Array.isArray(data)) {
        setEstimates(data);
        const activeOrHeld = data.filter(e => e.status === 'active' || e.status === 'held');
        const sessions = activeOrHeld.map(est => ({
          id: est.billNo,
          data: est,
          isNew: false
        }));
        setOpenBills(sessions);
      }
    } catch (err) {
      console.error("Error fetching estimates:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEstimates();
  }, []);

  const getNextBillNoFromServer = async () => {
    try {
      const data = await apiRequest('/estimates/next-bill-no?type=Wholesale');
      return data.nextBillNo;
    } catch (err) {
      console.error("Error fetching next bill no:", err);
      return `WHST-${Date.now()}`;
    }
  };

  useEffect(() => {
    if (printData) {
      const timer = setTimeout(() => {
        window.print();
        setPrintData(null);
      }, 500);
return () => clearTimeout(timer);
    }
  }, [printData]);

  const handlePrint = (est: EstimateRecord) => {
    setPrintData(est);
  };

  const handleNew = async () => {
    try {
      const nextBillNo = await getNextBillNoFromServer();
      const newBill = {
        billNo: nextBillNo,
        customerName: "New Customer",
        status: "active",
        type: 'Wholesale',
        date: getLocalDate(),
        items: [],
        totalAmount: 0
      };

      const response = await apiRequest('/estimates', {
        method: 'POST',
        body: JSON.stringify(newBill)
      });

      const saved = response.bill || response;

      setOpenBills(prev => [...prev, { id: saved.billNo, data: saved, isNew: true }]);
      setEstimates(prev => [saved, ...prev]);
      setActiveTab(saved.billNo);
      toast.success("New bill session created");
    } catch (err) {
      console.error("Error creating new bill:", err);
      toast.error("Failed to create new bill");
    }
  };

  const handleEdit = (est: EstimateRecord) => {
    const existing = openBills.find(b => b.id === est.billNo);
    if (existing) {
      setActiveTab(est.billNo);
    } else {
      setOpenBills(prev => [...prev, { id: est.billNo, data: est, isNew: false }]);
      setActiveTab(est.billNo);
    }
  };

  const handleCloseTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenBills(prev => {
      const filtered = prev.filter(b => b.id !== id);
      if (activeTab === id) setActiveTab("list");
      return filtered;
    });
  };

  const handleSave = async (data: any, print: boolean = false) => {
    try {
      const saved = await apiRequest(`/estimates/${data.billNo}`, {
        method: 'PUT',
        body: JSON.stringify({ ...data, type: 'Wholesale' })
      });

      setEstimates(prev => prev.map(e => e.billNo === data.billNo ? saved : e));
      
      if (print) {
        handlePrint(saved);
      }

      if (saved.status === 'completed' || saved.status === 'cancelled') {
        setOpenBills(prev => prev.filter(b => b.id !== data.billNo));
        setActiveTab("list");
      } else {
        setOpenBills(prev => prev.map(b => b.id === data.billNo ? { ...b, data: saved } : b));
      }
      toast.success(`Bill ${saved.status} successfully`);
    } catch (err) {
      console.error("Error saving estimate:", err);
      toast.error("Failed to save bill");
    }
  };

  const handleDelete = async (billNo: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      await apiRequest(`/estimates/${billNo}`, { method: 'DELETE' });
      setEstimates(prev => prev.filter(e => e.billNo !== billNo));
      setOpenBills(prev => prev.filter(b => b.id !== billNo));
      if (activeTab === billNo) setActiveTab("list");
      toast.success("Bill deleted");
    } catch (err) {
      console.error("Error deleting estimate:", err);
    }
  };

  const handleConvert = async (billNo: string) => {
    try {
      const updated = await apiRequest(`/estimates/${billNo}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'completed' })
      });
      setEstimates(prev => prev.map(e => e.billNo === billNo ? updated : e));
      setOpenBills(prev => prev.filter(b => b.id !== billNo));
      if (activeTab === billNo) setActiveTab("list");
      toast.success("Bill completed");
    } catch (err) {
      console.error("Error converting estimate:", err);
    }
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  return (
    <AppLayout title="Wholesale Estimate" noPadding hideHeader>
      <div className="flex flex-col h-screen overflow-hidden">
        {/* Sessions Top Bar */}
        <div className="border-b border-border bg-card/80 backdrop-blur-md shrink-0 flex items-center p-2 gap-2 overflow-x-auto scrollbar-none animate-in slide-in-from-top-4 duration-300">
          <Button onClick={handleNew} className="shrink-0 gap-2 h-9 px-4 shadow-sm">
            <Plus className="w-4 h-4" /> New Bill
          </Button>

          <div className="w-[1px] h-6 bg-border mx-1 shrink-0" />

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("list")}
              className={`shrink-0 flex items-center px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === "list" ? "bg-primary text-primary-foreground shadow-md" : "bg-muted/50 hover:bg-muted text-muted-foreground"
                }`}
            >
              All Estimates
            </button>

            {openBills.map((bill) => (
              <div
                key={bill.id}
                onClick={() => setActiveTab(bill.id)}
                className={`shrink-0 group flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-semibold transition-all border cursor-pointer relative ${activeTab === bill.id ? "bg-card border-primary/20 shadow-sm text-primary" : "bg-muted/20 border-transparent hover:bg-muted/40 text-muted-foreground"
                  }`}
              >
                <div className="flex flex-col leading-tight min-w-[80px]">
                  <span className="truncate max-w-[120px]">{bill.data?.customerName || "Customer"}</span>
                  <span className="text-[10px] opacity-60 font-medium">{bill.data?.billNo}</span>
                </div>

                <span className={`text-[8px] px-1.5 py-0.5 rounded-full uppercase font-black shrink-0 ${bill.data?.status === 'held' ? 'bg-orange-100/80 text-orange-700' : 'bg-green-100/80 text-green-700'
                  }`}>
                  {bill.data?.status}
                </span>

                <button
                  onClick={(e) => handleCloseTab(bill.id, e)}
                  className="p-1 rounded-full hover:bg-destructive hover:text-white opacity-0 group-hover:opacity-100 transition-all -mr-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-muted/5 pb-24">
          {activeTab === "list" ? (
            <EstimateListView type="Wholesale" estimates={estimates} onNew={handleNew} onMultiNew={(names) => toast.info(`Multi-new disabled.`)} onEdit={handleEdit} onDelete={handleDelete} onConvert={handleConvert} />
          ) : (
            <EstimateForm
              key={activeTab}
              type="Wholesale"
              onBack={() => setActiveTab("list")}
              onSave={handleSave}
              onChange={(updatedData) => {
                 setOpenBills(prev => prev.map(b => b.id === updatedData.billNo ? { ...b, data: updatedData } : b));
              }}
              editData={openBills.find(b => b.id === activeTab)?.data}
            />
          )}
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
