import os
from flask import Flask
from dotenv import load_dotenv
from app.models import db, Usuario
from flask_login import LoginManager

load_dotenv()

def create_app():
    app = Flask(__name__)
    
    # Configuración
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-key-123')
    
    # Vercel Postgres URL handling (psycopg2 requires postgresql:// instead of postgres://)
    db_url = os.getenv('POSTGRES_URL')
    if db_url and db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    
    app.config['SQLALCHEMY_DATABASE_URI'] = db_url or 'sqlite:///local.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(app)
    
    login_manager = LoginManager()
    login_manager.login_view = 'admin.login'
    login_manager.init_app(app)

    @app.template_filter('nl2br')
    def nl2br_filter(s):
        if not s:
            return ""
        from markupsafe import Markup, escape
        return Markup(escape(s).replace('\n', '<br>\n'))

    @login_manager.user_loader
    def load_user(user_id):
        return Usuario.query.get(int(user_id))

    # Registro de Blueprints
    from app.routes.public import public_bp
    from app.routes.admin import admin_bp
    
    app.register_blueprint(public_bp)
    app.register_blueprint(admin_bp, url_prefix='/admin')

    return app
