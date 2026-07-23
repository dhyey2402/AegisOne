import uuid
from datetime import datetime
from app import db

class PremiumPayment(db.Model):
    __tablename__ = 'premium_payments'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    policy_id = db.Column(db.String(36), db.ForeignKey('policies.id'), nullable=False)
    
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    due_date = db.Column(db.Date, nullable=False)
    payment_date = db.Column(db.Date, nullable=True)
    
    status = db.Column(db.String(20), nullable=False, default='PENDING') # PENDING, PAID, OVERDUE, PARTIALLY_PAID
    receipt_number = db.Column(db.String(100), unique=True, nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
