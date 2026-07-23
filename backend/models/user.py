import uuid
from datetime import datetime
from app import db, bcrypt

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='CUSTOMER') # ADMIN, AGENT, CUSTOMER
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    customer_profile = db.relationship('Customer', backref='user_account', uselist=False, foreign_keys='Customer.user_id')
    created_customers = db.relationship('Customer', backref='creator', foreign_keys='Customer.created_by')
    assigned_policies = db.relationship('Policy', backref='agent', foreign_keys='Policy.agent_id')
    approved_claims = db.relationship('Claim', backref='approver', foreign_keys='Claim.approved_by')
    uploaded_documents = db.relationship('Document', backref='uploader', foreign_keys='Document.uploaded_by')

    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
        
    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)
