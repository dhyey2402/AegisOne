import uuid
from datetime import datetime
from utils.time import get_ist_now
from app import db

class PremiumPayment(db.Model):
    __tablename__ = 'premium_payments'
    
    __table_args__ = (
        db.Index('idx_premium_status', 'status'),
        db.Index('idx_premium_due_date', 'due_date'),
        db.Index('idx_premium_policy_id', 'policy_id'),
    )
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    policy_id = db.Column(db.String(36), db.ForeignKey('policies.id'), nullable=False)
    
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    due_date = db.Column(db.Date, nullable=False)
    payment_date = db.Column(db.Date, nullable=True)
    
    status = db.Column(db.String(20), nullable=False, default='PENDING') # PENDING, PAID, OVERDUE, PARTIALLY_PAID
    receipt_number = db.Column(db.String(100), unique=True, nullable=True)
    
    created_at = db.Column(db.DateTime, default=get_ist_now)
    updated_at = db.Column(db.DateTime, default=get_ist_now, onupdate=get_ist_now)
