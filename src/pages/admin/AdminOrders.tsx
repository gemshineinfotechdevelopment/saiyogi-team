import AdminSidebar from "@/components/layout/AdminSidebar";
import AdminNavbar from "@/components/layout/AdminNavbar";
import { useEffect, useState } from "react";
import { getOrders, approveOrder, updatePackingStatus, deleteOrder } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { downloadOrderReceiptPDF, printOrderReceipt } from "@/lib/pdf-generator";
import { useSiteSettings } from "@/context/SiteSettingsContext";

const AdminOrders = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;
  const [orderList, setOrderList] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isApproving, setIsApproving] = useState(false);
  const { settings } = useSiteSettings();

  const getOrderData = (order: any) => ({
    orderNumber: order.orderNumber || order._id,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    deliveryAddress: order.deliveryAddress?.fullAddress || order.shippingAddress?.fullAddress || '',
    state: order.deliveryAddress?.state || '',
    district: order.deliveryAddress?.district || '',
    items: order.items.map((i: any) => ({
      ...i,
      productName: i.product?.name || i.productName || 'Product',
      originalPrice: i.originalPrice !== undefined ? i.originalPrice : (i.product?.price || i.price),
      hasDiscount: i.hasDiscount !== undefined ? i.hasDiscount : (i.product?.hasDiscount !== undefined ? i.product.hasDiscount : true),
      netRate: i.netRate !== undefined ? i.netRate : i.product?.netRate,
      displayNetRate: i.displayNetRate !== undefined ? i.displayNetRate : i.product?.displayNetRate
    })),
    subtotal: order.subtotal,
    packingCharge: order.packingCharge || (order.subtotal <= 3999 ? 120 : Math.round(order.subtotal * 0.03)),
    total: order.total || (order.subtotal + (order.packingCharge || (order.subtotal <= 3999 ? 120 : Math.round(order.subtotal * 0.03)))),
    date: new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN'),
    discountPercent: settings.discountPercent,
    siteName: settings.siteName,
    companyName: settings.billing?.companyName || settings.siteName,
    siteAddress: settings.contact?.address || '',
    sitePhone: settings.contact?.phone || '',
    siteEmail: settings.contact?.email || '',
    gstNumber: settings.billing?.gstNumber || '',
  });

  const handleDownloadPDF = (order: any) => {
    downloadOrderReceiptPDF(getOrderData(order));
    toast.success("Downloading PDF...");
  };

  const handlePrintPDF = (order: any) => {
    printOrderReceipt(getOrderData(order));
    toast.success("Preparing Print...");
  };
  const [phoneFilter, setPhoneFilter] = useState("");
  type StatusFilter = 'all' | 'approved' | 'packing';
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [isUpdatingPacking, setIsUpdatingPacking] = useState(false);

  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm("Are you sure you want to delete this order? This action cannot be undone.")) return;
    try {
      await deleteOrder(orderId);
      setOrderList((prev) => prev.filter((o) => o._id !== orderId));
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder(null);
      }
      toast.success("Order deleted successfully!");
    } catch (error) {
      console.error("Error deleting order:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete order");
    }
  };

  const fetchOrders = () => {
    getOrders().then((data) => {
      if (Array.isArray(data)) {
        setOrderList(data);
      }
    }).catch(() => setOrderList([]));
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleApproveOrder = async () => {
    if (!selectedOrder) return;
    
    try {
      setIsApproving(true);
      await approveOrder(selectedOrder._id);
      
      setOrderList((prev) =>
        prev.map((o) =>
          o._id === selectedOrder._id ? { ...o, approved: true } : o
        )
      );
      
      setSelectedOrder((prev: any) => ({ ...prev, approved: true }));
      toast.success("Order approved and customer updated!");
    } catch (error) {
      console.error("Error approving order:", error);
      toast.error(error instanceof Error ? error.message : "Failed to approve order");
    } finally {
      setIsApproving(false);
    }
  };

  const handleTogglePackingStatus = async () => {
    if (!selectedOrder) return;
    
    try {
      setIsUpdatingPacking(true);
      const newStatus = selectedOrder.packingStatus === 'packed' ? 'unpacked' : 'packed';
      await updatePackingStatus(selectedOrder._id, newStatus);
      
      setOrderList((prev) =>
        prev.map((o) =>
          o._id === selectedOrder._id ? { ...o, packingStatus: newStatus } : o
        )
      );
      
      setSelectedOrder((prev: any) => ({ ...prev, packingStatus: newStatus }));
      toast.success(`Order marked as ${newStatus}!`);
    } catch (error) {
      console.error("Error updating packing status:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update packing status");
    } finally {
      setIsUpdatingPacking(false);
    }
  };

  const phoneFiltered = orderList.filter((o) => {
    const q = phoneFilter.trim().toLowerCase();
    if (!q) return true;
    const phone = String(o.customerPhone || o.phone || "").toLowerCase();
    const name = String(o.customerName || o.name || "").toLowerCase();
    const email = String(o.customerEmail || o.email || "").toLowerCase();
    const orderNo = String(o.orderNumber || o._id || "").toLowerCase();
    return phone.includes(q) || name.includes(q) || email.includes(q) || orderNo.includes(q);
  });

  const tabCounts = {
    all: phoneFiltered.length,
    approved: phoneFiltered.filter((o) => o.approved).length,
    packing: phoneFiltered.filter((o) => o.packingStatus === 'packed').length,
  };

  const filteredOrders = phoneFiltered
    .filter((o) => {
      if (statusFilter === 'approved') return o.approved;
      if (statusFilter === 'packing') return o.packingStatus === 'packed';
      return true;
    })
    .sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const paginatedData = filteredOrders.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <>
      <AdminNavbar />
      <div className="flex min-h-screen">
        <AdminSidebar />
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="font-display text-2xl font-bold">Orders</h1>
            <Link to="/" className="text-sm text-primary hover:underline lg:hidden">← Store</Link>
          </div>

          {/* Filter tabs */}
          <div className="mb-4 flex flex-wrap gap-2">
            {([
              { key: 'all',      label: 'All Orders',  icon: '📋', activeClass: 'bg-primary text-primary-foreground border-primary' },
              { key: 'approved', label: 'Approved',     icon: '✅', activeClass: 'bg-green-600 text-white border-green-600' },
              { key: 'packing',  label: 'Shipped',      icon: '🚚', activeClass: 'bg-red-600 text-white border-red-600' },
            ] as { key: StatusFilter; label: string; icon: string; activeClass: string }[]).map(({ key, label, icon, activeClass }) => (
              <button
                key={key}
                onClick={() => { setStatusFilter(key); setCurrentPage(1); }}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                  statusFilter === key
                    ? activeClass
                    : 'border-border bg-card text-muted-foreground hover:text-foreground hover:border-foreground/40'
                }`}
              >
                <span>{icon}</span>
                <span>{label}</span>
                <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-xs font-bold ${
                  statusFilter === key ? 'bg-white/20' : 'bg-secondary'
                }`}>
                  {tabCounts[key]}
                </span>
              </button>
            ))}
          </div>

          {/* Search + count */}
          <div className="mb-6 flex gap-3 flex-wrap items-center">
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
            <span className="px-3 py-2 text-sm text-muted-foreground">Showing {filteredOrders.length} orders</span>
          </div>

          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50">
                  <tr className="border-b border-gray-200">
                    <th className="font-extrabold text-xs text-gray-700 uppercase p-4">Order ID</th>
                    <th className="font-extrabold text-xs text-gray-700 uppercase p-4">Customer</th>
                    <th className="font-extrabold text-xs text-gray-700 uppercase p-4">Phone</th>
                    <th className="font-extrabold text-xs text-gray-700 uppercase p-4 hidden sm:table-cell">Items</th>
                    <th className="font-extrabold text-xs text-gray-700 uppercase p-4 text-right">Total</th>
                    <th className="font-extrabold text-xs text-gray-700 uppercase p-4 text-center">Shipping</th>
                    <th className="font-extrabold text-xs text-gray-700 uppercase p-4 text-center">Approved</th>
                    <th className="font-extrabold text-xs text-gray-700 uppercase p-4 text-right hidden md:table-cell">Date</th>
                    <th className="font-extrabold text-xs text-gray-700 uppercase p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedData.map((o) => (
                    <tr
                      key={o._id}
                      className="hover:bg-red-50/40 transition-colors"
                    >
                      <td className="p-4 font-semibold text-gray-900">{o.orderNumber || o._id?.slice(-8)}</td>
                      <td className="p-4">
                        <p className="font-bold text-gray-900">{o.customerName}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{o.customerEmail}</p>
                      </td>
                      <td className="p-4 text-sm text-gray-700">{o.customerPhone}</td>
                      <td className="p-4 hidden sm:table-cell">
                        <Badge variant="secondary" className="font-bold whitespace-nowrap">
                          {o.items?.length || 0} Items
                        </Badge>
                      </td>
                      <td className="p-4 text-right font-bold text-primary">₹{Math.round(Number(o.subtotal) + (Number(o.packingCharge) || 0))}</td>
                      <td className="p-4 text-center">
                        <Badge variant={o.packingStatus === 'packed' ? 'default' : 'secondary'} className={o.packingStatus === 'packed' ? 'bg-red-600' : ''}>
                          {o.packingStatus ? (o.packingStatus === 'packed' ? '🚚 Shipped' : '🔹 Unshipped') : 'N/A'}
                        </Badge>
                      </td>
                      <td className="p-4 text-center">
                        {o.approved ? (
                          <Badge variant="default" className="bg-green-600">✓ Approved</Badge>
                        ) : (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                      </td>
                      <td className="p-4 text-right text-gray-500 hidden md:table-cell text-xs">
                        {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "N/A"}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedOrder(o)}
                            className="text-xs px-2.5 h-8"
                          >
                            View Details
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteOrder(o._id)}
                            className="text-xs px-2.5 h-8 bg-red-600 hover:bg-red-700 text-white flex items-center gap-1"
                            title="Delete Order"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Delete</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 bg-card border-t border-border mt-4 rounded-b-lg">
                <div className="text-sm text-muted-foreground">
                  Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredOrders.length)} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredOrders.length)} of {filteredOrders.length} entries
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</Button>
                  <div className="text-sm font-medium">Page {currentPage} of {Math.max(1, totalPages)}</div>
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0}>Next</Button>
                </div>
              </div>
            )}
          </div>

          {/* Order Details Dialog */}
          <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
            <DialogContent className="max-w-2xl max-h-96 overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Order Details</DialogTitle>
                <DialogDescription>Order ID: {selectedOrder?.orderNumber || selectedOrder?._id?.slice(-8)}</DialogDescription>
              </DialogHeader>

              {selectedOrder && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold text-sm mb-2">Customer Information</h3>
                      <div className="space-y-1 text-sm">
                        <p><strong>Name:</strong> {selectedOrder.customerName}</p>
                        <p><strong>Email:</strong> {selectedOrder.customerEmail}</p>
                        <p><strong>Phone:</strong> {selectedOrder.customerPhone}</p>
                        {selectedOrder.alternatePhoneNumber && (
                          <p><strong>Alternate Phone:</strong> {selectedOrder.alternatePhoneNumber}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-sm mb-2">Order Summary</h3>
                      <div className="space-y-1 text-sm">
                        <p><strong>Subtotal:</strong> ₹{selectedOrder.subtotal}</p>
                        <p><strong>Packing Charges:</strong> ₹{selectedOrder.packingCharge || (Number(selectedOrder.subtotal) <= 3999 ? 120 : Math.round(Number(selectedOrder.subtotal) * 0.03))}</p>
                        <p className="text-green-600 text-xs italic"><strong>Delivery Charges:</strong> Excluded</p>
                        <p className="font-bold"><strong>Total:</strong> ₹{Math.round(Number(selectedOrder.subtotal) + (Number(selectedOrder.packingCharge) || (Number(selectedOrder.subtotal) <= 3999 ? 120 : Math.round(Number(selectedOrder.subtotal) * 0.03))))}</p>
                        <p><strong>Status:</strong> {selectedOrder.status}</p>
                        <p><strong>Shipping Status:</strong> {selectedOrder.packingStatus ? (selectedOrder.packingStatus === 'packed' ? '🚚 Shipped' : '🔹 Unshipped') : 'Not set'}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-sm mb-2">Delivery Address</h3>
                    <p className="text-sm text-white bg-secondary p-2 rounded">
                      {selectedOrder.deliveryAddress?.fullAddress || selectedOrder.shippingAddress?.fullAddress || "No address provided"}
                      {selectedOrder.deliveryAddress?.district && <span className="block mt-1"><strong>District:</strong> {selectedOrder.deliveryAddress.district}</span>}
                      {selectedOrder.deliveryAddress?.state && <span className="block mt-1"><strong>State:</strong> {selectedOrder.deliveryAddress.state}</span>}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-sm mb-2">Items</h3>
                    <ul className="text-sm text-white space-y-1 bg-secondary p-2 rounded">
                      {selectedOrder.items?.map((item: any, idx: number) => (
                        <li key={idx}>
                          {item.product?.name || item.productName || 'Product'} - Qty: {item.quantity} × ₹{item.price}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedOrder(null)}
                      className="flex-1"
                    >
                      Close
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => handleDownloadPDF(selectedOrder)}
                      className="flex-1"
                    >
                      Download PDF
                    </Button>
                    {!selectedOrder.approved && (
                      <Button
                        onClick={handleApproveOrder}
                        disabled={isApproving}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      >
                        {isApproving ? "Approving..." : "Approve & Update Customer"}
                      </Button>
                    )}
                    {selectedOrder.approved && (
                      <Button variant="default" disabled className="flex-1">
                        ✓ Already Approved
                      </Button>
                    )}
                    {selectedOrder.approved && (
                      <Button
                        onClick={handleTogglePackingStatus}
                        disabled={isUpdatingPacking}
                        className={`flex-1 ${selectedOrder.packingStatus === 'packed' ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-600 hover:bg-orange-700'} text-white`}
                      >
                        {isUpdatingPacking ? "Updating..." : selectedOrder.packingStatus === 'packed' ? '🚚 Mark Unshipped' : '🚚 Mark Shipped'}
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      onClick={() => handleDeleteOrder(selectedOrder._id)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-1"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Delete</span>
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </>
  );
};

export default AdminOrders;