from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt

def role_required(*roles):
    """
    Decorator to enforce Role Based Access Control (RBAC).
    Usage: @role_required('ADMIN', 'AGENT')
    """
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            claims = get_jwt()
            user_role = claims.get('role')
            if user_role not in roles:
                return jsonify({'status': 'error', 'message': f'Forbidden. Requires one of: {roles}'}), 403
            return fn(*args, **kwargs)
        return decorator
    return wrapper
