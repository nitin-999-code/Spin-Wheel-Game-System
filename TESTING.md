# Manual Testing Guide

To test the complete workflow of the Spin Wheel Game System, follow these steps using the seeded accounts or newly created ones.

## 1. Setup Testing Accounts
By running `node seed.js`, you should have:
- **Admin**: Username: `admin`, Password: `admin123` (Role: admin, Coins: 1,000,000)
- **Test Users**: `user1`, `user2`, `user3`, `user4`, `user5` (Password: `password123`, Role: user, Coins: 1000 each)

Open multiple browser profiles, incognito windows, or distinct browsers (e.g., Chrome, Firefox, Safari) to simulate different users concurrently.

## 2. Test Cases

### Test Case A: Admin Wheel Creation
1. Login as `admin`.
2. Verify you see the "Create New Wheel Game" button on the dashboard.
3. Click "Create New Wheel Game".
4. The active game section should update to show the new wheel in "pending" status.

### Test Case B: User Joining & Concurrency
1. In separate browser windows, login as `user1`, `user2`, and `user3`.
2. On their dashboards, they should automatically see the pending game via WebSockets.
3. Click "Join Game" for `user1`. Verify 100 coins are deducted from their top-right balance instantly.
4. Attempt to click "Join Game" multiple times rapidly or inspect the API to trigger duplicate requests. Verify the server rejects duplicates.
5. The participants count should update globally across all connected windows.

### Test Case C: Auto-Abort (Not enough players)
1. Have only `user1` and `user2` join the pending wheel.
2. Wait 3 minutes (or have the admin click "Force Start Now").
3. The server should detect less than 3 players.
4. The wheel should abort.
5. Verify that both `user1` and `user2` receive their 100 coins refunded back to their balances.

### Test Case D: Standard Game Loop
1. Create a new wheel as admin.
2. Have `user1`, `user2`, and `user3` join the wheel.
3. The admin clicks "Force Start Now".
4. All 3 users (and the admin) should be immediately redirected to the `/wheel` game arena.
5. Every 7 seconds, one user should be visually eliminated (turns gray with a skull icon).
6. When 1 user remains, the game ends.
7. Verify the winner receives the correct percentage of the pool (Total Pool: 300, Winner gets 80% = 240 coins).
8. The UI should display the winner prominently.

### Test Case E: Persistence
1. Close the browser mid-game and reopen it.
2. You should be securely redirected back to the active game screen.
3. The eliminated users should accurately reflect the ongoing state.
