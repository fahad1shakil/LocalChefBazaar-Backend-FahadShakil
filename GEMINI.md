# Project Setup & Troubleshooting

## How to Run the Project

To see the website and its components (Header, Meals, Dashboard) working properly, you MUST have both the frontend and backend running simultaneously.

### 1. Start the Backend Server
Open a terminal in the `server` directory and run:
```bash
npm install
npm start
```
*Note: I have already started the backend server for you in this session.*

### 2. Start the Frontend (Client)
Open a new terminal in the `client` directory and run:
```bash
npm install
npm run dev
```

### 3. Seed the Database
If you don't see any meals on the marketplace, you can seed the database with initial data:
```bash
cd server
node seed.js
```
*Note: I have already seeded the database for you with 18 curated meals.*

## Identified Issues & Fixes

1.  **Backend Inactivity:** The website depends heavily on the backend for meals, user roles, and dashboard data. Without the backend, many sections return `null` or stay in a loading state.
2.  **Environment Variables:** Ensure `client/.env` has `VITE_BACKEND_API=http://localhost:5000` and `server/.env` has a valid `MONGODB_URI`.
3.  **File Naming:** Some files have slightly non-standard names (e.g., `Singin.jsx`, `SingUp.jsx`, `Firebase.confige.js`). These are working but should be kept consistent with imports.
4.  **Empty Files:** `client/src/App.jsx` and `client/src/App.css` were empty but are not currently used by `main.jsx`, so they don't cause crashes.
