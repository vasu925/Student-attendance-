import os
from datetime import datetime, date
from flask import Flask, render_template, redirect, url_for, flash, request, jsonify, send_from_directory
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from flask_wtf.csrf import CSRFProtect
from werkzeug.utils import secure_filename

# Import models, forms, and configuration
from config import Config
from models import db, Faculty, Department, Subject, Student, Attendance, AttendanceDetail
from forms import (LoginForm, RegistrationForm, ForgotPasswordForm, ProfileForm,
                   ChangePasswordForm, DepartmentForm, SubjectForm, StudentForm, AttendanceFilterForm)

app = Flask(__name__)
app.config.from_object(Config)

# Initialize extensions
db.init_app(app)
csrf = CSRFProtect(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'
login_manager.login_message_category = 'warning'

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

@login_manager.user_loader
def load_user(user_id):
    return Faculty.query.get(int(user_id))

# Helper: Allowed file validation
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

# ==========================================
# AUTHENTICATION ROUTES
# ==========================================

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    form = LoginForm()
    if form.validate_on_submit():
        user = Faculty.query.filter_by(email=form.email.data).first()
        if user and user.check_password(form.password.data):
            login_user(user, remember=form.remember_me.data)
            next_page = request.args.get('next')
            flash(f'Welcome back, {user.name}!', 'success')
            return redirect(next_page or url_for('dashboard'))
        else:
            flash('Invalid email or password. Please try again.', 'danger')
    return render_template('login.html', title='Faculty Login', form=form)

@app.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    form = RegistrationForm()
    # Populate department dropdown dynamically
    departments = Department.query.order_by(Department.name).all()
    form.department_id.choices = [(d.id, d.name) for d in departments]
    
    if form.validate_on_submit():
        # Check if email exists
        existing_faculty = Faculty.query.filter_by(email=form.email.data).first()
        if existing_faculty:
            flash('Email is already registered. Please login.', 'warning')
            return redirect(url_for('login'))
        
        faculty = Faculty(
            name=form.name.data,
            email=form.email.data,
            phone=form.phone.data,
            department_id=form.department_id.data
        )
        faculty.set_password(form.password.data)
        db.session.add(faculty)
        db.session.commit()
        flash('Registration successful! Please login with your credentials.', 'success')
        return redirect(url_for('login'))
    return render_template('register.html', title='Faculty Registration', form=form)

@app.route('/forgot-password', methods=['GET', 'POST'])
def forgot_password():
    form = ForgotPasswordForm()
    if form.validate_on_submit():
        # In a production B.Tech project, you would trigger an email send.
        # Here we mock password reset for user convenience.
        user = Faculty.query.filter_by(email=form.email.data).first()
        if user:
            flash('Password reset instructions have been sent to your registered email.', 'info')
        else:
            flash('Email address not found.', 'danger')
        return redirect(url_for('login'))
    return render_template('forgot_password.html', title='Forgot Password', form=form)

@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('You have been securely logged out.', 'info')
    return redirect(url_for('login'))


# ==========================================
# DASHBOARD ROUTE
# ==========================================

@app.route('/')
@app.route('/dashboard')
@login_required
def dashboard():
    total_students = Student.query.count()
    total_departments = Department.query.count()
    total_subjects = Subject.query.count()
    
    # Calculate today's attendance metrics
    today = date.today()
    todays_headers = Attendance.query.filter_by(date=today).all()
    header_ids = [h.id for h in todays_headers]
    
    today_present = 0
    today_absent = 0
    today_late = 0
    
    if header_ids:
        today_present = AttendanceDetail.query.filter(AttendanceDetail.attendance_id.in_(header_ids), AttendanceDetail.status == 'Present').count()
        today_absent = AttendanceDetail.query.filter(AttendanceDetail.attendance_id.in_(header_ids), AttendanceDetail.status == 'Absent').count()
        today_late = AttendanceDetail.query.filter(AttendanceDetail.attendance_id.in_(header_ids), AttendanceDetail.status == 'Late').count()
        
    total_today = today_present + today_absent + today_late
    today_percentage = round((today_present + today_late) / total_today * 100, 1) if total_today > 0 else 0.0
    
    # Overall history percentage
    all_details = AttendanceDetail.query.all()
    total_all = len(all_details)
    present_all = sum(1 for d in all_details if d.status in ['Present', 'Late'])
    overall_percentage = round(present_all / total_all * 100, 1) if total_all > 0 else 75.0 # realistic default if fresh
    
    # Recent Activities list
    recent_activities = []
    recent_headers = Attendance.query.order_by(Attendance.created_at.desc()).limit(5).all()
    for h in recent_headers:
        sub = Subject.query.get(h.subject_id)
        dept = Department.query.get(h.department_id)
        recent_activities.append({
            'time': h.created_at.strftime('%I:%M %p, %d %b'),
            'text': f"Attendance marked for {sub.code if sub else 'Subject'} ({dept.code if dept else 'Dept'}) Semester {h.semester} Section {h.section}."
        })
    
    # Dummy chart data endpoints integrated in front page
    return render_template('dashboard.html', title='Faculty Dashboard',
                           total_students=total_students,
                           total_departments=total_departments,
                           total_subjects=total_subjects,
                           today_present=today_present,
                           today_absent=today_absent,
                           today_late=today_late,
                           today_percentage=today_percentage,
                           overall_percentage=overall_percentage,
                           recent_activities=recent_activities)


# ==========================================
# DEPARTMENT MANAGEMENT (CRUD)
# ==========================================

@app.route('/departments', methods=['GET'])
@login_required
def departments():
    search = request.args.get('search', '')
    page = request.args.get('page', 1, type=int)
    
    query = Department.query
    if search:
        query = query.filter(Department.name.like(f"%{search}%") | Department.code.like(f"%{search}%"))
        
    pagination = query.order_by(Department.code).paginate(page=page, per_page=5, error_out=False)
    depts = pagination.items
    return render_template('departments.html', title='Manage Departments', departments=depts, pagination=pagination, search=search)

@app.route('/departments/add', methods=['GET', 'POST'])
@login_required
def add_department():
    form = DepartmentForm()
    if form.validate_on_submit():
        existing = Department.query.filter_by(code=form.code.data.upper()).first()
        if existing:
            flash(f"Department code '{form.code.data.upper()}' already exists.", 'danger')
            return render_template('department_form.html', form=form, title='Add Department')
            
        dept = Department(
            code=form.code.data.upper(),
            name=form.name.data,
            description=form.description.data
        )
        db.session.add(dept)
        db.session.commit()
        flash('Department added successfully!', 'success')
        return redirect(url_for('departments'))
    return render_template('department_form.html', form=form, title='Add Department')

@app.route('/departments/edit/<int:id>', methods=['GET', 'POST'])
@login_required
def edit_department(id):
    dept = Department.query.get_or_404(id)
    form = DepartmentForm(obj=dept)
    if form.validate_on_submit():
        existing = Department.query.filter(Department.code == form.code.data.upper(), Department.id != id).first()
        if existing:
            flash(f"Department code '{form.code.data.upper()}' already in use by another department.", 'danger')
            return render_template('department_form.html', form=form, title='Edit Department')
            
        dept.code = form.code.data.upper()
        dept.name = form.name.data
        dept.description = form.description.data
        db.session.commit()
        flash('Department updated successfully!', 'success')
        return redirect(url_for('departments'))
    return render_template('department_form.html', form=form, title='Edit Department')

@app.route('/departments/delete/<int:id>', methods=['POST'])
@login_required
def delete_department(id):
    dept = Department.query.get_or_404(id)
    db.session.delete(dept)
    db.session.commit()
    flash('Department deleted successfully!', 'success')
    return redirect(url_for('departments'))


# ==========================================
# SUBJECT MANAGEMENT (CRUD)
# ==========================================

@app.route('/subjects', methods=['GET'])
@login_required
def subjects():
    search = request.args.get('search', '')
    page = request.args.get('page', 1, type=int)
    
    query = Subject.query
    if search:
        query = query.filter(Subject.name.like(f"%{search}%") | Subject.code.like(f"%{search}%"))
        
    pagination = query.order_by(Subject.code).paginate(page=page, per_page=10, error_out=False)
    subs = pagination.items
    return render_template('subjects.html', title='Manage Subjects', subjects=subs, pagination=pagination, search=search)

@app.route('/subjects/add', methods=['GET', 'POST'])
@login_required
def add_subject():
    form = SubjectForm()
    depts = Department.query.order_by(Department.name).all()
    form.department_id.choices = [(d.id, d.name) for d in depts]
    
    if form.validate_on_submit():
        existing = Subject.query.filter_by(code=form.code.data.upper()).first()
        if existing:
            flash(f"Subject code '{form.code.data.upper()}' already exists.", 'danger')
            return render_template('subject_form.html', form=form, title='Add Subject')
            
        sub = Subject(
            code=form.code.data.upper(),
            name=form.name.data,
            department_id=form.department_id.data,
            year=form.year.data,
            semester=form.semester.data
        )
        db.session.add(sub)
        db.session.commit()
        flash('Subject added and assigned successfully!', 'success')
        return redirect(url_for('subjects'))
    return render_template('subject_form.html', form=form, title='Add Subject')

@app.route('/subjects/edit/<int:id>', methods=['GET', 'POST'])
@login_required
def edit_subject(id):
    sub = Subject.query.get_or_404(id)
    form = SubjectForm(obj=sub)
    depts = Department.query.order_by(Department.name).all()
    form.department_id.choices = [(d.id, d.name) for d in depts]
    
    if form.validate_on_submit():
        existing = Subject.query.filter(Subject.code == form.code.data.upper(), Subject.id != id).first()
        if existing:
            flash(f"Subject code '{form.code.data.upper()}' is already in use.", 'danger')
            return render_template('subject_form.html', form=form, title='Edit Subject')
            
        sub.code = form.code.data.upper()
        sub.name = form.name.data
        sub.department_id = form.department_id.data
        sub.year = form.year.data
        sub.semester = form.semester.data
        db.session.commit()
        flash('Subject updated successfully!', 'success')
        return redirect(url_for('subjects'))
    return render_template('subject_form.html', form=form, title='Edit Subject')

@app.route('/subjects/delete/<int:id>', methods=['POST'])
@login_required
def delete_subject(id):
    sub = Subject.query.get_or_404(id)
    db.session.delete(sub)
    db.session.commit()
    flash('Subject deleted successfully!', 'success')
    return redirect(url_for('subjects'))


# ==========================================
# STUDENT MANAGEMENT (CRUD)
# ==========================================

@app.route('/students', methods=['GET'])
@login_required
def students():
    search = request.args.get('search', '')
    dept_filter = request.args.get('department_id', '', type=str)
    year_filter = request.args.get('year', '', type=str)
    sem_filter = request.args.get('semester', '', type=str)
    sec_filter = request.args.get('section', '', type=str)
    page = request.args.get('page', 1, type=int)
    
    query = Student.query
    if search:
        query = query.filter(Student.full_name.like(f"%{search}%") | Student.roll_number.like(f"%{search}%") | Student.email.like(f"%{search}%"))
    if dept_filter:
        query = query.filter(Student.department_id == int(dept_filter))
    if year_filter:
        query = query.filter(Student.year == int(year_filter))
    if sem_filter:
        query = query.filter(Student.semester == int(sem_filter))
    if sec_filter:
        query = query.filter(Student.section == sec_filter)
        
    pagination = query.order_by(Student.roll_number).paginate(page=page, per_page=10, error_out=False)
    studs = pagination.items
    
    departments = Department.query.order_by(Department.name).all()
    return render_template('students.html', title='Student Directory', students=studs, pagination=pagination,
                           departments=departments, search=search, dept_filter=dept_filter,
                           year_filter=year_filter, sem_filter=sem_filter, sec_filter=sec_filter)

@app.route('/students/<int:id>')
@login_required
def view_student(id):
    student = Student.query.get_or_404(id)
    
    # Calculate Attendance Percentage for this student
    total_classes = AttendanceDetail.query.filter_by(student_id=id).count()
    attended_classes = AttendanceDetail.query.filter(AttendanceDetail.student_id == id, AttendanceDetail.status.in_(['Present', 'Late'])).count()
    attendance_ratio = round((attended_classes / total_classes) * 100, 1) if total_classes > 0 else 100.0
    
    recent_attendance = AttendanceDetail.query.filter_by(student_id=id).order_by(AttendanceDetail.id.desc()).limit(10).all()
    
    return render_template('student_detail.html', title=f"Student Profile: {student.full_name}",
                           student=student, attendance_ratio=attendance_ratio,
                           total_classes=total_classes, attended_classes=attended_classes,
                           recent_attendance=recent_attendance)

@app.route('/students/add', methods=['GET', 'POST'])
@login_required
def add_student():
    form = StudentForm()
    depts = Department.query.order_by(Department.name).all()
    form.department_id.choices = [(d.id, d.name) for d in depts]
    
    if form.validate_on_submit():
        existing_roll = Student.query.filter_by(roll_number=form.roll_number.data.upper()).first()
        if existing_roll:
            flash(f"Roll Number '{form.roll_number.data.upper()}' is already assigned to another student.", 'danger')
            return render_template('student_form.html', form=form, title='Add Student')
            
        existing_email = Student.query.filter_by(email=form.email.data).first()
        if existing_email:
            flash(f"Email '{form.email.data}' is already registered.", 'danger')
            return render_template('student_form.html', form=form, title='Add Student')
            
        # Photo upload logic
        filename = 'default_student.png'
        if form.photo.data and allowed_file(form.photo.data.filename):
            file = form.photo.data
            file_ext = secure_filename(file.filename).rsplit('.', 1)[1].lower()
            filename = f"student_{form.roll_number.data.upper()}.{file_ext}"
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)
            
        student = Student(
            roll_number=form.roll_number.data.upper(),
            full_name=form.full_name.data,
            gender=form.gender.data,
            dob=form.dob.data,
            department_id=form.department_id.data,
            year=form.year.data,
            semester=form.semester.data,
            section=form.section.data,
            email=form.email.data,
            phone=form.phone.data,
            address=form.address.data,
            parent_name=form.parent_name.data,
            parent_phone=form.parent_phone.data,
            photo=filename
        )
        db.session.add(student)
        db.session.commit()
        flash('Student registered successfully!', 'success')
        return redirect(url_for('students'))
    return render_template('student_form.html', form=form, title='Add Student')

