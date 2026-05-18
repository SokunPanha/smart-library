# Phase 0 — MVP

> Goal: A working system a single library can use on day one.

**Status:** Planned

---

## Features Included

### Catalog Management
- [ ] Add / edit / delete books
- [ ] ISBN barcode lookup (auto-fill metadata)
- [ ] Basic search by title, author, ISBN
- [ ] Book cover image upload
- [ ] Dewey Decimal classification

### Member Management
- [ ] Member registration (name, ID, contact, type)
- [ ] Member types: student, teacher, public
- [ ] Borrowing history per member

### Circulation
- [ ] Check-out and check-in (manual entry + barcode scan)
- [ ] Loan period configuration by member type
- [ ] Due date calculation
- [ ] Basic overdue tracking
- [ ] Simple fine calculation (KHR / USD)

### Admin
- [ ] Admin and librarian roles
- [ ] Basic dashboard (total books, members, active loans)

### Cambodia-Specific (MVP subset)
- [ ] Khmer + English UI
- [ ] KHR / USD dual currency
- [ ] Offline-capable core operations

---

## Out of Scope for MVP
- Digital resources / e-books
- Telegram Bot notifications
- Reporting exports
- Multi-branch
- OPAC (public catalog)
- Payment gateway integration
