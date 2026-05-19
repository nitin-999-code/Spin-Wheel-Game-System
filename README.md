# Roxstar Spin Wheel Game System

A real-time, multiplayer Spin Wheel Game built for Roxstar. This system features a highly concurrent backend architecture using Node.js, Express, Socket.io, and MongoDB (Mongoose Transactions), paired with a modern React, Vite, and Tailwind CSS frontend.

## Features
- **Role-Based Access**: Admins create and manage games; normal users join and compete.
- **Real-Time Synchronization**: Live updates for game states, timers, eliminations, and coin balances using Socket.io.
- **Atomic Transactions**: Concurrency-safe coin deductions, refunds, and payouts using MongoDB ACID Transactions.
- **Automated Game Engine**: 3-minute lobby timer, auto-refunds if minimum participants aren't met, and a 7-second interval elimination loop.
- **Dynamic Prize Distribution**: Database-driven configurations for entry fees and prize pool splitting (Winner %, Admin %, App %).

## Tech Stack
- **Backend**: Node.js, Express, Socket.io, MongoDB (Mongoose)
- **Frontend**: React (Vite), Tailwind CSS, Socket.io-client, React Router
- **Authentication**: JWT (JSON Web Tokens), bcrypt

## Folder Structure
```text
Spin-Wheel-Game-System/
├── backend/
│   ├── config/          # Database connection setup
│   ├── controllers/     # API request handlers
│   ├── middleware/      # JWT Auth and Admin role guards
│   ├── models/          # Mongoose schemas (User, SpinWheel, GameConfig, Transaction)
│   ├── routes/          # Express route definitions
│   ├── services/        # Core business logic (Game Engine, Socket events)
│   ├── seed.js          # Database initial seeding script
│   └── server.js        # Entry point
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable UI components (Navbar)
│   │   ├── context/     # Global state (AuthContext, SocketContext)
│   │   ├── pages/       # Route pages (Login, Dashboard, WheelGame)
│   │   ├── utils/       # Axios instance and API utilities
│   │   ├── App.jsx      # React Router configuration
│   │   └── main.jsx     # Vite entry point
│   └── tailwind.config.js
└── README.md
```

## Setup Instructions

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd Spin-Wheel-Game-System
```

### 2. Backend Setup
```bash
cd backend
npm install
```
Configure your environment variables (see below), then run the seed script to populate the database with test users and the default game configuration:
```bash
node seed.js
```
Start the backend server:
```bash
npm run start
```

### 3. Frontend Setup
Open a new terminal window:
```bash
cd frontend
npm install
npm run dev
```

The application will be available at `http://localhost:5173`.

## Environment Variables
Create a `.env` file in the `backend/` directory:

```env
PORT=5005
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/roxstar-spin?retryWrites=true&w=majority
JWT_SECRET=supersecretjwtkey123
```
*(Note: A MongoDB Replica Set or MongoDB Atlas cluster is **required** to support Mongoose Transactions).*

## Database Schemas Overview
- **User**: Stores username, hashed password, role (`admin` or `user`), and `coins` balance.
- **SpinWheel**: Tracks the game lifecycle (`status`: pending, active, completed, aborted), `totalPool`, `participants` array (with `isEliminated` flags), and the final `winner`.
- **GameConfig**: Defines `entryFee`, `winnerPoolPercentage`, `adminPoolPercentage`, and `appPoolPercentage`.
- **Transaction**: An immutable ledger recording all coin movements (types: `credit`, `debit`, `refund`, `payout`).

## API Routes Overview
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Authenticate and receive a JWT
- `GET /api/auth/profile` - Fetch current user profile
- `POST /api/wheels` - (Admin only) Create a new game
- `GET /api/wheels/active` - Fetch the currently pending or active game
- `GET /api/wheels/latest` - Fetch the most recently completed game result
- `POST /api/wheels/:id/join` - Pay entry fee and join a pending game
- `POST /api/wheels/:id/start` - (Admin only) Force start a pending game

## Real-Time Socket Events
- `wheel_created`: Broadcasts when an admin initializes a new game.
- `user_joined`: Updates the arena when a user successfully pays and joins.
- `wheel_started`: Navigates all joined players to the active game screen.
- `user_eliminated`: Visually eliminates a player every 7 seconds.
- `wheel_completed`: Displays the winner screen and updates global balances.
- `wheel_aborted`: Redirects users back to the dashboard if a game fails to start.
- `coins_updated`: Pushes fresh balances to specific users without requiring a page reload.

## Game Flow Explanation
1. **Creation**: An Admin clicks "Create New Wheel Game". A 3-minute lobby timer begins.
2. **Joining**: Normal users click "Join Game", paying the entry fee. The UI updates in real-time.
3. **Starting**: Once 3 minutes pass (or the admin clicks "Force Start"), the game checks if at least 3 users have joined.
4. **Execution**: The server randomly picks one participant to eliminate every 7 seconds and emits the event to clients.
5. **Completion**: When exactly 1 user remains, they are declared the winner. The prize pool is distributed safely via a database transaction.
6. **Result**: The final result screen lingers for 15 seconds before returning users to the dashboard, which displays a "Last Game Result" card.

## Coin Distribution
If the entry fee is 100 coins and 5 users join, the `totalPool` is 500 coins. Based on the default `GameConfig`:
- **Winner (80%)**: Receives 400 coins.
- **Admin (10%)**: Receives 50 coins.
- **App (10%)**: 50 coins remain in the system indefinitely (platform revenue).

## Assumptions
- **Role Separation**: Admins exist to orchestrate games and collect admin pool payouts, but cannot join games as competitive participants.
- **Minimum Requirements**: The "minimum 3 participants" rule strictly applies to 3 normal users.
- **App Pool**: The App Pool percentage is retained globally and not assigned to any specific user wallet.

## Edge Cases Handled
- **Single Active Game**: The API blocks the creation of a new game if one is already `pending` or `active`.
- **Insufficient Participants**: Automatically aborts the game, issues full coin refunds atomically, and logs the refund transactions.
- **Duplicate Joins**: Database transactions and API logic prevent a user from joining the same wheel twice.
- **Insufficient Balance**: Blocks entry if a user's coin balance is lower than the configured entry fee.
- **Concurrency**: `mongoose.startSession()` and `session.startTransaction()` are strictly enforced on all coin modifications to prevent race conditions during heavy traffic.
- **Admin Join Blocked**: Enforced strictly at the API and UI level.

## Testing Guide
1. Run the `seed.js` script to create an `admin` and 5 test users (`user1` to `user5`).
2. Open two browser windows: log into one as `admin` and the other as `user1`.
3. As the **admin**, create a new wheel game.
4. As **user1**, verify the active game appears and click "Join Game".
5. Log out of `user1` and log in as `user2` and `user3` to join the same game.
6. As the **admin**, click "Force Start Now".
7. Watch the game screen automatically eliminate users one-by-one every 7 seconds.
8. Once the game ends, verify the winner receives their payout, the admin receives their cut, and the "Last Game Result" appears on the dashboard.

## Submission Notes
This project adheres to professional coding standards, emphasizing clean architecture, secure authorization, atomic database operations, and seamless WebSocket integration. No unnecessary complexity was added, ensuring the codebase is highly readable and maintainable.
