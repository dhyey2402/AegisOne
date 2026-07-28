from extensions import db
from models.premium_payment import PremiumPayment
from models.policy import Policy
from services.activity_service import ActivityService
from datetime import datetime
from utils.time import get_ist_now
import uuid

class PremiumService:
    @staticmethod
    def record_payment(premium_id, payment_data):
        premium = PremiumPayment.query.get(premium_id)
        if not premium:
            return None, "Premium not found"
            
        policy = Policy.query.get(premium.policy_id)
        paid_amount = float(payment_data.get('amount', 0))
        current_amount = float(premium.amount)
        
        if paid_amount <= 0:
            return None, "Invalid amount"
            
        premium.payment_date = get_ist_now().date()
        premium.receipt_number = f"REC-{get_ist_now().strftime('%Y%m%d%H%M%S')}"
        
        if paid_amount >= current_amount:
            premium.status = 'PAID'
            premium.amount = paid_amount # update if they paid more/exact
            ActivityService.log_activity(
                policy.customer_id, 
                'PREMIUM_PAID', 
                f"Full premium payment of ${paid_amount} received for policy {policy.policy_number}.",
                commit=False
            )
        else:
            premium.status = 'PARTIALLY_PAID'
            premium.amount = current_amount - paid_amount
            ActivityService.log_activity(
                policy.customer_id, 
                'PREMIUM_PARTIAL', 
                f"Partial premium payment of ${paid_amount} received for policy {policy.policy_number}. Remaining: ${premium.amount}.",
                commit=False
            )
            
        db.session.commit()
        return premium, None
