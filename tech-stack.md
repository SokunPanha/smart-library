# Tech Stack

## Architecture Decision
**Next.js full-stack** (no separate API service) — one repo, one deployment. API layer exposed via App Router Route Handlers when mobile app needs it in V2.

---

## Frontend & UI

| Tool | Decision |
|------|----------|
| Framework | **Next.js 15** (App Router) |
| UI Library | **Ant Design v5** |
| Styling | **Tailwind CSS v4** (layout + utilities alongside AntD) |
| Language | **TypeScript** |

### AntD Minimalist Theme Strategy
Override Design Tokens globally via `ConfigProvider` to strip the heavy default look:

```ts
token: {
  colorPrimary: '#1a1a1a',        // near-black primary (or a single accent color)
  borderRadius: 6,                 // tighter radius
  fontFamily: 'Inter, sans-serif', // clean sans-serif
  colorBgContainer: '#ffffff',
  colorBorder: '#e5e7eb',          // softer border
  boxShadow: 'none',               // remove card shadows
  boxShadowSecondary: 'none',
}
```

- Use `theme.useToken()` for consistent spacing throughout
- Tailwind handles page layout, grid, and gap — AntD handles components
- Khmer font: **Noto Sans Khmer** loaded via `next/font`

---

## Backend (within Next.js)

| Tool | Decision |
|------|----------|
| API Layer | Next.js App Router Route Handlers |
| ORM | **Prisma** |
| Auth | **NextAuth.js v5** (credentials provider) |
| Validation | **Zod** |

---

## Database

| Tool | Decision |
|------|----------|
| Primary DB | **PostgreSQL** |
| Local / Offline | **SQLite** (via Prisma, switchable) |

---

## Mobile — Phase 2

| Tool | Decision |
|------|----------|
| Framework | **Flutter** (Android-first, iOS later) |

---

## Other Services

| Service | Tool |
|---------|------|
| Notifications | Telegram Bot API |
| Mobile Push | Firebase Cloud Messaging |
| Payments | ABA KHQR / Wing API |
| SMS | Cellcard / Smart gateway |

---

## Hosting

| Environment | Option |
|-------------|--------|
| Production | VPS (DigitalOcean or local Cambodian provider) |
| Offline branch | Local server (Next.js + PostgreSQL on-prem) |
| Dev | Vercel (preview deployments) |

---

## Key Libraries

```
antd                  — UI components
tailwindcss           — layout utilities
prisma                — ORM
next-auth             — authentication
zod                   — schema validation
react-query           — server state / data fetching
dayjs                 — date handling (lightweight, AntD compatible)
@nivo/charts          — reporting charts (lightweight alternative to Recharts)
next-intl             — Khmer / English UI translation (km.json + en.json)
```

---

## Khmer Language Support

AntD does **not** ship a Khmer locale officially. Three layers required:

### 1. AntD Component Labels
Create a custom `km_KH` locale object (~60 strings) and pass it to `ConfigProvider`:
```ts
import { ConfigProvider } from 'antd'
import kmKH from '@/locales/antd/km_KH'

<ConfigProvider locale={kmKH} theme={minimalTheme}>
```
Covers: pagination, date picker, table, modal buttons, form validation messages, etc.

### 2. App UI Text — next-intl
All page-level text (labels, headings, nav) managed via translation files:
```
locales/
  en.json
  km.json
```
Language toggle stored in a cookie — switches without page reload.

### 3. Khmer Font
```ts
// app/layout.tsx
import { Noto_Sans_Khmer } from 'next/font/google'

const khmer = Noto_Sans_Khmer({ subsets: ['khmer'], weight: ['400', '500', '600'] })
```
Set as `fontFamily` in AntD theme token so Khmer characters render correctly inside all AntD components.

### 4. Khmer Calendar (Chhankitek)
AntD DatePicker uses Gregorian only. Khmer calendar display is a custom wrapper — Gregorian is used internally, Khmer date shown as a label alongside. Addressed in V1.
