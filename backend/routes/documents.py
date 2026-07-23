import os
import uuid
from flask import Blueprint, request, jsonify, current_app, send_from_directory
from werkzeug.utils import secure_filename
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from models.document import Document

document_bp = Blueprint('documents', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'pdf'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@document_bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_document():
    if 'file' not in request.files:
        return jsonify({'status': 'error', 'message': 'No file part'}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({'status': 'error', 'message': 'No selected file'}), 400
        
    entity_type = request.form.get('entity_type')
    entity_id = request.form.get('entity_id')
    doc_type = request.form.get('document_type', 'OTHER')
    
    if not entity_type or not entity_id:
        return jsonify({'status': 'error', 'message': 'entity_type and entity_id are required'}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        # Unique filename to prevent overwriting
        unique_filename = f"{uuid.uuid4()}_{filename}"
        
        upload_folder = os.path.join(current_app.root_path, 'uploads')
        os.makedirs(upload_folder, exist_ok=True)
        file_path = os.path.join(upload_folder, unique_filename)
        
        file.save(file_path)
        
        new_doc = Document(
            entity_type=entity_type,
            entity_id=entity_id,
            document_type=doc_type,
            file_name=filename,
            file_path=unique_filename,
            file_size=os.path.getsize(file_path),
            mime_type=file.mimetype,
            uploaded_by=get_jwt_identity()
        )
        db.session.add(new_doc)
        db.session.commit()
        
        return jsonify({
            'status': 'success', 
            'message': 'File uploaded successfully',
            'data': {'id': new_doc.id, 'file_name': filename}
        }), 201
        
    return jsonify({'status': 'error', 'message': 'File type not allowed'}), 400

@document_bp.route('/download/<string:doc_id>', methods=['GET'])
@jwt_required()
def download_document(doc_id):
    doc = Document.query.get(doc_id)
    if not doc:
        return jsonify({'status': 'error', 'message': 'Document not found'}), 404
        
    upload_folder = os.path.join(current_app.root_path, 'uploads')
    return send_from_directory(upload_folder, doc.file_path, as_attachment=True, download_name=doc.file_name)
