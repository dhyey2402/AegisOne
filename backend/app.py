import os
from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
from flask_marshmallow import Marshmallow

# Initialize extensions
db = SQLAlchemy()
migrate = Migrate()
bcrypt = Bcrypt()
jwt = JWTManager()
ma = Marshmallow()

def create_app(test_config=None):
    app = Flask(__name__)
    
    # Configuration
    # Uses SQLite by default if DATABASE_URL is not set (e.g. for initial dev before Postgres)
    # The user can override with DATABASE_URL in .env
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///insurance.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'dev-super-secret-key-change-in-prod')
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16 MB max upload
    
    # Initialize extensions with app
    app.url_map.strict_slashes = False
    CORS(app)
    db.init_app(app)
    
    with app.app_context():
        import models
        
    migrate.init_app(app, db)
    bcrypt.init_app(app)
    jwt.init_app(app)
    ma.init_app(app)
    
    # Register error handlers
    register_error_handlers(app)
    
    # Register blueprints
    from routes.auth import auth_bp
    from routes.customers import customer_bp
    from routes.policies import policy_bp
    from routes.premiums import premium_bp
    from routes.claims import claim_bp
    from routes.reports import report_bp
    from routes.documents import document_bp
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(customer_bp, url_prefix='/api/customers')
    app.register_blueprint(policy_bp, url_prefix='/api/policies')
    app.register_blueprint(premium_bp, url_prefix='/api/premiums')
    app.register_blueprint(claim_bp, url_prefix='/api/claims')
    app.register_blueprint(report_bp, url_prefix='/api/reports')
    app.register_blueprint(document_bp, url_prefix='/api/documents')
    
    @app.route('/health')
    def health_check():
        return {'status': 'success', 'message': 'API is running'}, 200

    return app

def register_error_handlers(app):
    @app.errorhandler(400)
    def bad_request(error):
        return {'status': 'error', 'message': str(error)}, 400

    @app.errorhandler(401)
    def unauthorized(error):
        return {'status': 'error', 'message': 'Unauthorized'}, 401

    @app.errorhandler(403)
    def forbidden(error):
        return {'status': 'error', 'message': 'Forbidden'}, 403

    @app.errorhandler(404)
    def not_found(error):
        return {'status': 'error', 'message': 'Not Found'}, 404

    @app.errorhandler(500)
    def server_error(error):
        return {'status': 'error', 'message': 'Internal Server Error'}, 500

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)
