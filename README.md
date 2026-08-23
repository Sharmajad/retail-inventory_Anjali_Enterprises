# Retail Inventory

A simple, fast, mobile-friendly Inventory & Sales Management application built for a small local retail shop (cosmetics, ladies' items, and general store products) operating across **two physical outlets**.

Built on the MERN stack with JWT authentication and role-based access control.

**Status:** MVP complete, currently polishing UI/UX and closing minor spec gaps.

---

## ✨ Features

- **Dashboard** — today's sales, gross profit, items sold, transactions, low stock & out-of-stock counts, quick actions
- **Product Catalog** — categories (Cosmetics, Ladies Items, General Store), barcode/SKU support, purchase & selling price, stock levels
- **Inventory Management** — add stock, adjust stock, low-stock/out-of-stock indicators, full stock transaction history
- **Sales (POS)** — fast search/barcode scan → cart → discount → payment (Cash / UPI / Card) → complete sale, with automatic stock reduction
- **Purchases** — record purchases from suppliers, automatic stock increase, purchase history
- **Supplier Management** — supplier ledger, outstanding balances, payment history
- **Reports** — sales, profit, best-selling products, category performance, payment-method breakdown, inventory valuation
- **Two-Outlet Support** — all sales, stock, and reports are scoped per outlet (`Outlet 1` / `Outlet 2`)
- **Role-Based Access** — Owner (full access) vs Staff (sales & basic inventory only, no cost/profit visibility)
- **Asia/Kolkata timezone handling** for all "today" business calculations

> **Out of scope for this build:** Udhaar/customer credit, Returns workflow, Expenses module, Expiry tracking, Subcategories. These were deliberately excluded to keep the app simple for a single small shop with two outlets.

---

## 🛠️ Tech Stack

**Frontend**
- React + Vite
- Tailwind CSS
- React Router
- Axios
- Recharts (charts)
- Lucide React (icons)

**Backend**
- Node.js + Express.js
- MongoDB + Mongoose
- JWT authentication
- bcryptjs (password hashing)

**Database**
- MongoDB Atlas (free tier)

**Deployment**
- Frontend → Vercel
- Backend → Render
- Database → MongoDB Atlas

---

## 🏗️ Architecture

```
User
  ↓
React (PWA-ready, responsive)
  ↓
REST API
  ↓
Node.js + Express
  ↓
MongoDB Atlas
```

Frontend and backend are fully decoupled and communicate via a REST API.

---

## 📁 Project Structure

```
/client
  src/
    components/
    pages/
    layouts/
    hooks/
    services/
    context/
    utils/
    routes/

/server
  src/
    config/
    controllers/
    middleware/
    models/
    routes/
    services/
    utils/
    validators/
    index.js
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas account (or local MongoDB instance)

### Installation

```bash
# Clone the repo
git clone https://github.com/<your-username>/retail-inventory.git
cd retail-inventory

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### Environment Variables

Create a `.env` file in `/server` (see `.env.example`):

```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000
CLIENT_URL=http://localhost:5173
```

Create a `.env` file in `/client`:

```
VITE_API_URL=http://localhost:5000/api
```

### Running Locally

```bash
# Start backend
cd server
npm run dev

# Start frontend (in a new terminal)
cd client
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## 👥 Roles

| Role  | Access |
|-------|--------|
| Owner | Full access — sales, inventory, purchases, suppliers, reports, profit, user management |
| Staff | Create sales, search products, view basic inventory — no purchase prices or profit visibility |

---

## 🏪 Outlets

The application supports exactly two outlets, tracked via a fixed enum:

- `Outlet 1`
- `Outlet 2`

Products, stock, and sales are scoped per outlet throughout the system.

---

## 📄 License

This project is private/internal to the shop it was built for.
