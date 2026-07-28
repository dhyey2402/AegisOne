from extensions import db
from models.claim import Claim
from services.activity_service import ActivityService
from datetime import datetime
from utils.time import get_ist_now

class ClaimService:
    @staticmethod
    def update_status(claim_id, new_status, notes, user_id, amount=None):
        claim = Claim.query.get(claim_id)
        if not claim:
            return None, "Claim not found"
            
        old_status = claim.status
        claim.status = new_status
        if notes:
            claim.verification_notes = f"{claim.verification_notes or ''}\n[{get_ist_now().isoformat()}] {notes}"
            
        if new_status == 'APPROVED':
            claim.approved_by = user_id
            claim.approval_date = get_ist_now()
            if amount:
                claim.settlement_amount = amount
                
        ActivityService.log_activity(
            claim.customer_id, 
            f'CLAIM_{new_status}', 
            f"Claim {claim.claim_number} status updated to {new_status}.",
            commit=False
        )
        db.session.commit()
        
        return claim, None
