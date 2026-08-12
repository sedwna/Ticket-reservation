# سامانه رزرو صندلی سالن آمفی‌تئاتر

**Seat Reservation System - Amphi Theater of Faculty of Engineering, Bu-Ali Sina University**

## Overview

A full-stack web application for online seat reservation in the university amphitheater. This system replaces the traditional manual process with a modern, secure, and user-friendly platform.

### Tech Stack

| Layer     | Technology |
|-----------|------------|
| Frontend  | React 18, Vite, Tailwind CSS, Recharts |
| Backend   | Go 1.21, Gin Framework, GORM |
| Database  | PostgreSQL 16 |
| Auth      | JWT + RBAC |

### Architecture

```
┌─────────────────────┐
│   Presentation Layer │  ← React (Vite + Tailwind)
├─────────────────────┤
│   Business Logic     │  ← Go (Gin + GORM)
├─────────────────────┤
│   Data Layer         │  ← PostgreSQL
└─────────────────────┘
```

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Or: Go 1.21+, Node.js 20+, PostgreSQL 16

### Using Docker (Recommended)

```bash
# Clone and start all services
git clone <repo-url>
cd Ticket-reservation
docker-compose up -d

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8080
```

### Manual Setup

#### 1. Database

```bash
# Create PostgreSQL database
createdb ticket_reservation
# Or use: docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=ticket_reservation postgres:16-alpine
```

#### 2. Backend

```bash
cd backend
cp .env.example .env  # Edit if needed
go mod tidy
go run cmd/server/main.go
```

#### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

### Default Admin Account

- Email: `admin@basu.ac.ir`
- Password: `REMOVED_SECRET`

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Login |
| POST | `/api/v1/auth/logout` | Logout |
| PUT | `/api/v1/auth/change-password` | Change password |

### Events
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/events` | List active events |
| GET | `/api/v1/events/:id` | Event details |
| GET | `/api/v1/events/:id/seats` | Seat map |

### Reservations
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/reservations` | Create reservation |
| GET | `/api/v1/reservations/my` | My reservations |
| DELETE | `/api/v1/reservations/:id` | Cancel reservation |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/admin/events` | Create event |
| PUT | `/api/v1/admin/events/:id` | Update event |
| DELETE | `/api/v1/admin/events/:id` | Delete event |
| GET | `/api/v1/admin/reservations` | All reservations |
| GET | `/api/v1/admin/users` | All users |
| PUT | `/api/v1/admin/users/:id/toggle-status` | Toggle user |
| PUT | `/api/v1/admin/users/:id/change-role` | Change role |
| GET | `/api/v1/admin/reports/stats` | Dashboard stats |
| GET | `/api/v1/admin/reports/events/:id` | Event report |
| GET | `/api/v1/admin/reports/export` | Export CSV |

## Features

### User Features
- Register & Login with JWT authentication
- Browse active events with capacity progress bars
- Interactive visual seat map with real-time status
- Color-coded seats (available/reserved/reserved by you)
- One-click seat reservation with concurrency control
- View and cancel personal reservations
- Reservation history

### Admin Features
- Dashboard with statistics (active events, today's reservations, total users)
- Reservation trend chart (7 days)
- Event CRUD management with auto seat generation
- User management (toggle status, change roles)
- Reports with bar/pie/line charts
- CSV export for further analysis
- Audit log for admin actions

### Technical Highlights
- Race condition prevention with SELECT FOR UPDATE
- UUID primary keys for scalability
- Layered architecture (Handler → Service → Repository → Database)
- Proper error handling and validation
- RTL support with Persian (Jalali) date display
- Fully responsive design
- Docker containerization

## Project Structure

```
Ticket-reservation/
├── backend/
│   ├── cmd/server/main.go         # Entry point
│   ├── config/config.go            # Configuration
│   ├── internal/
│   │   ├── models/                 # Data models
│   │   ├── repository/             # Database access layer
│   │   ├── services/               # Business logic
│   │   ├── handlers/               # HTTP handlers
│   │   ├── middleware/             # Auth & CORS middleware
│   │   └── routes/routes.go        # Route definitions
│   ├── pkg/
│   │   ├── database/               # DB connection
│   │   └── utils/                  # JWT, response helpers
│   └── migrations/                 # SQL migrations
├── frontend/
│   ├── src/
│   │   ├── components/             # Reusable components
│   │   ├── pages/                  # Page components
│   │   ├── services/               # API service layer
│   │   ├── context/                # React context
│   │   └── App.jsx                 # Main app with routing
│   ├── index.html
│   └── vite.config.js
├── docker-compose.yml
└── README.md
```

## Security

- Passwords hashed with bcrypt
- JWT tokens with configurable expiry
- Role-based access control (RBAC)
- SQL injection prevention via GORM
- CORS policy configured for trusted origins
- Input validation on both client and server

## License

This project was developed as a university course project at Bu-Ali Sina University, Faculty of Engineering.

**Developers:** Sajad Dehqan, Fatemeh Damavandi
