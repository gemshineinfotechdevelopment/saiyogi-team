import { useState, useMemo, useEffect } from "react";
import { Users, FileText, ArrowUpDown } from "lucide-react";
import { Link } from "react-router-dom";
import AdminSidebar from "@/components/layout/AdminSidebar";
import AdminNavbar from "@/components/layout/AdminNavbar";
import { getOrders } from "@/lib/api";
import { downloadOrderReceiptPDF, printOrderReceipt } from "@/lib/pdf-generator";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface Customer {
  name: string;
  email: string;
  phone?: string;
  alternatePhone?: string;
  deliveryAddress?: string;
  state?: string;
  district?: string;
  lastOrderDate?: string;
  totalOrders: number;
  totalSpent: number;
  purchases: any[];
}

const buildCustomers = (ordersData: any[]): Customer[] => {
  const map = new Map<string, Customer>();
  ordersData.forEach((o) => {
    // Use phone as primary key, fallback to email if phone is missing
    const key = o.customerPhone || o.customerEmail;
    const existing = map.get(key);
    const orderAmt = Number(o.subtotal) + (Number(o.packingCharge) || 0);
    if (existing) {
      existing.totalOrders += 1;
      existing.totalSpent += orderAmt;
      existing.purchases.push(o);
      // Update last order date
      if (o.createdAt) {
        existing.lastOrderDate = o.createdAt;
      }
      // Update customer details from approved orders
      existing.phone = existing.phone || o.customerPhone;
      existing.alternatePhone = existing.alternatePhone || o.alternatePhoneNumber;
      existing.deliveryAddress = existing.deliveryAddress || o.deliveryAddress?.fullAddress;
      existing.state = existing.state || o.deliveryAddress?.state;
      existing.district = existing.district || o.deliveryAddress?.district;
    } else {
      const customer: Customer = {
        name: o.customerName,
        email: o.customerEmail,
        phone: o.customerPhone,
        alternatePhone: o.alternatePhoneNumber,
        deliveryAddress: o.deliveryAddress?.fullAddress,
        state: o.deliveryAddress?.state,
        district: o.deliveryAddress?.district,
        lastOrderDate: o.createdAt,
        totalOrders: 1,
        totalSpent: orderAmt,
        purchases: [o]
      };
      map.set(key, customer || {} as Customer);
    }
  });
  return Array.from(map.values());
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
    siteWebsite: settings.socialLinks?.youtube || '', // or wherever website is stored
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
  useEffect(() => { getOrders().then(setOrders).catch(() => setOrders([])); }, []);
  const customers = useMemo(() => buildCustomers(orders), [orders]);
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [phoneFilter, setPhoneFilter] = useState("");

  const filteredCustomers = useMemo(() => {
    return customers
      .filter((c) => {
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
        return dateB - dateA; // Newest first (descending order)
      });
  }, [customers, phoneFilter]);

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
              <Users className="h-6 w-6 text-primary" /> Customers
            </h1>
            <p className="text-sm text-muted-foreground">{filteredCustomers.length} of {customers.length} customers</p>
          </div>
          <Link to="/" className="text-sm text-primary hover:underline lg:hidden mt-1">← Store</Link>
        </div>

        <div className="mb-6 flex gap-3">
          <input
            type="text"
            placeholder="Filter by phone number..."
            value={phoneFilter}
            onChange={(e) => { setPhoneFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 border border-border rounded-md bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary flex-1 max-w-xs"
          />
          {phoneFilter && (
            <button
              onClick={() => setPhoneFilter("")}
              className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          )}
        </div>

        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Total Spent</TableHead>
                <TableHead className="hidden md:table-cell">Last Order</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((c) => (
                <TableRow key={c.phone || c.email}>
                  <TableCell className="font-semibold">{c.name}</TableCell>
                  <TableCell className="text-muted-foreground">{c.phone || "—"}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {c.district && c.state ? `${c.district}, ${c.state}` : (c.state || c.district || "—")}
                  </TableCell>
                  <TableCell>{c.totalOrders}</TableCell>
                  <TableCell className="font-bold text-primary">₹{c.totalSpent.toLocaleString()}</TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString() : "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => { setSelectedCustomer(c); setSortAsc(false); }}>
                      View History
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-border">
              <div className="text-sm text-muted-foreground">
                Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredCustomers.length)} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredCustomers.length)} of {filteredCustomers.length} entries
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</Button>
                <div className="text-sm font-medium">Page {currentPage} of {Math.max(1, totalPages)}</div>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0}>Next</Button>
              </div>
            </div>
          )}
        </div>

        {/* Customer Details & Purchase History Dialog */}
        <Dialog open={!!selectedCustomer} onOpenChange={(o) => !o && setSelectedCustomer(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedCustomer?.name} — Customer Profile</DialogTitle>
              <DialogDescription>{selectedCustomer?.email}</DialogDescription>
            </DialogHeader>
            
            {selectedCustomer && (
              <div className="space-y-6">
                {/* Customer Details */}
                <div className="bg-secondary text-white p-4 rounded-lg">
                  <h3 className="font-semibold mb-3">Contact Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-white/70">Email</p>
                      <p className="font-medium">{selectedCustomer.email}</p>
                    </div>
                    <div>
                      <p className="text-white/70">Phone</p>
                      <p className="font-medium">{selectedCustomer.phone || "Not provided"}</p>
                    </div>
                    {selectedCustomer.alternatePhone && (
                      <div>
                        <p className="text-white/70">Alternate Phone</p>
                        <p className="font-medium">{selectedCustomer.alternatePhone}</p>
                      </div>
                    )}
                  </div>
                  {selectedCustomer.deliveryAddress && (
                    <div className="mt-4">
                      <p className="text-white/70 text-sm">Delivery Address</p>
                      <p className="font-medium text-sm text-foreground bg-background p-2 rounded mt-1">{selectedCustomer.deliveryAddress}</p>
                    </div>
                  )}
                </div>

                {/* Summary */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-primary/10 p-3 rounded">
                    <p className="text-muted-foreground">Total Orders</p>
                    <p className="font-bold text-lg">{selectedCustomer.totalOrders}</p>
                  </div>
                  <div className="bg-primary/10 p-3 rounded">
                    <p className="text-muted-foreground">Total Spent</p>
                    <p className="font-bold text-lg">₹{selectedCustomer.totalSpent.toLocaleString()}</p>
                  </div>
                  <div className="bg-primary/10 p-3 rounded col-span-2 md:col-span-1">
                    <p className="text-muted-foreground">Location</p>
                    <p className="font-bold text-base truncate" title={selectedCustomer.district && selectedCustomer.state ? `${selectedCustomer.district}, ${selectedCustomer.state}` : (selectedCustomer.state || selectedCustomer.district || "—")}>
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
                        {sortedPurchases.map((o) => (
                          <TableRow key={o._id}>
                            <TableCell className="font-semibold">{o.orderNumber || o._id?.slice(-8)}</TableCell>
                            <TableCell className="text-xs">{o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "N/A"}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="font-bold whitespace-nowrap">
                                {o.items?.length || 0} Items
                              </Badge>
                            </TableCell>
                            <TableCell className="font-bold">₹{(Number(o.subtotal) + (Number(o.packingCharge) || 0)).toLocaleString()}</TableCell>
                            <TableCell>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                o.status === "delivered" ? "bg-green-500/20 text-green-500" :
                                o.status === "shipped" ? "bg-red-500/20 text-red-500" :
                                o.status === "processing" ? "bg-primary/20 text-primary" :
                                o.status === "cancelled" ? "bg-destructive/20 text-destructive" :
                                "bg-muted text-muted-foreground"
                              }`}>{o.status}</span>
                            </TableCell>
                            <TableCell>
                              {o.approved ? (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-500">✓ Yes</span>
                              ) : (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">No</span>
                              )}
                            </TableCell>
                            <TableCell className="flex gap-1">
                              <Button variant="ghost" size="sm" onClick={() => { handleInvoiceAction(o, settings, 'download'); toast({ title: "Downloading Invoice" }); }} title="Download PDF">
                                <FileText className="h-4 w-4 text-blue-600" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => { handleInvoiceAction(o, settings, 'print'); toast({ title: "Printing Invoice" }); }} title="Print Invoice" className="hidden md:inline-flex">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-printer"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <Button onClick={() => setSelectedCustomer(null)} className="w-full">Close</Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
        </main>
      </div>
    </>
  );
}

export default AdminCustomers;
