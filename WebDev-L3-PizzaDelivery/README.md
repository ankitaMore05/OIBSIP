# Pizza Delivery Full-Stack Application

Oasis Infobyte SIP | Web Development & Designing | Level 3, Task 1

A pizza ordering and inventory platform with separate User and Admin roles.

## Tech stack
React (Vite) + React Router | Node.js + Express | MongoDB (Mongoose) | JWT | Razorpay (test mode) | Nodemailer | node-cron

## Features
**User**
- Registration with email verification link
- Login with JWT; forgot-password flow with an emailed reset link (valid 1 hour)
- Dashboard with available pizza varieties
- Custom pizza builder: base (5), sauce (5), cheese (4), vegetables (multi-select)
- Order summary page, then Razorpay checkout (test mode)
- Live order status (Order Received -> In Kitchen -> Sent to Delivery), refreshed by polling every 5 seconds

**Admin**
- Separate admin login (`/admin/login`); registration can only create normal users
- Inventory dashboard (bases, sauces, cheeses, vegetables) with manual stock update
- Stock decreases automatically after each paid order
- Email alert to the admin when an item falls below its threshold (configurable per item, checked by a node-cron job)
- Order management panel: view orders and change status; the user sees the change within seconds

## Security notes
- Passwords hashed with bcrypt; verification and reset tokens stored as SHA-256 hashes
- Prices are calculated on the server; Razorpay payment signature is verified (HMAC SHA-256) before an order is confirmed
- Role checks on every protected route; same error message for wrong email or wrong password

## Setup
Requirements: Node.js 18+, MongoDB running locally (or a MongoDB Atlas URI), a free Razorpay account (test mode keys).

1. Backend
   ```
   cd backend
   npm install
   cp .env.example .env      # then edit .env
   npm start
   ```
   On first start it seeds inventory, 4 pizza varieties and the admin account (`ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env`).
2. Frontend (new terminal)
   ```
   cd frontend
   npm install
   npm run dev
   ```
   Open http://localhost:5173

### Email
Fill in `SMTP_*` in `.env` (for Gmail use an App Password). If SMTP is left empty, emails are printed in the backend console, so you can copy the verification and reset links from there while testing.

### Razorpay test mode
Put your test `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in `.env`. At checkout choose a test payment method and click **Success**.

### Testing the low-stock email
Log in as admin, set an item's "Alert below" higher than its stock, and wait for the next job run. For a quick demo set `STOCK_CRON=* * * * *` (every minute) in `.env`.

## Demo flow for the video
Register -> verify -> login -> build a pizza -> pay (Success) -> open the admin panel in another window -> change the order status -> show it update on the user dashboard -> show stock decrease and the low-stock alert.

## API overview
| Method | Route | Who |
|---|---|---|
| POST | /api/auth/register, /verify, /login, /forgot, /reset | public |
| POST | /api/auth/admin-login | admin |
| GET | /api/menu | user |
| POST | /api/orders/checkout, /api/orders/verify | user |
| GET | /api/orders/mine | user |
| GET, PATCH | /api/admin/inventory | admin |
| GET, PATCH | /api/admin/orders | admin |

## What I learned
(Write 3-4 sentences in your own words.)
