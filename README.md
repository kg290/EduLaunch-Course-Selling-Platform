# EduLaunch - Course Selling Platform

Full-stack course marketplace where:
- Educators create/manage courses with chapter videos
- Students preview, purchase (Razorpay), and track progress
- Admin can manage the platform

---

## 1. Tech Stack

- Frontend: React 18, Vite, React Router, Axios
- Backend: Node.js, Express, JWT auth
- Database: MongoDB + Mongoose
- Payments: Razorpay (real) + mock fallback when keys are missing
- Email: Nodemailer (SMTP optional, console fallback)

---

## 2. Core Features

- Role-based auth: `student`, `educator`, `admin`
- Course creation/editing (educator)
- Public course discovery + category filters
- Preview chapter locking before purchase
- Razorpay order + verify payment flow
- Enrollment progress tracking (chapter completion)
- Ratings and reviews
- Admin seeding + demo data seeding scripts

---

## 3. Project Structure

```text
course-selling-platform/
  client/                 # React app (Vite)
  server/                 # Express API + MongoDB models/controllers
  run.ps1                 # Windows one-command setup/run script
  package.json            # Root scripts
```

---

## 4. Prerequisites

- Node.js 18+ (recommended: latest LTS)
- npm 9+
- MongoDB running locally (default expected):
  - `mongodb://127.0.0.1:27017/course_platform`
- Windows PowerShell (for `run.ps1`)

---

## 5. Environment Variables

Backend reads from: `server/.env`

Create it from template:

```powershell
Copy-Item .\server\.env.example .\server\.env
```

Minimum required for full app:

| Variable | Description | Required |
|---|---|---|
| `MONGO_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `CLIENT_URL` | Frontend URL for CORS | Yes |
| `RAZORPAY_KEY_ID` | Razorpay test key ID | No (mock fallback) |
| `RAZORPAY_KEY_SECRET` | Razorpay test key secret | No (mock fallback) |
| `SMTP_HOST` | SMTP host | No |
| `SMTP_PORT` | SMTP port | No |
| `SMTP_USER` | SMTP username | No |
| `SMTP_PASS` | SMTP password | No |
| `ADMIN_EMAIL` | Admin seed email | No (default exists) |
| `ADMIN_PASSWORD` | Admin seed password | No (default exists) |
| `LOCAL_COURSE_LIBRARY` | Local-only absolute path for imported course videos | No |
| `BLOB_READ_WRITE_TOKEN` | Required on Vercel for production video uploads | No locally, Yes for deployed uploads |
| `VITE_API_BASE_URL` | Frontend API base URL | No locally, recommended for custom deploys |
| `VITE_BLOB_UPLOAD_URL` | Blob token endpoint used by frontend uploads | No locally, recommended on Vercel |

Example `server/.env`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/course_platform
JWT_SECRET=change_me
CLIENT_URL=http://localhost:5173

RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxxxxx

SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=

ADMIN_EMAIL=admin@edulaunch.com
ADMIN_PASSWORD=admin123

LOCAL_COURSE_LIBRARY=C:\Users\your-name\Downloads\courses
```

---

## 6. Quick Start (Windows, Recommended)

From project root:

```powershell
powershell -ExecutionPolicy Bypass -File .\run.ps1
```

What `run.ps1` does:
- Ensures `server/.env` exists (copies from example if missing)
- Fills safe defaults for missing core env values
- Copies Razorpay keys from root `.env` -> `server/.env` if needed
- Installs dependencies (unless skipped)
- Seeds admin (unless skipped)
- Frees ports `5000` and `5173`
- Starts backend + frontend

Useful flags:

```powershell
.\run.ps1 -SkipInstall
.\run.ps1 -SkipSeed
.\run.ps1 -NoStart
```

---

## 7. Manual Setup (Cross-platform)

### 7.1 Install dependencies

From project root:

```bash
npm install
npm run install:all
```

### 7.2 Seed admin

From project root:

```bash
npm run seed:admin --prefix server
```

or from inside `server`:

```bash
npm run seed:admin
```

### 7.3 Start backend + frontend

From project root:

```bash
npm run dev
```

or separately:

```bash
npm run start --prefix server
npm run dev --prefix client
```

---

## 8. Data Seeding Commands

### 8.1 Seed demo courses/users

From project root:

```bash
npm run seed:demo --prefix server
```

From inside `server`:

