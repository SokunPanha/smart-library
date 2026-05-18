# Phase 0 — MVP

> Goal: A working system a single library can use on day one.

**Status:** In Progress

---

## Features Included

### Catalog Management
- [x] Add / edit / delete books
- [ ] ISBN barcode lookup (auto-fill metadata)
- [x] Basic search by title, author, ISBN
- [ ] Book cover image upload
- [x] Dewey Decimal classification

### Member Management
- [x] Member registration (name, ID, contact, type)
- [x] Member types: student, teacher, public, researcher
- [ ] Borrowing history per member (API done, UI pending)

### Circulation
- [x] Check-out (with auto due date by member type)
- [x] Check-in / return
- [x] Mark book as lost
- [x] Loan period configuration by member type (14/30 days)
- [x] Due date calculation
- [x] Basic overdue tracking (auto-mark via dashboard API)
- [x] Simple fine calculation (500 KHR/day)

### Admin
- [x] Admin and librarian roles (JWT-based)
- [x] Login page with auth protection on all routes
- [x] Basic dashboard (total books, members, active loans, overdue)
- [x] Recent loans table on dashboard

### Cambodia-Specific (MVP subset)
- [x] Khmer + English UI (language switcher in header)
- [x] KHR fine calculation
- [ ] Offline-capable core operations (Phase 2)

---

## Remaining MVP Tasks
- [ ] ISBN barcode lookup (Open Library API)
- [ ] Book cover image upload
- [ ] Member borrowing history view (detail drawer)

---

## Out of Scope for MVP
- Digital resources / e-books
- Telegram Bot notifications
- Reporting exports
- Multi-branch
- OPAC (public catalog)
- Payment gateway integration
