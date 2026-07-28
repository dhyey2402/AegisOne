import os
import uuid
from flask import Blueprint, request, jsonify, current_app, send_from_directory
from werkzeug.utils import secure_filename
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
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
        upload_folder = os.path.join(current_app.root_path, 'uploads')
        
        from services.document_service import DocumentService
        doc, error = DocumentService.upload_document(file, entity_type, entity_id, doc_type, get_jwt_identity(), upload_folder)
        
        if error:
            return jsonify({'status': 'error', 'message': error}), 400
            
        return jsonify({
            'status': 'success', 
            'message': 'File uploaded successfully',
            'data': {'id': doc.id, 'file_name': doc.file_name}
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
