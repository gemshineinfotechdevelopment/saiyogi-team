import { useState, useMemo, useEffect } from "react";
import { Users, FileText, ArrowUpDown, Tag, ShoppingBag, HelpCircle, UserCheck } from "lucide-react";
import { Link } from "react-router-dom";
import AdminSidebar from "@/components/layout/AdminSidebar";
import AdminNavbar from "@/components/layout/AdminNavbar";
import { getOrders, getCustomers } from "@/lib/api";
import { downloadOrderReceiptPDF, printOrderReceipt } from "@/lib/pdf-generator";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export interface ProductEnquiryItem {
  id?: string;
  productName: string;
  amount: number;
  status: string;
  enquiryDate: string;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone: string;
  alternatePhone?: string;
  deliveryAddress?: string;
  state?: string;
  district?: string;
  sources: ("normal_login" | "chit_scheme" | "product_enquiry")[];
  productEnquiries: ProductEnquiryItem[];
  lastOrderDate?: string;
  totalOrders: number;
  totalSpent: number;
  purchases: any[];
  createdAt?: string;
}

const SourceBadges: React.FC<{ sources: string[] }> = ({ sources }) => {
  const list = sources || ['normal_login'];
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {list.includes('normal_login') && (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80">
          🔐 Login
        </span>
      )}
      {list.includes('chit_scheme') && (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/80">
          🎁 Chit Scheme
        </span>
      )}
      {list.includes('product_enquiry') && (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200/80">
          🔎 Enquiry
        </span>
      )}
    </div>
  );
};

const cleanPhone = (phone?: string) => {
  if (!phone) return "";
  return String(phone).replace(/\D/g, "").slice(-10);
};

