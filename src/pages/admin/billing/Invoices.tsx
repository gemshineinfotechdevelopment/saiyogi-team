import { apiRequest } from "@/lib/api";
import { getLocalDate } from "@/lib/utils";
import { useState, useEffect } from "react";
import { EstimateListView, EstimateRecord } from "@/components/estimates/EstimateListView";
import { EstimateForm } from "@/components/estimates/EstimateForm";
import { Button } from "@/components/ui/button";
import { Plus, X, FileText } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { useSettings } from "@/context/SettingsContext";
import { BillPrintTemplate } from "@/components/printing/BillPrintTemplate";
import { PrintPortal } from "@/components/printing/PrintPortal";
import { TransportBillForm } from "@/components/transport/TransportBillForm";

interface BillSession {
  id: string;
  data: EstimateRecord;
  isNew: boolean;
}

export default function Invoices() {
  const [activeTab, setActiveTab] = useState<string>("list");
  const [invoices, setInvoices] = useState<EstimateRecord[]>([]);
  const [openBills, setOpenBills] = useState<BillSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { settings } = useSettings();
  const [printData, setPrintData] = useState<any>(null);

  const fetchInvoices = async () => {
    try {
      const data = await apiRequest('/estimates');
      if (Array.isArray(data)) {
        setInvoices(data);
        const activeOrHeld = data.filter(e => e.status === 'active' || e.status === 'held');
        const sessions = activeOrHeld.map(inv => ({
          id: inv.billNo,
          data: inv,
          isNew: false
        }));
        setOpenBills(sessions);
      }
    } catch (err) {
      console.error("Error fetching invoices:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const getNextInvoiceNoFromServer = async () => {
    try {
      const data = await apiRequest('/estimates/next-bill-no?billType=invoice');
      return data.nextBillNo;
    } catch (err) {
      console.error("Error fetching next invoice no:", err);
      return `INV-${Date.now()}`;
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

  const handlePrint = (inv: EstimateRecord) => {
    setPrintData(inv);
  };

  const handleNew = async () => {
    try {
      const nextInvoiceNo = await getNextInvoiceNoFromServer();

      const newInvoice = {
        billNo: nextInvoiceNo,
        customerName: "New Customer",
        status: "active",
        type: 'Retail',
        billType: 'invoice',
        date: getLocalDate(),
        items: [],
        totalAmount: 0
      };

      const response = await apiRequest('/estimates', {
        method: 'POST',
        body: JSON.stringify(newInvoice)
      });

      const saved = response.bill || response;

      setOpenBills(prev => [...prev, { id: saved.billNo, data: saved, isNew: true }]);
      setInvoices(prev => [saved, ...prev]);
      setActiveTab(saved.billNo);
      toast.success("New invoice session created");
    } catch (err) {
      console.error("Error creating new invoice:", err);
      toast.error("Failed to create new invoice");
    }
  };

  const handleEdit = (inv: EstimateRecord) => {
    const existing = openBills.find(b => b.id === inv.billNo);
    if (existing) {
      setActiveTab(inv.billNo);
    } else {
      setOpenBills(prev => [...prev, { id: inv.billNo, data: inv, isNew: false }]);
      setActiveTab(inv.billNo);
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
        body: JSON.stringify({ ...data, billType: data.billType || 'invoice' })
      });

      setInvoices(prev => prev.map(e => e.billNo === data.billNo ? saved : e));
      
      if (print) {
        handlePrint(saved);
      }

      if (saved.status === 'completed' || saved.status === 'cancelled') {
        setOpenBills(prev => prev.filter(b => b.id !== data.billNo));
        setActiveTab("list");
      } else {
        setOpenBills(prev => prev.map(b => b.id === data.billNo ? { ...b, data: saved } : b));
      }

      toast.success(`Invoice ${saved.status === 'held' ? 'held' : (saved.status === 'completed' ? 'completed' : 'updated')} successfully`);
    } catch (err) {
      console.error("Error saving invoice:", err);
      toast.error("Failed to save invoice");
    }
  };

  const handleDelete = async (billNo: string) => {
    if (!confirm("Are you sure you want to delete this invoice?")) return;
    try {
      await apiRequest(`/estimates/${billNo}`, { method: 'DELETE' });
      setInvoices(prev => prev.filter(e => e.billNo !== billNo));
      setOpenBills(prev => prev.filter(b => b.id !== billNo));
      if (activeTab === billNo) setActiveTab("list");
      toast.success("Invoice deleted");
    } catch (err) {
      console.error("Error deleting invoice:", err);
    }
  };

  const handleConvert = async (billNo: string) => {
    try {
      await apiRequest(`/estimates/${billNo}`, {
        method: 'PUT',
        body: JSON.stringify({ billType: 'estimate' })
      });
      setInvoices(prev => prev.filter(e => e.billNo !== billNo));
      setOpenBills(prev => prev.filter(b => b.id !== billNo));
      if (activeTab === billNo) setActiveTab("list");
    } catch (err) {
      console.error("Error converting invoice:", err);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading invoices...</div>;
  }

  return (
    <AppLayout title="Invoices" noPadding hideHeader>
      <div className="flex flex-col h-screen overflow-hidden">
        {/* Sessions Top Bar */}
        <div className="border-b border-border bg-card/80 backdrop-blur-md shrink-0 flex items-center p-2 gap-2 overflow-x-auto scrollbar-none animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("list")}
              className={`shrink-0 flex items-center px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === "list" ? "bg-primary text-primary-foreground shadow-md" : "bg-muted/50 hover:bg-muted text-muted-foreground"
                }`}
            >
              Invoice History
            </button>

            {openBills.map((inv) => (
              <div
                key={inv.id}
                onClick={() => setActiveTab(inv.id)}
                className={`shrink-0 group flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-semibold transition-all border cursor-pointer relative ${activeTab === inv.id ? "bg-card border-primary/20 shadow-sm text-primary" : "bg-muted/20 border-transparent hover:bg-muted/40 text-muted-foreground"
                  }`}
              >
                <div className="flex flex-col leading-tight min-w-[80px]">
                  <span className="truncate max-w-[120px]">{inv.data?.customerName || "Customer"}</span>
                  <span className="text-[10px] opacity-60 font-medium">{inv.data?.billNo}</span>
                </div>

                <span className={`text-[8px] px-1.5 py-0.5 rounded-full uppercase font-black shrink-0 ${inv.data?.status === 'held' ? 'bg-orange-100/80 text-orange-700' : 'bg-green-100/80 text-green-700'
                  }`}>
                  {inv.data?.status}
                </span>

                <button
                  onClick={(e) => handleCloseTab(inv.id, e)}
                  className="p-1 rounded-full hover:bg-destructive hover:text-white opacity-0 group-hover:opacity-100 transition-all -mr-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-muted/5 pb-24">
          {activeTab === "list" ? (
            <EstimateListView
              type="Retail"
              estimates={invoices}
              onMultiNew={(names) => toast.info(`Multi-new disabled.`)}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onConvert={handleConvert}
              title="Invoice"
              convertIcon={<FileText className="w-4 h-4" />}
              convertToast="Invoice {id} converted to estimate!"
            />
          ) : openBills.find(b => b.id === activeTab)?.data.billType === 'transport' ? (
            <TransportBillForm
              key={activeTab}
              onBack={() => setActiveTab("list")}
              onSave={handleSave}
              editData={openBills.find(b => b.id === activeTab)?.data}
            />
          ) : (
            <EstimateForm
              key={activeTab}
              type={openBills.find(b => b.id === activeTab)?.data.type || "Retail"}
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