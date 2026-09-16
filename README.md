# EMS - ElexoPlus

EMS - ElexoPlus is a role-aware Employee Management System designed to centralize employee operations, attendance, leave, payroll, sales performance, reporting, notifications, and organization settings.

## Key modules

- Authentication and password recovery
- Role-based dashboards and profile management
- Employee Master
- Attendance and attendance-correction workflows
- Leave policies, balances, requests, approvals, and holidays
- Payroll and salary-management workflows
- Sales activities, targets, territories, and performance data
- Reports and analytics
- Notifications and application settings

## Supported roles

- Administrator
- HR Manager
- Area Sales Manager (ASM)
- Sales Executive

The interface and permitted actions are role-aware, so each user is shown the functionality relevant to their responsibilities.

## Technology stack

| Layer | Technologies |
| --- | --- |
| Frontend | React, Vite, React Router, Tailwind CSS, Recharts |
| Backend | PHP 8.1+, PDO, JWT-based authentication |
| Database | MySQL |
| Supporting libraries | Axios, Headless UI, React PDF, jsPDF |

## Repository structure

```text
EMS-ElexoPlus/
|- Frontend/                 # React application
|  `- src/
|     |- features/          # Module-specific pages, components, hooks and services
|     |- layouts/           # Shared application layouts
|     `- routes/            # Client-side routes
|- backend/                  # PHP application
|  |- Core/                 # Shared framework and infrastructure code
|  |- Modules/              # Feature modules and API routes
|  |- config/               # Application configuration
|  |- public/               # Web-server document root
|  `- storage/              # Runtime files and uploaded documents
`- README.md
```

## Prerequisites

- Node.js 18 or later
- npm
- PHP 8.1 or later
- MySQL 8 or compatible MySQL server

## Local setup

### 1. Clone the repository

```bash
git clone <repository-url>
cd EMS-ElexoPlus
```

### 2. Configure and run the backend

Create `backend/.env` from the project environment template or configure the required application values locally. Do not commit database passwords, JWT secrets, or mail credentials.

Install PHP dependencies:

```bash
cd backend
composer install
```

Run the PHP development server:

```bash
php -S localhost:8000 -t public
```

The backend is then available at `http://localhost:8000`.

### 3. Configure and run the frontend

Open a second terminal:

```bash
cd Frontend
npm install
npm run dev
```

Vite will display the local application URL, normally `http://localhost:5173`.

## Available scripts

Run these commands from the `Frontend` directory:

```bash
npm run dev       # Start the Vite development server
npm run build     # Build the production frontend bundle
npm run preview   # Preview the production bundle locally
npm run lint      # Run ESLint
```

## Main application routes

| Route | Module |
| --- | --- |
| `/login` | Authentication |
| `/dashboard` | Dashboard |
| `/employee` | Employee Master |
| `/attendance` | Attendance |
| `/leave` | Leave Management |
| `/payroll` | Payroll |
| `/sales` | Sales |
| `/reports` | Reports |
| `/notifications` | Notifications |
| `/settings` | Settings |
| `/profile` | Profile |

## Security notes

- Keep `.env` files private and never commit secrets.
- Use a unique, strong `JWT_SECRET` in every environment.
- Configure `ALLOWED_ORIGINS` to trusted frontend URLs for deployed environments.
- Use HTTPS and production-safe database credentials outside local development.

## Team

- Gaurav - Team Lead; Authentication, Settings and Notifications
- Harshit Goel - System Architecture, Dashboard and Profile Management
- Sakshi Bansal - Employee Master and Sales Management
- Nisha Bansal - Attendance Management and Reports
- Niyati - Leave Management and Payroll Management