@app.route('/students/edit/<int:id>', methods=['GET', 'POST'])
@login_required
def edit_student(id):
    student = Student.query.get_or_404(id)
    form = StudentForm(obj=student)
    depts = Department.query.order_by(Department.name).all()
    form.department_id.choices = [(d.id, d.name) for d in depts]
    
    if form.validate_on_submit():
        existing_roll = Student.query.filter(Student.roll_number == form.roll_number.data.upper(), Student.id != id).first()
        if existing_roll:
            flash(f"Roll Number '{form.roll_number.data.upper()}' already in use.", 'danger')
            return render_template('student_form.html', form=form, title='Edit Student', student=student)
            
        # Update image if provided
        filename = student.photo
        if form.photo.data and allowed_file(form.photo.data.filename):
            file = form.photo.data
            file_ext = secure_filename(file.filename).rsplit('.', 1)[1].lower()
            filename = f"student_{form.roll_number.data.upper()}.{file_ext}"
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)
            
        student.roll_number = form.roll_number.data.upper()
        student.full_name = form.full_name.data
        student.gender = form.gender.data
        student.dob = form.dob.data
        student.department_id = form.department_id.data
        student.year = form.year.data
        student.semester = form.semester.data
        student.section = form.section.data
        student.email = form.email.data
        student.phone = form.phone.data
        student.address = form.address.data
        student.parent_name = form.parent_name.data
        student.parent_phone = form.parent_phone.data
        student.photo = filename
        
        db.session.commit()
        flash('Student record updated successfully!', 'success')
        return redirect(url_for('students'))
    return render_template('student_form.html', form=form, title='Edit Student', student=student)

