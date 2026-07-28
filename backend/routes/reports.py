from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from extensions import db
from models.customer import Customer
from models.policy import Policy
from models.claim import Claim
from models.premium_payment import PremiumPayment
from sqlalchemy import func, or_, and_
from sqlalchemy.orm import joinedload
from datetime import datetime
from utils.time import get_ist_now, timedelta

report_bp = Blueprint('reports', __name__)

@report_bp.route('/dashboard-summary', methods=['GET'])
@jwt_required()
def get_dashboard_summary():
    # Only Admin and Agents get full dashboard stats in this prototype
    claims_token = get_jwt()
    if claims_token.get('role') == 'CUSTOMER':
        return jsonify({'status': 'error', 'message': 'Unauthorized'}), 403

    # Consolidate 7 queries into a single query to fix latency
    t_cust = db.session.query(func.count(Customer.id)).filter(Customer.status == 'ACTIVE').scalar_subquery()
    t_pol = db.session.query(func.count(Policy.id)).filter(Policy.status == 'ACTIVE').scalar_subquery()
    
    t_claims = db.session.query(func.count(Claim.id)).scalar_subquery()
    a_claims = db.session.query(func.count(Claim.id)).filter(Claim.status == 'APPROVED').scalar_subquery()
    r_claims = db.session.query(func.count(Claim.id)).filter(Claim.status == 'REJECTED').scalar_subquery()
    
    c_prem = db.session.query(func.coalesce(func.sum(PremiumPayment.amount), 0)).filter(PremiumPayment.status == 'PAID').scalar_subquery()
    p_prem = db.session.query(func.coalesce(func.sum(PremiumPayment.amount), 0)).filter(PremiumPayment.status == 'PENDING').scalar_subquery()

    stats = db.session.query(t_cust, t_pol, t_claims, a_claims, r_claims, c_prem, p_prem).first()
    
    total_customers, total_policies, total_claims, approved_claims, rejected_claims, collected_premium, pending_premium = stats or (0, 0, 0, 0, 0, 0, 0)
    
    # Recent Activities (fetch from ActivityLog)
    from models.activity import ActivityLog
    recent_activities_db = ActivityLog.query.order_by(ActivityLog.created_at.desc()).limit(5).all()
    
    activities = []
    for a in recent_activities_db:
        activities.append({
            'type': a.activity_type,
            'message': a.description,
            'date': a.created_at.isoformat()
        })
        
    # Chart Data (Mocking last 6 months revenue for simplicity, since we lack historical premium data in dummy setup)
    months = [(get_ist_now() - timedelta(days=30*i)).strftime('%b') for i in range(5, -1, -1)]
    revenue_data = [float(collected_premium) * (0.15 * i) if i > 0 else float(collected_premium)*0.1 for i in range(1, 7)] 

    # Policy Types Distribution
    policy_types = db.session.query(Policy.policy_type, func.count(Policy.id)).group_by(Policy.policy_type).all()
    types_labels = [pt[0] for pt in policy_types]
    types_data = [pt[1] for pt in policy_types]
    
    # --- RISK CENTER DATA ---
    thirty_days_from_now = get_ist_now().date() + timedelta(days=30)
    # Using selectinload for optimal loading without cartesian explosion
    from sqlalchemy.orm import selectinload
    expiring_policies = Policy.query.options(selectinload(Policy.customer)).filter(Policy.status == 'ACTIVE', Policy.end_date <= thirty_days_from_now).all()

    # Overdue Premiums
    overdue_premiums = PremiumPayment.query.options(selectinload(PremiumPayment.policy).selectinload(Policy.customer)).filter(or_(PremiumPayment.status == 'OVERDUE', and_(PremiumPayment.status == 'PENDING', PremiumPayment.due_date < get_ist_now().date()))).all()

    # Pending Claims
    pending_claims = Claim.query.options(selectinload(Claim.customer)).filter(Claim.status.in_(['SUBMITTED', 'UNDER_REVIEW'])).all()
    
    risk_data = {
        'expiring_policies': [{
            'id': p.id,
            'policy_number': p.policy_number,
            'customer_name': f"{p.customer.first_name} {p.customer.last_name}",
            'end_date': p.end_date.isoformat(),
            'priority': 'High' if (p.end_date - get_ist_now().date()).days <= 7 else 'Medium'
        } for p in expiring_policies],
        
        'overdue_premiums': [{
            'id': pr.id,
            'policy_number': pr.policy.policy_number,
            'customer_name': f"{pr.policy.customer.first_name} {pr.policy.customer.last_name}",
            'amount': float(pr.amount),
            'due_date': pr.due_date.isoformat(),
            'priority': 'Critical'
        } for pr in overdue_premiums],
        
        'pending_claims': [{
            'id': c.id,
            'claim_number': c.claim_number,
            'customer_name': f"{c.customer.first_name} {c.customer.last_name}",
            'status': c.status,
            'priority': 'Medium'
        } for c in pending_claims]
    }

    return jsonify({
        'status': 'success',
        'data': {
            'dashboard': {
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
                'recent_activities': activities
            },
            'risk_center': risk_data
        }
    }), 200
