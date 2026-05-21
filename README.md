# Roxstar Spin Wheel Game System

A real-time multiplayer spin wheel game built for Roxstar. Players join a lobby, pay an entry fee in coins, and get eliminated one by one until a winner takes the prize pool. The whole thing runs live — no refreshing needed.

**GitHub:** [nitin-999-code/Spin-Wheel-Game-System](https://github.com/nitin-999-code/Spin-Wheel-Game-System)  
**Live Frontend:** [https://spin-wheel-game-system.vercel.app](https://spin-wheel-game-system.vercel.app)  
**Backend API:** [https://spin-wheel-game-system.onrender.com](https://spin-wheel-game-system.onrender.com)

---

## What it does

- Admins create and manage wheel games from a dashboard
- Players join active games by paying an entry fee (coins)
- The server automatically eliminates one player every 7 seconds
- The last player standing wins the prize pool
- Everything updates in real-time using Socket.io — no page refreshes

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express, Socket.io |
| Database | MongoDB (via Mongoose) |
| Auth | JWT + bcrypt |
| Frontend | React 19, Vite, Tailwind CSS |
| Deployment | Render (backend), Vercel (frontend) |

---

## Folder Structure

```
Spin-Wheel-Game-System/
├── backend/
│   ├── config/         # MongoDB connection
│   ├── controllers/    # Route handlers
│   ├── middleware/     # JWT auth + admin guard
│   ├── models/         # Mongoose schemas
│   ├── routes/         # API route definitions
│   ├── services/       # Game engine + Socket.io events
│   ├── seed.js         # Seed script for test data
│   └── server.js       # Entry point
├── frontend/
│   └── src/
│       ├── components/ # Navbar
│       ├── context/    # AuthContext, SocketContext
│       ├── pages/      # Login, Dashboard, WheelGame
│       └── utils/      # Axios instance
└── README.md
```

---

## Running Locally

### 1. Clone the repository

```bash
git clone https://github.com/nitin-999-code/Spin-Wheel-Game-System.git
cd Spin-Wheel-Game-System
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create a `.env` file inside `backend/` (see Environment Variables below), then seed the database:

```bash
node seed.js
```

Start the server:

```bash
npm start
```

The backend runs on `http://localhost:5005` by default.

### 3. Frontend setup

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

The app will be at `http://localhost:5173`.

---

## Environment Variables

### Backend (`backend/.env`)

```env
PORT=5005
MONGODB_URI=<your_mongodb_connection_string>
JWT_SECRET=<your_jwt_secret>
FRONTEND_URL=https://spin-wheel-game-system.vercel.app
```

> A MongoDB Atlas cluster (or any Replica Set) is required because the game engine uses Mongoose transactions for atomic coin operations.

### Frontend (`frontend/.env`)

```env
VITE_API_URL=https://spin-wheel-game-system.onrender.com
VITE_SOCKET_URL=https://spin-wheel-game-system.onrender.com
```

For local development, set these to `http://localhost:5005`.

---

## Database Schema

This project uses **MongoDB** with **Mongoose** schema definitions. Schema files are available inside the `/backend/models` folder. No SQL migration is required because MongoDB is a NoSQL database.

Collections used:
- `users` — stores accounts, roles, and coin balances
- `spinwheels` — tracks game state, participants, and winner
- `gameconfigs` — holds entry fee and prize distribution percentages
- `transactions` — logs all coin movements (joins, refunds, payouts)

Full schema documentation: [`backend/database-schema.md`](./backend/database-schema.md)

---

## API Routes

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create a new account |
| POST | `/api/auth/login` | Login and receive a JWT |
| GET | `/api/auth/profile` | Get the current user's profile |
| POST | `/api/wheels` | (Admin) Create a new game |
| GET | `/api/wheels/active` | Get the current pending/active game |
| GET | `/api/wheels/latest` | Get the most recent completed game |
| POST | `/api/wheels/:id/join` | Join a game (deducts entry fee) |
| POST | `/api/wheels/:id/start` | (Admin) Force start a game |

---

## Real-Time Events (Socket.io)

| Event | What it does |
|---|---|
| `wheel_created` | Notifies clients a new game is open |
| `user_joined` | Updates the player list in real-time |
| `wheel_started` | Moves all players to the game screen |
| `user_eliminated` | Marks a player as eliminated |
| `wheel_completed` | Shows the winner and distributes coins |
| `wheel_aborted` | Refunds players and returns to dashboard |
| `coins_updated` | Pushes balance updates without reload |

---

## Game Flow

1. Admin creates a game — a 3-minute lobby timer starts
2. Players join by paying the entry fee in coins
3. After 3 minutes (or admin force-starts), the game checks for at least 3 players
4. If enough players joined, the game starts — one player is eliminated every 7 seconds
5. The last player standing wins; coins are distributed atomically via a MongoDB transaction
6. The result screen shows for 15 seconds, then returns to the dashboard

---

## Coin Distribution Example

With an entry fee of 100 coins and 5 players (total pool: 500 coins):

- **Winner (80%)** → 400 coins
- **Admin (10%)** → 50 coins
- **App (10%)** → 50 coins retained by the platform

Percentages are configurable via the `GameConfig` collection.

---

## Test Accounts (after seeding)

Run `node seed.js` inside the `backend/` folder. This creates:

| Username | Password | Role |
|---|---|---|
| `admin` | `admin123` | Admin |
| `user1` | `user123` | Player |
| `user2` | `user123` | Player |
| `user3` | `user123` | Player |
| `user4` | `user123` | Player |
| `user5` | `user123` | Player |

---

## Edge Cases Handled

- Only one active game allowed at a time
- Insufficient players triggers auto-abort and full refunds
- Users cannot join a game twice
- Admins cannot join as players
- Coin deductions are concurrency-safe via Mongoose sessions

---

## Submission Notes

Built with clean architecture principles — separation of concerns between routes, controllers, services, and the real-time layer. No unnecessary dependencies or over-engineering. The codebase is readable, maintainable, and production-ready.
