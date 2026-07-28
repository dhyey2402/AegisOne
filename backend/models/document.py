import uuid
from datetime import datetime
from utils.time import get_ist_now
from app import db

class Document(db.Model):
    __tablename__ = 'documents'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    entity_type = db.Column(db.String(20), nullable=False) # CUSTOMER, POLICY, CLAIM
    entity_id = db.Column(db.String(36), nullable=False)
    
    document_type = db.Column(db.String(20), nullable=False) # IDENTITY, POLICY, CLAIM, OTHER
    
    file_name = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(512), nullable=False)
    file_size = db.Column(db.Integer, nullable=False) # In bytes
    mime_type = db.Column(db.String(100), nullable=False)
    
    uploaded_by = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    
    created_at = db.Column(db.DateTime, default=get_ist_now)
    updated_at = db.Column(db.DateTime, default=get_ist_now, onupdate=get_ist_now)
