# Edge Cases Handled

1. **Duplicate Joins**: Prevented at the controller level. A user attempting to join a game they are already in will be rejected.
2. **Joining Mid-Game**: Users cannot join a wheel unless its status is explicitly `pending`.
3. **Negative Coin Balances**: Transactions fail gracefully and roll back if the user does not have enough coins to cover the entry fee. MongoDB Transactions ensure that no race condition can bypass this validation.
4. **Insufficient Players at Start**: If the 3-minute timer fires (or an admin forces the start) and there are fewer than 3 players, the game intercepts the start, sets the wheel status to `aborted`, and refunds all participating users securely.
5. **Multiple Active Wheels**: The `createWheel` endpoint checks for any existing wheel with a `pending` or `active` status. Admins are blocked from creating a new wheel until the current one resolves.
6. **Last Player Standing**: The game engine is designed to stop gracefully at 1 active player. It does not attempt to eliminate the final user.
7. **Socket Disconnections**: State is maintained strictly on the server database. If a user's connection drops and reconnects, the React `useEffect` hooks automatically pull the latest authoritative wheel state from the REST API to re-sync the view.