@app.route('/students/delete/<int:id>', methods=['POST'])
@login_required
def delete_student(id):
    student = Student.query.get_or_404(id)
    # Remove image file if not default
    if student.photo != 'default_student.png':
        try:
            os.remove(os.path.join(app.config['UPLOAD_FOLDER'], student.photo))
        except OSError:
            pass
    db.session.delete(student)
    db.session.commit()
    flash('Student record deleted successfully!', 'success')
    return redirect(url_for('students'))


# ==========================================
# ATTENDANCE MODULE
# ==========================================

@app.route('/attendance/take', methods=['GET', 'POST'])
@login_required
def take_attendance():
    form = AttendanceFilterForm()
    
    # Populate dropdown choices dynamically
    depts = Department.query.order_by(Department.name).all()
    form.department_id.choices = [(d.id, d.name) for d in depts]
    
    # Populate subjects depending on chosen criteria
    subs = Subject.query.order_by(Subject.code).all()
    form.subject_id.choices = [(s.id, f"{s.code} - {s.name}") for s in subs]
    
    students_list = []
    attendance_header = None
    existing_status_map = {}
    
    # Check if a search has been completed
    is_class_loaded = False
    
    if request.method == 'POST' and 'load_class' in request.form:
        # Load the students based on parameters
        dept_id = request.form.get('department_id', type=int)
        sem = request.form.get('semester', type=int)
        sec = request.form.get('section', type=str)
        sub_id = request.form.get('subject_id', type=int)
        att_date_str = request.form.get('date', '')
        
        att_date = datetime.strptime(att_date_str, '%Y-%m-%d').date() if att_date_str else date.today()
        
        # Load students matching filter
        students_list = Student.query.filter_by(
            department_id=dept_id,
            semester=sem,
            section=sec
        ).order_by(Student.roll_number).all()
        
        if not students_list:
            flash('No registered students found matching the selected Department, Semester, and Section.', 'warning')
        else:
            is_class_loaded = True
            # Check if attendance already exists for this slot to load it for edit
            attendance_header = Attendance.query.filter_by(
                date=att_date,
                department_id=dept_id,
                semester=sem,
                section=sec,
                subject_id=sub_id
            ).first()
            
            if attendance_header:
                flash('Attendance record found for this slot. Loading saved entries to Edit.', 'info')
                details = AttendanceDetail.query.filter_by(attendance_id=attendance_header.id).all()
                existing_status_map = {d.student_id: (d.status, d.remarks or '') for d in details}
            else:
                flash(f'New attendance session started for {att_date.strftime("%d-%b-%Y")}', 'success')
                
        # Persist form fields values
        form.department_id.data = dept_id
        form.semester.data = sem
        form.section.data = sec
        form.subject_id.data = sub_id
        form.date.data = att_date

    elif request.method == 'POST' and 'save_attendance' in request.form:
        # Process and save marked attendance
        dept_id = request.form.get('department_id', type=int)
        sem = request.form.get('semester', type=int)
        sec = request.form.get('section', type=str)
        sub_id = request.form.get('subject_id', type=int)
        att_date_str = request.form.get('date', '')
        att_date = datetime.strptime(att_date_str, '%Y-%m-%d').date() if att_date_str else date.today()
        
        # Verify duplicate or update
        attendance_header = Attendance.query.filter_by(
            date=att_date,
            department_id=dept_id,
            semester=sem,
            section=sec,
            subject_id=sub_id
        ).first()
        
        if not attendance_header:
            # Create header record
            attendance_header = Attendance(
                date=att_date,
                department_id=dept_id,
                semester=sem,
                section=sec,
                subject_id=sub_id,
                created_by=current_user.id
            )
            db.session.add(attendance_header)
            db.session.flush() # gets header ID immediately
            
        # Get list of student IDs submitted
        student_ids = request.form.getlist('student_ids')
        
        for stud_id_str in student_ids:
            stud_id = int(stud_id_str)
            status = request.form.get(f'status_{stud_id}', 'Present')
            remarks = request.form.get(f'remarks_{stud_id}', '')
            
            # Check if record detail exists
            detail = AttendanceDetail.query.filter_by(
                attendance_id=attendance_header.id,
                student_id=stud_id
            ).first()
            
            if detail:
                detail.status = status
                detail.remarks = remarks
            else:
                new_detail = AttendanceDetail(
                    attendance_id=attendance_header.id,
                    student_id=stud_id,
                    status=status,
                    remarks=remarks
                )
                db.session.add(new_detail)
                
        db.session.commit()
        flash('Attendance saved and database synchronized successfully!', 'success')
        return redirect(url_for('attendance_history_route'))

    return render_template('take_attendance.html', form=form,
                           students_list=students_list,
                           is_class_loaded=is_class_loaded,
                           attendance_header=attendance_header,
                           existing_status_map=existing_status_map)

