from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity, get_jwt
from app import db, bcrypt
from models.user import User

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data:
        return jsonify({'status': 'error', 'message': 'No input data provided'}), 400
        
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'CUSTOMER').upper()
    
    if not email or not password:
        return jsonify({'status': 'error', 'message': 'Email and password are required'}), 400
        
    if User.query.filter_by(email=email).first():
        return jsonify({'status': 'error', 'message': 'Email already exists'}), 409
        
    # Role validation - for safety, you wouldn't typically let users register as ADMIN directly
    # but for this prototype, we'll allow it.
    if role not in ['ADMIN', 'AGENT', 'CUSTOMER']:
        role = 'CUSTOMER'
        
    user = User(email=email, role=role)
    user.set_password(password)
    
    db.session.add(user)
    db.session.commit()
    
    return jsonify({
        'status': 'success', 
        'message': 'User registered successfully',
        'data': {
            'id': user.id,
            'email': user.email,
            'role': user.role
        }
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    user = User.query.filter_by(email=email).first()
    
    if not user or not user.check_password(password):
        return jsonify({'status': 'error', 'message': 'Invalid email or password'}), 401
        
    if not user.is_active:
        return jsonify({'status': 'error', 'message': 'Account is disabled'}), 403
        
    additional_claims = {'role': user.role}
    access_token = create_access_token(identity=user.id, additional_claims=additional_claims)
    refresh_token = create_refresh_token(identity=user.id, additional_claims=additional_claims)
    
    return jsonify({
        'status': 'success',
        'message': 'Login successful',
        'data': {
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': {
                'id': user.id,
                'email': user.email,
                'role': user.role
            }
        }
    }), 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({'status': 'error', 'message': 'User not found'}), 404
        
    return jsonify({
        'status': 'success',
        'data': {
            'id': user.id,
            'email': user.email,
            'role': user.role,
            'is_active': user.is_active
        }
    }), 200
