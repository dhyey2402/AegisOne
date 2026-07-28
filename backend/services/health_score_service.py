from models.customer import Customer
from models.policy import Policy
from models.premium_payment import PremiumPayment
from models.claim import Claim
from models.document import Document
from datetime import datetime
from utils.time import get_ist_now

class HealthScoreService:
    @staticmethod
    def calculate_score(customer_id):
        """
        Calculates the Smart Insurance Health Score (0-100) dynamically.
        Base Score: 100
        - Late Payment: -10 each
        - Approved Claim: -5 each
        - Rejected Claim: -10 each
        - Missing Documents (< 2): -15
        - Active Policies: +5 each (max +20)
        - Policy Age: +2 per year of oldest active policy
        """
        score = 100
        reasons = []

        # Get relevant data
        policies = Policy.query.filter_by(customer_id=customer_id).all()
        claims = Claim.query.filter_by(customer_id=customer_id).all()
        docs = Document.query.filter_by(entity_id=customer_id).all()
        
        # We need all premiums across all policies for this customer
        policy_ids = [p.id for p in policies]
        premiums = PremiumPayment.query.filter(PremiumPayment.policy_id.in_(policy_ids)).all() if policy_ids else []

        # 1. Payment Consistency
        late_payments = [p for p in premiums if p.status == 'OVERDUE' or (p.payment_date and p.due_date and p.payment_date > p.due_date)]
        if late_payments:
            deduction = len(late_payments) * 10
            score -= deduction
            reasons.append(f"Late or overdue payments (-{deduction} points)")

        # 2. Claims
        approved_claims = [c for c in claims if c.status == 'SETTLED' or c.status == 'APPROVED']
        rejected_claims = [c for c in claims if c.status == 'REJECTED']
        
        if approved_claims:
            deduction = len(approved_claims) * 5
            score -= deduction
            reasons.append(f"Approved claims history (-{deduction} points)")
            
        if rejected_claims:
            deduction = len(rejected_claims) * 10
            score -= deduction
            reasons.append(f"Rejected claims history (-{deduction} points)")

        # 3. Documents
        if len(docs) < 2:
            score -= 15
            reasons.append("Missing required documents (-15 points)")

        # 4. Active Policies
        active_policies = [p for p in policies if p.status == 'ACTIVE']
        if active_policies:
            bonus = min(len(active_policies) * 5, 20)
            score += bonus
            reasons.append(f"Multiple active policies (+{bonus} points)")
            
            # Policy Age (Oldest active policy)
            oldest_policy = min(active_policies, key=lambda x: x.start_date)
            years_active = (get_ist_now().date() - oldest_policy.start_date).days // 365
            if years_active > 0:
                bonus = years_active * 2
                score += bonus
                reasons.append(f"Long-term customer relationship (+{bonus} points)")

        # Clamp score between 0 and 100
        score = max(0, min(100, score))
        
        # Determine Status
        if score >= 80:
            status = 'Green'
        elif score >= 50:
            status = 'Yellow'
        else:
            status = 'Red'

        if not reasons and score == 100:
            reasons.append("Perfect standing")

        return {
            'score': score,
            'status': status,
            'reasons': reasons
        }