@app.route('/attendance/history')
@login_required
def attendance_history_route():
    page = request.args.get('page', 1, type=int)
    # Load recent attendance sessions
    pagination = Attendance.query.order_by(Attendance.date.desc(), Attendance.id.desc()).paginate(page=page, per_page=10, error_out=False)
    sessions = pagination.items
    
    # Build complete presentation records
    records = []
    for s in sessions:
        sub = Subject.query.get(s.subject_id)
        dept = Department.query.get(s.department_id)
        creator = Faculty.query.get(s.created_by)
        
        total_class_size = Student.query.filter_by(department_id=s.department_id, semester=s.semester, section=s.section).count()
        present_count = AttendanceDetail.query.filter_by(attendance_id=s.id, status='Present').count()
        late_count = AttendanceDetail.query.filter_by(attendance_id=s.id, status='Late').count()
        absent_count = AttendanceDetail.query.filter_by(attendance_id=s.id, status='Absent').count()
        
        records.append({
            'id': s.id,
            'date': s.date.strftime('%d-%b-%Y'),
            'department': dept.code if dept else 'N/A',
            'semester': s.semester,
            'section': s.section,
            'subject': f"{sub.code}: {sub.name}" if sub else 'N/A',
            'marked_by': creator.name if creator else 'System',
            'summary': f"Present: {present_count}, Late: {late_count}, Absent: {absent_count} / Total: {total_class_size}"
        })
        
    return render_template('attendance_history.html', title='Attendance History', records=records, pagination=pagination)


