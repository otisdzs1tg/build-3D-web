# CLAUDE.md — build-3D-web (3D Warehouse AGV Simulation)

This file is for Claude Code to read before working in this repo. Everything here comes from reading
the actual source code, not from the original project plan (`PROJECT.docx`) — a few things diverge,
noted below.

## Overview
A web app that simulates a 3D AGV (warehouse robot) driving autonomously from point A to point B
inside a warehouse, rendered with React Three Fiber. The real source code lives in the subfolder
`3d-warehouse-simulation/` (the repo root only has a shared `package.json` and `README.md`), split
into two separate apps: `3d-warehouse-simulation/frontend` (Vite + React) and
`3d-warehouse-simulation/backend` (Express).

## 🔴 Security — read before committing anything
`3d-warehouse-simulation/backend/.env` is currently tracked in git and contains a real MongoDB Atlas
connection string (username + password). The repo is public. Before doing anything else:
1. Rotate the password for that MongoDB Atlas user.
2. `git rm --cached 3d-warehouse-simulation/backend/.env`, add `.env` to `.gitignore`.
3. Add a root-level `.gitignore` covering `node_modules/`, `dist/`, `.env` (the repo root currently has
   no `.gitignore` at all — only the frontend has one — and both apps' `node_modules` are committed).
4. Never commit `.env`, API keys, connection strings, or any other secret — including in sample code,
   debug logs, or test fixtures.

## Architecture reality — live code vs. dead scaffolding
The repo has two overlapping layers of code. Always confirm you're editing the "actually running" layer
below before changing behavior — confusing the two layers is the most common mistake an AI agent makes
in this repo.

### Actually running (edit here to change behavior)
| File | Role |
|---|---|
| `frontend/src/main.jsx` | Entry point — renders only `<App />`, nothing else |
| `frontend/src/App.jsx` | **The most important file.** Contains the entire dashboard UI, the `<AGV>` component, the `<Shelf>` component, warehouse fetching, route requests, and animation — all in one file, not split into subcomponents |
| `frontend/src/App.css` | All styling, hand-written plain CSS (see Stack section below) |
| `frontend/src/utils/complexMotion.js` | Motion interpolation engine: Catmull-Rom spline + complex-number SLERP for rotation. Fairly intricate math (avoids gimbal lock, constant speed via arc-length parameterization) — edit carefully, add tests before refactoring |
| `backend/src/server.js` | Express + http server, mounts `/api/warehouse`, `/api/route`, the seed endpoint `/api/seed30x30`, initializes Socket.IO |
| `backend/src/routes/routeRoutes.js` | **The actual pathfinding algorithm.** A BFS written directly inside the route handler (not in a separate controller/service), with a buffer zone that expands obstacles by 1 cell, falling back to the raw matrix if the buffer makes the route impossible. This is the real `POST /api/route/calculate` endpoint the frontend calls |
| `backend/src/routes/warehouseRoutes.js`, `controllers/warehouseController.js`, `models/Warehouse.js` | CRUD for the warehouse grid matrix — the only Mongo model that's actually used |

### Dead scaffolding — NOT reachable from `main.jsx`, don't treat as live code
| File | Why it's dead |
|---|---|
| `frontend/src/components/3d/Scene.jsx`, `Vehicle.jsx`, `Warehouse.jsx` | Nothing in the live tree imports them |
| `frontend/src/components/ui/Dashboard.jsx` | Earlier dashboard version, replaced by the UI written directly in `App.jsx` |
| `frontend/src/store/useStore.js` | Zustand is installed (`package.json`) but `App.jsx` uses plain `useState`, never touches this store |
| `frontend/src/sockets/socketClient.js` | `socket.io-client` is installed but no live file imports it |
| `frontend/src/utils/astar.js`, `frontend/src/utils/mapping.js` | Only imported by the scaffold components above |
| `backend/src/controllers/routeController.js` + `backend/src/services/navigationService.js` (`dijkstra2D`, `{row,col}` format) | `routeRoutes.js` does not import either file — this is a forgotten duplicate BFS/Dijkstra implementation, **redundant** with the real BFS in `routeRoutes.js` (which uses `{x,y}` format) |
| `backend/src/models/Vehicle.js`, `backend/src/models/Route.js` | Schemas are defined but nothing ever calls `.save()` on them |
| `backend/src/sockets/socketHandler.js` | Server side is fully wired (multi-AGV realtime sync, heartbeat, emergency-stop) but **no live client emits or listens to it** — only `Vehicle.jsx` does (also dead) |

→ If a task requires reusing part of the scaffolding (e.g. wiring the Zustand store or turning on the
Socket.IO realtime sync), state the plan to "wire X into App.jsx" explicitly before writing code —
don't silently assume it's already connected.

## Actual stack (diverges from PROJECT.docx in a few places)
- Frontend: React 19, Vite, `@react-three/fiber` + `drei`, `three.js`, `axios`, Zustand (unused),
  `socket.io-client` (unused). **No TailwindCSS** despite the original plan listing it — all styling is
  plain CSS in `App.css`.
- Backend: Express 5, Socket.io (fully wired, no real consumer yet), Mongoose/MongoDB Atlas, cors, dotenv.
- The real pathfinding algorithm is an **unweighted BFS** on a 4-directional grid (equivalent to A*
  without a heuristic, since every cell has equal cost), not A* as described in PROJECT.docx.
- `backend/package.json` is missing `express`, `mongoose`, `dotenv`, and `cors` even though they're
  imported in code — those packages currently only live in the root `package.json`. A fresh machine or
  CI that installs `backend/` in isolation (without installing root first) will fail with
  "module not found". `backend/package.json` should declare its own dependencies.

## Running locally
```
# Backend (port 5000, needs .env with MONGODB_URI)
cd 3d-warehouse-simulation/backend && npm install && npm run dev

# Frontend (Vite, default port 5173)
cd 3d-warehouse-simulation/frontend && npm install && npm run dev
```
The backend hardcodes the CORS origin `http://localhost:5173` in both `server.js` (REST) and the
Socket.IO setup — changing the frontend port requires updating both places.

Before the UI can render a warehouse, call `GET /api/seed30x30` once (the complex 30×30 demo map used
for the live demo) or `GET /api/warehouse/seed` (a small 5×5 demo map) to create a `Warehouse` document
in Mongo.

## Data flow — Manual Dispatch feature (the main, live feature)
1. `App.jsx` mounts → `GET /api/warehouse` fetches `matrix`.
2. User enters start/end coordinates → clicks "Khởi hành AGV" (Start AGV) → `POST /api/route/calculate`
   with `{ start: {x,y}, end: {x,y} }`.
3. `routeRoutes.js`: builds a `bufferedMatrix` (obstacles expanded by 1 cell), runs BFS; falls back to
   BFS on the raw matrix if the buffer makes the route impossible; returns `{ path: [{x,y}, ...] }`.
4. Frontend: `convertToSmoothPath` → `generateSmoothPath` (Catmull-Rom + complex-number rotation angle)
   → sets the `smoothPath` state.
5. The `<AGV>` component uses `useFrame` to move along `smoothPath`, with two modes: `discrete` (snap
   step-by-step) and `lerp` (smooth interpolation + complex-number SLERP, currently the default).

## Conventions already in use — stay consistent when adding new code
- All comments, console logs, error messages, and UI labels are in **Vietnamese (with diacritics)** —
  keep this voice.
- Console logs use a leading emoji to categorize: ✅ success, ❌/🚨 error, 📡 socket, 🚀 startup/dispatch.
- Section banner comments use `// ═══...═══`.
- Pure ES Modules (`"type": "module"` in both `package.json` files) — no `require()`.
- Frontend errors currently surface via `alert()` (see `handleStartMission` in `App.jsx`) — there's no
  toast/notification system yet. This is a reasonable improvement candidate but don't change it unless asked.

## Don't do this without being asked
- Don't add Tailwind or another CSS framework without also cleaning up the existing `App.css` —
  that creates two competing styling systems.
- Don't assume Socket.IO is doing realtime sync on the live UI — the server is wired up but no client
  uses it yet.
- Don't edit `dijkstra2D` / `routeController.js` thinking it affects the app — that branch is dead;
  the real pathfinding code is in `routeRoutes.js`.
- Don't change the path coordinate format (`{x,y}`) to `{row,col}` on the live branch without updating
  both `App.jsx` and `routeRoutes.js` together.
- Don't commit `.env`, `node_modules`, or any credential (see the Security section above).
