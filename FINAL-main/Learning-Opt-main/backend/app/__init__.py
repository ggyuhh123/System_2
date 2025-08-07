# backend/app/__init__.py
from flask import Flask
from flask_cors import CORS

def create_app():
    app = Flask(__name__)

    # app.config.from_pyfile('config.py', silent=True)  

    CORS(app)

    @app.route('/')
    def index():
        return 'Backend server is running'


    from .routes.upload import bp as upload_bp
    from .routes.generate import bp as generate_bp
    from .routes.immersion import immersion_bp

    app.register_blueprint(upload_bp)
    app.register_blueprint(generate_bp)
    app.register_blueprint(immersion_bp)
    

    return app
