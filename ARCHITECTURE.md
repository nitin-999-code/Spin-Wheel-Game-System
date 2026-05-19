# Architecture Overview

## High-Level System Architecture

The Spin Wheel Game System follows a standard Client-Server architecture utilizing a RESTful API for standard operations (authentication, user management, joining wheels) and WebSockets for real-time state synchronization (game loop, eliminations).

### 1. Frontend Architecture (React + Vite)
- **Component-Based UI**: UI is broken down into modular components (Navbar, Game Arena, Participant Cards).
- **Context API for State**: 
  - `AuthContext`: Manages user sessions, JWT tokens, and global coin balances.
  - `SocketContext`: Manages the global Socket.io instance, connecting only when a user is authenticated.
- **Routing**: Handled by React Router with protected routes to prevent unauthenticated access.
- **Styling**: Tailwind CSS is used for responsive, highly animated, and modern UI design.

### 2. Backend Architecture (Node.js + Express)
- **MVC Pattern**: Code is strictly organized into `models`, `routes`, and `controllers`.
- **Service Layer**:
  - `game.service.js`: Contains all the complex business logic regarding scheduling the wheel, handling random eliminations, distributing prize pools, and orchestrating database transactions.
  - `socket.service.js`: Acts as a singleton to broadcast events from any controller or service directly to connected clients.
- **Database (MongoDB)**:
  - Uses Mongoose schemas with strict validations.
  - Relational links are maintained using `ObjectId` refs between `User`, `SpinWheel`, and `Transaction`.

### 3. Concurrency & Atomicity
- The application guarantees transaction safety using **Mongoose Sessions & Transactions**.
- Joining a wheel involves checking a user's balance, debiting coins, adding them to the wheel, and writing a ledger entry (Transaction). All of this happens in a single ACID-compliant transaction block to prevent negative balances under high concurrent loads.

### 4. Real-Time Communication
- Real-time events push data directly to clients without needing them to poll the server.
- The `gameLoopTimer` exists on the server. The server acts as the absolute source of truth. Every 7 seconds, it mutates the state (eliminating a player) and broadcasts the `user_eliminated` event, ensuring all clients stay synchronized without running out of sync.
