from extensions import db
from models.customer import Customer
from models.policy import Policy
from models.claim import Claim
from models.premium_payment import PremiumPayment
from models.document import Document
from services.health_score_service import HealthScoreService
from services.activity_service import ActivityService

class CustomerService:
    @staticmethod
    def get_profile(customer_id):
        customer = Customer.query.filter_by(id=customer_id).first()
        if not customer or customer.status == 'DELETED':
            return None
            
        policies = Policy.query.filter_by(customer_id=customer_id).all()
        claims = Claim.query.filter_by(customer_id=customer_id).all()
        docs = Document.query.filter_by(entity_id=customer_id).all()
        
        policy_ids = [p.id for p in policies]
        premiums = PremiumPayment.query.filter(PremiumPayment.policy_id.in_(policy_ids)).order_by(PremiumPayment.due_date.desc()).all() if policy_ids else []
        
        health_score = HealthScoreService.calculate_score(customer_id)
        timeline = ActivityService.get_customer_timeline(customer_id)
        
        return {
            'customer': {
                'id': customer.id,
                'first_name': customer.first_name,
                'last_name': customer.last_name,
                'email': customer.email,
                'phone': customer.phone,
                'dob': customer.dob.isoformat(),
                'address': customer.address,
                'government_id': customer.government_id,
                'emergency_contact': customer.emergency_contact,
                'notes': customer.notes,
                'status': customer.status,
                'created_at': customer.created_at.isoformat()
            },
            'health_score': health_score,
            'timeline': timeline,
            'policies': [{
                'id': p.id, 'policy_number': p.policy_number, 'type': p.policy_type,
                'status': p.status, 'coverage': float(p.coverage_amount), 'premium': float(p.premium_amount)
            } for p in policies],
            'claims': [{
                'id': c.id, 'claim_number': c.claim_number, 'amount': float(c.claim_amount),
                'status': c.status, 'date': c.created_at.isoformat()
            } for c in claims],
            'premiums': [{
                'id': pr.id, 'amount': float(pr.amount), 'due_date': pr.due_date.isoformat(),
                'status': pr.status, 'payment_date': pr.payment_date.isoformat() if pr.payment_date else None
            } for pr in premiums],
            'documents': [{
                'id': d.id, 'name': d.file_name, 'type': d.document_type, 'url': d.file_path, 'date': d.created_at.isoformat()
            } for d in docs]
        }
        
    @staticmethod
    def restore_customer(customer_id, user_id):
        customer = Customer.query.filter_by(id=customer_id).first()
        if customer and customer.status == 'DELETED':
            customer.status = 'ACTIVE'
            customer.updated_by = user_id
            db.session.commit()
            ActivityService.log_activity(customer_id, 'CUSTOMER_RESTORED', 'Customer profile was restored.')
            return True
        return False
