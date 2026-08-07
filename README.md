# Sai Yogi Crackers

Sai Yogi Crackers is a comprehensive e-commerce platform built for the online sale of firecrackers. The project is split into a robust Node.js/Express backend powered by Firebase and a modern, responsive React frontend.

## 🌟 Key Features

### Frontend (Client Application)
- **Modern UI:** Built with React 18, Tailwind CSS, and shadcn-ui for a premium, responsive design.
- **Product Catalog:** Browse products by categories, complete with dynamic image sliders and detailed views.
- **Shopping Cart:** Context-based cart state management for a seamless checkout experience.
- **Dynamic Content:** Real-time news marquees, promotional offers, and floating discount badges.
- **State Management:** Utilizes React Query for efficient server-state management and data fetching.

### Backend (Server API)
- **Authentication:** Secure user and admin login using JWT and Firebase Admin.
- **Product & Inventory Management:** Full CRUD capabilities for products, categories, and real-time stock tracking.
- **Order Processing:** Manage orders, track statuses, and compute totals including GST and delivery charges.
- **Media Storage:** Integrated with Cloudinary for handling product and category image uploads.
- **Secure:** Features CORS configurations, error handling middlewares, and route-based access control.

## 🛠 Technology Stack

**Frontend:**
- [React](https://react.dev/) (v18.3)
- [Vite](https://vitejs.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn-ui](https://ui.shadcn.com/) (Radix UI)
- [React Query](https://tanstack.com/query/latest)
- [React Router DOM](https://reactrouter.com/)

**Backend:**
- [Node.js](https://nodejs.org/) & [Express.js](https://expressjs.com/)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup) (Firestore)
- [Cloudinary](https://cloudinary.com/)
- [JSON Web Tokens (JWT)](https://jwt.io/)
- [Bcryptjs](https://www.npmjs.com/package/bcryptjs)

## 📁 Project Structure

```text
narandiraa/
├── server/                 # Backend Node.js/Express application
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Custom Express middlewares (auth, error handling)
│   ├── routes/             # API route definitions
│   ├── server.js           # Main application entry point
│   ├── package.json        # Backend dependencies
│   └── README.md           # Backend-specific documentation
├── src/                    # Frontend React application
│   ├── components/         # Reusable React components (UI, Layout)
│   ├── context/            # React Context providers (Auth, Cart, Settings)
│   ├── lib/                # API clients and utility functions
│   ├── pages/              # Application pages (Index, Catalog, Admin, etc.)
│   ├── App.tsx             # Main routing component
│   └── main.tsx            # React application entry point
├── package.json            # Frontend dependencies
├── tailwind.config.ts      # Tailwind CSS configuration
└── vite.config.ts          # Vite configuration
```

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/en/download/) (v16 or higher recommended)
- A Firebase project with Firestore enabled and a service account key
- A Cloudinary account for image hosting

### 1. Backend Setup

Navigate to the `server` directory and install the dependencies:

```bash
cd server
npm install
```

Create a `.env` file in the `server` directory using the provided `.env.example`:

```bash
cp .env.example .env
```

Ensure you configure the required environment variables in `.env`:
- `PORT` (e.g., 5000)
- `CLIENT_URL` (e.g., `http://localhost:5173`)
- `FIREBASE_SERVICE_ACCOUNT_PATH` (Path to your Firebase service account JSON)
- `JWT_SECRET`
- Cloudinary credentials (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`)

Run the development server:
```bash
npm run dev
```
*The backend server will start on `http://localhost:5000`.*

### 2. Frontend Setup

Open a new terminal and navigate to the root directory of the project:

```bash
# From the project root
npm install
```

Start the Vite development server:

```bash
npm run dev
```
*The frontend application will start on `http://localhost:5173`.*

## 📄 License & Legal Notice

**Legal Disclaimer:** As per the 2018 Supreme Court order, online sale of firecrackers is subject to strict regulations. This platform acts as an inquiry and catalog portal. Customers are requested to submit their requirements, and orders are confirmed via WhatsApp/Phone call in compliance with all legal and statutory regulations.

---
*For detailed backend API documentation, refer to [`server/README.md`](./server/README.md).*
