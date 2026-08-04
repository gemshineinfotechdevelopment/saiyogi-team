# Development Notes

## Project Structure

```
server/
├── server.js                 # Main application entry point
├── package.json              # Project dependencies
├── .env.example              # Environment variables template
├── README.md                 # Documentation
│
├── middleware/               # Express middleware
│   ├── auth.js              # Authentication & authorization
│   ├── errorHandler.js      # Global error handler
│   └── validation.js        # Request validation rules
│
├── models/                   # MongoDB schemas
│   ├── User.js              # User schema
│   ├── Product.js           # Product schema
│   ├── Category.js          # Category schema
│   ├── Order.js             # Order schema
│   ├── Cart.js              # Shopping cart schema
│   ├── Inventory.js         # Inventory tracking schema
│   └── Settings.js          # Site settings schema
│
├── controllers/              # Business logic
│   ├── authController.js    # Auth operations
│   ├── productController.js # Product operations
│   ├── categoryController.js # Category operations
│   ├── orderController.js   # Order operations
│   ├── cartController.js    # Cart operations
│   ├── customerController.js # Customer operations
│   ├── inventoryController.js # Inventory operations
│   └── settingsController.js # Settings operations
│
├── routes/                   # API routes
│   ├── auth.js              # Auth endpoints
│   ├── products.js          # Product endpoints
│   ├── categories.js        # Category endpoints
│   ├── orders.js            # Order endpoints
│   ├── cart.js              # Cart endpoints
│   ├── customers.js         # Customer endpoints
│   ├── inventory.js         # Inventory endpoints
│   └── settings.js          # Settings endpoints
│
├── utils/                    # Utility functions
│   └── helpers.js           # Helper functions
│
└── seed.js                   # Database seeding script
```

## Key Technologies

- **Express.js** - Web framework
- **MongoDB + Mongoose** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **express-validator** - Input validation
- **CORS** - Cross-origin requests
- **dotenv** - Environment management

## Common Tasks

### Adding a New Feature

1. Create model in `models/`
2. Create controller in `controllers/`
3. Create routes in `routes/`
4. Add validation middleware if needed
5. Test with Postman or similar tool

### Database Queries

Examples:
```javascript
// Find all
await Product.find({ isActive: true });

// Find with population
await Order.find().populate('items.product');

// Pagination
await Product.find()
  .skip((page - 1) * limit)
  .limit(limit);

// Filter and sort
await Product.find({ category: catId })
  .sort({ price: 1 })
  .select('name price stock');
```

## API Response Format

### Success
```javascript
{
  message: "Operation successful",
  data: { ... }
}
```

### Error
```javascript
{
  error: {
    status: 400,
    message: "Error description"
  }
}
```

## Testing Workflow

1. Start server: `npm run dev`
2. Use Postman to test endpoints
3. Check responses and error handling
4. Test with different roles (user/admin)

## Common Issues & Solutions

**MongoDB Connection Error**
- Ensure MongoDB is running
- Check MONGODB_URI in .env
- Verify network access if using Atlas

**JWT Token Expired**
- Re-login to get new token
- Adjust JWT_EXPIRE in .env if needed

**Products Not Showing**
- Check if `isActive: true` in database
- Verify category exists
- Check pagination parameters

**Admin Functions Not Working**
- Verify user role is 'admin'
- Check bearer token in headers
- Ensure valid JWT token

## Performance Tips

- Use database indexing for frequently queried fields
- Implement pagination for large datasets
- Cache frequently accessed data
- Use select() to limit returned fields
- Implement request rate limiting in production

## Security Reminders

- Never hardcode secrets
- Always validate user input
- Use strong JWT secrets
- Hash passwords before storing
- Implement HTTPS in production
- Set secure CORS policies
- Keep dependencies updated
