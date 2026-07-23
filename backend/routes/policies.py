from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app import db
from models.policy import Policy
from models.customer import Customer
from datetime import datetime

policy_bp = Blueprint('policies', __name__)

@policy_bp.route('/', methods=['GET'])
@jwt_required()
def get_policies():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('limit', 10, type=int)
    search = request.args.get('search', '')
    status = request.args.get('status', '')
    
    query = Policy.query.join(Customer)
    
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
    
    # Generate unique policy number
    policy_num = f"POL-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
    
    try:
        new_policy = Policy(
            policy_number=policy_num,
            customer_id=data.get('customer_id'),
            agent_id=get_jwt_identity(),
            policy_type=data.get('policy_type'),
            coverage_amount=data.get('coverage_amount'),
            premium_amount=data.get('premium_amount'),
            start_date=datetime.strptime(data.get('start_date'), '%Y-%m-%d').date(),
            end_date=datetime.strptime(data.get('end_date'), '%Y-%m-%d').date(),
            status='ACTIVE'
        )
        db.session.add(new_policy)
        db.session.commit()
        
        return jsonify({'status': 'success', 'message': 'Policy created successfully', 'data': {'id': new_policy.id, 'policy_number': policy_num}}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'status': 'error', 'message': str(e)}), 400

@policy_bp.route('/<string:policy_id>', methods=['PUT'])
@jwt_required()
def update_policy(policy_id):
    claims = get_jwt()
    if claims.get('role') not in ['ADMIN', 'AGENT']:
        return jsonify({'status': 'error', 'message': 'Unauthorized'}), 403

    policy = Policy.query.get(policy_id)
    if not policy:
        return jsonify({'status': 'error', 'message': 'Policy not found'}), 404

    data = request.get_json()
    
    policy.status = data.get('status', policy.status)
    if data.get('end_date'):
        policy.end_date = datetime.strptime(data.get('end_date'), '%Y-%m-%d').date()
    
    db.session.commit()
    return jsonify({'status': 'success', 'message': 'Policy updated successfully'}), 200
