# LibraCore

A full-featured library management system built for school libraries.

## Features

- **Catalog** — Book inventory with shelf assignment, cover images, ISBN, Dewey codes, and tags
- **Members** — Student, teacher, and public member management with QR card printing and bulk import
- **Circulation** — Loan checkout/return, renewals, overdue tracking, fine management, and reservations
- **Visitor Log** — Check-in/checkout with purpose tracking; kiosk mode for self-service QR scanning
- **Reports** — Circulation trends, popular books, top visitors, peak hours, overdue list, and more
- **Settings** — Library profile, loan rules, fine rates, shelf management, library map, and user accounts
- **Bilingual** — Full Khmer (ខ្មែរ) and English interface

## Tech Stack

- [Next.js 16](https://nextjs.org) (App Router)
- [Prisma 7](https://prisma.io) + PostgreSQL
- [Ant Design 6](https://ant.design)
- [next-auth v5](https://authjs.dev) (JWT, credentials)
- [next-intl](https://next-intl.dev) (i18n)
- [Cloudinary](https://cloudinary.com) (image uploads)
- [TanStack Query](https://tanstack.com/query)
- Tailwind CSS v4

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database
- Cloudinary account

### Environment Variables

Create a `.env` file:

```env
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=http://localhost:3000
CLOUDINARY_CLOUD_NAME=your-cloud
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret
```

### Install & Run

```bash
npm install
npx prisma migrate deploy
npm run seed       # seed demo data
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Default admin credentials (after seeding):

| Email | Password |
|-------|----------|
| admin@hunsenkchao.edu.kh | admin1234 |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run seed` | Seed the database with demo data |
| `npm run lint` | Run ESLint |
