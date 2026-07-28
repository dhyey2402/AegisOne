from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from extensions import db
from models.premium_payment import PremiumPayment
from models.policy import Policy
from models.customer import Customer
from sqlalchemy.orm import contains_eager, joinedload
from datetime import datetime
from utils.time import get_ist_now

premium_bp = Blueprint('premiums', __name__)

@premium_bp.route('/', methods=['GET'])
@jwt_required()
def get_premiums():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('limit', 10, type=int)
    status = request.args.get('status', '')
    
    query = PremiumPayment.query.join(PremiumPayment.policy).join(Policy.customer).options(
        contains_eager(PremiumPayment.policy).contains_eager(Policy.customer)
    )
    
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

@premium_bp.route('/<string:premium_id>/pay', methods=['PUT'])
@jwt_required()
def record_payment(premium_id):
    claims = get_jwt()
    if claims.get('role') not in ['ADMIN', 'AGENT']:
        return jsonify({'status': 'error', 'message': 'Unauthorized'}), 403

    data = request.get_json()
    from services.premium_service import PremiumService
    premium, error = PremiumService.record_payment(premium_id, data)
    
    if error:
        return jsonify({'status': 'error', 'message': error}), 400
        
    return jsonify({
        'status': 'success', 
        'message': 'Payment recorded successfully',
        'data': {'receipt_number': premium.receipt_number, 'status': premium.status, 'amount': float(premium.amount)}
    }), 200

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
                due_date=get_ist_now().date(),
                status='PENDING'
            )
            db.session.add(new_payment)
            count += 1
            
    db.session.commit()
    return jsonify({'status': 'success', 'message': f'Generated {count} due payments'}), 201

@premium_bp.route('/<string:premium_id>/receipt', methods=['GET'])
@jwt_required()
def get_receipt(premium_id):
    premium = PremiumPayment.query.options(
        joinedload(PremiumPayment.policy).joinedload(Policy.customer)
    ).filter_by(id=premium_id).first()
    
    if not premium:
        return jsonify({'status': 'error', 'message': 'Premium not found'}), 404
        
    policy = premium.policy
    customer = policy.customer
    
    base_amount = float(premium.amount)
    tax = round(base_amount * 0.18, 2)
    discount = round(base_amount * 0.05, 2)
    processing_fee = 50.00
    total_paid = round(base_amount + tax + processing_fee - discount, 2)
    
    from datetime import timedelta
    next_due_date = policy.end_date if policy.end_date else (premium.due_date + timedelta(days=365))
    days_remaining = (next_due_date - get_ist_now().date()).days
    
    data = {
        'payment': {
            'id': premium.id,
            'receipt_number': premium.receipt_number or f"REC-PENDING-{premium.id[:8].upper()}",
            'transaction_id': f"TRX-{premium.id[:12].upper()}",
            'issue_date': (premium.payment_date or premium.updated_at.date()).isoformat(),
            'issue_time': premium.updated_at.strftime('%H:%M:%S'),
            'status': premium.status,
            'method': 'Credit Card ending in 4242',
            'base_amount': base_amount,
            'tax': tax,
            'discount': discount,
            'processing_fee': processing_fee,
            'total_paid': total_paid,
            'payment_date': premium.payment_date.isoformat() if premium.payment_date else None,
            'initiated_at': premium.created_at.isoformat(),
            'processed_at': premium.updated_at.isoformat()
        },
        'policy': {
            'id': policy.id,
            'policy_number': policy.policy_number,
            'policy_name': f"Comprehensive {policy.policy_type.capitalize()} Plan",
            'policy_type': policy.policy_type,
            'coverage_amount': float(policy.coverage_amount),
            'status': policy.status,
            'start_date': policy.start_date.isoformat(),
            'end_date': policy.end_date.isoformat(),
            'agent_id': policy.agent_id,
            'health_score': 92
        },
        'customer': {
            'id': customer.id,
            'name': f"{customer.first_name} {customer.last_name}",
            'phone': customer.phone,
            'email': f"{customer.first_name.lower()}@example.com",
            'address': customer.address,
            'since': customer.created_at.date().isoformat(),
            'loyalty_tier': 'Platinum'
        },
        'next_premium': {
            'due_date': next_due_date.isoformat(),
            'days_remaining': days_remaining,
            'amount': float(policy.premium_amount),
            'auto_pay': True
        }
    }
    
    return jsonify({'status': 'success', 'data': data}), 200
