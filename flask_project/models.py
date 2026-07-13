from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class Department(db.Model):
    __tablename__ = 'departments'
    
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(10), unique=True, nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    faculty_members = db.relationship('Faculty', backref='department', lazy='dynamic', cascade="all, delete-orphan")
    subjects = db.relationship('Subject', backref='department', lazy='dynamic', cascade="all, delete-orphan")
    students = db.relationship('Student', backref='department', lazy='dynamic', cascade="all, delete-orphan")
    attendances = db.relationship('Attendance', backref='department', lazy='dynamic', cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Department {self.code}>"


class Faculty(UserMixin, db.Model):
    __tablename__ = 'faculty'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    phone = db.Column(db.String(15), nullable=True)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id', ondelete='SET NULL'), nullable=True)
    profile_pic = db.Column(db.String(255), default='default_avatar.png')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    created_attendances = db.relationship('Attendance', backref='creator', lazy='dynamic')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
        
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def __repr__(self):
        return f"<Faculty {self.email}>"


class Subject(db.Model):
    __tablename__ = 'subjects'
    
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(15), unique=True, nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id', ondelete='CASCADE'), nullable=False)
    year = db.Column(db.Integer, nullable=False) # 1, 2, 3, 4
    semester = db.Column(db.Integer, nullable=False) # 1 to 8
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    attendances = db.relationship('Attendance', backref='subject', lazy='dynamic', cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Subject {self.code}>"


class Student(db.Model):
    __tablename__ = 'students'
    
    id = db.Column(db.Integer, primary_key=True)
    roll_number = db.Column(db.String(20), unique=True, nullable=False, index=True)
    full_name = db.Column(db.String(100), nullable=False)
    gender = db.Column(db.Enum('Male', 'Female', 'Other'), nullable=False)
    dob = db.Column(db.Date, nullable=False)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id', ondelete='CASCADE'), nullable=False)
    year = db.Column(db.Integer, nullable=False) # 1 to 4
    semester = db.Column(db.Integer, nullable=False) # 1 to 8
    section = db.Column(db.String(5), nullable=False) # A, B, C, etc.
    email = db.Column(db.String(100), unique=True, nullable=False)
    phone = db.Column(db.String(15), nullable=True)
    address = db.Column(db.Text, nullable=True)
    parent_name = db.Column(db.String(100), nullable=True)
    parent_phone = db.Column(db.String(15), nullable=True)
    photo = db.Column(db.String(255), default='default_student.png')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    attendance_records = db.relationship('AttendanceDetail', backref='student', lazy='dynamic', cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Student {self.roll_number}>"


class Attendance(db.Model):
    __tablename__ = 'attendance'
    __table_args__ = (
        db.UniqueConstraint('date', 'department_id', 'semester', 'section', 'subject_id', name='uq_attendance_session'),
    )
    
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.Date, nullable=False, index=True)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id', ondelete='CASCADE'), nullable=False)
    semester = db.Column(db.Integer, nullable=False)
    section = db.Column(db.String(5), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey('subjects.id', ondelete='CASCADE'), nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('faculty.id', ondelete='SET NULL'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    details = db.relationship('AttendanceDetail', backref='attendance_header', lazy='dynamic', cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Attendance Header {self.id} on {self.date}>"


class AttendanceDetail(db.Model):
    __tablename__ = 'attendance_details'
    __table_args__ = (
        db.UniqueConstraint('attendance_id', 'student_id', name='uq_student_attendance_entry'),
    )
    
    id = db.Column(db.Integer, primary_key=True)
    attendance_id = db.Column(db.Integer, db.ForeignKey('attendance.id', ondelete='CASCADE'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id', ondelete='CASCADE'), nullable=False)
    status = db.Column(db.Enum('Present', 'Absent', 'Late'), nullable=False, index=True)
    remarks = db.Column(db.String(255), nullable=True)

    def __repr__(self):
        return f"<AttendanceDetail student_id={self.student_id} status={self.status}>"
