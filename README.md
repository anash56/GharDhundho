# GharDhundho

MERN MVP for discovering rooms, flats, and PGs in a new city.

## Run locally

Requirements: Node.js 20+ and a reachable MongoDB instance.

1. Copy `server/.env.example` to `server/.env`; set a private, random `JWT_SECRET` and set `MONGO_URI`.
2. Install the three package groups from the repository root:

   ```sh
   npm install
   npm install --prefix client
   npm install --prefix server
   ```

3. Run `npm run seed` to create the demo users and 12 listings.
4. Run `npm run dev` and open <http://localhost:5173>.

Demo password: `Password123!`. Accounts: `admin@example.com`, `owner1@example.com`, `owner2@example.com`, `seeker1@example.com`, `seeker2@example.com`.

Cloudinary is optional. Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` to enable remote photo uploads. `CLIENT_URL` defaults to `http://localhost:5173`; `PORT` defaults to `5000`. Client `VITE_API_URL` defaults to `http://localhost:5000/api`.

## Architecture

### Server (`server/src`)

- `config/`: environment validation, MongoDB connection, Cloudinary setup.
- `models/`: one Mongoose model per collection; schemas and stored field names are unchanged.
- `routes/`: URL, HTTP method, middleware, and controller mapping only.
- `controllers/`: HTTP input/output handling. Business logic is delegated to services.
- `services/`: database queries and resource operations without Express request/response objects.
- `middleware/`: authentication, roles, uploads, rate limiting, async error forwarding, 404, and centralized errors.
- `validators/`: request input checks.
- `utils/`: standard response and error types, async handler, JWT helpers, and listing query construction.
- `app.js` configures Express; `server.js` validates environment, connects MongoDB, and starts the listener.
- `seed/seed.js` creates sample data.

### Client (`client/src`)

- `main.jsx` mounts `App` with auth and toast providers; `App.jsx` delegates to the route setup.
- `routes/` holds lazy-loaded route definitions.
- `pages/` contains route-level screens; `components/` contains shared layout and listing UI.
- `context/` owns authentication and toast state; `hooks/` exposes shared hooks.
- `services/` owns Axios and all API calls; pages and components call resource services.
- `utils/` contains display constants; `styles/index.css` loads the existing stylesheet.

## Scripts

Run from the repository root:

- `npm run dev`: start the API and Vite client together.
- `npm run build`: build the client for production.
- `npm run lint`: lint client and server.
- `npm run format`: format client and server.
- `npm run seed`: reset and seed demo users/listings.

## API

- Auth: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`
- Listings: `GET /api/listings`, `GET /api/listings/:id`, `POST /api/listings`, `PUT /api/listings/:id`, `DELETE /api/listings/:id`, `GET /api/listings/my`
- Enquiries: `POST /api/enquiries`, `GET /api/enquiries/received`, `GET /api/enquiries/sent`, `PATCH /api/enquiries/:id/status`
- Saved: `GET /api/saved`, `POST /api/saved/:listingId`, `DELETE /api/saved/:listingId`

Responses retain the `{ success, message, data }` envelope. Auth uses an httpOnly JWT cookie.
