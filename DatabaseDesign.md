# Database Design

## Entities and Relationships

### 1. User
- `id` (UUID, Primary Key)
- `email` (String, Unique)
- `password_hash` (String)
- `role` (Enum: ADMIN, AGENT, CUSTOMER)
- `is_active` (Boolean)
- `created_at` (DateTime)
- `updated_at` (DateTime)

### 2. Customer
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key -> User.id, Nullable - some customers might not have login access initially)
- `first_name` (String)
- `last_name` (String)
- `dob` (Date)
- `phone` (String, Unique)
- `address` (Text)
- `email` (String, Unique)
- `photo_url` (String, Nullable)
- `government_id` (String, Unique)
- `status` (Enum: ACTIVE, INACTIVE)
- `created_at` (DateTime)
- `updated_at` (DateTime)
- `created_by` (UUID, Foreign Key -> User.id)
- `updated_by` (UUID, Foreign Key -> User.id)
- *Relationships: policies, claims*

### 3. Policy
- `id` (UUID, Primary Key)
- `policy_number` (String, Unique)
- `customer_id` (UUID, Foreign Key -> Customer.id)
- `agent_id` (UUID, Foreign Key -> User.id)
- `policy_type` (Enum: LIFE, HEALTH, AUTO, HOME, PROPERTY)
- `coverage_amount` (Decimal)
- `premium_amount` (Decimal)
- `start_date` (Date)
- `end_date` (Date)
- `status` (Enum: ACTIVE, EXPIRED, CANCELLED, PENDING)
- `created_at` (DateTime)
- `updated_at` (DateTime)
- *Relationships: payments, claims, documents*

### 4. Premium Payment
- `id` (UUID, Primary Key)
- `policy_id` (UUID, Foreign Key -> Policy.id)
- `amount` (Decimal)
- `due_date` (Date)
- `payment_date` (Date, Nullable)
- `status` (Enum: PENDING, PAID, OVERDUE, PARTIALLY_PAID)
- `receipt_number` (String, Unique, Nullable)
- `created_at` (DateTime)
- `updated_at` (DateTime)

### 5. Claim
- `id` (UUID, Primary Key)
- `claim_number` (String, Unique)
- `policy_id` (UUID, Foreign Key -> Policy.id)
- `customer_id` (UUID, Foreign Key -> Customer.id)
- `claim_amount` (Decimal)
- `reason` (String)
- `description` (Text)
- `status` (Enum: SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, SETTLED)
- `verification_notes` (Text, Nullable)
- `approved_by` (UUID, Foreign Key -> User.id, Nullable)
- `approval_date` (DateTime, Nullable)
- `settlement_amount` (Decimal, Nullable)
- `created_at` (DateTime)
- `updated_at` (DateTime)
- *Relationships: documents*

### 6. Document
- `id` (UUID, Primary Key)
- `entity_type` (Enum: CUSTOMER, POLICY, CLAIM)
- `entity_id` (UUID) - Polymorphic relation to Customer, Policy, or Claim
- `document_type` (Enum: IDENTITY, POLICY, CLAIM, OTHER)
- `file_name` (String)
- `file_path` (String)
- `file_size` (Integer)
- `mime_type` (String)
- `uploaded_by` (UUID, Foreign Key -> User.id)
- `created_at` (DateTime)
- `updated_at` (DateTime)
