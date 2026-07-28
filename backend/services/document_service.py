import os
from werkzeug.utils import secure_filename
from extensions import db
from models.document import Document
from services.activity_service import ActivityService

class DocumentService:
    @staticmethod
    def upload_document(file, entity_type, entity_id, doc_type, user_id, upload_folder):
        if not file:
            return None, "No file provided"
            
        filename = secure_filename(file.filename)
        # Create a unique filename
        import uuid
        unique_filename = f"{uuid.uuid4()}_{filename}"
        filepath = os.path.join(upload_folder, unique_filename)
        
        # Ensure dir exists
        os.makedirs(upload_folder, exist_ok=True)
        
        file.save(filepath)
        
        doc = Document(
            entity_type=entity_type,
            entity_id=entity_id,
            document_type=doc_type,
            file_name=filename,
            file_path=f"/uploads/{unique_filename}", # Relative path for serving
            file_size=os.path.getsize(filepath),
            mime_type=file.content_type,
            uploaded_by=user_id
        )
        db.session.add(doc)
        db.session.commit()
        
        if entity_type == 'CUSTOMER':
            ActivityService.log_activity(
                entity_id, 
                'DOCUMENT_UPLOADED', 
                f"Uploaded document: {filename}."
            )
            
        return doc, None
