# CLAUDE.md — Rise Up Arena

## Project Overview
Rise Up Arena is a Brazilian esports competitive platform. React 19 + Vite frontend, Express 5 backend, Supabase (PostgreSQL + Auth + Realtime).

## Architecture
```
RiseUpArena/
├── frontend/          # React 19 + Vite 7 + TailwindCSS 4
│   └── src/
│       ├── components/   # Navbar, ProtectedRoute, ChatPanel, Cards, etc.
│       ├── contexts/     # AuthContext, RealtimeContext
│       ├── lib/          # api.js, supabase.js, useCaptcha.jsx
│       └── pages/        # 13 pages (auth/, admin/, etc.)
├── backend/           # Express 5 + Supabase Admin Client
│   └── src/
│       ├── routes/       # 9 route files (games, lobbies, matches, etc.)
│       ├── middleware/   # auth.js, captcha.js
│       └── lib/          # supabase.js, elo.js
├── docs/              # schema.sql, SETUP.md
└── scripts/           # setup.sh
```

## Tech Stack
- **Frontend**: React 19, Vite 7.3, TailwindCSS 4.2, React Router 7, Lucide icons
- **Backend**: Express 5, Helmet, express-rate-limit, CORS
- **Database**: Supabase PostgreSQL with RLS, Realtime
- **Auth**: Supabase Auth (email/password + Google OAuth)
- **Language**: Brazilian Portuguese (PT-BR) throughout UI

## Key Commands
```bash
# Frontend
cd frontend && npm run dev      # Dev server on :5173
cd frontend && npm run build    # Production build to dist/

# Backend
cd backend && npm run dev       # Nodemon on :3001
cd backend && npm start         # Production
```

## Environment Variables
**Frontend** (.env): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_RECAPTCHA_SITE_KEY`, `VITE_API_URL`
**Backend** (.env): `PORT`, `FRONTEND_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `RECAPTCHA_SECRET_KEY`

## Database
- **14 tables**: profiles, games, tournaments, tournament_participants, tournament_matches, lobbies, lobby_players, matches, match_players, rankings, player_stats, store_products, orders, chat_messages
- **RLS enabled** on all tables
- **Realtime** on: lobbies, lobby_players, chat_messages, matches, tournament_matches
- **ELO system**: 400-base, K=32, 7 tiers (bronze→legend)
- **Dual currency**: Rise Coins (RC, premium) + Arena Coins (AC, earned)

## Supabase Project
- **Project ID**: ncfsipepanciborcfidx
- **Region**: (check Supabase dashboard)

---

# SECURITY AUDIT — 26 Issues Found

## CRITICAL (4)

### 1. Supabase credentials committed to git
**File**: `frontend/.env`
The `.env` with real keys exists in the repo. Even though `frontend/.gitignore` lists `.env`, there's no root-level `.gitignore`.
**Fix**: Add root `.gitignore`, rotate keys if repo was ever pushed, use `BFG Repo-Cleaner` to purge history.

### 2. No root or backend .gitignore
**Files**: `.gitignore` (MISSING), `backend/.gitignore` (MISSING)
The `SUPABASE_SERVICE_KEY` (bypasses ALL RLS) could be committed with `git add .`.
**Fix**: Create root and backend `.gitignore` files covering `.env`, `node_modules`.

### 3. Double-spend vulnerability in store purchases
**File**: `backend/src/routes/store.js:52-92`
Credit deduction is non-atomic (read → check → write). Concurrent requests can all pass the balance check.
**Fix**: Use atomic SQL: `UPDATE profiles SET credits = credits - $1 WHERE id = $2 AND credits >= $1 RETURNING credits`. Same for stock.

### 4. All backend operations bypass RLS
**File**: `backend/src/lib/supabase.js`
Every route uses the admin (service role) client. `createUserClient()` exists but is never used. RLS is only a frontend safeguard.
**Fix**: Use user-scoped client (with anon key + user JWT) for user-context operations. Reserve service role for server-internal ops only.

## HIGH (6)

### 5. Filter injection in admin search
**File**: `backend/src/routes/admin.js:26`
Search param interpolated into `.or()` filter string. Special chars (`,`, `.`, `()`) can manipulate query logic.
**Fix**: Sanitize input or use separate `.ilike()` calls.

### 6. No input validation on backend routes
**Files**: All `backend/src/routes/`
UUID params, body fields passed directly to Supabase without type/format validation.
**Fix**: Add `zod` or `express-validator` for all route inputs.

### 7. CPF stored as plaintext
**File**: `frontend/src/contexts/AuthContext.jsx:85-100`
CPF (equivalent to SSN) stored in `raw_user_meta_data` as plaintext JSON. Privacy policy claims it's stored securely — this is false.
**Fix**: Hash CPF server-side for uniqueness checks, encrypt at rest if display needed. Validate on backend, not just frontend.

### 8. Profile update allows privilege escalation
**File**: `frontend/src/contexts/AuthContext.jsx:138-152`
`updateProfile(updates)` passes arbitrary object to Supabase. User can set `role: 'admin'`, `credits: 999999`, `email_verified: true` from DevTools.
**Fix**: Allowlist fields: `['display_name', 'bio', 'avatar_url']`. Add DB trigger to prevent role/credits/email_verified changes by users.

### 9. Admin check is client-side only
**File**: `frontend/src/components/ProtectedRoute.jsx:61-63`
Admin UI guard is React-only. Backend admin routes ARE properly protected, but admin UI code is sent to all users.
**Fix**: Lazy-load admin page. Ensure all admin actions go through admin-protected API endpoints.

