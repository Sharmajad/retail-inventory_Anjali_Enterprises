# retail-inventory_Anjali_Enterprises

A full-stack retail inventory and point-of-sale management system built with the MERN stack (MongoDB, Express, React, Node.js).

## 📁 Project Structure

```
retail-inventory-app/
├── client/          # React + Vite frontend application
│   ├── src/         # UI components, pages, context, and services
│   ├── public/      # Static assets and icons
│   ├── .env.example # Frontend environment template
│   └── package.json
├── server/          # Express + Node.js backend API
│   ├── src/         # Controllers, models, routes, middleware, validators
│   ├── .env.example # Backend environment template
│   └── package.json
└── .gitignore       # Root-level ignore rules
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB Atlas cluster or local MongoDB instance

---

### Backend Setup

1. Navigate to the server folder:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Configure your environment variables in `.env`:
   - `PORT`: Server port (default: `5000`)
   - `NODE_ENV`: `development` | `production`
   - `MONGO_URI`: Your MongoDB connection string
   - `JWT_SECRET`: Secret key for JWT token generation
   - `JWT_EXPIRE`: Token expiration time (e.g. `24h`)
   - `CORS_ORIGIN`: Allowed client URLs (e.g. `http://localhost:5173`)

5. Start the server:
   ```bash
   npm run dev
   ```

---

### Frontend Setup

1. Navigate to the client folder:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Configure your environment variables in `.env`:
   - `VITE_API_URL`: Backend API base URL (e.g. `http://localhost:5000/api`)

5. Start the frontend development server:
   ```bash
   npm run dev
   ```

---

## 🔒 Security Note
- Secrets and `.env` files are never committed to version control.
- Always configure environment variables in your deployment hosting providers (e.g., Render, Vercel, Railway).
