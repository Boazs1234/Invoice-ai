# How to Run Art Sale Record

## Prerequisites

- **Node.js** v20 or later — [download here](https://nodejs.org/)

That's it! The app uses SQLite, which runs as a local file — no database server needed.

---

## 1. Clone the Repository

```bash
git clone <your-repo-url>
cd Art-Sale-Record
```

## 2. Install Dependencies

```bash
npm install
```

## 3. Set Up the Database

Push the schema to create the SQLite database:

```bash
npm run db:push
```

This creates a `sqlite.db` file in the project root.

## 4. Run in Development Mode

```bash
npm run dev
```

The app will be available at **http://localhost:5000** with hot module replacement enabled.

---

## 5. Run in Production Mode

Build the project:

```bash
npm run build
```

Start the production server:

```bash
npm run start
```

The app will serve the compiled frontend and API on **http://localhost:5000**.

---

## Environment Variables

| Variable         | Required | Description                       | Default          |
|------------------|----------|-----------------------------------|------------------|
| `SESSION_SECRET` | No       | Secret key for session encryption | `dev-secret-...` |
| `PORT`           | No       | Port the server listens on        | `5000`           |

---

## Folder Structure

```
Art-Sale-Record/
├── client/          # React frontend (Vite)
│   ├── src/         # Components, pages, hooks
│   └── public/      # Static assets & uploaded images
├── server/          # Express backend
│   ├── index.ts     # Server entry point
│   ├── routes.ts    # API route handlers
│   ├── db.ts        # Database connection
│   └── storage.ts   # File upload config
├── shared/          # Shared schema & route definitions
│   ├── schema.ts    # Drizzle ORM tables + Zod validation
│   └── routes.ts    # Typed API route constants
├── script/
│   └── build.ts     # Production build script
└── sqlite.db        # SQLite database (auto-created)
```
