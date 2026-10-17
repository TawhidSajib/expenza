# Firestore Security Specification for Expenza

## 1. Data Invariants
1. **User Identity Invariant**: A user document at `/users/{userId}` can only be read, created, or updated by the authenticated user whose `request.auth.uid == userId`.
2. **Category Isolation Invariant**: Categories located at `/users/{userId}/categories/{categoryId}` can only be accessed and managed by the owning user (`request.auth.uid == userId`). The `userId` field inside the category document must match `userId` path variable and `request.auth.uid`.
3. **Expense Isolation Invariant**: Expenses located at `/users/{userId}/expenses/{expenseId}` can only be accessed, created, updated, or deleted by the owning user (`request.auth.uid == userId`). The `userId` in the expense payload must match `request.auth.uid`.
4. **Data Sanitization & Limits**: All string fields are constrained in length; numbers for amounts and budgets cannot be negative.
5. **No Orphaned or Spoofed Records**: Document IDs must satisfy `isValidId(id)` pattern with `id.size() <= 128` and matching alphanumeric characters.

## 2. Dirty Dozen Threat Vectors
1. **Unauthenticated Read/Write**: Attempt to read `/users/victim_123` or any subcollection without auth token -> REJECTED.
2. **Cross-Tenant Access**: User `attacker_456` attempting to read or write to `/users/victim_123/expenses/exp_1` -> REJECTED.
3. **Spoofed Owner UID in Category**: User `attacker_456` creating category in their own path `/users/attacker_456/categories/cat_1` with `userId: 'victim_123'` -> REJECTED.
4. **Negative Expense Amount**: User attempting to inject negative or non-numeric amount (e.g., `-99999`) -> REJECTED.
5. **Junk Character Path Variable**: Path variable injection containing 1.5KB invalid symbols -> REJECTED by `isValidId`.
6. **Payload Bloat**: User sending a description/notes string exceeding length limits -> REJECTED.
7. **Shadow Field Injection**: Adding arbitrary fields like `isAdmin: true` or `role: 'superadmin'` to user document -> REJECTED.
8. **Invalid Date Format**: Expense date not conforming to `YYYY-MM-DD` 10-char string -> REJECTED.
9. **Blanket Query Scraping**: Attempting collectionGroup or unscoped collection queries -> REJECTED.
10. **Immutable Field Tampering**: Modifying `id` or `userId` during an update operation -> REJECTED.
11. **Orphaned Sub-Resource**: Writing to a subcollection without parent userId check -> REJECTED.
12. **Unauthorized Deletion**: User attempting to delete another user's categories or expenses -> REJECTED.
