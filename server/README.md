# Cracker Hub - Backend Server

A comprehensive Node.js/Express backend for the Cracker Hub e-commerce platform. This server handles all business logic, database operations, user authentication, and order management.

## Features

### 🔐 Authentication & Authorization
- User registration and login
- JWT-based authentication
- Role-based access control (Admin/User)
- Password hashing with bcryptjs
- Profile management

### 📦 Product Management
- Complete CRUD operations for products
- Category management with nested hierarchies
- Product filtering, sorting, and pagination
- Stock management and inventory tracking
- Discount and pricing controls

### 🛒 Shopping Cart
- Add/remove items from cart
- Update quantities
- Cart persistence per user
- Real-time total calculation

### 📋 Order Management
- Order creation and processing
- Order status tracking (pending, processing, shipped, delivered, cancelled)
- Automatic order number generation
- Payment method support (COD, Card, UPI, NetBanking)
- Shipping address management

### 👥 Customer Management
- Customer profiles and information
- Order history per customer
- Spending analytics
- Customer activity tracking

### 📊 Inventory Management
- Real-time stock tracking
- Low stock alerts
- Inventory movements history
- Stock adjustments and replenishment
- Warehouse management

### ⚙️ Settings Management
- Site configuration
- Pricing settings (GST, delivery charges)
- Discount management
- Maintenance mode
- Social links and contact information

## Installation

### Prerequisites
- Node.js (v16+)
- Firebase project with a service account (or MongoDB if you still prefer)

### Setup Steps

1. **Clone and navigate to server directory**
```bash
cd server
```

2. **Install dependencies**
```bash
npm install
```

3. **Create .env file**
```bash
cp .env.example .env
```

4. **Configure environment variables**
Edit `.env` and set (if using Firebase):
```
PORT=5000
CLIENT_URL=http://localhost:5173
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
# Or set FIREBASE_SERVICE_ACCOUNT_JSON with base64 or raw JSON
FIREBASE_DATABASE_URL=
FIREBASE_PROJECT_ID=
JWT_SECRET=your_secret_key_here
ADMIN_EMAIL=admin@crackerhub.com
ADMIN_PASSWORD=admin123
```

5. **Seed database (optional)**
```bash
npm run seed
```

6. **Start server**
```bash
npm run dev    # Development mode with auto-reload
npm start      # Production mode
```

Server will be running at `http://localhost:5000`

## API Endpoints

### Authentication (`/api/auth`)
- `POST /signup` - Register new user
- `POST /login` - Login user
- `GET /profile` - Get user profile (protected)
- `PUT /profile` - Update user profile (protected)

### Products (`/api/products`)
- `GET /` - Get all products with pagination
- `GET /category/:category` - Get products by category
- `GET /:id` - Get product details
- `POST /` - Create product (admin only)
- `PUT /:id` - Update product (admin only)
- `DELETE /:id` - Delete product (admin only)

### Categories (`/api/categories`)
- `GET /` - Get all categories
- `GET /:id` - Get category details
- `POST /` - Create category (admin only)
- `PUT /:id` - Update category (admin only)
- `DELETE /:id` - Delete category (admin only)

### Orders (`/api/orders`)
- `GET /` - Get all orders (admin only)
- `GET /:id` - Get order details (admin only)
- `POST /` - Create new order
- `PUT /:id/status` - Update order status (admin only)
- `PUT /:id/cancel` - Cancel order (admin only)
- `GET /user/my-orders` - Get user's orders (protected)

### Cart (`/api/cart`)
- `GET /` - Get cart (protected)
- `POST /add` - Add item to cart (protected)
- `PUT /update` - Update cart item (protected)
- `DELETE /:productId` - Remove item from cart (protected)
- `DELETE /` - Clear cart (protected)

### Customers (`/api/customers`)
- `GET /` - Get all customers (admin only)
- `GET /:id` - Get customer details (admin only)
- `GET /:id/orders` - Get customer's orders (admin only)
- `PUT /:id` - Update customer (admin only)
- `DELETE /:id` - Delete customer (admin only)

### Inventory (`/api/inventory`)
- `GET /` - Get inventory (admin only)
- `GET /low-stock` - Get low stock products (admin only)
- `GET /product/:productId` - Get product inventory (admin only)
- `GET /:productId/movements` - Get inventory movements (admin only)
- `POST /add-stock` - Add stock (admin only)
- `POST /adjust-stock` - Adjust stock (admin only)

### Settings (`/api/settings`)
- `GET /public/info` - Get site info (public)
- `GET /public/pricing` - Get pricing info (public)
- `GET /` - Get all settings (admin only)
- `PUT /` - Update settings (admin only)

## Database Models