const buildMergedCustomers = (apiCustomers: any[], ordersData: any[]): Customer[] => {
  const map = new Map<string, Customer>();

  // 1. Process API customers
  (apiCustomers || []).forEach((c) => {
    const pKey = cleanPhone(c.phone) || c.email || c._id;
    if (!pKey) return;

    const sourcesSet = new Set<"normal_login" | "chit_scheme" | "product_enquiry">(
      Array.isArray(c.sources) ? c.sources : ["normal_login"]
    );

    map.set(pKey, {
      id: c._id || c.id || pKey,
      name: c.name || "Customer",
      email: c.email || "",
      phone: cleanPhone(c.phone) || c.phone || "",
      alternatePhone: c.alternatePhone || "",
      deliveryAddress: c.deliveryAddress || "",
      state: c.state || "",
      district: c.district || "",
      sources: Array.from(sourcesSet),
      productEnquiries: Array.isArray(c.productEnquiries) ? c.productEnquiries : [],
      totalOrders: Number(c.totalOrders) || 0,
      totalSpent: Number(c.totalSpent) || 0,
      lastOrderDate: c.lastOrderDate || undefined,
      purchases: Array.isArray(c.purchases) ? c.purchases : [],
      createdAt: c.createdAt || undefined
    });
  });

  // 2. Process Local Storage customer tracks fallback
  try {
    const localTracks = JSON.parse(localStorage.getItem("local_customer_tracks") || "{}");
    Object.values(localTracks).forEach((track: any) => {
      const pKey = cleanPhone(track.phone);
      if (!pKey) return;

      const existing = map.get(pKey);
      if (existing) {
        (track.sources || []).forEach((src: any) => {
          if (!existing.sources.includes(src)) existing.sources.push(src);
        });
        if (Array.isArray(track.productEnquiries)) {
          track.productEnquiries.forEach((pe: any) => {
            const exists = existing.productEnquiries.some((item) => item.id === pe.id);
            if (!exists) existing.productEnquiries.push(pe);
          });
        }
      } else {
        map.set(pKey, {
          id: pKey,
          name: track.name || "Customer",
          email: "",
          phone: pKey,
          sources: track.sources || ["normal_login"],
          productEnquiries: track.productEnquiries || [],
          totalOrders: 0,
          totalSpent: 0,
          purchases: []
        });
      }
    });
  } catch (e) {
    console.warn("Could not read local_customer_tracks:", e);
  }

  // 3. Process Orders Data (linking approved orders & enquiries)
  (ordersData || []).forEach((o) => {
    const pKey = cleanPhone(o.customerPhone) || o.customerEmail || o._id;
    if (!pKey) return;

    let existing = map.get(pKey);
    if (!existing) {
      existing = {
        id: pKey,
        name: o.customerName || "Customer",
        email: o.customerEmail || "",
        phone: cleanPhone(o.customerPhone) || o.customerPhone || "",
        alternatePhone: o.alternatePhoneNumber || "",
        deliveryAddress: o.deliveryAddress?.fullAddress || (typeof o.deliveryAddress === 'string' ? o.deliveryAddress : ""),
        state: o.deliveryAddress?.state || o.state || "",
        district: o.deliveryAddress?.district || o.district || "",
        sources: ["product_enquiry"],
        productEnquiries: [],
        totalOrders: 0,
        totalSpent: 0,
        purchases: []
      };
      map.set(pKey, existing);
    }

    if (!existing.sources.includes("product_enquiry")) {
      existing.sources.push("product_enquiry");
    }

    if (o.deliveryAddress) {
      if (!existing.deliveryAddress) {
        existing.deliveryAddress = o.deliveryAddress.fullAddress || (typeof o.deliveryAddress === 'string' ? o.deliveryAddress : "");
      }
      if (!existing.state) existing.state = o.deliveryAddress.state || o.state || "";
      if (!existing.district) existing.district = o.deliveryAddress.district || o.district || "";
    }

    const alreadyInPurchases = existing.purchases.some((p) => String(p._id || p.orderNumber) === String(o._id || o.orderNumber));
    if (!alreadyInPurchases) {
      existing.purchases.push(o);
      const amt = Number(o.total) || (Number(o.subtotal) + (Number(o.packingCharge) || 0));
      if (o.approved) {
        existing.totalOrders += 1;
        existing.totalSpent += amt;
      }
      const dateVal = o.createdAt ? new Date(o.createdAt).getTime() : 0;
      const currentLast = existing.lastOrderDate ? new Date(existing.lastOrderDate).getTime() : 0;
      if (dateVal > currentLast) {
        existing.lastOrderDate = o.createdAt;
      }
    }
  });

  return Array.from(map.values()).map(c => {
    if (c.sources.includes("chit_scheme") || c.sources.includes("product_enquiry")) {
      c.sources = c.sources.filter(s => s !== "normal_login");
    }
    if (Array.isArray(c.productEnquiries)) {
      c.productEnquiries.sort((a, b) => {
        const da = a.enquiryDate ? new Date(a.enquiryDate).getTime() : 0;
        const db = b.enquiryDate ? new Date(b.enquiryDate).getTime() : 0;
        return db - da;
      });
    }
    return c;
  });
};

const handleInvoiceAction = (order: any, settings: any, action: 'download' | 'print') => {
  const orderData = {
    orderNumber: order.orderNumber || order._id?.slice(-8) || "",
    customerName: order.customerName || "",
    customerEmail: order.customerEmail || "",
    customerPhone: order.customerPhone || "",
    deliveryAddress: order.deliveryAddress?.fullAddress || (typeof order.deliveryAddress === 'string' ? order.deliveryAddress : ""),
    state: order.deliveryAddress?.state || "",
    district: order.deliveryAddress?.district || "",
    items: order.items || [],
    subtotal: Number(order.subtotal) || 0,
    discountPercent: Number(order.discountPercent) || 0,
    total: Number(order.total) || (Number(order.subtotal) + (Number(order.packingCharge) || 0)),
    packingCharge: Number(order.packingCharge) || 0,
    date: order.createdAt ? new Date(order.createdAt).toLocaleDateString() : (order.date || new Date().toLocaleDateString()),
    siteName: settings.siteName,
    companyName: settings.billing?.companyName || settings.siteName,
    siteAddress: settings.contact?.address || '',
    sitePhone: settings.contact?.phone || '',
    siteEmail: settings.contact?.email || '',
    siteWebsite: settings.socialLinks?.youtube || '',
    gstNumber: settings.billing?.gstNumber || '',
  };
  
  if (action === 'download') {
    downloadOrderReceiptPDF(orderData);
  } else {
    printOrderReceipt(orderData);
  }
};

