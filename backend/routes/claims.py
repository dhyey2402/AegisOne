from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from extensions import db
from models.claim import Claim
from models.policy import Policy
from models.customer import Customer
from sqlalchemy.orm import contains_eager
from datetime import datetime
from utils.time import get_ist_now

claim_bp = Blueprint('claims', __name__)

@claim_bp.route('/', methods=['GET'])
@jwt_required()
def get_claims():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('limit', 10, type=int)
    status = request.args.get('status', '')
    
    query = Claim.query.join(Claim.policy).join(Claim.customer).options(
        contains_eager(Claim.policy),
        contains_eager(Claim.customer)
    )
    
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
        
    claim_num = f"CLM-{get_ist_now().strftime('%Y%m%d%H%M%S')}"
    
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
    action = data.get('action') # APPROVE, REJECT, UNDER_REVIEW, SETTLED
    notes = data.get('notes', '')
    amount = data.get('settlement_amount')

    from services.claim_service import ClaimService
    claim, error = ClaimService.update_status(claim_id, action, notes, get_jwt_identity(), amount)
    
    if error:
        return jsonify({'status': 'error', 'message': error}), 400
        
    return jsonify({'status': 'success', 'message': f'Claim marked as {claim.status}'}), 200
