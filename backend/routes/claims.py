from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app import db
from models.claim import Claim
from models.policy import Policy
from models.customer import Customer
from datetime import datetime

claim_bp = Blueprint('claims', __name__)

@claim_bp.route('/', methods=['GET'])
@jwt_required()
def get_claims():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('limit', 10, type=int)
    status = request.args.get('status', '')
    
    query = Claim.query.join(Policy).join(Customer)
    
    claims = get_jwt()
    role = claims.get('role')
    user_id = get_jwt_identity()
    
    if role == 'AGENT':
        query = query.filter(Policy.agent_id == user_id)
    elif role == 'CUSTOMER':
        query = query.filter(Customer.user_id == user_id)
        
    if status:
        query = query.filter(Claim.status == status)
        
    query = query.order_by(Claim.created_at.desc())
    paginated = query.paginate(page=page, per_page=per_page, error_out=False)
    
    result_claims = []
    for c in paginated.items:
        result_claims.append({
            'id': c.id,
            'claim_number': c.claim_number,
            'policy_number': c.policy.policy_number,
            'customer_name': f"{c.customer.first_name} {c.customer.last_name}",
            'claim_amount': float(c.claim_amount),
            'reason': c.reason,
            'status': c.status,
            'created_at': c.created_at.isoformat()
        })
        
    return jsonify({
        'status': 'success',
        'data': {
            'items': result_claims,
            'total': paginated.total,
            'pages': paginated.pages
        }
    }), 200

@claim_bp.route('/', methods=['POST'])
@jwt_required()
def submit_claim():
    data = request.get_json()
    
    policy_id = data.get('policy_id')
    policy = Policy.query.get(policy_id)
    if not policy:
        return jsonify({'status': 'error', 'message': 'Policy not found'}), 404
        
    claim_num = f"CLM-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
    
    new_claim = Claim(
        claim_number=claim_num,
        policy_id=policy.id,
        customer_id=policy.customer_id,
        claim_amount=data.get('claim_amount'),
        reason=data.get('reason'),
        description=data.get('description'),
        status='SUBMITTED'
    )
    
    db.session.add(new_claim)
    db.session.commit()
    
    return jsonify({'status': 'success', 'message': 'Claim submitted successfully'}), 201

@claim_bp.route('/<string:claim_id>/review', methods=['PUT'])
@jwt_required()
def review_claim(claim_id):
    claims = get_jwt()
    if claims.get('role') not in ['ADMIN', 'AGENT']:
        return jsonify({'status': 'error', 'message': 'Unauthorized'}), 403

    claim = Claim.query.get(claim_id)
    if not claim:
        return jsonify({'status': 'error', 'message': 'Claim not found'}), 404

    data = request.get_json()
    action = data.get('action') # APPROVE, REJECT, UNDER_REVIEW
    notes = data.get('notes', '')
    
    if action == 'APPROVE':
        claim.status = 'APPROVED'
        claim.approved_by = get_jwt_identity()
        claim.approval_date = datetime.utcnow()
        claim.settlement_amount = data.get('settlement_amount', claim.claim_amount)
    elif action == 'REJECT':
        claim.status = 'REJECTED'
        claim.approved_by = get_jwt_identity()
        claim.approval_date = datetime.utcnow()
    elif action == 'UNDER_REVIEW':
        claim.status = 'UNDER_REVIEW'
        
    claim.verification_notes = notes
    
    db.session.commit()
    return jsonify({'status': 'success', 'message': f'Claim marked as {claim.status}'}), 200
