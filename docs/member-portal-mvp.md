# Member Portal — MVP & Roadmap

## What It Is

A public-facing web app (separate route group from the admin dashboard) where library members can self-register, browse the catalog, track their loans, and carry a digital membership card with a QR code. Built inside the same Next.js repo — no separate deployment.

---

## URL Structure

| URL | Audience | Description |
|-----|----------|-------------|
| `/` | Members | Member portal login — PWA `start_url` |
| `/register` | Members | Self-registration |
| `/dashboard` | Members | Member home after login |
| `/books` | Public | Book catalog (no login required) |
| `/books/[id]` | Public | Book detail |
| `/loans` | Members | Active loans + history |
| `/card` | Members | Digital membership card + QR |
| `/admin` | Staff | Admin/librarian login |
| `/admin/dashboard` | Staff | Admin dashboard (current `/dashboard`) |

Members never see `/admin` exists. Staff bookmark `/admin`. The PWA installs from the root and its scope is locked to the member-facing routes.

---

## Route Groups

```
app/[locale]/
  (portal)/                     ← member portal (default, lives at /)
    layout.tsx                  ← mobile-first, minimal header/footer
    page.tsx                    ← redirects to /dashboard or /login
    login/page.tsx
    register/page.tsx
    dashboard/page.tsx
    books/
      page.tsx
      [id]/page.tsx
    loans/page.tsx
    card/page.tsx
    manifest.json               ← PWA manifest, scope = /
    sw.ts                       ← service worker

  (admin)/                      ← admin dashboard (lives at /admin)
    layout.tsx                  ← existing admin layout with sidebar
    admin/
      page.tsx                  ← admin login
      dashboard/page.tsx        ← existing dashboard
      ... (all existing admin routes under /admin/*)
```

Auth is separate from the admin `User` model — members log in with their `memberId` + phone number (or a PIN they set on first login).

---

## ⚠️ Admin Route Migration (Prerequisite)

The current admin dashboard lives at `/` (the root). Before building the portal, all admin routes must be moved under `/admin`. This is a one-time refactor.

**What changes:**

| Current URL | New URL |
|-------------|---------|
| `/` (dashboard redirect) | `/admin` |
| `/dashboard` | `/admin/dashboard` |
| `/books` | `/admin/books` |
| `/members` | `/admin/members` |
| `/loans` | `/admin/loans` |
| `/settings` | `/admin/settings` |
| `/login` (admin) | `/admin/login` |
| `/(auth)/login` route group | `/(admin)/(auth)/login` |

**Steps:**
1. Rename route group `(dashboard)` → `(admin)` and nest all pages under an `admin/` segment
2. Update `middleware.ts` — change auth guard matchers from `/dashboard(.*)` to `/admin(.*)`
3. Update all `redirect()` and `router.push()` calls that point to admin pages
4. Update NextAuth `pages.signIn` from `/login` to `/admin/login`
5. Update any hardcoded links in the sidebar/nav components
6. Verify `/` is now free — the portal `(portal)` route group takes it over

This is purely a file/config change — no schema or API changes needed.

---

## MVP Scope

### 1. Self-Registration

| Field | Notes |
|-------|-------|
| Name (KH) | Required |
| Name (EN) | Optional |
| Phone | Required — used as login credential |
| Email | Optional |
| Member type | STUDENT / TEACHER / PUBLIC / RESEARCHER |
| Class | Optional, only shown for STUDENT |

- On submit, creates a `Member` record with a system-generated `memberId` (e.g. `LIB-2025-00142`)
- Status is **pending** until a librarian approves — member sees a "waiting for approval" screen
- Approval done from the existing admin Settings > Members tab (add an approve button)
- No email verification for MVP — phone is the identity anchor

### 2. Member Login

- Login with `memberId` + phone number (no password reset UI for MVP)
- Session stored in a cookie via NextAuth with a separate `MEMBER` provider
- Auto-redirects to `/portal/dashboard` after login

### 3. Book Catalog

- List all books with cover image, title (KH + EN), author, category, available copies
- Search by title (KH or EN), author, ISBN
- Filter by category and availability (`availableCopies > 0`)
- Book detail page: full info + shelf location + availability badge
- No borrow action from the portal — borrowing is still done by staff at the counter

### 4. Active Loans & History

