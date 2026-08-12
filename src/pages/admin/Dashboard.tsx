import { ShoppingBag, DollarSign, Package, AlertTriangle, TrendingUp, Users } from "lucide-react";
import AdminSidebar from "@/components/layout/AdminSidebar";
import AdminNavbar from "@/components/layout/AdminNavbar";
import { useEffect, useState } from "react";
import { getProducts, getOrders } from "@/lib/api";
import { Product } from "@/data/products";
import { Link } from "react-router-dom";

// Stats will be computed from live data

const Dashboard = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    getProducts()
      .then((data) => {
        console.log('Products loaded (Dashboard):', data, Array.isArray(data));
        setProducts(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error('Failed to fetch products (Dashboard):', err);
        setProducts([]);
      });

    getOrders()
      .then((data) => {
        console.log('Orders loaded (Dashboard):', data, Array.isArray(data));
        setOrders(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error('Failed to fetch orders (Dashboard):', err);
        setOrders([]);
      });
  }, []);

  const lowStock = products.filter((p) => (p.storeStockPieces || 0) < (p.minimumStock || 10));
  // Sort orders by date descending
  const sortedOrders = [...orders].sort((a, b) => {
    const da = new Date(a.createdAt || 0).getTime();
    const db = new Date(b.createdAt || 0).getTime();
    return db - da;
  });

  const totalOrders = sortedOrders.length;
  const today = new Date();
  const todaysOrders = sortedOrders.filter((o) => {
    try {
      const d = new Date(o.createdAt);
      return d.getFullYear() === today.getFullYear() &&
             d.getMonth() === today.getMonth() &&
             d.getDate() === today.getDate();
    } catch {
      return false;
    }
  }).length;
  const totalRevenue = sortedOrders.reduce((s, o) => s + (Number(o.subtotal) + (Number(o.packingCharge) || 0)), 0);

  // Calculate actual top selling products from orders
  const productSalesMap = new Map<string, number>();
  orders.forEach(order => {
    order.items?.forEach((item: any) => {
      const id = item.product?._id ? String(item.product._id) : String(item.product);
      if (id && id !== 'undefined' && id !== 'null') {
        productSalesMap.set(id, (productSalesMap.get(id) || 0) + (item.quantity || 0));
      }
    });
  });

  const topSelling = [...products]
    .map(p => ({
      ...p,
      soldCount: productSalesMap.get(String(p._id || p.id || "")) || 0
    }))
    .sort((a, b) => b.soldCount - a.soldCount)
    .slice(0, 5);

  const fmt = (v: number) => new Intl.NumberFormat('en-IN').format(Math.round(v));

  return (
    <>
      <AdminNavbar />
      <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 p-6 lg:p-8 overflow-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-2xl font-bold">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Welcome back, Admin 🎆</p>
          </div>
          <Link to="/" className="text-sm text-primary hover:underline lg:hidden">← Store</Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-card border border-border rounded-lg p-4 glow-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Total Orders</span>
              <ShoppingBag className="h-5 w-5 text-primary" />
            </div>
            <p className="text-2xl font-bold">{fmt(totalOrders)}</p>
            <span className="text-xs text-green-500">{todaysOrders} today</span>
          </div>

          <div className="bg-card border border-border rounded-lg p-4 glow-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Today's Orders</span>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold">{fmt(todaysOrders)}</p>
            <span className="text-xs text-muted-foreground">Orders placed today</span>
          </div>

          <div className="bg-card border border-border rounded-lg p-4 glow-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Total Revenue</span>
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <p className="text-2xl font-bold">₹{fmt(totalRevenue)}</p>
            <span className="text-xs text-green-500">Calculated from orders</span>
          </div>

          <div className="bg-card border border-border rounded-lg p-4 glow-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Low Stock Alerts</span>
              <AlertTriangle className="h-5 w-5 text-accent" />
            </div>
            <p className="text-2xl font-bold">{fmt(lowStock.length)}</p>
            <span className="text-xs text-muted-foreground">Products low on stock</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="font-display text-lg font-bold mb-4">Recent Orders</h2>
            <div className="space-y-3">
              {sortedOrders.slice(0, 5).map((order, idx) => (
                <div key={order._id || order.id || idx} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="font-semibold text-sm">{order.orderNumber || (order._id ? order._id.slice(-8) : 'Unknown')}</p>
                    <p className="text-xs text-muted-foreground">{order.customerName}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">₹{Math.round(Number(order.subtotal) + (Number(order.packingCharge) || 0))}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      order.status === "delivered" ? "bg-green-500/20 text-green-500" :
                      order.status === "shipped" ? "bg-red-500/20 text-red-500" :
                      order.status === "processing" ? "bg-primary/20 text-primary" :
                      order.status === "cancelled" ? "bg-destructive/20 text-destructive" :
                      "bg-muted text-muted-foreground"
                    }`}>{order.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Selling */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="font-display text-lg font-bold mb-4">Top Selling Products</h2>
            <div className="space-y-3">
              {topSelling.map((p, i) => (
                <div key={p._id || p.id || i} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                  <span className="text-lg font-bold text-muted-foreground w-6">{i + 1}</span>
                  <img src={p.image} alt={p.name} className="w-10 h-10 rounded object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.soldCount} sold</p>
                  </div>
                  <span className="font-bold text-primary text-sm">₹{p.price}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="bg-card border border-border rounded-lg p-6 lg:col-span-2">
            <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-accent" /> Low Stock Alerts
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {lowStock.map((p, i) => (
                <div key={p._id || p.id || i} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border">
                  <img src={p.image} alt={p.name} className="w-10 h-10 rounded object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{p.name}</p>
                    <p className="text-xs text-accent font-bold">{p.storeStockPieces || 0} left in stock</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
    </>
  );
};

export default Dashboard;
