import uuid
from datetime import datetime
from app import db

class Customer(db.Model):
    __tablename__ = 'customers'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=True) # Nullable because an agent can create a customer without login access first
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    dob = db.Column(db.Date, nullable=False)
    phone = db.Column(db.String(20), unique=True, nullable=False)
    address = db.Column(db.Text, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    photo_url = db.Column(db.String(255), nullable=True)
    government_id = db.Column(db.String(100), unique=True, nullable=False)
    status = db.Column(db.String(20), nullable=False, default='ACTIVE') # ACTIVE, INACTIVE, DELETED
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    created_by = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=True)
    updated_by = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=True)
    
    # Relationships
    policies = db.relationship('Policy', backref='customer', lazy=True, cascade="all, delete-orphan")
    claims = db.relationship('Claim', backref='customer', lazy=True, cascade="all, delete-orphan")
