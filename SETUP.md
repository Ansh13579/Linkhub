# LinkHub — Setup Guide

## Prerequisites

You need **one** of:
- Docker Desktop (easiest — will start PostgreSQL automatically)
- PostgreSQL 14+ installed locally

### Node.js
- Node.js 18+ is required

---

## Option A: Docker Setup (Recommended)

1. **Start Docker Desktop** (from the Windows Start menu)
2. Open a terminal in the `linkhub` folder:
   ```powershell
   cd "c:\Users\HP\OneDrive - itbhu.ac.in\Puprle\linkhub"
   docker-compose up -d
   ```
3. Wait ~10 seconds for PostgreSQL to start, then proceed to **Step 2**.

---

## Option B: Local PostgreSQL

If you have PostgreSQL installed:

1. Create the database and user:
   ```sql
   CREATE DATABASE linkhub_db;
   CREATE USER linkhub WITH PASSWORD 'linkhub_secret';
   GRANT ALL PRIVILEGES ON DATABASE linkhub_db TO linkhub;
   ```
2. Run the init script:
   ```powershell
   psql -U linkhub -d linkhub_db -f "apps\backend\src\db\init.sql"
   ```

---

## Step 2: Start the Backend

Open a terminal in `linkhub\apps\backend`:
```powershell
npm run dev
```

The API will start at **http://localhost:4000**

---

## Step 3: Seed the Database

In a new terminal window (while backend is running):
```powershell
cd "c:\Users\HP\OneDrive - itbhu.ac.in\Puprle\linkhub\apps\backend"
npm run seed
```

This creates **5 demo tenants** with realistic themes and click data.

### Demo Accounts
| Email | Password | Theme | Profile URL |
|---|---|---|---|
| alex@linkhub.dev | password123 | Neon Dark | /t/alexdesigns |
| sarah@linkhub.dev | password123 | Soft Pastel | /t/sarahcodes |
| marcus@linkhub.dev | password123 | Bold Gradient | /t/marcusbrand |
| luna@linkhub.dev | password123 | Ocean Breeze | /t/lunafitness |
| studio@linkhub.dev | password123 | Minimal Light | /t/quantumstudio |

---

## Step 4: Start the Frontend

Open a terminal in `linkhub\apps\frontend`:
```powershell
npm run dev
```

The frontend will be at **http://localhost:3000**

---

## URLs

| Page | URL |
|---|---|
| Landing Page | http://localhost:3000 |
| Login | http://localhost:3000/login |
| Register | http://localhost:3000/register |
| Alex's Profile (Neon Dark) | http://localhost:3000/t/alexdesigns |
| Sarah's Profile (Soft Pastel) | http://localhost:3000/t/sarahcodes |
| Marcus's Profile (Bold Gradient) | http://localhost:3000/t/marcusbrand |
| Luna's Profile (Ocean Breeze) | http://localhost:3000/t/lunafitness |
| Studio's Profile (Minimal Light) | http://localhost:3000/t/quantumstudio |
| Dashboard | http://localhost:3000/dashboard |
| Analytics | http://localhost:3000/dashboard/analytics |
| Theme Editor | http://localhost:3000/dashboard/settings |
| Backend Health | http://localhost:4000/health |