```bash
npm run seed:demo
```

### 8.2 Cleanup demo/test data

From project root:

```bash
npm run cleanup:demo --prefix server
```

From inside `server`:

```bash
npm run cleanup:demo
```

This removes test/demo accounts and their related courses/enrollments.

---

## 9. Razorpay Setup & Validation

1. Put keys in `server/.env`:
   - `RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`
2. Restart backend.
3. Check payment config endpoint:

```bash
GET http://localhost:5000/api/enrollments/payment-config
```

Expected when configured:

```json
{
  "razorpayConfigured": true,
  "razorpayKeyId": "rzp_test_xxxxx"
}
```

If keys are missing, app falls back to mock payment.

---

## 10. Available Scripts

### Root (`package.json`)

- `npm run dev` - start server + client concurrently
- `npm run dev:server` - server dev only
- `npm run dev:client` - client dev only
- `npm run install:all` - install server and client deps
- `npm run build` - build frontend production bundle

### Server (`server/package.json`)

- `npm run dev` - nodemon backend
- `npm run start` - backend start
- `npm run seed:admin` - seed admin user
- `npm run seed:demo` - seed demo educator/student/courses
- `npm run cleanup:demo` - remove demo/test data

### Client (`client/package.json`)

- `npm run dev` - Vite dev server
- `npm run build` - production build
- `npm run preview` - preview built client

---

## 11. URLs

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- Health API: `http://localhost:5000/api/health`

---

## 12. Default Credentials

Admin (seeded by `seed:admin`):
- Email: `admin@edulaunch.com`
- Password: `admin123`

Demo (seeded by `seed:demo`):
- Educator: `educator.demo@edulaunch.com / educator123`
- Student: `student.demo@edulaunch.com / student123`

---

## 13. Common Command Mistakes (Important)

If you are in project root, use:

```powershell
npm run seed:demo --prefix server
```

If you already did `cd server`, do **not** add `--prefix server` again. Use:

```powershell
npm run seed:demo
```

Wrong inside `server`:

```powershell
npm run seed:demo --prefix server
```

That incorrectly looks for `server/server/package.json`.

---

## 14. Troubleshooting

- `Missing script: seed:demo`
  - Pull latest code or ensure `server/package.json` contains `seed:demo`.
- Local uploaded videos do not play after deploying to Vercel
  - This is expected if the course was seeded from a local machine path.
  - The app now falls back to the saved YouTube URL automatically when local media is unavailable.
- Educator video uploads fail on Vercel
  - Add a Blob store to the Vercel project and ensure `BLOB_READ_WRITE_TOKEN` is present.
  - Set `VITE_BLOB_UPLOAD_URL=/api/blob-upload`.
- Thumbnails look broken
  - Existing courses may have invalid external URLs.
  - Reseed demo data (`seed:demo`) or update thumbnail URLs via educator dashboard.
- Razorpay checkout fails
  - Verify keys in `server/.env`
  - Ensure backend restarted after env update
  - Check backend error response in browser dev tools / server logs
- Port already in use (`5000` / `5173`)
  - Use `run.ps1` (it frees both ports automatically), or stop conflicting processes manually.

---

## 15. Vercel Deployment

This repo is now prepared to deploy as:
- Vite frontend output from `client/dist`
- Vercel serverless API routes from root `/api`
- SPA-safe client routing via `vercel.json`

### Recommended Vercel Environment Variables

Set these in the Vercel dashboard:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_URL=https://your-vercel-domain.vercel.app

RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxxxxx

SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=

ADMIN_EMAIL=admin@edulaunch.com
ADMIN_PASSWORD=admin123

BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
VITE_API_BASE_URL=/api
VITE_BLOB_UPLOAD_URL=/api/blob-upload
```

### Important Production Notes

- Use MongoDB Atlas or another network-accessible MongoDB instance. Local MongoDB will not work on Vercel.
- For large educator video uploads on Vercel, Blob is required. Vercel Functions have a request body limit, so the app now uses browser-to-Blob uploads in production.
- Locally seeded course videos from `C:\Users\...` will not exist in Vercel. Those lessons now fall back to their YouTube URL automatically instead of breaking.

### Deploy Settings

- Framework preset: `Other`
- Root directory: project root
- Build command: read from `vercel.json`
- Output directory: read from `vercel.json`

---

## 16. License

Use freely for learning/hackathon purposes unless your team adds a separate license file.
