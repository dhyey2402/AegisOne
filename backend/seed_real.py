from app import create_app
from extensions import db
from models.user import User
from models.customer import Customer
from models.policy import Policy
from models.premium_payment import PremiumPayment
from models.claim import Claim
from models.activity import ActivityLog
from extensions import bcrypt
import random
import uuid
from datetime import datetime
from utils.time import get_ist_now, timedelta

app = create_app()

def clear_db():
    print("Clearing database...")
    db.session.query(ActivityLog).delete()
    db.session.query(Claim).delete()
    db.session.query(PremiumPayment).delete()
    db.session.query(Policy).delete()
    db.session.query(Customer).delete()
    db.session.query(User).delete()
    db.session.commit()
    print("Database cleared.")

def generate_phone():
    return "+91-" + "".join([str(random.randint(0,9)) for _ in range(10)])

def generate_gov_id():
    return "AADHAAR-" + "".join([str(random.randint(0,9)) for _ in range(12)])

def seed_db():
    with app.app_context():
        clear_db()
        print("Seeding new data...")

        # Create Admin
        admin = User(
            email='admin@insurepro.com',
            password_hash=bcrypt.generate_password_hash('admin123').decode('utf-8'),
            role='ADMIN',
            is_active=True
        )
        db.session.add(admin)

        first_names = ["Aarav", "Vihaan", "Aditya", "Sai", "Arjun", "Rohan", "Ananya", "Diya", "Isha", "Kavya", "Neha", "Priya", "Rahul", "Vikram", "Sneha", "Karan", "Pooja", "Meera", "Ravi", "Amit"]
        last_names = ["Sharma", "Patel", "Singh", "Kumar", "Gupta", "Deshmukh", "Joshi", "Verma", "Chauhan", "Reddy", "Iyer", "Nair", "Rao", "Das", "Bose", "Menon", "Pillai", "Yadav", "Tiwari", "Kapoor"]
        cities = ["Mumbai, Maharashtra", "Delhi, NCR", "Bengaluru, Karnataka", "Hyderabad, Telangana", "Ahmedabad, Gujarat", "Chennai, Tamil Nadu", "Kolkata, West Bengal", "Pune, Maharashtra"]
        streets = ["MG Road", "Link Road", "Station Road", "Ring Road", "Main Street", "Park Avenue", "Lake View", "Hill Road"]

        policy_types = ['HEALTH', 'AUTO', 'HOME', 'LIFE']
        claim_reasons = ["Accident", "Medical Emergency", "Theft", "Natural Disaster", "Routine Checkup", "Fire Damage", "Water Damage", "Surgery"]

        customers = []
        for _ in range(20):
            fn = random.choice(first_names)
            ln = random.choice(last_names)
            email = f"{fn.lower()}.{ln.lower()}{random.randint(1,99)}@example.com"
            
            cust = Customer(
                first_name=fn,
                last_name=ln,
                email=email,
                phone=generate_phone(),
                dob=get_ist_now().date() - timedelta(days=random.randint(18*365, 60*365)),
                address=f"{random.randint(1, 999)}, {random.choice(streets)}, {random.choice(cities)}",
                government_id=generate_gov_id(),
                status='ACTIVE'
            )
            db.session.add(cust)
            customers.append(cust)
            
            cust_user = User(
                email=email,
                password_hash=bcrypt.generate_password_hash('password123').decode('utf-8'),
                role='CUSTOMER',
                is_active=True
            )
            db.session.add(cust_user)

        db.session.commit()

        for cust in customers:
            num_policies = random.randint(1, 4)
            for _ in range(num_policies):
                ptype = random.choice(policy_types)
                coverage = random.choice([500000, 1000000, 2000000, 5000000, 10000000])
                premium = coverage * 0.012

                start_date = get_ist_now().date() - timedelta(days=random.randint(10, 700))
                end_date = start_date + timedelta(days=365)
                status = 'ACTIVE' if end_date > get_ist_now().date() else 'EXPIRED'

                policy = Policy(
                    customer_id=cust.id,
                    policy_type=ptype,
                    coverage_amount=coverage,
                    premium_amount=premium,
                    start_date=start_date,
                    end_date=end_date,
                    status=status,
                    policy_number=f"POL-{ptype[0]}-{random.randint(10000, 99999)}"
                )
                db.session.add(policy)
                db.session.flush()

                # Activity
                act1 = ActivityLog(
                    customer_id=cust.id,
                    activity_type='POLICY_PURCHASED',
                    description=f'Purchased {ptype} policy {policy.policy_number}',
                    created_at=datetime.combine(start_date, datetime.min.time())
                )
                db.session.add(act1)

                # Premiums
                for i in range(1, 5):
                    due = start_date + timedelta(days=30 * i)
                    p_status = random.choices(['PAID', 'PENDING', 'OVERDUE'], weights=[0.6, 0.3, 0.1])[0]
                    pmt = PremiumPayment(
                        policy_id=policy.id,
                        amount=premium / 12,
                        due_date=due,
                        status=p_status,
                        payment_date=due - timedelta(days=random.randint(1, 5)) if p_status == 'PAID' else None,
                        receipt_number=f"REC-{random.randint(100000, 999999)}" if p_status == 'PAID' else None
                    )
                    db.session.add(pmt)

                # Claims (25% chance)
                if random.random() < 0.25:
                    c_status = random.choice(['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'])
                    claim_amount = random.randint(10000, int(coverage * 0.5))
                    claim_date = start_date + timedelta(days=random.randint(10, 100))
                    
                    claim = Claim(
                        policy_id=policy.id,
                        customer_id=cust.id,
                        claim_amount=claim_amount,
                        reason=random.choice(claim_reasons),
                        description="Customer filed a claim for incident.",
                        status=c_status,
                        claim_number=f"CLM-{ptype[0]}-{random.randint(10000, 99999)}",
                        created_at=datetime.combine(claim_date, datetime.min.time())
                    )
                    db.session.add(claim)
                    db.session.flush()

                    act2 = ActivityLog(
                        customer_id=cust.id,
                        activity_type='CLAIM_SUBMITTED',
                        description=f'Submitted claim {claim.claim_number} for ₹{claim_amount:,.2f}',
                        created_at=claim.created_at
                    )
                    db.session.add(act2)

        db.session.commit()
        print("Database seeded with realistic data successfully! All dummy users have password: password123")

if __name__ == '__main__':
    seed_db()
