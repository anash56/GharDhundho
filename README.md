# GharDhundho

**Find a place to call home.**

GharDhundho helps people moving to a new city discover rooms, flats, and PG accommodations. Owners can publish and manage listings; seekers can browse properties, save favourites, and contact owners through enquiries.

## Features

### Seekers
- Browse rooms, flats, and PG listings.
- Search and filter by city, locality, property type, rent, and listing preferences.
- View listing details, photos, amenities, and availability.
- Save listings and manage sent enquiries.

### Owners
- Create, edit, and delete property listings.
- Upload listing photos and manage availability.
- Review enquiries and update their status.

### Administrators
- View an admin overview and listing moderation queue.
- Hide or restore listings and add moderation notes.

### Platform
- Role-based access for seekers, owners, and administrators.
- JWT authentication using HTTP-only cookies.
- Protected API routes and role checks.
- Centralized API response/error handling, rate limiting, security headers, and MongoDB input sanitization.

## Tech stack

| Layer | Technologies |
|---|---|
| Frontend | React 18, Vite, React Router, Axios, Lucide React |
| Backend | Node.js, Express |
| Database | MongoDB, Mongoose |
| Authentication | JWT, HTTP-only cookies, bcrypt |
| Image uploads | Cloudinary, Multer |
| Security | Helmet, CORS, express-rate-limit, MongoDB input sanitization |
| Testing | Vitest, Testing Library, Node.js test runner, Supertest |
| Code quality | ESLint, Prettier |

## Project structure

```text
GharDhundho/
├── client/
│   └── src/
│       ├── components/    # Shared UI and layout
│       ├── context/       # Authentication and toast providers
│       ├── hooks/         # Shared React hooks
│       ├── pages/         # Route-level screens
│       ├── routes/        # Application routes
│       ├── services/      # API client and resource services
│       ├── styles/        # Stylesheet entry point
│       └── utils/         # Client utilities
├── server/
│   └── src/
│       ├── config/         # Environment, database, Cloudinary
│       ├── controllers/   # HTTP request handlers
│       ├── middleware/    # Auth, roles, uploads, validation, errors
│       ├── models/         # Mongoose models
│       ├── routes/         # API route definitions
│       ├── services/       # Business and data-access logic
│       ├── utils/          # Shared server utilities
│       └── validators/    # Request validation
├── package.json
└── README.md
```

## Getting started

### Prerequisites
- Node.js (current LTS release recommended).
- npm.
- MongoDB running locally or a MongoDB connection string.
- Cloudinary credentials only if remote image uploads are required.

### 1. Clone the repository

```bash
git clone https://github.com/anash56/GharDhundho.git
cd GharDhundho
```

### 2. Install dependencies

Run from the repository root:

```bash
npm install
npm install --prefix client
npm install --prefix server
```

### 3. Configure the backend

Copy the example environment file.

**Windows PowerShell**
```powershell
Copy-Item server/.env.example server/.env
```

**macOS / Linux**
```bash
cp server/.env.example server/.env
```

Set the values in `server/.env`:

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/ghardhundho
JWT_SECRET=replace_with_a_random_secret_at_least_32_characters
CLIENT_URL=http://localhost:5173
AUTH_COOKIE_SAME_SITE=lax

# Optional: Cloudinary image uploads
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Use a unique, randomly generated secret for `JWT_SECRET`. Never commit `.env` files or expose production credentials.

For production, set `NODE_ENV=production` and set `CLIENT_URL` to the exact frontend origin. Configure cookie settings and trusted proxy hops for your deployment. If the frontend and API are cross-site, cookie `SameSite` and `Secure` settings must be configured consistently; `SameSite=None` requires HTTPS in production.

### 4. Configure the frontend (if needed)

The client defaults to `http://localhost:5000/api`. If your API uses a different URL, create `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```


### 5. Start the application

```bash
npm run dev
```

Default local URLs:
- Frontend: http://localhost:5173
- API: http://localhost:5000
- Health check: http://localhost:5000/api/health

## Available scripts

Run from the repository root:

| Command | Description |
|---|---|
| `npm run dev` | Start backend and frontend together |
| `npm run build` | Build the frontend |
| `npm run lint` | Run ESLint for client and server |
| `npm run format` | Format client and server source files |
| `npm run test` | Run server and client test suites |
| `npm run test:server` | Run backend tests |
| `npm run test:client` | Run frontend tests |

## API overview

All API routes are prefixed with `/api`.

| Area | Method | Endpoint | Purpose |
|---|---|---|---|
| Health | GET | `/health` | Check API status |
| Auth | POST | `/auth/register` | Register |
| Auth | POST | `/auth/login` | Sign in |
| Auth | GET | `/auth/me` | Get current session user |
| Auth | POST | `/auth/logout` | Sign out |
| Listings | GET | `/listings` | Browse listings |
| Listings | GET | `/listings/:id` | View listing details |
| Listings | GET | `/listings/my` | Get owner's listings |
| Listings | POST | `/listings` | Create listing (owner) |
| Listings | PUT | `/listings/:id` | Update listing (owner) |
| Listings | DELETE | `/listings/:id` | Delete listing (owner/admin) |
| Enquiries | POST | `/enquiries` | Send enquiry (seeker) |
| Enquiries | GET | `/enquiries/sent` | View sent enquiries (seeker) |
| Enquiries | GET | `/enquiries/received` | View received enquiries (owner) |
| Enquiries | PATCH | `/enquiries/:id/status` | Update enquiry status (owner) |
| Saved | GET | `/saved` | List saved properties (seeker) |
| Saved | POST | `/saved/:listingId` | Save a property (seeker) |
| Saved | DELETE | `/saved/:listingId` | Remove a saved property (seeker) |
| Admin | GET | `/admin/overview` | View admin overview |
| Admin | GET | `/admin/listings` | View listings for moderation |
| Admin | PATCH | `/admin/listings/:id/moderation` | Moderate a listing |

Protected endpoints require a valid session and the appropriate role. API responses use a consistent response envelope.

## Security notes

- Passwords are hashed before storage; password fields are excluded from normal user queries.
- Authentication tokens are issued through HTTP-only cookies.
- The API uses Helmet, configured CORS, rate limiting, and MongoDB input sanitization.
- Listing ownership and role authorization are enforced on protected operations.
- Keep secrets in environment variables. Never commit `.env` files, API keys, database credentials, or production JWT secrets.

## Development checks

Before merging or deploying a change, run:

```bash
npm run lint
npm run test
npm run build
```

Fix failing checks before treating a change as ready to deploy.

## License

No license is currently specified. Unless a license is added to this repository, the code should not be assumed to be available for reuse or redistribution.
