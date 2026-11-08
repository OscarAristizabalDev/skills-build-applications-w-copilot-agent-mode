# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

- Presentation tier decision: Use a thin React layer that reads and renders API data through a shared client, with loading, empty, and error states exposed as accessible status and alert elements so the browser UI stays decoupled from business logic.
- Logic tier decision: Keep all API behavior in Express routes and services, validating requests before hitting MongoDB and returning deliberate 4xx responses for missing references, bad IDs, and invalid payloads instead of leaking cast errors as 500s.
- Data tier decision: Define Mongoose schemas with required fields, default arrays, and realistic relationships between users, teams, activities, and workouts so the database enforces the contract before the API layer is tested.
- Activity tracking approach: Accept `userId` and `teamId`, verify both objects exist, store the normalized `user`, `team`, `type`, `minutes`, and computed `points` plus `occurredAt`, and expose the result through list/create endpoints.
- Team management approach: Require a name and mascot, keep members as an array of user IDs, and allow creation/listing while preserving the contract that teams have a valid membership list and a 400 on missing required fields.
- Leaderboard approach: Aggregate activity points by team, sort highest total first, and emit `teamName`, `totalPoints`, and a 1-based `rank` so the ranking stays deterministic and testable.
- Workout suggestions approach: Match the seeded user's email to their recent activity or goal, then recommend the highest-fit workout with a reason string that explains the pattern and return a proper 4xx for an unknown user.

## Test plan

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend` — validates the Mongoose schemas and seed data contract; failures here mean the database layer is not enforcing required fields or seeded relationships.
- API command: `npm run test:api --prefix octofit-tracker/backend` — validates the Express endpoints, validation behavior, leaderboard aggregation, and workout recommendation logic; failures here mean the logic tier is not matching the /api contract.
- Frontend command: `npm test --prefix octofit-tracker/frontend` — validates the React UI contract, including loading, empty, and error states as well as fetch behavior against the API; failures here mean the presentation tier is not rendering real API-driven states.
- Backend build command: `npm run build --prefix octofit-tracker/backend` — checks TypeScript compilation for the server and data layer; build breaks here indicate type-level contract mismatches or invalid imports.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend` — checks TypeScript and Vite compilation for the UI layer; build breaks here indicate the frontend is not aligned with the project’s React/Vite contract.
