import os
from dotenv import load_dotenv

# Load environment variables from a .env file if present
load_dotenv()

class Config:
    # Flask app secret key for session signing and CSRF protection
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'super-secret-key-for-btech-final-project'
    
    # Database connection parameters (MySQL)
    # Format: mysql+pymysql://username:password@host:port/database_name
    DB_USER = os.environ.get('DB_USER') or 'root'
    DB_PASSWORD = os.environ.get('DB_PASSWORD') or 'password'
    DB_HOST = os.environ.get('DB_HOST') or 'localhost'
    DB_PORT = os.environ.get('DB_PORT') or '3306'
    DB_NAME = os.environ.get('DB_NAME') or 'student_attendance_system'
    
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
        
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # File upload configurations
    UPLOAD_FOLDER = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'static', 'uploads')
    MAX_CONTENT_LENGTH = 2 * 1024 * 1024  # Limit uploads to 2MB
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
    
    # Remember-me cookie lifetime (in seconds)
    REMEMBER_COOKIE_DURATION = 86400 * 30  # 30 Days
