import os
from flask import Flask
from dotenv import load_dotenv
from app.models import db, Usuario
from flask_login import LoginManager

import logging
import os
from flask import Flask
from dotenv import load_dotenv
from app.models import db, Usuario
from flask_login import LoginManager

# --- REGISTRO MANUAL DEL DIALECTO DE TURSO ---
try:
    from sqlalchemy.dialects import registry
    registry.register("libsql", "libsql_experimental.sqlalchemy", "LibSQLDialect")
except ImportError:
    pass
# ---------------------------------------------

load_dotenv()

def create_app():
    # Vercel fix: Use /tmp for instance_path as the rest of the filesystem is read-only
    app = Flask(__name__, 
                instance_path='/tmp',
                template_folder='templates',
                static_folder='static')
    
    # Configuración de logs para ver errores en Vercel
    logging.basicConfig(level=logging.INFO)
    
    # Configuración
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-key-123')
    
    # Database Configuration (Supports Local SQLite and Turso)
    db_url = os.getenv('DATABASE_URL')
    db_token = os.getenv('DATABASE_AUTH_TOKEN')
    
    if db_url and db_url.startswith("libsql://"):
        # Asegurar que el token vaya en la URL
        if db_token and "auth_token=" not in db_url:
            separator = "&" if "?" in db_url else "?"
            db_url = f"{db_url}{separator}auth_token={db_token}"
    
    app.config['SQLALCHEMY_DATABASE_URI'] = db_url or 'sqlite:///database.db'
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
