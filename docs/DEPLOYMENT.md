# 🚀 Nisha Collection — Deployment Guide

## Stack
- **Frontend** → Vercel (React + Vite)
- **Backend** → Render (Spring Boot JAR)
- **Database** → Supabase (PostgreSQL)

---

## Step 1 — Supabase (Database)

1. Go to https://supabase.com → Create new project
2. Name: `nisha-collection` | Region: `Southeast Asia (Singapore)`
3. Once created → Go to **SQL Editor**
4. Paste the full contents of `database/schema.sql` → Click **Run**
5. Go to **Settings → Database** → Copy the **Connection String (URI)**
   - It looks like: `postgresql://postgres:[password]@db.xxxx.supabase.co:5432/postgres`
6. Save this — you'll need it for Render

---

## Step 2 — Render (Backend)

### Option A — Deploy JAR (recommended)

1. Go to https://render.com → New → **Web Service**
2. Connect your GitHub repo (push your backend code first)
3. Settings:
   - **Name:** `nisha-collection-api`
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Build Command:** `mvn clean package -DskipTests`
   - **Start Command:** `java -jar target/nisha-collection-backend-1.0.0.jar`
   - **Instance Type:** Free

4. Environment Variables (click "Add Environment Variable"):
   ```
   DATABASE_URL      = postgresql://postgres:[pass]@db.xxxx.supabase.co:5432/postgres
   DATABASE_USERNAME = postgres
   DATABASE_PASSWORD = your_supabase_password
   FRONTEND_URL      = https://nisha-collection.vercel.app
   PORT              = 8080
   ```

5. Click **Create Web Service** → Wait ~5 min for first deploy
6. Note your Render URL: `https://nisha-collection-api.onrender.com`

---

## Step 3 — Vercel (Frontend)

1. Go to https://vercel.com → New Project
2. Import your GitHub repo
3. Settings:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

4. Environment Variables:
   ```
   VITE_API_URL = https://nisha-collection-api.onrender.com
   ```

5. Click **Deploy** → Wait ~2 min
6. Your app is live at: `https://nisha-collection.vercel.app`

---

## Step 4 — Update CORS on Render

After Vercel gives you a URL, go back to Render:
- Update `FRONTEND_URL` to your actual Vercel URL
- Click **Save** → Service will auto-redeploy

---

## Local Development

### Backend
```bash
cd backend

# Set environment (create .env or export directly)
export DATABASE_URL=jdbc:postgresql://localhost:5432/nisha_collection
export DATABASE_USERNAME=postgres
export DATABASE_PASSWORD=your_password

# Run
mvn spring-boot:run
# API available at http://localhost:8080
```

### Frontend
```bash
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env: VITE_API_URL=http://localhost:8080

# Run
npm run dev
# App available at http://localhost:5173
```

### Local PostgreSQL Setup
```sql
-- Create database
CREATE DATABASE nisha_collection;

-- Then run schema
\c nisha_collection
\i database/schema.sql
```

---

## ✅ Deployment Checklist

- [ ] Supabase project created
- [ ] schema.sql executed in Supabase SQL Editor
- [ ] Backend code pushed to GitHub
- [ ] Render Web Service created with all env variables
- [ ] Render deploy successful (check logs)
- [ ] Frontend pushed to GitHub
- [ ] Vercel project created with VITE_API_URL set
- [ ] Vercel deploy successful
- [ ] FRONTEND_URL updated in Render with Vercel URL
- [ ] Test: Dashboard loads
- [ ] Test: Add a product
- [ ] Test: Create a bill
- [ ] Test: Download PDF invoice

---

## 🔧 Troubleshooting

| Problem | Solution |
|---------|----------|
| CORS error in browser | Check `FRONTEND_URL` in Render matches your Vercel URL exactly |
| 500 on API calls | Check Render logs → likely DB connection issue |
| Spring Boot won't start | Verify all 3 DB env vars are set in Render |
| Vercel shows blank page | Check browser console for errors; verify `VITE_API_URL` is set |
| Supabase connection refused | Use port `5432`, not `6543` (pooler) in direct connection |
| Free Render sleeps | First request after idle takes ~30s. Upgrade to paid or use UptimeRobot to ping every 14 min |
