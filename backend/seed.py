from app import create_app
from extensions import db

app = create_app()
from models.user import User
from models.customer import Customer
from models.policy import Policy
from models.premium_payment import PremiumPayment
from models.claim import Claim
from werkzeug.security import generate_password_hash
from datetime import datetime
from utils.time import get_ist_now, timedelta

def seed_db():
    with app.app_context():
        # Check if Admin already exists
        admin = User.query.filter_by(email='admin@insurepro.com').first()
        if not admin:
            admin = User(
                email='admin@insurepro.com',
                password_hash=generate_password_hash('admin123'),
                role='ADMIN',
                is_active=True
            )
            db.session.add(admin)
            print("Admin user created.")

        # Check if test customer exists
        cust = Customer.query.filter_by(email='john.doe@example.com').first()
        if not cust:
            cust = Customer(
                first_name='John',
                last_name='Doe',
                email='john.doe@example.com',
                phone='555-0100',
                dob=datetime(1980, 1, 1),
                address='123 Main St, Anytown',
                government_id='SSN-1234',
                status='ACTIVE'
            )
            db.session.add(cust)
            db.session.commit()
            print("Test customer created.")
            
            # Create a user account for the customer so they can log in
            cust_user = User(
                email='john.doe@example.com',
                password_hash=generate_password_hash('customer123'),
                role='CUSTOMER',
                is_active=True
            )
            db.session.add(cust_user)
            db.session.commit()

            # Create a policy for the customer
            policy = Policy(
                customer_id=cust.id,
                policy_type='HEALTH',
                coverage_amount=100000.0,
                premium_amount=1200.0,
                start_date=get_ist_now().date(),
                end_date=(get_ist_now() + timedelta(days=365)).date(),
                status='ACTIVE',
                policy_number='POL-H-10001'
            )
            db.session.add(policy)
            db.session.commit()
            print("Test policy created.")

            # Create a pending premium payment
            premium = PremiumPayment(
                policy_id=policy.id,
                amount=100.0,
                due_date=(get_ist_now() + timedelta(days=15)).date(),
                status='PENDING'
            )
            db.session.add(premium)
            
            # Create a pending claim
            claim = Claim(
                policy_id=policy.id,
                customer_id=cust.id,
                claim_amount=500.0,
                reason='Emergency Room Visit',
                description='Fell and hurt knee, required stitches.',
                status='SUBMITTED',
                claim_number='CLM-H-20001'
            )
            db.session.add(claim)

            db.session.commit()
            print("Test premium and claim created.")
        else:
            print("Database already seeded.")

if __name__ == '__main__':
    seed_db()
