# Family Medicine Tracker — Developer Spec

## 1. Overview
A web app that lets a family track medicine stock at home, get reminders to take medicine on time (tied to meals), get warned when stock/insulin runs low with a one-tap call to the pharmacy, and see medicine spending trends.

Primary users: multiple family members sharing one household account, possibly with different roles (e.g. parent manages, elderly member just gets reminders).

## 2. Core Modules

### 2.1 Medicine Inventory
- Add a medicine: name, form (tablet/syrup/insulin/injection etc.), current quantity, unit (pills, ml, units), low-stock threshold, expiry date, assigned family member.
- Edit/delete medicine.
- Auto-decrement stock each time a dose is marked "taken" (from the reminder flow).
- Manual stock adjustment (e.g. after refilling).
- Low-stock flag: when quantity ≤ threshold, mark medicine as "low" and surface it on the dashboard.
- Insulin gets the same low-stock logic but should support smaller thresholds/units (e.g. "2 pens left").

### 2.2 Reminders
- Each medicine has one or more schedule entries: time of day + relation to meal (before food / after food / with food / anytime).
- Meal times are set once per household (or per user) in Settings: Breakfast, Lunch, Dinner — each a simple time value.
- When a medicine's schedule says "before breakfast," the reminder engine computes the actual notification time as (breakfast time − offset, e.g. 30 min), configurable.
- Reminder fires as a push/browser notification: "Time for [medicine name] — before lunch."
- User actions on a reminder: Mark as taken (decrements stock), Snooze, Skip.
- Separate reminder type: low-stock/refill reminder, fired once stock crosses the threshold (not meal-linked).
- Missed-dose handling: if not acted on within a grace period, log it as "missed" for the adherence history.

### 2.3 Medical Store / Pharmacy
- Store one or more pharmacy contacts per household: name, phone number, address (optional), notes.
- On a low-stock alert, show a "Call [store name]" button.
- Call button uses a `tel:` link so it opens the device's native dialer — this only works meaningfully on mobile; on desktop it can open the OS calling app if one is registered, otherwise show the number to copy.
- Optionally support multiple stores (e.g. "usual pharmacy" and "backup") with quick switch.

### 2.4 Expense Tracking
- Every stock refill/purchase entry includes: medicine, quantity bought, price paid, date, store.
- Compute rolling averages: weekly average spend, monthly average spend, per-medicine breakdown.
- Simple chart view (bar/line) of spend over time, filterable by family member or medicine.

## 3. Data Model (suggested entities)

```
Household
  id, name

User
  id, household_id, name, role (admin/member), notification_prefs

Medicine
  id, household_id, assigned_user_id, name, form, unit,
  current_quantity, low_stock_threshold, expiry_date

Schedule
  id, medicine_id, time_of_day (or meal_relation: before/after/with + meal),
  offset_minutes, active (bool)

DoseLog
  id, schedule_id, medicine_id, user_id, scheduled_time,
  status (taken/snoozed/skipped/missed), actual_time

Store
  id, household_id, name, phone, address, notes

Purchase
  id, medicine_id, store_id, quantity, price, date

MealTimes
  household_id or user_id, breakfast_time, lunch_time, dinner_time
```

## 4. Screens

1. **Login / household setup** — create household, add family members.
2. **Dashboard** — today's upcoming reminders, low-stock alerts, quick stats (this week's spend).
3. **Medicine list** — all medicines with stock level, add/edit medicine.
4. **Medicine detail** — schedule, dose history, refill history for one medicine.
5. **Reminder / today view** — chronological list of today's doses, mark taken/skip.
6. **Stores** — manage pharmacy contacts, call button.
7. **Expenses** — charts + table of spend, filters by time range/medicine/member.
8. **Settings** — meal times, notification preferences, family members.

## 5. Key Logic Notes

- **Meal-relative reminders**: store meal times centrally so changing "lunch" once updates every "before/after lunch" reminder automatically — don't hardcode times per medicine.
- **Stock decrement**: only decrement when a dose is explicitly marked "taken," not just when the reminder fires, so stock stays accurate even if doses are skipped.
- **Low-stock trigger**: check threshold after every decrement; when crossed, create a one-time refill notification and surface the "call store" CTA until stock is topped up.
- **Notifications**: use the Web Push API (or a simpler in-app + browser Notification API for v1) since this is a web app; a PWA wrapper is worth considering so reminders still fire when the browser is closed.

## 6. Suggested Tech Stack

- Frontend: React (or plain HTML/JS if keeping it lightweight) + PWA setup for installability and offline reminders.
- Backend: Node/Express or Firebase (Firebase is a fast way to get auth, realtime DB, and push notifications for a family-scale app).
- Notifications: Web Push API / Firebase Cloud Messaging.
- Storage: Firestore or Postgres — Firestore is simpler for a small multi-user household app.
- Charts: Chart.js or Recharts for the expense views.

## 7. Future Enhancements
- OCR to scan a medicine strip/box and auto-fill name + expiry.
- Shared shopping-list style view of everything currently low.
- Doctor/prescription attachment per medicine.
- Multi-language support for elderly users.
