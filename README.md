# 🤖 AI Powered Job Requirement & Candidate Management System

A full-stack production-ready application combining AI-powered job description generation, intelligent resume parsing & candidate matching, and AWS cloud management — all in one platform.

---

## 🚀 Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Frontend    | React 18 + Vite + Tailwind CSS      |
| Backend     | Node.js + Express.js                |
| Database    | MongoDB (Mongoose)                  |
| AI          | OpenAI GPT-4o-mini                  |
| Cloud       | AWS SDK v3 (EC2 + S3)              |
| Auth        | JWT (JSON Web Tokens)               |
| Container   | Docker + Docker Compose             |
| Charts      | Chart.js + react-chartjs-2          |

---

## 📁 Project Structure

```
ai-job-system/
├── client/                    # React frontend (Vite)
│   └── src/
│       ├── components/        # Sidebar, StatsCard, ProtectedRoute
│       ├── context/           # AuthContext (global state)
│       ├── pages/             # Dashboard, Jobs, Candidates, Cloud
│       └── services/          # api.js, auth.js, cloud.js
│
├── server/                    # Node.js / Express backend
│   ├── config/                # db.js, openai.js, aws.js
│   ├── controllers/           # authController, jobController, candidateController, cloudController
│   ├── middleware/            # auth.js (JWT), upload.js (Multer)
│   ├── models/                # User, Job, Candidate (Mongoose schemas)
│   └── routes/                # auth, jobs, candidates, cloud
│
├── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## ✨ Features

### 1. Authentication
- Register / Login with JWT
- Role-based access: **Admin**, **HR**, **Candidate**
- Protected routes on frontend

### 2. AI Job Module
- HR creates jobs with raw bullet-point requirements
- **OpenAI auto-generates** a professional job description + skill list
- PDF resume upload with **AI parsing** (skills, experience, education)
- **AI match score** (0–100%) with explanation for each candidate
- Candidate ranking sorted by match score

### 3. Cloud Management (Admin only)
- List all AWS EC2 instances
- **Start / Stop** EC2 instances directly from the UI
- List S3 bucket objects
- **Upload / Delete / Download** files from S3
- Pre-signed URLs for secure downloads

### 4. Dashboard
- Real-time analytics with Chart.js
- Monthly job posting bar chart
- Candidate pipeline doughnut chart
- Key metrics: total jobs, active jobs, candidates, avg match score

---

## ⚡ Quick Start

### Prerequisites
- Node.js ≥ 18
- MongoDB (local or Atlas)
- OpenAI API key
- AWS account with EC2 and S3 access

### 1. Clone & Setup Environment

```bash
git clone <repo-url>
cd ai-job-system

# Copy environment file
cp .env.example .env
# Edit .env with your actual API keys
```

### 2. Backend Setup

```bash
cd server
npm install
npm run dev
# Server runs on http://localhost:5000
```

### 3. Frontend Setup

```bash
cd client
npm install
npm run dev
# Client runs on http://localhost:3000
```

---

## 🐳 Docker Setup (Recommended)

### Production (server + mongo)
```bash
# Copy and fill in your .env
cp .env.example .env

# Build and run
docker compose up --build -d

# View logs
docker compose logs -f server
```

### Development (includes hot-reload client)
```bash
docker compose --profile dev up --build
```

The app will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **MongoDB**: mongodb://localhost:27017

---

## 🔑 Environment Variables

| Variable              | Description                        |
|-----------------------|------------------------------------|
| `PORT`                | Server port (default: 5000)        |
| `MONGO_URI`           | MongoDB connection string          |
| `JWT_SECRET`          | Secret for signing JWT tokens      |
| `JWT_EXPIRES_IN`      | Token expiry (e.g. `7d`)           |
| `OPENAI_API_KEY`      | OpenAI API key                     |
| `AWS_ACCESS_KEY_ID`   | AWS access key                     |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key                   |
| `AWS_REGION`          | AWS region (e.g. `us-east-1`)      |
| `AWS_S3_BUCKET`       | Target S3 bucket name              |

---

## 🔐 API Endpoints

### Auth
| Method | Endpoint          | Access    |
|--------|-------------------|-----------|
| POST   | /api/auth/register | Public   |
| POST   | /api/auth/login   | Public    |
| GET    | /api/auth/me      | Protected |
| GET    | /api/auth/users   | Admin     |

### Jobs
| Method | Endpoint         | Access        |
|--------|------------------|---------------|
| GET    | /api/jobs        | All           |
| POST   | /api/jobs        | Admin / HR    |
| GET    | /api/jobs/:id    | All           |
| PUT    | /api/jobs/:id    | Admin / HR    |
| DELETE | /api/jobs/:id    | Admin / HR    |
| GET    | /api/jobs/stats  | All           |

### Candidates
| Method | Endpoint              | Access     |
|--------|-----------------------|------------|
| GET    | /api/candidates       | All        |
| POST   | /api/candidates       | All        |
| GET    | /api/candidates/:id   | All        |
| PUT    | /api/candidates/:id   | Admin / HR |
| DELETE | /api/candidates/:id   | Admin / HR |

### Cloud (Admin only)
| Method | Endpoint                        |
|--------|---------------------------------|
| GET    | /api/cloud/ec2/instances        |
| POST   | /api/cloud/ec2/:id/start        |
| POST   | /api/cloud/ec2/:id/stop         |
| GET    | /api/cloud/s3/objects           |
| POST   | /api/cloud/s3/upload            |
| DELETE | /api/cloud/s3/object            |

---

## 👤 Default Roles

| Role      | Access                                        |
|-----------|-----------------------------------------------|
| admin     | Everything including cloud management         |
| hr        | Jobs CRUD, candidates management              |
| candidate | View jobs, submit applications                |

> **Tip:** Register the first user, then manually update their role to `admin` in MongoDB.

---

## 📦 To Create Zip File

```bash
cd ..
zip -r ai-job-system.zip ai-job-system/ \
  --exclude "*/node_modules/*" \
  --exclude "*/.git/*" \
  --exclude "*/dist/*" \
  --exclude "*/.env"
```

This creates `ai-job-system.zip` with all source code, excluding dependencies and secrets.

---

## 🛠 Development Notes

- Resume parsing uses `pdf-parse` — only works with text-based PDFs (not scanned images)
- OpenAI calls are made server-side; the API key is never exposed to the client
- AWS credentials require EC2 `DescribeInstances`, `StartInstances`, `StopInstances` and S3 permissions
- For production, set `NODE_ENV=production` and use a secrets manager for credentials

---

## 📄 License

MIT © 2024 AI Job System