Shows the member's own loans only, pulled from the `Loan` model.

| Column | Value |
|--------|-------|
| Book title | Link to book detail |
| Borrowed date | `borrowedAt` |
| Due date | `dueAt` with overdue highlight in red |
| Status | ACTIVE / RETURNED / OVERDUE / LOST badge |
| Fine | Amount if any, paid/unpaid indicator |
| Renewals used | `renewalCount` |

### 5. Digital Membership Card + QR Code

A styled card page (`/portal/card`) that shows:

- Member name (KH + EN)
- `memberId` as text + as a **QR code**
- Member type badge
- Expiry date
- Library name + logo

QR code encodes the raw `memberId` string. Staff scan it at the counter using the existing admin interface to pull up the member record instantly.

Use `qrcode.react` library — no server-side generation needed.

The page is print-friendly (`@media xprint` hides the nav) so members can print a physical card.

---

## Data Changes Required

None to the Prisma schema for MVP. Two small additions needed:

1. **`Member.portalPin`** — hashed PIN for portal login. Add as `String?` nullable field.
2. **`Member.portalApproved`** — `Boolean @default(false)` so self-registered members are held until approved.

Migration is additive — no existing data affected.

---

## API Routes Needed

```
POST /api/portal/register         — create Member + send approval to admin
POST /api/portal/auth/[...nextauth] — portal-specific NextAuth route
GET  /api/portal/books            — catalog list (public, no auth)
GET  /api/portal/books/[id]       — book detail (public, no auth)
GET  /api/portal/loans            — member's loans (auth required)
GET  /api/portal/me               — current member profile (auth required)
```

Book catalog endpoints are **public** (no login required) so casual visitors can search without registering.

---

## UI Notes

- Same AntD + Tailwind stack as admin, but lighter theme — white background, minimal chrome
- Bilingual: all labels in KH + EN toggle same as admin
- Mobile-first layout — members will mostly use phones
- QR card page uses a centered card component, no AntD Table

---

## Post-MVP Features (Prioritized)

### High Priority

| Feature | Why |
|---------|-----|
| Book reservation | Member reserves a copy; librarian fulfills — `Reservation` model already exists |
| Overdue push notifications | Telegram Bot already in stack; send reminder 1 day before due |
| Loan renewal request | Member requests renewal; librarian approves or auto-approves if no queue |
| PIN reset via phone OTP | Currently members call the library to reset |

### Medium Priority

| Feature | Why |
|---------|-----|
| Reading history & stats | Gamification — books read, pages, categories |
| Book wishlist / suggestions | Member suggests a title for the library to acquire |
| Notifications inbox | In-app log of overdue alerts, approval messages, due reminders |
| Fine payment status | Show paid/unpaid fines; link to ABA KHQR payment in V2 |
| Search by Khmer keyword | Full-text search on `titleKh` using PostgreSQL `tsvector` |

### Low Priority / V2

| Feature | Why |
|---------|-----|
| Flutter mobile app | Offline-capable, faster QR scan, push via FCM |
| Khmer calendar due dates | Show due date in Chhankitek alongside Gregorian |
| Reading recommendations | Suggest books by category based on borrow history |
| Social features | Reviews, ratings per book |
| ABA KHQR fine payment | Pay overdue fines directly from the portal |
| Class leaderboard | For school libraries — top readers per class |

---

## PWA Setup

The member portal is installable as a PWA — no separate Flutter app needed for V1.

```json
// app/[locale]/(portal)/manifest.json
{
  "name": "Library Portal",
  "short_name": "Library",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1a1a1a",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

- Service worker caches the book catalog and member card for offline viewing
- "Add to Home Screen" prompt shown after first login
- Admin at `/admin` is a regular web app — no PWA manifest there

---

## MVP Build Order

1. **Admin route migration** — move all admin routes under `/admin`, free up `/` (prerequisite)
2. Schema migration — add `portalPin`, `portalApproved` to `Member`
3. Portal NextAuth provider + session types
4. Register + login pages at `/register` and `/`
5. Book catalog (public) — `/books` list + search + `/books/[id]` detail
6. Loans page (authenticated) — `/loans`
7. Digital card + QR code page — `/card`
8. PWA manifest + service worker
9. Admin: approve/reject pending portal registrations (add to Members tab)
