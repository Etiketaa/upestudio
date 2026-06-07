import os
import logging
from flask import Flask
from dotenv import load_dotenv
from flask_login import LoginManager
from app.models import db, Usuario

# Intentar registrar el dialecto de Turso manualmente
try:
    from sqlalchemy.dialects import registry
    # El nombre interno en libsql-experimental suele ser 'dialect'
    registry.register("libsql", "libsql_experimental.sqlalchemy", "dialect")
except Exception as e:
    # No fallar aquí, solo registrar la advertencia
    print(f"Advertencia: No se pudo registrar el dialecto 'libsql': {e}")

load_dotenv()

def create_app():
    # Vercel fix: Use /tmp para evitar errores de Read-only filesystem
    app = Flask(__name__, 
                instance_path='/tmp',
                template_folder='templates',
                static_folder='static')
    
    logging.basicConfig(level=logging.INFO)
    
    # Configuración básica
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-key-123')
    
    # Obtener variables de base de datos
    db_url = os.getenv('DATABASE_URL')
    db_token = os.getenv('DATABASE_AUTH_TOKEN')
    
    # Lógica de conexión para Turso (LibSQL)
    if db_url and db_url.startswith("libsql://"):
        # Asegurar que el token vaya en la URL
        if db_token and "auth_token=" not in db_url:
            separator = "&" if "?" in db_url else "?"
            db_url = f"{db_url}{separator}auth_token={db_token}"
    
    # Si no hay URL, usamos SQLite estándar (compatible con todo)
    # En Vercel usamos /tmp/ para que sea escribible
    if not db_url:
        db_url = 'sqlite:////tmp/database.db'
    
    app.config['SQLALCHEMY_DATABASE_URI'] = db_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Inicializar base de datos
    db.init_app(app)
    
    # Configurar login
    login_manager = LoginManager()
    login_manager.login_view = 'admin.login'
    login_manager.init_app(app)

    @login_manager.user_loader
    def load_user(user_id):
        return Usuario.query.get(int(user_id))

    # Filtros de plantillas
    @app.template_filter('nl2br')
    def nl2br_filter(s):
        if not s: return ""
        from markupsafe import Markup, escape
        return Markup(escape(s).replace('\n', '<br>\n'))

    # Registro de Blueprints
    from app.routes.public import public_bp
    from app.routes.admin import admin_bp
    
    app.register_blueprint(public_bp)
    app.register_blueprint(admin_bp, url_prefix='/admin')

    return app