### 10. Inconsistent chat message length limits
**Files**: Frontend (500), Backend (2000), Database (1000)
Messages 1001-2000 chars pass backend but fail DB constraint.
**Fix**: Align all to 1000 chars.

## MEDIUM (8)

### 11. CAPTCHA is optional and disconnected
CAPTCHA silently disabled when env var missing. Verification is a separate API call, not tied to auth action.
**Fix**: Make reCAPTCHA key required. Move verification to backend as prerequisite for auth.

### 12. CORS origin unvalidated
`FRONTEND_URL` env var used directly. If set to `*` with `credentials: true`, security is broken.
**Fix**: Validate at startup.

### 13. Supabase error messages leaked to clients
20+ locations return raw `error.message` exposing table/column/constraint names.
**Fix**: Create safe error mapper, log internally, return generic messages.

### 14. reCAPTCHA score leaked in response
`backend/src/middleware/captcha.js:34-37` returns score to client, helping bots tune their behavior.
**Fix**: Remove score from response.

### 15. RLS admin policies use per-row subqueries
12 policies execute `EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')` per row.
**Fix**: Create `is_admin()` STABLE function.

### 16. SECURITY DEFINER without search_path
`handle_new_user()` runs as superuser without `SET search_path = public`.
**Fix**: Add `SET search_path = public` to all SECURITY DEFINER functions.

### 17. Duplicate SELECT policies on orders table
Both user and admin SELECT policies evaluate for every row.
**Fix**: Combine into single policy with OR.

### 18. No body size limit on express.json()
Default 100KB allows memory exhaustion at scale.
**Fix**: `express.json({ limit: '10kb' })`.

## LOW (8)

### 19. Global rate limiter only — no per-route limits
Auth endpoints allow 100 attempts per 15 min (credential stuffing risk).
**Fix**: Per-route limiters (auth: 10/15min, API: 200/15min).

### 20. No CSRF protection
Mitigated by Bearer token auth (not cookie-based). Document this dependency.

### 21. Supabase client falls back to placeholder silently
**Fix**: Throw error if env vars missing.

### 22. Weak password policy (6 chars, no complexity)
**Fix**: Minimum 8 chars, require letter + number. Configure Supabase server-side too.

### 23. No token refresh failure handling
User silently loses auth state without explanation.
**Fix**: Handle `TOKEN_REFRESHED` with null session, redirect to login.

### 24. Public profile route without auth
`/profile/:userId` exposes stats and match history to anyone.
**Fix**: Add privacy toggle if needed.

### 25. console.error throughout production code
Leaks internal details in browser DevTools and server logs.
**Fix**: Use structured logging (pino/winston) on backend, conditional logger on frontend.

### 26. Error handler depends on NODE_ENV === 'production'
Typos like `prod` or `Production` expose error details.
**Fix**: Default to safe behavior, only show details when `NODE_ENV === 'development'`.

---

# PERFORMANCE & SCALABILITY NOTES

## Database Indexes Needed
The current schema has basic indexes. For millions of users, add:
- Composite indexes for common query patterns (e.g., `rankings(game_id, rating DESC)` already exists)
- Partial indexes for filtered queries (e.g., `WHERE status = 'waiting'` on lobbies)
- Consider `BRIN` indexes on `created_at` columns for time-range queries on large tables

## Missing Optimizations
- **No lazy loading**: All pages loaded upfront (559KB JS bundle). Use `React.lazy()` + `Suspense`.
- **No query caching**: Frontend makes fresh Supabase calls every render. Add React Query or SWR.
- **No connection pooling**: Configure Supabase connection pooler (PgBouncer) for production.
- **No CDN**: Static assets should go through Cloudflare CDN (already planned).
- **Chat messages**: Will grow fastest. Consider partitioning by month or archiving old messages.
- **Materialized views**: Create for leaderboard/ranking pages to avoid expensive joins at read time.

## Bundle Size
Current: 559KB (150KB gzipped). Split with:
```js
const AdminPage = lazy(() => import('./pages/admin/AdminPage'))
const StorePage = lazy(() => import('./pages/StorePage'))
// etc.
```

---

# CODING CONVENTIONS

- **Language**: All UI text in Brazilian Portuguese (PT-BR)
- **Styling**: TailwindCSS utility classes, dark theme, orange primary (#e8611a)
- **Components**: Functional React components with hooks
- **State**: React Context (AuthContext, RealtimeContext) — no Redux
- **API calls**: Centralized in `frontend/src/lib/api.js`
- **Backend**: Express router pattern, one file per resource
- **Auth flow**: Supabase handles JWT, backend verifies with `auth.getUser(token)`
- **Error handling**: Try/catch in all async handlers

---

# PRIORITY FIX ORDER

1. **IMMEDIATE**: Create root + backend `.gitignore` (Issue #2)
2. **IMMEDIATE**: Fix privilege escalation in `updateProfile` (Issue #8)
3. **IMMEDIATE**: Fix double-spend in store (Issue #3)
4. **HIGH**: Add input validation with zod (Issue #6)
5. **HIGH**: Stop leaking Supabase errors (Issue #13)
6. **HIGH**: Align chat message limits (Issue #10)
7. **HIGH**: Hash/encrypt CPF (Issue #7)
8. **MEDIUM**: Create `is_admin()` SQL function (Issue #15)
9. **MEDIUM**: Add per-route rate limiting (Issue #19)
10. **MEDIUM**: Lazy load pages for bundle splitting
