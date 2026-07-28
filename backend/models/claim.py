import uuid
from datetime import datetime
from utils.time import get_ist_now
from app import db

class Claim(db.Model):
    __tablename__ = 'claims'
    
    __table_args__ = (
        db.Index('idx_claim_status', 'status'),
        db.Index('idx_claim_policy_id', 'policy_id'),
        db.Index('idx_claim_created_at', 'created_at'),
    )
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    claim_number = db.Column(db.String(50), unique=True, nullable=False)
    policy_id = db.Column(db.String(36), db.ForeignKey('policies.id'), nullable=False)
    customer_id = db.Column(db.String(36), db.ForeignKey('customers.id'), nullable=False)
    
    claim_amount = db.Column(db.Numeric(12, 2), nullable=False)
    reason = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False)
    
    status = db.Column(db.String(20), nullable=False, default='SUBMITTED') # SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, SETTLED
    verification_notes = db.Column(db.Text, nullable=True)
    
    approved_by = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=True)
    approval_date = db.Column(db.DateTime, nullable=True)
    settlement_amount = db.Column(db.Numeric(12, 2), nullable=True)
    
    created_at = db.Column(db.DateTime, default=get_ist_now)
    updated_at = db.Column(db.DateTime, default=get_ist_now, onupdate=get_ist_now)
