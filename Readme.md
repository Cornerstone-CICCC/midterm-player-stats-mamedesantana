# Player Performance Explorer — Complete Midterm Project

## 1. Database

```bash
createdb worldcup
cd docs
psql -d worldcup
```

Inside `psql`:

```sql
\i setup_db.sql
\q
```

## 2. Server

```bash
cd server
cp .env.example .env
npm install
npm run dev
```

Edit `.env` if your PostgreSQL username/password differs. API: `http://localhost:3000`.

## 3. Client

Open another terminal:

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

Open `http://localhost:4321`.

## Features

- Full CRUD for performances
- Server-side pagination and 10/25/50/100 rows selector
- Search, team filter, position filter, sorting
- Full detail page
- PostgreSQL JOINs
- Ranking aggregate with COUNT, SUM, AVG, GROUP BY
- Parameterized values and allow-listed sort columns

## Submission

Add normalization screenshots and UI screenshots to `deliverables/`. A draft `reflection.md` is included and should be personalized before submission.
