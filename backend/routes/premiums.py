from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app import db
from models.premium_payment import PremiumPayment
from models.policy import Policy
from models.customer import Customer
from datetime import datetime

premium_bp = Blueprint('premiums', __name__)

@premium_bp.route('/', methods=['GET'])
@jwt_required()
def get_premiums():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('limit', 10, type=int)
    status = request.args.get('status', '')
    
    query = PremiumPayment.query.join(Policy).join(Customer)
    
    claims = get_jwt()
    role = claims.get('role')
    user_id = get_jwt_identity()
    
    if role == 'AGENT':
        query = query.filter(Policy.agent_id == user_id)
    elif role == 'CUSTOMER':
        query = query.filter(Customer.user_id == user_id)
        
    if status:
        query = query.filter(PremiumPayment.status == status)
        
    query = query.order_by(PremiumPayment.due_date.asc())
    paginated = query.paginate(page=page, per_page=per_page, error_out=False)
    
    payments = []
    for pay in paginated.items:
        payments.append({
            'id': pay.id,
            'policy_number': pay.policy.policy_number,
            'customer_name': f"{pay.policy.customer.first_name} {pay.policy.customer.last_name}",
            'amount': float(pay.amount),
            'due_date': pay.due_date.isoformat(),
            'payment_date': pay.payment_date.isoformat() if pay.payment_date else None,
            'status': pay.status,
            'receipt_number': pay.receipt_number
        })
        
    return jsonify({
        'status': 'success',
        'data': {
            'items': payments,
            'total': paginated.total,
            'pages': paginated.pages
        }
    }), 200

@premium_bp.route('/', methods=['POST'])
@jwt_required()
def record_payment():
    claims = get_jwt()
    # In a real app, customer might pay themselves via gateway, or Agent records it.
    if claims.get('role') not in ['ADMIN', 'AGENT']:
        return jsonify({'status': 'error', 'message': 'Unauthorized'}), 403

    data = request.get_json()
    
    policy_id = data.get('policy_id')
    amount = data.get('amount')
    
    policy = Policy.query.get(policy_id)
    if not policy:
        return jsonify({'status': 'error', 'message': 'Policy not found'}), 404
        
    receipt_num = f"REC-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
    
    payment = PremiumPayment(
        policy_id=policy.id,
        amount=amount,
        due_date=datetime.utcnow().date(), # Simplification: due today
        payment_date=datetime.utcnow().date(),
        status='PAID',
        receipt_number=receipt_num
    )
    
    db.session.add(payment)
    db.session.commit()
    
    return jsonify({
        'status': 'success', 
        'message': 'Payment recorded successfully',
        'data': {'receipt_number': receipt_num}
    }), 201

@premium_bp.route('/generate-due', methods=['POST'])
@jwt_required()
def generate_due_payments():
    # Admin endpoint to generate due payments for active policies.
    # A real system would run this on a cron job.
    claims = get_jwt()
    if claims.get('role') != 'ADMIN':
        return jsonify({'status': 'error', 'message': 'Unauthorized'}), 403
        
    active_policies = Policy.query.filter_by(status='ACTIVE').all()
    count = 0
    for p in active_policies:
        # Simplification: just generate one due payment for each active policy for demo
        existing = PremiumPayment.query.filter_by(policy_id=p.id, status='PENDING').first()
        if not existing:
            new_payment = PremiumPayment(
                policy_id=p.id,
                amount=p.premium_amount,
                due_date=datetime.utcnow().date(),
                status='PENDING'
            )
            db.session.add(new_payment)
            count += 1
            
    db.session.commit()
    return jsonify({'status': 'success', 'message': f'Generated {count} due payments'}), 201
