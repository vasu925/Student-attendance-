from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, BooleanField, SubmitField, SelectField, TextAreaField, DateField, EmailField
from wtforms.validators import DataRequired, Email, EqualTo, Length, Optional, ValidationError
from flask_wtf.file import FileField, FileAllowed

class LoginForm(FlaskForm):
    email = EmailField('Email Address', validators=[DataRequired(), Email(), Length(max=100)])
    password = PasswordField('Password', validators=[DataRequired()])
    remember_me = BooleanField('Remember Me')
    submit = SubmitField('Login')


class RegistrationForm(FlaskForm):
    name = StringField('Full Name', validators=[DataRequired(), Length(min=2, max=100)])
    email = EmailField('Email Address', validators=[DataRequired(), Email(), Length(max=100)])
    password = PasswordField('Password', validators=[DataRequired(), Length(min=6, max=50)])
    confirm_password = PasswordField('Confirm Password', validators=[DataRequired(), EqualTo('password', message='Passwords must match')])
    phone = StringField('Phone Number', validators=[Optional(), Length(max=15)])
    department_id = SelectField('Department', coerce=int, validators=[DataRequired()])
    submit = SubmitField('Register')


class ForgotPasswordForm(FlaskForm):
    email = EmailField('Email Address', validators=[DataRequired(), Email()])
    submit = SubmitField('Request Password Reset')


class ProfileForm(FlaskForm):
    name = StringField('Full Name', validators=[DataRequired(), Length(min=2, max=100)])
    email = EmailField('Email Address', validators=[DataRequired(), Email(), Length(max=100)])
    phone = StringField('Phone Number', validators=[Optional(), Length(max=15)])
    department_id = SelectField('Department', coerce=int, validators=[Optional()])
    profile_pic = FileField('Update Profile Picture', validators=[Optional(), FileAllowed(['jpg', 'jpeg', 'png', 'gif'], 'Images only!')])
    submit = SubmitField('Update Profile')


class ChangePasswordForm(FlaskForm):
    current_password = PasswordField('Current Password', validators=[DataRequired()])
    new_password = PasswordField('New Password', validators=[DataRequired(), Length(min=6, max=50)])
    confirm_password = PasswordField('Confirm New Password', validators=[DataRequired(), EqualTo('new_password', message='Passwords must match')])
    submit = SubmitField('Change Password')


class DepartmentForm(FlaskForm):
    code = StringField('Department Code', validators=[DataRequired(), Length(min=2, max=10)])
    name = StringField('Department Name', validators=[DataRequired(), Length(min=2, max=100)])
    description = TextAreaField('Description', validators=[Optional(), Length(max=500)])
    submit = SubmitField('Save')


class SubjectForm(FlaskForm):
    code = StringField('Subject Code', validators=[DataRequired(), Length(min=2, max=15)])
    name = StringField('Subject Name', validators=[DataRequired(), Length(min=2, max=100)])
    department_id = SelectField('Department', coerce=int, validators=[DataRequired()])
    year = SelectField('Year', choices=[(1, '1st Year'), (2, '2nd Year'), (3, '3rd Year'), (4, '4th Year')], coerce=int, validators=[DataRequired()])
    semester = SelectField('Semester', choices=[(1, '1st Sem'), (2, '2nd Sem'), (3, '3rd Sem'), (4, '4th Sem'), (5, '5th Sem'), (6, '6th Sem'), (7, '7th Sem'), (8, '8th Sem')], coerce=int, validators=[DataRequired()])
    submit = SubmitField('Save')


class StudentForm(FlaskForm):
    roll_number = StringField('Roll Number', validators=[DataRequired(), Length(min=2, max=20)])
    full_name = StringField('Full Name', validators=[DataRequired(), Length(min=2, max=100)])
    gender = SelectField('Gender', choices=[('Male', 'Male'), ('Female', 'Female'), ('Other', 'Other')], validators=[DataRequired()])
    dob = DateField('Date of Birth', validators=[DataRequired()])
    department_id = SelectField('Department', coerce=int, validators=[DataRequired()])
    year = SelectField('Year', choices=[(1, '1st Year'), (2, '2nd Year'), (3, '3rd Year'), (4, '4th Year')], coerce=int, validators=[DataRequired()])
    semester = SelectField('Semester', choices=[(1, '1st Sem'), (2, '2nd Sem'), (3, '3rd Sem'), (4, '4th Sem'), (5, '5th Sem'), (6, '6th Sem'), (7, '7th Sem'), (8, '8th Sem')], coerce=int, validators=[DataRequired()])
    section = SelectField('Section', choices=[('A', 'Section A'), ('B', 'Section B'), ('C', 'Section C'), ('D', 'Section D')], validators=[DataRequired()])
    email = EmailField('Email Address', validators=[DataRequired(), Email(), Length(max=100)])
    phone = StringField('Phone Number', validators=[Optional(), Length(max=15)])
    address = TextAreaField('Residential Address', validators=[Optional(), Length(max=300)])
    parent_name = StringField('Parent/Guardian Name', validators=[Optional(), Length(max=100)])
    parent_phone = StringField('Parent Phone Number', validators=[Optional(), Length(max=15)])
    photo = FileField('Student Photo', validators=[Optional(), FileAllowed(['jpg', 'jpeg', 'png', 'gif'], 'Images only!')])
    submit = SubmitField('Save Student')


class AttendanceFilterForm(FlaskForm):
    department_id = SelectField('Department', coerce=int, validators=[DataRequired()])
    semester = SelectField('Semester', choices=[(1, '1st Sem'), (2, '2nd Sem'), (3, '3rd Sem'), (4, '4th Sem'), (5, '5th Sem'), (6, '6th Sem'), (7, '7th Sem'), (8, '8th Sem')], coerce=int, validators=[DataRequired()])
    section = SelectField('Section', choices=[('A', 'A'), ('B', 'B'), ('C', 'C'), ('D', 'D')], validators=[DataRequired()])
    subject_id = SelectField('Subject', coerce=int, validators=[DataRequired()])
    date = DateField('Attendance Date', default=DateField.default, validators=[DataRequired()])
    submit = SubmitField('Load Class')
