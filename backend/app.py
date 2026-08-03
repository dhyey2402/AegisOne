import os
from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
from flask_marshmallow import Marshmallow

from dotenv import load_dotenv
load_dotenv()

# Initialize extensions
from extensions import db, migrate, bcrypt, jwt, ma

def create_app(test_config=None):
    app = Flask(__name__)
    
    # Configuration
    # Uses SQLite by default if DATABASE_URL is not set (e.g. for initial dev before Postgres)
    # The user can override with DATABASE_URL in .env
    db_url = os.environ.get('DATABASE_URL', 'sqlite:///insurance.db')
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    app.config['SQLALCHEMY_DATABASE_URI'] = db_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
        'pool_pre_ping': True,
        'pool_recycle': 300,
    }
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-super-secret-key-change-in-prod')
    app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'dev-super-secret-key-change-in-prod')
    app.config['UPLOAD_FOLDER'] = os.environ.get('UPLOAD_FOLDER', os.path.join(app.root_path, 'uploads'))
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16 MB max upload
    
    # Initialize extensions with app
    app.url_map.strict_slashes = False
    frontend_url = os.environ.get('FRONTEND_URL')
    origins = ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:3000']
    if frontend_url:
        origins.extend([url.strip() for url in frontend_url.split(',')])
        
    CORS(app, resources={r"/*": {"origins": origins}}, supports_credentials=True)
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
