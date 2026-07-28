from extensions import db
from models.policy import Policy
from models.premium_payment import PremiumPayment
from services.activity_service import ActivityService
from datetime import datetime
from utils.time import get_ist_now
from dateutil.relativedelta import relativedelta
import uuid

class PolicyService:
    @staticmethod
    def create_policy(data, agent_id, policy_num):
        start_date = datetime.strptime(data.get('start_date'), '%Y-%m-%d').date()
        end_date = datetime.strptime(data.get('end_date'), '%Y-%m-%d').date()
        
        new_policy = Policy(
            policy_number=policy_num,
            customer_id=data.get('customer_id'),
            agent_id=agent_id,
            policy_type=data.get('policy_type'),
            coverage_amount=data.get('coverage_amount'),
            premium_amount=data.get('premium_amount'),
            start_date=start_date,
            end_date=end_date,
            status='ACTIVE'
        )
        db.session.add(new_policy)
        db.session.flush() # Get ID before commit
        
        # Schedule first premium
        first_premium = PremiumPayment(
            policy_id=new_policy.id,
            amount=new_policy.premium_amount,
            due_date=start_date, # Due immediately upon start
            status='PENDING'
        )
        db.session.add(first_premium)
        
        # Log activity
        ActivityService.log_activity(
            data.get('customer_id'), 
            'POLICY_PURCHASED', 
            f"Purchased a new {new_policy.policy_type} policy ({policy_num})."
        )
        
        db.session.commit()
        return new_policy

    @staticmethod
    def update_status(policy_id, new_status, user_id):
        policy = Policy.query.get(policy_id)
        if policy:
            old_status = policy.status
            policy.status = new_status
            db.session.commit()
            ActivityService.log_activity(
                policy.customer_id, 
                f'POLICY_{new_status}', 
                f"Policy {policy.policy_number} status changed from {old_status} to {new_status}."
            )
            return True
        return False
        
    @staticmethod
    def renew_policy(policy_id, extra_years, user_id):
        policy = Policy.query.get(policy_id)
        if policy:
            policy.end_date = policy.end_date + relativedelta(years=extra_years)
            if policy.status == 'EXPIRED':
                policy.status = 'ACTIVE'
            
            # Schedule next premium for renewal
            renewal_premium = PremiumPayment(
                policy_id=policy.id,
                amount=policy.premium_amount,
                due_date=get_ist_now().date(),
                status='PENDING'
            )
            db.session.add(renewal_premium)
            
            db.session.commit()
            
            ActivityService.log_activity(
                policy.customer_id, 
                'POLICY_RENEWED', 
                f"Policy {policy.policy_number} renewed for {extra_years} year(s)."
            )
            return True
        return False
