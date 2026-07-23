# System Workflow

## 1. Authentication Workflow
- Users access the platform via `/login`.
- If unauthenticated, they are redirected to login.
- Based on their role (Admin, Agent, Customer), they are redirected to their respective dashboard.
- Admin manages all entities.
- Agents manage customers they registered and their respective policies/claims.
- Customers view their own profile, policies, claims, and pay premiums.

## 2. Customer Registration
- Admin or Agent navigates to `/customers`.
- Clicks "Add Customer".
- Fills in personal details, uploads photo and government ID.
- System validates inputs (unique email/phone/government ID).
- Customer is created with `status: ACTIVE`.

## 3. Policy Creation
- Admin or Agent navigates to a customer profile or `/policies`.
- Selects customer, chooses policy type, sets coverage, premium amount, start and end dates.
- Documents (like agreement) are optionally uploaded.
- Policy is created. First premium payment schedule is automatically generated based on the policy terms.

## 4. Premium Payments
- The system regularly checks for due premiums.
- Customers or Agents navigate to `/premiums` to view due payments.
- Agent records a payment (Cash/Card/Transfer) by clicking "Record Payment".
- Status changes from `PENDING` or `OVERDUE` to `PAID`.
- System generates a receipt number.

## 5. Claim Submission
- Customer experiences an event covered by the policy.
- Customer or Agent navigates to `/claims` and submits a new claim.
- Details including amount, reason, and description are entered.
- Evidence (Photos/PDFs) are uploaded.
- Claim is created with status `SUBMITTED`.

## 6. Claim Verification & Processing
- Agent/Admin reviews the claim and updates status to `UNDER_REVIEW`.
- Notes are added regarding verification.
- Admin decides to `APPROVE` or `REJECT`.
- If approved, settlement amount is finalized and status changes to `APPROVED`, then later `SETTLED`.

## 7. Reports & Dashboard
- Dashboards load real-time aggregations.
- Charts show premium collections by month, claim approval ratios, etc.
