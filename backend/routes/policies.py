from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from extensions import db
from models.policy import Policy
from models.customer import Customer
from sqlalchemy.orm import contains_eager
from datetime import datetime
from utils.time import get_ist_now

policy_bp = Blueprint('policies', __name__)

@policy_bp.route('/', methods=['GET'])
@jwt_required()
def get_policies():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('limit', 10, type=int)
    search = request.args.get('search', '')
    status = request.args.get('status', '')
    
    query = Policy.query.join(Customer).options(contains_eager(Policy.customer))
    
    # RBAC logic
    claims = get_jwt()
    role = claims.get('role')
    user_id = get_jwt_identity()
    
    if role == 'AGENT':
        query = query.filter(Policy.agent_id == user_id)
    elif role == 'CUSTOMER':
        query = query.filter(Customer.user_id == user_id)
        
    if search:
        query = query.filter(
            (Policy.policy_number.ilike(f'%{search}%')) |
            (Customer.first_name.ilike(f'%{search}%')) |
            (Customer.last_name.ilike(f'%{search}%'))
        )
        
    if status:
        query = query.filter(Policy.status == status)
        
    query = query.order_by(Policy.created_at.desc())
    paginated = query.paginate(page=page, per_page=per_page, error_out=False)
    
    policies = []
    for p in paginated.items:
        policies.append({
            'id': p.id,
            'policy_number': p.policy_number,
            'customer_name': f"{p.customer.first_name} {p.customer.last_name}",
            'policy_type': p.policy_type,
            'coverage_amount': float(p.coverage_amount),
            'premium_amount': float(p.premium_amount),
            'start_date': p.start_date.isoformat(),
            'end_date': p.end_date.isoformat(),
            'status': p.status,
            'created_at': p.created_at.isoformat()
        })
        
    return jsonify({
        'status': 'success',
        'data': {
            'items': policies,
            'total': paginated.total,
            'pages': paginated.pages
        }
    }), 200

@policy_bp.route('/', methods=['POST'])
@jwt_required()
def create_policy():
    claims = get_jwt()
    if claims.get('role') not in ['ADMIN', 'AGENT']:
        return jsonify({'status': 'error', 'message': 'Unauthorized'}), 403

    data = request.get_json()
    from datetime import datetime
    from utils.time import get_ist_now
    policy_num = f"POL-{get_ist_now().strftime('%Y%m%d%H%M%S')}"
    
    try:
        from services.policy_service import PolicyService
        new_policy = PolicyService.create_policy(data, get_jwt_identity(), policy_num)
        return jsonify({'status': 'success', 'message': 'Policy created successfully', 'data': {'id': new_policy.id, 'policy_number': policy_num}}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'status': 'error', 'message': str(e)}), 400

@policy_bp.route('/<string:policy_id>/status', methods=['PUT'])
@jwt_required()
def change_policy_status(policy_id):
    claims = get_jwt()
    if claims.get('role') not in ['ADMIN', 'AGENT']:
        return jsonify({'status': 'error', 'message': 'Unauthorized'}), 403

    data = request.get_json()
    new_status = data.get('status')
    if new_status not in ['ACTIVE', 'CANCELLED', 'SUSPENDED']:
        return jsonify({'status': 'error', 'message': 'Invalid status'}), 400

    from services.policy_service import PolicyService
    success = PolicyService.update_status(policy_id, new_status, get_jwt_identity())
    if success:
        return jsonify({'status': 'success', 'message': f'Policy status updated to {new_status}'}), 200
    return jsonify({'status': 'error', 'message': 'Policy not found'}), 404

@policy_bp.route('/<string:policy_id>/renew', methods=['PUT'])
@jwt_required()
def renew_policy(policy_id):
    claims = get_jwt()
    if claims.get('role') not in ['ADMIN', 'AGENT']:
        return jsonify({'status': 'error', 'message': 'Unauthorized'}), 403

    data = request.get_json()
    extra_years = int(data.get('extra_years', 1))

    from services.policy_service import PolicyService
    success = PolicyService.renew_policy(policy_id, extra_years, get_jwt_identity())
    if success:
        return jsonify({'status': 'success', 'message': f'Policy renewed for {extra_years} years'}), 200
    return jsonify({'status': 'error', 'message': 'Policy not found'}), 404

