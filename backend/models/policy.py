import uuid
from datetime import datetime
from utils.time import get_ist_now
from app import db

class Policy(db.Model):
    __tablename__ = 'policies'
    
    __table_args__ = (
        db.Index('idx_policy_status', 'status'),
        db.Index('idx_policy_customer_id', 'customer_id'),
        db.Index('idx_policy_created_at', 'created_at'),
    )
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    policy_number = db.Column(db.String(50), unique=True, nullable=False)
    customer_id = db.Column(db.String(36), db.ForeignKey('customers.id'), nullable=False)
    agent_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=True)
    
    policy_type = db.Column(db.String(50), nullable=False) # LIFE, HEALTH, AUTO, HOME, PROPERTY
    coverage_amount = db.Column(db.Numeric(12, 2), nullable=False)
    premium_amount = db.Column(db.Numeric(12, 2), nullable=False)
    
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(20), nullable=False, default='ACTIVE') # ACTIVE, EXPIRED, CANCELLED, PENDING
    
    created_at = db.Column(db.DateTime, default=get_ist_now)
    updated_at = db.Column(db.DateTime, default=get_ist_now, onupdate=get_ist_now)
    
    # Relationships
    payments = db.relationship('PremiumPayment', backref='policy', lazy=True, cascade="all, delete-orphan")
    claims = db.relationship('Claim', backref='policy', lazy=True, cascade="all, delete-orphan")
