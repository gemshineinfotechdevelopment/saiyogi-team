# API Testing Guide

This document provides examples for testing all API endpoints using curl or Postman.

## Base URL
```
http://localhost:5000/api
```

## Authentication

First, register or login to get a JWT token:

### Register
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

Response:
```json
{
  "message": "Login successful",
  "token": "eyJhbGc...",
  "user": {
    "id": "...",
    "name": "John Doe",
    "email": "user@example.com",
    "role": "user"
  }
}
```

Use the token in subsequent requests with header:
```
Authorization: Bearer <token>
```

## Products

### Get All Products
```bash
curl -X GET "http://localhost:5000/api/products?page=1&limit=12" \
  -H "Content-Type: application/json"
```

### Get Product by ID
```bash
curl -X GET http://localhost:5000/api/products/[productId] \
  -H "Content-Type: application/json"
```

### Get Products by Category
```bash
curl -X GET http://localhost:5000/api/products/category/sparklers \
  -H "Content-Type: application/json"
```

### Create Product (Admin Only)
```bash
curl -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [token]" \
  -d '{
    "name": "Red Sparklers",
    "category": "[categoryId]",
    "price": 199,
    "stock": 100,
    "brand": "BrandName",
    "image": "https://...",
    "description": "Beautiful red sparklers",
    "quantity": "Pack of 10"
  }'
```

### Update Product (Admin Only)
```bash
curl -X PUT http://localhost:5000/api/products/[productId] \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [token]" \
  -d '{
    "name": "Updated name",
    "price": 249,
    "stock": 150
  }'
```

### Delete Product (Admin Only)
```bash
curl -X DELETE http://localhost:5000/api/products/[productId] \
  -H "Authorization: Bearer [token]"
```

## Categories

### Get All Categories
```bash
curl -X GET http://localhost:5000/api/categories \
  -H "Content-Type: application/json"
```

### Get Category by ID
```bash
curl -X GET http://localhost:5000/api/categories/[categoryId] \
  -H "Content-Type: application/json"
```

### Create Category (Admin Only)
```bash
curl -X POST http://localhost:5000/api/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [token]" \
  -d '{
    "name": "New Category",
    "icon": "🎆",
    "image": "https://..."
  }'
```

## Orders

### Create Order
```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "product": "[productId]",
        "quantity": 2
      }
    ],
    "customerName": "John Doe",
    "customerEmail": "john@example.com",
    "customerPhone": "9876543210",
    "shippingAddress": {
      "street": "123 Main St",
      "city": "Delhi",
      "state": "Delhi",
      "pincode": "110001",
      "country": "India"
    },
    "paymentMethod": "cod"
  }'
```

### Get All Orders (Admin Only)
```bash
curl -X GET "http://localhost:5000/api/orders?page=1&limit=10" \
  -H "Authorization: Bearer [adminToken]"
```

### Get Order by ID (Admin Only)
```bash
curl -X GET http://localhost:5000/api/orders/[orderId] \
  -H "Authorization: Bearer [adminToken]"
```

### Update Order Status (Admin Only)
```bash
curl -X PUT http://localhost:5000/api/orders/[orderId]/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [adminToken]" \
  -d '{
    "status": "shipped",
    "trackingNumber": "TRK123456"
  }'
```

### Get My Orders (User)
```bash
curl -X GET http://localhost:5000/api/orders/user/my-orders \
  -H "Authorization: Bearer [token]"
```

## Cart

### Get Cart (Authenticated)
```bash
curl -X GET http://localhost:5000/api/cart \
  -H "Authorization: Bearer [token]"
```

### Add to Cart
```bash
curl -X POST http://localhost:5000/api/cart/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [token]" \
  -d '{
    "productId": "[productId]",
    "quantity": 2
  }'
```

### Update Cart Item
```bash
curl -X PUT http://localhost:5000/api/cart/update \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [token]" \
  -d '{
    "productId": "[productId]",
    "quantity": 3
  }'
```

### Remove from Cart
```bash
curl -X DELETE http://localhost:5000/api/cart/[productId] \
  -H "Authorization: Bearer [token]"
```

### Clear Cart
```bash
curl -X DELETE http://localhost:5000/api/cart \
  -H "Authorization: Bearer [token]"
```

## Customers (Admin Only)

### Get All Customers
```bash
curl -X GET "http://localhost:5000/api/customers?page=1&limit=10" \
  -H "Authorization: Bearer [adminToken]"
```

### Get Customer by ID
```bash
curl -X GET http://localhost:5000/api/customers/[customerId] \
  -H "Authorization: Bearer [adminToken]"
```

### Get Customer Orders
```bash
curl -X GET http://localhost:5000/api/customers/[customerId]/orders \
  -H "Authorization: Bearer [adminToken]"
```

### Update Customer
```bash
curl -X PUT http://localhost:5000/api/customers/[customerId] \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [adminToken]" \
  -d '{
    "name": "Updated Name",
    "phone": "9876543210"
  }'
```

## Inventory (Admin Only)

### Get Inventory
```bash
curl -X GET "http://localhost:5000/api/inventory?page=1&limit=10" \
  -H "Authorization: Bearer [adminToken]"
```

### Get Low Stock Products
```bash
curl -X GET http://localhost:5000/api/inventory/low-stock \
  -H "Authorization: Bearer [adminToken]"
```

### Add Stock
```bash
curl -X POST http://localhost:5000/api/inventory/add-stock \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [adminToken]" \
  -d '{
    "productId": "[productId]",
    "quantity": 50,
    "reason": "Monthly replenishment",
    "warehouse": "Main Warehouse"
  }'
```

### Adjust Stock
```bash
curl -X POST http://localhost:5000/api/inventory/adjust-stock \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [adminToken]" \
  -d '{
    "productId": "[productId]",
    "quantity": -10,
    "reason": "Damage adjustment"
  }'
```

## Settings

### Get Settings (Admin Only)
```bash
curl -X GET http://localhost:5000/api/settings \
  -H "Authorization: Bearer [adminToken]"
```

### Get Public Site Info
```bash
curl -X GET http://localhost:5000/api/settings/public/info
```

### Update Settings (Admin Only)
```bash
curl -X PUT http://localhost:5000/api/settings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [adminToken]" \
  -d '{
    "discountPercent": 10,
    "gstPercent": 18,
    "deliveryCharge": 99,
    "freeDeliveryThreshold": 999
  }'
```

## Health Check

```bash
curl -X GET http://localhost:5000/api/health
```

Response:
```json
{
  "status": "ok",
  "message": "Server is running"
}
```

## Postman Setup

1. Import collection from JSON
2. Set variables:
   - `baseUrl`: http://localhost:5000/api
   - `token`: (obtained from login)
   - `productId`: (get from product list)
   - `categoryId`: (get from categories list)

3. Use environment to store credentials

## Testing Workflow

1. Start server: `npm run dev`
2. Seed database: `npm run seed` (runs automatically)
3. Login with admin credentials
4. Copy token from response
5. Test endpoints using provided curl commands or Postman
6. Check responses and verify data in MongoDB

## Error Responses

All errors follow this format:
```json
{
  "error": {
    "status": 400,
    "message": "Error description"
  }
}
```

Common status codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Server Error