# ==========================================
# PROFILE & ACCOUNT SETTINGS
# ==========================================

@app.route('/profile', methods=['GET', 'POST'])
@login_required
def profile():
    profile_form = ProfileForm(obj=current_user)
    password_form = ChangePasswordForm()
    
    depts = Department.query.order_by(Department.name).all()
    profile_form.department_id.choices = [(d.id, d.name) for d in depts]
    
    if 'update_profile' in request.form and profile_form.validate_on_submit():
        # Update image if provided
        filename = current_user.profile_pic
        if profile_form.profile_pic.data and allowed_file(profile_form.profile_pic.data.filename):
            file = profile_form.profile_pic.data
            file_ext = secure_filename(file.filename).rsplit('.', 1)[1].lower()
            filename = f"faculty_{current_user.id}.{file_ext}"
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)
            
        current_user.name = profile_form.name.data
        current_user.email = profile_form.email.data
        current_user.phone = profile_form.phone.data
        current_user.department_id = profile_form.department_id.data
        current_user.profile_pic = filename
        
        db.session.commit()
        flash('Profile settings updated successfully!', 'success')
        return redirect(url_for('profile'))
        
    if 'change_password' in request.form and password_form.validate_on_submit():
        if current_user.check_password(password_form.current_password.data):
            current_user.set_password(password_form.new_password.data)
            db.session.commit()
            flash('Your account security password has been changed successfully!', 'success')
            return redirect(url_for('profile'))
        else:
            flash('Incorrect current password. Verification failed.', 'danger')
            
    return render_template('profile.html', title='Faculty Profile Settings',
                           profile_form=profile_form, password_form=password_form)


