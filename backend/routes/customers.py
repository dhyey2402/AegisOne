from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from extensions import db
from models.customer import Customer
from models.user import User
from sqlalchemy.orm import joinedload, selectinload

customer_bp = Blueprint('customers', __name__)

@customer_bp.route('/', methods=['GET'])
@jwt_required()
def get_customers():
    # Pagination
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('limit', 10, type=int)
    
    # Search and Filter
    search = request.args.get('search', '')
    status = request.args.get('status', '')
    
    query = Customer.query.options(selectinload(Customer.policies), selectinload(Customer.claims)).filter(Customer.status != 'DELETED')
    
    # Role-based access logic
    claims = get_jwt()
    role = claims.get('role')
    user_id = get_jwt_identity()
    
    # If agent, perhaps they only see customers they created or are assigned to
    if role == 'AGENT':
        query = query.filter_by(created_by=user_id)
    elif role == 'CUSTOMER':
        # Customers can only see themselves
        query = query.filter_by(user_id=user_id)

    if search:
        query = query.filter(
            (Customer.first_name.ilike(f'%{search}%')) | 
            (Customer.last_name.ilike(f'%{search}%')) |
            (Customer.email.ilike(f'%{search}%')) |
            (Customer.phone.ilike(f'%{search}%'))
        )
        
    if status:
        query = query.filter_by(status=status)
        
    # Sort
    query = query.order_by(Customer.created_at.desc())
    
    paginated = query.paginate(page=page, per_page=per_page, error_out=False)
    
    customers = []
    for c in paginated.items:
        customers.append({
            'id': c.id,
            'first_name': c.first_name,
            'last_name': c.last_name,
            'email': c.email,
            'phone': c.phone,
            'status': c.status,
            'created_at': c.created_at.isoformat(),
            'policies_count': len(c.policies),
            'claims_count': len(c.claims)
        })
        
    return jsonify({
        'status': 'success',
        'data': {
            'items': customers,
            'total': paginated.total,
            'pages': paginated.pages,
            'current_page': paginated.page
        }
    }), 200


@customer_bp.route('/<string:customer_id>', methods=['GET'])
@jwt_required()
def get_customer(customer_id):
    customer = Customer.query.filter_by(id=customer_id).first()
    
    if not customer or customer.status == 'DELETED':
        return jsonify({'status': 'error', 'message': 'Customer not found'}), 404
        
    # Check permissions
    claims = get_jwt()
    if claims.get('role') == 'AGENT' and customer.created_by != get_jwt_identity():
        return jsonify({'status': 'error', 'message': 'Forbidden'}), 403
    elif claims.get('role') == 'CUSTOMER' and customer.user_id != get_jwt_identity():
        return jsonify({'status': 'error', 'message': 'Forbidden'}), 403

    return jsonify({
        'status': 'success',
        'data': {
            'id': customer.id,
            'first_name': customer.first_name,
            'last_name': customer.last_name,
            'dob': customer.dob.isoformat(),
            'email': customer.email,
            'phone': customer.phone,
            'address': customer.address,
            'government_id': customer.government_id,
            'status': customer.status,
            'created_at': customer.created_at.isoformat()
        }
    }), 200


@customer_bp.route('/', methods=['POST'])
@jwt_required()
def create_customer():
    claims = get_jwt()
    if claims.get('role') not in ['ADMIN', 'AGENT']:
        return jsonify({'status': 'error', 'message': 'Unauthorized to create customers'}), 403

    data = request.get_json()
    
    # Check if exists
    if Customer.query.filter_by(email=data.get('email')).first():
        return jsonify({'status': 'error', 'message': 'Email already registered'}), 409
    if Customer.query.filter_by(government_id=data.get('government_id')).first():
        return jsonify({'status': 'error', 'message': 'Government ID already registered'}), 409
        
    try:
        new_customer = Customer(
            first_name=data.get('first_name'),
            last_name=data.get('last_name'),
            dob=data.get('dob'), # Format: YYYY-MM-DD
            phone=data.get('phone'),
            email=data.get('email'),
            address=data.get('address'),
            government_id=data.get('government_id'),
            created_by=get_jwt_identity()
        )
        
        db.session.add(new_customer)
        db.session.commit()
        
        return jsonify({'status': 'success', 'message': 'Customer created successfully', 'data': {'id': new_customer.id}}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'status': 'error', 'message': str(e)}), 400


@customer_bp.route('/<string:customer_id>', methods=['PUT'])
@jwt_required()
def update_customer(customer_id):
    claims = get_jwt()
    if claims.get('role') not in ['ADMIN', 'AGENT']:
        return jsonify({'status': 'error', 'message': 'Unauthorized to update customers'}), 403

    customer = Customer.query.filter_by(id=customer_id).first()
    if not customer or customer.status == 'DELETED':
        return jsonify({'status': 'error', 'message': 'Customer not found'}), 404

    data = request.get_json()
    
    customer.first_name = data.get('first_name', customer.first_name)
    customer.last_name = data.get('last_name', customer.last_name)
    customer.phone = data.get('phone', customer.phone)
    customer.address = data.get('address', customer.address)
    customer.status = data.get('status', customer.status)
    customer.updated_by = get_jwt_identity()
    
    db.session.commit()
    
    return jsonify({'status': 'success', 'message': 'Customer updated successfully'}), 200


@customer_bp.route('/<string:customer_id>', methods=['DELETE'])
@jwt_required()
def delete_customer(customer_id):
    claims = get_jwt()
    if claims.get('role') != 'ADMIN':
        return jsonify({'status': 'error', 'message': 'Only Admins can delete customers'}), 403

    customer = Customer.query.filter_by(id=customer_id).first()
    if not customer or customer.status == 'DELETED':
        return jsonify({'status': 'error', 'message': 'Customer not found'}), 404

    # Soft delete
    customer.status = 'DELETED'
    customer.updated_by = get_jwt_identity()
    db.session.commit()
    
    return jsonify({'status': 'success', 'message': 'Customer deleted successfully'}), 200

@customer_bp.route('/<string:customer_id>/profile', methods=['GET'])
@jwt_required()
def get_customer_profile(customer_id):
    from services.customer_service import CustomerService
    profile = CustomerService.get_profile(customer_id)
    if not profile:
        return jsonify({'status': 'error', 'message': 'Customer not found'}), 404
        
    claims = get_jwt()
    if claims.get('role') == 'CUSTOMER' and profile['customer']['user_id'] != get_jwt_identity():
        return jsonify({'status': 'error', 'message': 'Forbidden'}), 403
        
    return jsonify({'status': 'success', 'data': profile}), 200

@customer_bp.route('/<string:customer_id>/restore', methods=['PUT'])
@jwt_required()
def restore_customer(customer_id):
    claims = get_jwt()
    if claims.get('role') != 'ADMIN':
        return jsonify({'status': 'error', 'message': 'Only Admins can restore customers'}), 403
        
    from services.customer_service import CustomerService
    success = CustomerService.restore_customer(customer_id, get_jwt_identity())
    if success:
        return jsonify({'status': 'success', 'message': 'Customer restored successfully'}), 200
    return jsonify({'status': 'error', 'message': 'Customer not found or not deleted'}), 404

