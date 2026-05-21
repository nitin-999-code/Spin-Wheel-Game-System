# Database Schema

This project is built using **MongoDB**, a NoSQL database, and **Mongoose**, an Object Data Modeling (ODM) library for Node.js. 

Because we are using a NoSQL database, there are **no SQL migration scripts** required. The database schema is defined entirely at the application level using Mongoose Schema definitions. 

When the application runs and the `seed.js` script is executed, Mongoose automatically creates the required collections in the database based on these schemas.

Below are the explicit definitions of the collections and their fields, mirroring our Mongoose schema models.

---

## 1. User Schema
**File:** `models/User.js`

Stores all registered accounts for both administrators and regular participants.

- `_id`: ObjectId (Auto-generated)
- `username`: String (Required, Unique)
- `password`: String (Required, Hashed)
- `role`: String (Enum: `['user', 'admin']`, Default: `'user'`)
- `coins`: Number (Default: `1000`, Minimum: `0`) - Represents the user's current wallet balance.
- `createdAt`: Date (Auto-generated)
- `updatedAt`: Date (Auto-generated)

---

## 2. SpinWheel (Game) Schema
**File:** `models/SpinWheel.js`

Tracks the complete lifecycle of a wheel game, including participants, current state, and the final result.

- `_id`: ObjectId (Auto-generated)
- `status`: String (Enum: `['pending', 'active', 'completed', 'aborted']`, Default: `'pending'`)
- `participants`: Array of Objects
  - `user`: ObjectId (Reference to `User` collection)
  - `joinedAt`: Date (Default: `Date.now`)
  - `isEliminated`: Boolean (Default: `false`)
- `winner`: ObjectId (Reference to `User` collection, Default: `null`)
- `totalPool`: Number (Default: `0`) - Accumulates the entry fees of all joined participants.
- `startedAt`: Date (Default: `null`)
- `endedAt`: Date (Default: `null`)
- `createdAt`: Date (Auto-generated)
- `updatedAt`: Date (Auto-generated)

---

## 3. GameConfig Schema
**File:** `models/GameConfig.js`

A singleton configuration document that defines the game's economic rules, making the entry fees and prize splits fully database-driven.

- `_id`: ObjectId (Auto-generated)
- `entryFee`: Number (Default: `100`)
- `winnerPoolPercentage`: Number (Default: `80`)
- `adminPoolPercentage`: Number (Default: `10`)
- `appPoolPercentage`: Number (Default: `10`)
- `createdAt`: Date (Auto-generated)
- `updatedAt`: Date (Auto-generated)

---

## 4. Transaction Schema
**File:** `models/Transaction.js`

An append-only ledger that securely records all coin movements within the system. This ensures a verifiable trail for all economic events (entry fees, refunds, and payouts).

- `_id`: ObjectId (Auto-generated)
- `user`: ObjectId (Reference to `User` collection)
- `wheel`: ObjectId (Reference to `SpinWheel` collection)
- `type`: String (Enum: `['debit', 'credit', 'refund', 'payout']`, Required)
- `amount`: Number (Required)
- `description`: String (Contextual memo, e.g., "Wheel entry fee", "Wheel winner payout")
- `createdAt`: Date (Auto-generated)
- `updatedAt`: Date (Auto-generated)

---

### Concurrency & Relationships Note
- **Relationships:** `Transaction` and `SpinWheel` documents maintain relational integrity by keeping `ObjectId` references to the `User` document.
- **Transactions:** We execute all multi-document operations (e.g., modifying `User.coins` and adding a `Transaction` ledger entry simultaneously) using **Mongoose ACID Transactions** (`mongoose.startSession()`), ensuring robust data integrity against race conditions.
