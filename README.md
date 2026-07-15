<div align="center">

# 📒 Backend Ledger
### A Double-Entry Ledger System — Built From Banking Principles, Not Just a Wallet API

Every rupee is tracked as a **DEBIT** and a **CREDIT** — never as a single mutable "balance" field.

[![Node](https://img.shields.io/badge/Node.js-Express%205-339933?logo=node.js&logoColor=white)](#)
[![Database](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)](#)
[![Auth](https://img.shields.io/badge/Auth-JWT%20%2B%20Cookies-000000?logo=jsonwebtokens&logoColor=white)](#)
[![Deployed](https://img.shields.io/badge/Deployed-Render-46E3B7?logo=render&logoColor=white)](#)

[Core Concept](#-core-concept) • [Features](#-features) • [API Reference](#-api-reference) • [Transfer Flow](#-the-transfer-flow-10-steps)

</div>

---

## 🚀 Live

**API:** [backend-ledger-xch2.onrender.com](https://backend-ledger-xch2.onrender.com/)

*(Free-tier Render instance — may take ~30s to spin up on the first request after inactivity.)*

## 📖 About

**Backend Ledger** is a backend system for handling money movement between user accounts the way real financial systems do it: with an **immutable ledger**, atomic MongoDB transactions, idempotent transfers, and a system-user path for injecting funds — not a naive "update balance" API.

There is no `balance` field stored anywhere. Balance is **derived** on every request by aggregating a user's ledger entries. This makes the system audit-safe: nothing can silently drift out of sync, because the ledger itself is the single source of truth and can't be edited or deleted once written.

## 💡 Core Concept

Every transaction creates **two ledger entries**, never one:
- A `DEBIT` entry against the sender's account
- A `CREDIT` entry against the receiver's account

An account's balance is calculated live:
```
balance = totalCredits − totalDebits   (via MongoDB aggregation, on demand)
```

The `Ledger` model enforces this at the schema level — every mutating Mongoose hook (`updateOne`, `deleteOne`, `findOneAndUpdate`, `remove`, etc.) is blocked with a hard `throw`, so ledger entries genuinely cannot be altered or deleted after creation, even by a bug elsewhere in the codebase.

## ✨ Features

### 🔐 Authentication
- JWT-based auth (3-day expiry), delivered via both an HTTP cookie and the response body
- Passwords hashed with `bcrypt` before save (never stored/returned in plain text — `select: false` on the schema field)
- **Token blacklisting on logout** — logging out inserts the token into a blacklist collection, and `authMiddleware` checks every request against it, so a logged-out token can't be reused even though JWTs are normally stateless
- Registration triggers a real welcome email via Nodemailer
- Separate `authSystemUserMiddleware` for endpoints only a designated "system user" account can call

### 🏦 Accounts
- One user can hold multiple accounts, each with a `status` (`ACTIVE`, `FROZEN`, `CLOSED`) and `currency` (defaults to INR)
- Balance is never stored — always computed live from the ledger via aggregation

### 💸 Transactions — the real core of the project
- **Peer-to-peer transfers** (`POST /api/transactions/`) — fully validated, ledger-backed, atomic
- **Idempotency keys** — every transfer requires a unique `idempotencyKey`. Replaying the same key returns the original result instead of double-processing:
  - `COMPLETED` → returns the existing transaction, no reprocessing
  - `PENDING` → tells the caller it's still in progress
  - `FAILED` / `REVERSED` → surfaces the failure instead of silently retrying
- **Account status guard** — both sender and receiver accounts must be `ACTIVE`, or the transfer is rejected
- **Balance guard** — sender's live ledger balance is checked before any transfer; insufficient funds → `400`
- **Atomic MongoDB sessions** — transaction record + both ledger entries are written inside a single `session`, committed together or rolled back together on any failure
- **Transfer email notification** sent after a successful transfer
- **System-issued funds** (`POST /api/transactions/system/initial-funds`) — a separate, deliberately unguarded endpoint restricted to system users, used to inject new money into the system (like a bank creating funds), which is why it has no balance check — it's not "bypassing" the normal check, it's a different endpoint that was never meant to have one

## 🔍 The Transfer Flow (10 steps)

Every `POST /api/transactions/` call runs this exact sequence:

```
1.  Validate request body (fromAccount, toAccount, amount, idempotencyKey)
2.  Check idempotency key — has this exact transfer already been attempted?
3.  Check both accounts are ACTIVE
4.  Derive sender's current balance from the ledger (aggregation)
5.  Create Transaction record → status: PENDING
6.  Create DEBIT ledger entry (sender)
7.  Create CREDIT ledger entry (receiver)
8.  Mark Transaction → status: COMPLETED
9.  Commit the MongoDB session (all-or-nothing)
10. Send email notification to the sender
```
If anything fails between steps 5–9, the whole session aborts — no partial ledger entries, no orphaned transactions.

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Runtime** | Node.js |
| **Framework** | Express 5 |
| **Database** | MongoDB + Mongoose |
| **Auth** | JWT (`jsonwebtoken`), `cookie-parser`, `bcrypt` |
| **Email** | Nodemailer |
| **Deployment** | Render |

## 📡 API Reference

### Auth — `/api/auth`
| Method | Endpoint | Description |
|---|---|---|
| POST | `/register` | Create a user (`name`, `email`, `password`) → sends welcome email, returns user + JWT |
| POST | `/login` | Login with `email`, `password` → returns user + JWT |
| POST | `/logout` | Blacklists the current token so it can no longer be used |

### Accounts — `/api/accounts` 🔒 *(all require auth)*
| Method | Endpoint | Description |
|---|---|---|
| POST | `/` | Create a new account for the logged-in user |
| GET | `/` | List all accounts belonging to the logged-in user |
| GET | `/:accountId/balance` | Get an account's live balance (derived from the ledger) |

### Transactions — `/api/transactions` 🔒 *(all require auth)*
| Method | Endpoint | Description |
|---|---|---|
| POST | `/` | Transfer funds between two accounts (idempotent, balance-checked) |
| POST | `/system/initial-funds` | 🔐 System-user only — inject funds into an account, no balance check |

## 📂 Project Structure

```
Backend-Ledger/
├── server.js                     # Entry point — connects DB, starts Express
├── src/
│   ├── app.js                    # Express app, route mounting
│   ├── config/
│   │   └── db.js                 # Mongoose connection
│   ├── models/
│   │   ├── user.model.js         # Auth + bcrypt password hashing
│   │   ├── account.model.js      # Account status, currency, getBalance()
│   │   ├── ledger.model.js       # Immutable DEBIT/CREDIT entries
│   │   ├── transaction.model.js  # Transaction status + idempotencyKey
│   │   └── blackList.model.js    # Blacklisted (logged-out) JWTs
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── account.controller.js
│   │   └── transaction.controller.js
│   ├── middleware/
│   │   └── auth.middleware.js    # authMiddleware + authSystemUserMiddleware
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── account.routes.js
│   │   └── transaction.routes.js
│   └── services/
│       └── email.service.js      # Nodemailer — registration + transfer emails
```

## 🎯 What This Project Demonstrates

- Double-entry bookkeeping instead of a naive mutable balance field
- True idempotency handling for financial operations (not just deduplication — deduplication *with correct status-aware responses*)
- Atomic multi-document writes via MongoDB sessions/transactions
- An immutable data model enforced at the schema level, not just by convention
- Role-separated endpoints (system user vs. regular user) with different middleware guards
- Practical, incremental debugging — this repo's own test notes trace real bugs found and fixed step by step

## 👤 Author

**Mohammed Nabeel T**
GitHub: [@MD-NABEEL-T](https://github.com/MD-NABEEL-T)

---

<div align="center">
Built to actually understand how money moves — not just to move it.
</div>