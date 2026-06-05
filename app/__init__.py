import os
from flask import Flask
from dotenv import load_dotenv
from app.models import db, Usuario
from flask_login import LoginManager

import logging

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
    
    # Vercel Postgres URL handling
    db_url = os.getenv('POSTGRES_URL') or os.getenv('DATABASE_URL')
    if db_url:
        # Neon requiere postgresql:// y sslmode=require
        if db_url.startswith("postgres://"):
            db_url = db_url.replace("postgres://", "postgresql://", 1)
        if "sslmode=" not in db_url:
            separator = "&" if "?" in db_url else "?"
            db_url += f"{separator}sslmode=require"
    
    app.config['SQLALCHEMY_DATABASE_URI'] = db_url or 'sqlite:////tmp/local.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Optimización para Supabase Transaction Pooler (Puerto 6543)
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
        "connect_args": {
            "prepare_threshold": 0  # Desactiva prepared statements para compatibilidad con poolers
        },
        "pool_pre_ping": True,       # Verifica la conexión antes de usarla
    }

    logging.info(f"Conectando a base de datos: {app.config['SQLALCHEMY_DATABASE_URI'].split('@')[-1]}")

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