const AdminCustomers = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;
  const { toast } = useToast();
  const { settings } = useSiteSettings();
  const [orders, setOrders] = useState<any[]>([]);
  const [apiCustomersList, setApiCustomersList] = useState<any[]>([]);
  const [sourceTab, setSourceTab] = useState<'all' | 'normal_login' | 'chit_scheme' | 'product_enquiry'>('all');
  const [phoneFilter, setPhoneFilter] = useState("");
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    Promise.all([
      getCustomers().catch(() => []),
      getOrders().catch(() => [])
    ]).then(([custs, ords]) => {
      setApiCustomersList(custs || []);
      setOrders(ords || []);
    });
  }, []);

  const customers = useMemo(() => {
    return buildMergedCustomers(apiCustomersList, orders);
  }, [apiCustomersList, orders]);

  const filteredCustomers = useMemo(() => {
    return customers
      .filter((c) => {
        // 1. Source Tab Filter
        if (sourceTab !== 'all' && !c.sources.includes(sourceTab)) {
          return false;
        }

        // 2. Search Filter (Phone/Name/Email)
        const q = phoneFilter.trim().toLowerCase();
        if (!q) return true;

        const phone = String(c.phone || "").toLowerCase();
        const name = String(c.name || "").toLowerCase();
        const email = String(c.email || "").toLowerCase();
        return phone.includes(q) || name.includes(q) || email.includes(q);
      })
      .sort((a, b) => {
        const dateA = a.lastOrderDate ? new Date(a.lastOrderDate).getTime() : 0;
        const dateB = b.lastOrderDate ? new Date(b.lastOrderDate).getTime() : 0;
        return dateB - dateA;
      });
  }, [customers, sourceTab, phoneFilter]);

  const sortedPurchases = useMemo(() => {
    if (!selectedCustomer) return [];
    return [...selectedCustomer.purchases].sort((a, b) => {
      const da = a.createdAt ? new Date(a.createdAt).getTime() : new Date(a.date || 0).getTime();
      const db = b.createdAt ? new Date(b.createdAt).getTime() : new Date(b.date || 0).getTime();
      return sortAsc ? da - db : db - da;
    });
  }, [selectedCustomer, sortAsc]);

  const totalPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE);
  const paginatedData = filteredCustomers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <>
      <AdminNavbar />
      <div className="flex min-h-screen">
        <AdminSidebar />
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          <div className="mb-8 flex items-start justify-between w-full">
            <div>
              <h1 className="font-display text-2xl font-bold flex items-center gap-2">
                <Users className="h-6 w-6 text-primary" /> Customers Management
              </h1>
              <p className="text-sm text-muted-foreground">
                {filteredCustomers.length} of {customers.length} unique customers registered across Login, Chit Scheme & Enquiries
              </p>
            </div>
            <Link to="/" className="text-sm text-primary hover:underline lg:hidden mt-1">← Store</Link>
          </div>

          {/* Source Filter Tabs */}
          <div className="flex items-center gap-2 flex-wrap mb-6">
            <button
              onClick={() => { setSourceTab('all'); setCurrentPage(1); }}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                sourceTab === 'all'
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              All Customers ({customers.length})
            </button>

            <button
              onClick={() => { setSourceTab('normal_login'); setCurrentPage(1); }}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                sourceTab === 'normal_login'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <span>🔐</span> Normal Login ({customers.filter(c => c.sources.includes('normal_login')).length})
            </button>

            <button
              onClick={() => { setSourceTab('chit_scheme'); setCurrentPage(1); }}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                sourceTab === 'chit_scheme'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <span>🎁</span> Chit Scheme ({customers.filter(c => c.sources.includes('chit_scheme')).length})
            </button>

            <button
              onClick={() => { setSourceTab('product_enquiry'); setCurrentPage(1); }}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                sourceTab === 'product_enquiry'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <span>🔎</span> Product Enquiry ({customers.filter(c => c.sources.includes('product_enquiry')).length})
            </button>
          </div>

          {/* Search Input */}
          <div className="mb-6 flex gap-3">
            <input
              type="text"
              placeholder="Search by name or phone number..."
              value={phoneFilter}
              onChange={(e) => { setPhoneFilter(e.target.value); setCurrentPage(1); }}
              className="px-3.5 py-2 border border-border rounded-xl bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary flex-1 max-w-xs font-medium"
            />
            {phoneFilter && (
              <button
                onClick={() => setPhoneFilter("")}
                className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground cursor-pointer font-medium"
              >
                Clear Search
              </button>
            )}
          </div>

          {/* Customers Table */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-2xs">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="font-bold">Name</TableHead>
                  <TableHead className="font-bold">Phone</TableHead>
                  <TableHead className="font-bold">Location</TableHead>
                  <TableHead className="font-bold">Source</TableHead>
                  <TableHead className="font-bold">Orders</TableHead>
                  <TableHead className="font-bold">Total Spent</TableHead>
                  <TableHead className="hidden md:table-cell font-bold">Last Order</TableHead>
                  <TableHead className="text-right font-bold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground text-sm font-medium">
                      No customers found matching your criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((c) => (
                    <TableRow key={c.id || c.phone || c.email}>
                      <TableCell className="font-semibold text-foreground">{c.name}</TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs">{c.phone || "—"}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {c.district && c.state ? `${c.district}, ${c.state}` : (c.state || c.district || "—")}
                      </TableCell>
                      <TableCell>
                        <SourceBadges sources={c.sources} />
                      </TableCell>
                      <TableCell className="font-medium">{c.totalOrders > 0 ? c.totalOrders : "—"}</TableCell>
                      <TableCell className="font-bold text-primary">
                        {c.totalSpent > 0 ? (
                          `₹${c.totalSpent.toLocaleString()}`
                        ) : c.productEnquiries && c.productEnquiries.length > 0 ? (
                          `₹${(c.productEnquiries[0]?.amount || 0).toLocaleString()}`
                        ) : (
                          <span className="text-muted-foreground font-normal">—</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                        {c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString() : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => { setSelectedCustomer(c); setSortAsc(false); }} className="rounded-xl font-bold cursor-pointer">
                          View History
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-border bg-muted/10">
                <div className="text-sm text-muted-foreground">
                  Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredCustomers.length)} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredCustomers.length)} of {filteredCustomers.length} entries
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="rounded-xl font-bold cursor-pointer">Previous</Button>
                  <div className="text-sm font-semibold">Page {currentPage} of {Math.max(1, totalPages)}</div>
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="rounded-xl font-bold cursor-pointer">Next</Button>
                </div>
              </div>
            )}
          </div>

          {/* Customer Details & Purchase History Dialog */}
          <Dialog open={!!selectedCustomer} onOpenChange={(o) => !o && setSelectedCustomer(null)}>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto rounded-3xl p-6 bg-white">
              <DialogHeader className="mb-2">
                <DialogTitle className="text-xl font-bold">{selectedCustomer?.name} — Customer Profile</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">{selectedCustomer?.email}</DialogDescription>
              </DialogHeader>
              
              {selectedCustomer && (
                <div className="space-y-6">
                  {/* Contact Information Banner */}
                  <div className="bg-secondary text-white p-5 rounded-2xl shadow-sm space-y-3">
                    <h3 className="font-semibold text-xs tracking-wider uppercase text-white/90">CONTACT INFORMATION</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-white/70 text-xs font-medium">Email</p>
                        <p className="font-semibold text-white mt-0.5">{selectedCustomer.email || "Not provided"}</p>
                      </div>
                      <div>
                        <p className="text-white/70 text-xs font-medium">Phone</p>
                        <p className="font-semibold text-white mt-0.5">{selectedCustomer.phone || "Not provided"}</p>
                      </div>
                    </div>
                    {selectedCustomer.deliveryAddress && (
                      <div className="pt-2">
                        <p className="text-white/70 text-xs font-medium mb-1">Delivery Address</p>
                        <div className="bg-white text-gray-900 font-semibold text-sm p-3.5 rounded-xl">
                          {selectedCustomer.deliveryAddress}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Summary Stats Row */}
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="bg-rose-50/80 p-4 rounded-2xl border border-rose-100">
                      <p className="text-xs font-medium text-muted-foreground">Total Orders</p>
                      <p className="font-bold text-xl text-foreground mt-1">{selectedCustomer.purchases.length}</p>
                    </div>
                    <div className="bg-rose-50/80 p-4 rounded-2xl border border-rose-100">
                      <p className="text-xs font-medium text-muted-foreground">Total Spent</p>
                      <p className="font-bold text-xl text-foreground mt-1">
                        ₹{(
                          selectedCustomer.totalSpent > 0
                            ? selectedCustomer.totalSpent
                            : selectedCustomer.purchases.reduce((sum, o) => sum + (Number(o.total) || (Number(o.subtotal) + (Number(o.packingCharge) || 0))), 0)
                        ).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-rose-50/80 p-4 rounded-2xl border border-rose-100">
                      <p className="text-xs font-medium text-muted-foreground">Location</p>
                      <p className="font-bold text-base text-foreground mt-1 truncate" title={selectedCustomer.district && selectedCustomer.state ? `${selectedCustomer.district}, ${selectedCustomer.state}` : (selectedCustomer.state || selectedCustomer.district || "—")}>
                        {selectedCustomer.district && selectedCustomer.state ? `${selectedCustomer.district}, ${selectedCustomer.state}` : (selectedCustomer.state || selectedCustomer.district || "—")}
                      </p>
                    </div>
                  </div>

                {/* Purchase History */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold">Purchase History</h3>
                    <Button variant="ghost" size="sm" className="gap-1" onClick={() => setSortAsc(!sortAsc)}>
                      <ArrowUpDown className="h-3 w-3" /> Sort ({sortAsc ? "Oldest" : "Newest"})
                    </Button>
                  </div>
                  <div className="max-h-60 overflow-auto border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order ID</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Items</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Approved</TableHead>
                          <TableHead>Invoice</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedPurchases.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-xs text-muted-foreground italic">
                              No purchase history available.
                            </TableCell>
                          </TableRow>
                        ) : (
                          sortedPurchases.map((o) => (
                            <TableRow key={o._id || o.orderNumber}>
                              <TableCell className="font-bold text-xs">{o.orderNumber || o._id?.slice(-8)}</TableCell>
                              <TableCell className="text-xs font-medium text-muted-foreground">
                                {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : (o.date || "N/A")}
                              </TableCell>
                              <TableCell className="text-xs font-bold">{o.items?.length || 0}</TableCell>
                              <TableCell className="font-bold text-xs text-foreground">
                                ₹{(Number(o.total) || (Number(o.subtotal) + (Number(o.packingCharge) || 0))).toLocaleString()}
                              </TableCell>
                              <TableCell>
                                <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                  {o.status || "pending"}
                                </span>
                              </TableCell>
                              <TableCell className="text-xs font-medium text-muted-foreground">
                                {o.approved ? "Yes" : "No"}
                              </TableCell>
                              <TableCell className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    handleInvoiceAction(o, settings, 'download');
                                    toast({ title: "Downloading Invoice" });
                                  }}
                                  title="Download PDF Invoice"
                                  className="h-8 w-8 p-0 cursor-pointer text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                >
                                  <FileText className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    handleInvoiceAction(o, settings, 'print');
                                    toast({ title: "Printing Invoice" });
                                  }}
                                  title="Print Invoice"
                                  className="h-8 w-8 p-0 cursor-pointer text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-printer"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                  <Button
                    onClick={() => setSelectedCustomer(null)}
                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-2xl cursor-pointer shadow-md transition-all active:scale-[0.99]"
                  >
                    Close
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </>
  );
};

export default AdminCustomers;
