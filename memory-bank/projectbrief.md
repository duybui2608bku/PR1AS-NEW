## Project Brief

- **Project**: PR1AS
- **Goal**: Full‑stack marketplace platform connecting **Clients** and **Workers**, with secure wallet/escrow, rich worker profiles, booking/transactions, real-time chat, favorites system, and powerful admin tools.
- **Scope (platform)**:
  - **Core flows** (auth, worker profiles, wallet & escrow, admin, i18n) are implemented and documented in `MEMORY_BANK.md` (v1.0, production‑ready).
  - **New features**: Chat system (real-time messaging), Booking system (service bookings with status workflow), Worker favorites (client bookmarking), Site settings history (versioning).
  - **Security enhancements**: Rate limiting, password validation, token refresh, admin authorization improvements (role-based instead of hardcoded email).
  - Database, API routes, and frontend architecture follow the patterns described in `MEMORY_BANK.md` and refactor docs.
- **Current Session Scope**:
  - No specific feature is in progress until the user defines a new task.
  - This Memory Bank exists to make it easy to resume work after resets by pointing to the right docs and code entry points.
- **Key Reference Docs**:
  - High level: `MEMORY_BANK.md`
  - Feature & implementation notes: `docs/` and `progess/`
  - Refactor & security reviews: `refactor/admin.md`, `refactor/auth.md`, `refactor/worker-profile.md`