### User
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  phone: String,
  address: Object,
  role: String (admin/user),
  isActive: Boolean,
  orders: [ObjectId],
  createdAt: Date,
  updatedAt: Date
}
```

### Product
```javascript
{
  name: String,
  category: ObjectId,
  price: Number,
  hasDiscount: Boolean,
  discountPercent: Number,
  image: String,
  brand: String,
  stock: Number,
  rating: Number,
  reviews: Number,
  description: String,
  quantity: String,
  sku: String (unique),
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Category
```javascript
{
  name: String (unique),
  slug: String (unique),
  icon: String,
  image: String,
  description: String,
  productCount: Number,
  displayOrder: Number,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Order
```javascript
{
  orderNumber: String (unique),
  customer: ObjectId,
  customerName: String,
  customerEmail: String,
  customerPhone: String,
  items: [{
    product: ObjectId,
    quantity: Number,
    price: Number
  }],
  subtotal: Number,
  gst: Number,
  delivery: Number,
  total: Number,
  status: String (pending/processing/shipped/delivered/cancelled),
  shippingAddress: Object,
  paymentMethod: String (cod/card/upi/netbanking),
  paymentStatus: String (pending/completed/failed),
  trackingNumber: String,
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Cart
```javascript
{
  user: ObjectId,
  items: [{
    product: ObjectId,
    quantity: Number
  }],
  totalItems: Number,
  totalPrice: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### Inventory
```javascript
{
  product: ObjectId,
  stock: Number,
  reserved: Number,
  available: Number,
  reorderLevel: Number,
  warehouse: String,
  movements: [{
    type: String,
    quantity: Number,
    reason: String,
    createdAt: Date
  }],
  lastRestocked: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Settings
```javascript
{
  siteName: String,
  siteDescription: String,
  logo: String,
  favicon: String,
  discountPercent: Number,
  gstPercent: Number,
  freeDeliveryThreshold: Number,
  deliveryCharge: Number,
  currency: String,
  maintenanceMode: Boolean,
  maintenanceMessage: String,
  contact: Object,
  socialLinks: Object,
  features: Object,
  createdAt: Date,
  updatedAt: Date
}
```

## Middleware

### Authentication Middleware
- `auth` - Requires valid JWT token
- `adminOnly` - Requires admin role
- `optionalAuth` - Optional authentication (doesn't fail if no token)

### Validation Middleware
- `validate` - Validates request body against rules
- `validateProduct` - Product creation/update validation
- `validateOrder` - Order creation validation
- `validateCategory` - Category creation validation
- `validateSignUp` - User registration validation
- `validateLogin` - User login validation

### Error Handler
- Centralized error handling with proper HTTP status codes
- Environment-aware error responses

## Seeding Database

Run the seed script to populate initial data:

```bash
npm run seed
```

This will create:
- 7 product categories (Sparklers, Rockets, etc.)
- 7 sample products with various specifications
- Admin user account
- Sample regular user account
- Default site settings

## Error Handling

All endpoints return consistent error responses:

```javascript
{
  error: {
    status: 400,
    message: "Error description",
    stack: "..." // Only in development
  }
}
```

## Deployment

### Using MongoDB Atlas

1. Create a MongoDB Atlas account and cluster
2. Get connection string
3. Update `.env`:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/cracker-hub
```

### Using Environment Variables

Always use `.env` files for sensitive data. Never commit `.env` to version control.

### Production Checklist

- [ ] Set strong JWT_SECRET
- [ ] Enable CORS restrictions
- [ ] Use HTTPS in production
- [ ] Set NODE_ENV=production
- [ ] Configure MongoDB backups
- [ ] Enable request rate limiting
- [ ] Set up monitoring and logging
- [ ] Configure SMTP for emails (future)

## Development Tools

### Available Scripts
```bash
npm run dev        # Start with auto-reload
npm start         # Start production server
npm run seed      # Seed database
npm test          # Run tests
```

### Debugging
Enable debug logs with:
```bash
DEBUG=cracker-hub:* npm run dev
```

## Performance Optimization

- Database indexing on frequently queried fields
- Pagination for list endpoints (default 10-12 items)
- Proper error handling to prevent crashes
- Connection pooling with MongoDB

## Security Features

- Password hashing with bcryptjs (salt rounds: 10)
- JWT token authentication
- Role-based access control
- Input validation with express-validator
- CORS configuration
- HTTP parameter pollution protection

## Future Enhancements

- [ ] Email notifications for orders
- [ ] SMS notifications
- [ ] Payment gateway integration (Razorpay, Stripe)
- [ ] Coupon and promo code system
- [ ] Product reviews and ratings
- [ ] Wishlist feature
- [ ] Advanced search with filters
- [ ] Analytics dashboard
- [ ] Bulk operations for admin
- [ ] API rate limiting
- [ ] Redis caching
- [ ] File upload service
- [ ] Admin audit logs

## Support

For issues or questions, please contact support@crackerhub.com

## License

This project is proprietary and confidential.