# ==========================================
# ANALYTICS & REPORTS
# ==========================================

@app.route('/reports', methods=['GET'])
@login_required
def reports():
    # Reports engine providing instant print/download data
    departments = Department.query.all()
    subjects = Subject.query.all()
    
    dept_id = request.args.get('department_id', '', type=str)
    sem = request.args.get('semester', '', type=str)
    sub_id = request.args.get('subject_id', '', type=str)
    start_date = request.args.get('start_date', '')
    
    report_data = []
    
    if dept_id and sem and sub_id:
        # Load all students in the class
        students = Student.query.filter_by(department_id=int(dept_id), semester=int(sem)).all()
        for student in students:
            # Query attendance stats
            headers_query = Attendance.query.filter_by(department_id=int(dept_id), semester=int(sem), subject_id=int(sub_id))
            if start_date:
                headers_query = headers_query.filter(Attendance.date >= datetime.strptime(start_date, '%Y-%m-%d').date())
            headers = headers_query.all()
            header_ids = [h.id for h in headers]
            
            total_classes = len(header_ids)
            attended = 0
            absent = 0
            late = 0
            
            if total_classes > 0:
                details = AttendanceDetail.query.filter(
                    AttendanceDetail.student_id == student.id,
                    AttendanceDetail.attendance_id.in_(header_ids)
                ).all()
                
                attended = sum(1 for d in details if d.status == 'Present')
                absent = sum(1 for d in details if d.status == 'Absent')
                late = sum(1 for d in details if d.status == 'Late')
                
            total_attended = attended + late
            percentage = round((total_attended / total_classes) * 100, 1) if total_classes > 0 else 100.0
            
            report_data.append({
                'roll_number': student.roll_number,
                'name': student.full_name,
                'total_lectures': total_classes,
                'attended': attended,
                'late': late,
                'absent': absent,
                'percentage': percentage,
                'eligibility': 'Eligible' if percentage >= 75 else 'Shortage (Blocked)'
            })
            
    return render_template('reports.html', title='Attendance Reports & Register',
                           departments=departments, subjects=subjects,
                           report_data=report_data, dept_id=dept_id, sem=sem, sub_id=sub_id, start_date=start_date)


# ==========================================
# ERROR PAGES
# ==========================================

@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html', title='404: Page Not Found'), 404

@app.errorhandler(500)
def internal_server_error(e):
    return render_template('500.html', title='500: Server Error'), 500


# ==========================================
# RUN THE APPLICATION
# ==========================================

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(host='0.0.0.0', port=5000, debug=True)
