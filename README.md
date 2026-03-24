[README.md](https://github.com/user-attachments/files/26217663/README.md)
# Art Sale Record

#### Video Demo: <URL HERE>

#### Description:

Art Sale Record is a full-stack web application designed to help artists and galleries create, manage, and print professional invoices for artwork sales. Instead of relying on generic invoicing tools that know nothing about art, this app is built specifically for the needs of artists: it supports fields like artwork title, medium, dimensions, and year of creation, alongside the usual seller and buyer information. Users can upload their studio logo and an image of the artwork itself, and then generate a print-ready or PDF invoice in one click.

The application supports multiple user accounts with secure authentication, so each artist's invoices are private and only accessible to them. A set of read-only example invoices is shown to visitors who are not logged in, giving them a preview of what the app can produce before they sign up.

---

## Files and What They Do

### `shared/schema.ts`

This file is the backbone of the entire application. It defines the PostgreSQL database tables using Drizzle ORM — a `users` table for accounts and an `invoices` table that stores all invoice fields. It also exports Zod insert schemas derived directly from the table definitions, which means the same validation rules are enforced on both the server (before writing to the database) and the client (before the form is submitted). Having one source of truth here eliminates an entire category of bugs where the frontend and backend disagree about what a valid invoice looks like.

### `shared/routes.ts`

This file defines every API route as a typed constant along with the Zod schemas for request bodies and responses. Both the Express server and the React frontend import from this file, so if a route ever changes, TypeScript will immediately flag any mismatches. This pattern — sharing route definitions across the stack — is what makes the application end-to-end type-safe without requiring a separate code generation step.

### `server/index.ts`

The Express server entry point. It sets up session middleware, attaches the API router, and in development mode integrates with the Vite dev server so the React frontend is served through the same process. In production it serves the pre-built frontend from the `dist/public` directory.

### `server/routes.ts`

Contains all the API route handlers: user registration, login, logout, and the full CRUD API for invoices (list, create, read, update, delete). Every write route checks that a valid session exists before proceeding, so unauthenticated requests are rejected at the server level regardless of what the frontend shows.

### `server/db.ts`

Initializes the Drizzle ORM client with a connection to PostgreSQL using the `DATABASE_URL` environment variable. Keeping the database connection in its own module makes it easy to import wherever it's needed without creating multiple connections.

### `server/storage.ts`

Configures Multer for handling image file uploads. Uploaded files are saved to `client/public/uploads/` with a timestamp-prefixed filename to avoid collisions. The server returns the public URL path so the frontend can display or embed the image immediately.

### `client/src/App.tsx`

The root of the React application. It wraps the entire app in the authentication context provider and TanStack Query client provider, then sets up client-side routing with Wouter. Routes are defined here: the home page, create/edit/view invoice pages, sign-in, and sign-up.

### `client/src/pages/Home.tsx`

The main dashboard showing the user's list of invoices. It fetches invoice data through TanStack Query, which handles caching and background refetching automatically. Each invoice card shows key details and links to the view and edit pages. Example invoices (read-only) are shown to visitors who are not authenticated.

### `client/src/pages/CreateInvoice.tsx` and `EditInvoice.tsx`

These pages both render the shared `InvoiceForm` component — create passes in empty defaults, edit fetches the existing invoice and pre-populates the form. Keeping the form logic in one component means any validation change or new field only needs to be added once.

### `client/src/pages/ViewInvoice.tsx`

Renders a polished, print-ready view of a single invoice. It includes buttons to download the invoice as a PDF (using html2canvas and jsPDF) or to trigger the browser's print dialog. The layout mimics a formal sales document with logo, artist details, buyer details, artwork information, and pricing.

### `client/src/components/InvoiceForm.tsx`

The largest component in the app. It handles all form state through React Hook Form with Zod validation, image upload interactions, and the live preview panel. Splitting form logic and preview rendering into separate components (InvoiceForm and InvoicePreview) keeps each file focused and easier to reason about.

### `client/src/components/InvoicePreview.tsx`

A pure presentational component that takes invoice field values as props and renders the formatted invoice layout. Because it receives only props and has no internal state, it can be used both inside the form (for the live preview) and on the view page without any changes.

### `client/src/hooks/use-auth.tsx`

Implements the authentication context: it exposes the current user, a login function, a logout function, and a register function to any component that needs them. Centralizing auth state in a context means components never have to prop-drill user information through the component tree.

### `client/src/hooks/use-invoices.ts`

Wraps the invoice API calls in TanStack Query hooks (`useQuery` for fetching, `useMutation` for create/update/delete). Each mutation automatically invalidates the invoice list cache on success, so the UI stays in sync with the server without manual refresh logic.

---

## Design Choices

**Why Wouter instead of React Router?** Wouter is a much smaller library (about 1.5 KB versus React Router's ~50 KB) and its API is essentially identical for the simple page-level routing this app needs. For a project with a handful of routes and no need for nested layouts or data loaders, Wouter is the right tool.

**Why session-based authentication instead of JWTs?** Sessions stored server-side in PostgreSQL are easier to invalidate immediately if a user logs out or an account is compromised. JWTs are stateless, which is an advantage in distributed systems, but this is a single-server application — the statefulness of sessions is not a problem, and the ability to instantly revoke a session is a genuine advantage.

**Why Drizzle ORM instead of Prisma?** Drizzle lets you write queries that are very close to SQL, which makes it easier to understand exactly what is being sent to the database. Prisma abstracts more aggressively and generates its own client, which adds build complexity. For a project like this where the schema is straightforward, Drizzle's lighter footprint and closer-to-SQL style are the better fit.

**Why a shared `schema.ts` for both frontend and backend?** Duplicating validation logic across the stack is a common source of bugs — the server accepts something the client doesn't validate, or vice versa. By deriving Zod schemas directly from the Drizzle table definitions and importing them on both sides, there is only one place to update when a field changes.

**Why html2canvas + jsPDF for PDF generation instead of a server-side approach?** Client-side PDF generation avoids the need for a headless browser or a PDF rendering service on the server. The invoice layout is already rendered in the browser as HTML and CSS, so capturing it with html2canvas and converting to PDF with jsPDF produces a result that exactly matches what the user sees on screen, with no additional server infrastructure required.

---

## Running the Project

The application uses a local SQLite database, so no external database server is required. To run the project locally:

```bash
npm install
npm run db:push
npm run dev
```

The development server starts on port 5000 (`http://localhost:5000`), with hot module replacement for the frontend and automatic server restarts.

---

## AI Citation

In accordance with CS50's academic honesty policy, I utilized AI coding assistants (Google Gemini / Claude) to help scaffold the boilerplate code, configure the Vite + Express build system, debug TypeScript errors, and assist with migrating the database from PostgreSQL to SQLite. All generated code was reviewed, tested, and understood by me before inclusion in the final project.
