from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app import db
from models.customer import Customer
from models.policy import Policy
from models.claim import Claim
from models.premium_payment import PremiumPayment
from sqlalchemy import func
from datetime import datetime, timedelta

report_bp = Blueprint('reports', __name__)

@report_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard_stats():
    # Only Admin and Agents get full dashboard stats in this prototype
    claims_token = get_jwt()
    if claims_token.get('role') == 'CUSTOMER':
        return jsonify({'status': 'error', 'message': 'Unauthorized'}), 403

    total_customers = Customer.query.filter_by(status='ACTIVE').count()
    total_policies = Policy.query.filter_by(status='ACTIVE').count()
    
    total_claims = Claim.query.count()
    approved_claims = Claim.query.filter_by(status='APPROVED').count()
    rejected_claims = Claim.query.filter_by(status='REJECTED').count()
    
    # Calculate premiums
    collected_premium = db.session.query(func.sum(PremiumPayment.amount)).filter(PremiumPayment.status == 'PAID').scalar() or 0
    pending_premium = db.session.query(func.sum(PremiumPayment.amount)).filter(PremiumPayment.status == 'PENDING').scalar() or 0
    
    # Recent Activities (mix of newest customers, policies, claims)
    recent_customers = Customer.query.order_by(Customer.created_at.desc()).limit(3).all()
    recent_claims = Claim.query.order_by(Claim.created_at.desc()).limit(3).all()
    
    activities = []
    for c in recent_customers:
        activities.append({
            'type': 'CUSTOMER_REGISTERED',
            'message': f"New customer registered: {c.first_name} {c.last_name}",
            'date': c.created_at.isoformat()
        })
    for c in recent_claims:
        activities.append({
            'type': 'CLAIM_SUBMITTED',
            'message': f"New claim submitted for policy {c.policy.policy_number}",
            'date': c.created_at.isoformat()
        })
        
    activities.sort(key=lambda x: x['date'], reverse=True)
    
    # Chart Data (Mocking last 6 months revenue for simplicity)
    months = [(datetime.utcnow() - timedelta(days=30*i)).strftime('%b') for i in range(5, -1, -1)]
    revenue_data = [float(collected_premium) * (0.15 * i) for i in range(1, 7)] # Dummy trend data based on collected

    # Policy Types Distribution
    policy_types = db.session.query(Policy.policy_type, func.count(Policy.id)).group_by(Policy.policy_type).all()
    types_labels = [pt[0] for pt in policy_types]
    types_data = [pt[1] for pt in policy_types]
    
    return jsonify({
        'status': 'success',
        'data': {
            'cards': {
                'total_customers': total_customers,
                'total_policies': total_policies,
                'total_claims': total_claims,
                'approved_claims': approved_claims,
                'rejected_claims': rejected_claims,
                'collected_premium': float(collected_premium),
                'pending_premium': float(pending_premium)
            },
            'charts': {
                'revenue': {
                    'labels': months,
                    'data': revenue_data
                },
                'policy_types': {
                    'labels': types_labels,
                    'data': types_data
                }
            },
            'recent_activities': activities[:5]
        }
    }), 200
