from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt

def role_required(roles):
    """
    Decorator to protect endpoints by role.
    roles: List of allowed roles, e.g., ['ADMIN', 'AGENT']
    """
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            user_role = claims.get('role')
            if user_role not in roles:
                return jsonify({
                    'status': 'error',
                    'message': f'Access forbidden: Role {user_role} is not authorized.'
                }), 403
            return fn(*args, **kwargs)
        return decorator
    return wrapper
