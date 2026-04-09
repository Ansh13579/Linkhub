# 🔗 LinkHub

LinkHub is a powerful, multi-tenant "Link-in-Bio" SaaS platform. It allows users to create highly customizable public profile pages with dynamic themes, drag-and-drop link management, and built-in click analytics.

The application is built using a modern full-stack monorepo architecture, utilizing Next.js for a robust front-end experience and an Express Node.js REST API on the backend, fully secured by PostgreSQL Row-Level Security (RLS) to enforce strict multi-tenant data isolation.

## ✨ Features

- **Multi-Tenant Architecture:** Secure data isolation using PostgreSQL Row-Level Security (RLS).
- **Customizable Themes:** Dynamic, user-specific themes (Neon, Pastel, Gradients and more) injected via CSS variables.
- **Drag-and-Drop Management:** Reorder links seamlessly via a fluid UI.
- **Advanced Analytics:** Track total clicks, referrers, device distribution, and 7-day trends dynamically.
- **Micro-Animations:** Beautiful, responsive UI built with modern web aesthetics.

## 🛠️ Technology Stack

- **Frontend:** Next.js (App Router), React, CSS Modules, dnd-kit (for drag and drop)
- **Backend:** Node.js, Express.js, JSON Web Tokens (JWT) for authentication
- **Database:** PostgreSQL (with Row-Level Security), `pg` driver
- **Monorepo:** NPM Workspaces

---

## 🚀 Local Setup Instructions

This project uses an NPM workspaces monorepo structure, containing an `apps/frontend` and an `apps/backend`.

### Prerequisites
- Node.js (v18+)
- PostgreSQL (Docker Desktop or a local installation, or a cloud provider like Neon/Supabase)

### 1. Database Setup

You will need a running PostgreSQL database. You can start one using the provided Docker configuration:

```bash
docker-compose up -d
```

*Alternatively, if you are using a cloud database (like Neon), grab your connection string URL.*

### 2. Configure Environment Variables

**Backend Configuration:**
Navigate to `apps/backend` and create an `.env` file (if one doesn't exist):
```env
PORT=4000
DATABASE_URL=postgresql://linkhub:linkhub_secret@localhost:5432/linkhub_db
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```
*(If using a cloud database, replace the `DATABASE_URL` with your cloud connection string).*

**Frontend Configuration:**
Navigate to `apps/frontend` and create an `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### 3. Initialize the Database

Before running the application, you need to create the table structure. 
- **If using Docker/Local PSQL:** Run the `apps/backend/src/db/init.sql` script against your database.
- **If using a Cloud Provider:** Connect to your SQL Editor and paste/run the SQL code from `apps/backend/src/db/init.sql`.

### 4. Install Dependencies & Start the Servers

In the root directory of the project, run the following commands:

```bash
# Install all dependencies for both frontend and backend
npm install

# Start the Backend Server (runs on http://localhost:4000)
npm run dev:backend
```

Open a **new terminal** in the root directory and start the frontend:
```bash
# Start the Frontend App (runs on http://localhost:3000)
npm run dev:frontend
```

---

## 🌱 Seeding Demo Data (Optional)

If you'd like to populate your database with dummy users, realistic analytics, and beautiful pre-configured themes to test the UI, run the seed command while your database is active:

```bash
npm run seed
```

This will generate several demo accounts (e.g., `alex@linkhub.dev`, `sarah@linkhub.dev` with password `password123`).

## 🚢 Deployment Overview

- **Frontend:** Optimized for Vercel. Set the Root Directory to `apps/frontend`.
- **Backend:** Designed for standard container hosting (Render, Railway, Heroku). Set the Root Directory to `apps/backend`.
- **Database:** Supabase, Neon, or any PostgreSQL hosting provider.
