# jeetwise

`jeetwise` is a Splitwise-like React app for shared expenses with:

- React + TailwindCSS
- Firebase Anonymous Auth
- Firestore real-time room sync with `onSnapshot`
- A 4-digit room code system
- A greedy settlement algorithm to minimize transactions
- Static hosting support for GitHub Pages

## Project structure

```text
src/
  components/
    ExpensesPanel.jsx
    PanelShell.jsx
    ParticipantsPanel.jsx
    RoomGate.jsx
    RoomHero.jsx
    SettlementPanel.jsx
  lib/
    firebase.js
    format.js
    roomApi.js
    settlements.js
  App.jsx
  index.css
  main.jsx
```

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the environment file and add your Firebase web config:

   ```bash
   cp .env.example .env
   ```

3. Start the app:

   ```bash
   npm run dev
   ```

## Firebase setup

1. Create a Firebase project.
2. Enable **Authentication**:
   - Go to `Authentication -> Sign-in method`
   - Enable `Anonymous`
3. Create a **Firestore Database** in production or test mode.
   - This step is required. If you skip it, room creation will fail because the Cloud Firestore API or default database is not active yet.
   - In Firebase Console, open `Build -> Firestore Database` and click `Create database`
4. Add a **Web App** in Firebase and copy the config values into `.env`.
5. Add Firestore rules that allow authenticated anonymous users to read and write rooms. Example:

   ```text
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /rooms/{roomCode} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

## GitHub Pages deployment

GitHub Pages is free for public repositories, and this project is set up to deploy automatically with GitHub Actions.

1. Push the code to a GitHub repository named `jeetwise`.
2. In GitHub, open `Settings -> Pages`.
3. Under `Build and deployment`, choose `GitHub Actions` as the source.
4. In `Settings -> Secrets and variables -> Actions`, add these repository secrets:

   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`

5. Push to `main`. The workflow at `.github/workflows/deploy.yml` will build and publish the app.

If your repo is not named `jeetwise`, update both `.env` and `vite.config.js` so the base path matches:

```bash
VITE_BASE_PATH=/your-repo-name/
```

Then also update the workflow's `VITE_BASE_PATH` value in `.github/workflows/deploy.yml`.

For a user or organization site, set:

```bash
VITE_BASE_PATH=/
```

## Firestore data model

Each room is stored as:

```text
rooms/{roomCode}
```

Example shape:

```json
{
  "code": "4821",
  "participants": [
    { "id": "firebaseAuthUid", "name": "Jeet" },
    { "id": "person_xxx", "name": "Aisha" }
  ],
  "expenses": [
    {
      "id": "expense_xxx",
      "description": "Groceries",
      "amount": 1200,
      "paidBy": "firebaseAuthUid",
      "splitBetween": ["firebaseAuthUid", "person_xxx"],
      "createdAt": "2026-04-20T18:30:00.000Z"
    }
  ]
}
```

## Notes

- Joining a room auto-adds or updates the current anonymous user as a participant.
- Participants can only be removed if they are not referenced by any stored expense.
- Settlement suggestions are computed client-side from room data and update live for everyone subscribed to the room.
