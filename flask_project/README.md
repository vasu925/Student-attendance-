# Student Attendance Management System 🎓
### B.Tech Final Year Project - Production Ready

A comprehensive, fully-featured **Student Attendance Management System** utilizing the MVC (Model-View-Controller) architecture. It is built using Python, Flask, Flask-SQLAlchemy, Flask-Login, and Flask-WTF for the backend, and styled with Bootstrap 5, Font Awesome, and Chart.js for a professional, responsive user interface.

---

## 🛠️ Technology Stack
* **Frontend:** HTML5, CSS3, Bootstrap 5, Vanilla JavaScript (ES6), Chart.js (Interactive Analytics), Font Awesome (Icons)
* **Backend:** Python 3, Flask (Web Microframework), Flask-SQLAlchemy (ORM), Flask-Login (Session Auth), Flask-WTF (Form CSRF Protection & Server Validation)
* **Database:** MySQL 8.0+

---

## 🌟 Key Features
1. **Secure Session Engine:** Full faculty registration, password hashing (PBKDF2), "Remember Me" cookies, and Route Protection middleware.
2. **Interactive Analytics Dashboard:** Real-time summary cards, latest attendance session tracking, and graphical charts (Pie, Bar, Line) visualizing overall statistics and department comparisons.
3. **Department & Subject Managers:** Full CRUD interfaces with code uniqueness, foreign keys, and multi-year-semester mapping.
4. **Comprehensive Student Directory:** Roll number tracking, parent-guardian credentials, physical address, and profile picture upload validation.
5. **Smart Attendance Register:** Filters by section/semester, real-time checklist (Present/Absent/Late toggle) with comments, duplicates prevention, and historical edits.
6. **Academic Export Engines:** Generate printable tabular lists, filterable registers, highlight attendance shortage alerts (<75%), and print layouts.
7. **Accessibility Features:** Clean sidebar navigation, professional blue-white visual hierarchy, and an adaptive Dark Mode toggle.

---

## 📁 Directory Structure
```text
student-attendance-system/
│
├── app.py                 # Main application entry point and routes
├── config.py              # Application settings (DB, directories, upload limits)
├── models.py              # SQLAlchemy database classes and relationships
├── forms.py               # WTForms client/server validations
├── requirements.txt       # Python package dependencies
├── database.sql           # Full MySQL schema and sample records
├── README.md              # Installation and run documentation
│
├── static/                # Static assets
│   ├── css/               # Core styles and dark mode sheets
│   ├── js/                # Client side validation and charts scripts
│   └── uploads/           # Uploaded faculty avatars and student photos
│
└── templates/             # Jinja2 HTML core templates
    ├── base.html          # Global sidebar & layout shell
    ├── dashboard.html     # Analytics and KPIs screen
    ├── login.html         # Secure login screen
    ├── register.html      # Account creation form
    ├── take_attendance.html # Active attendance checklist page
    └── ...
```

---

## ⚙️ Local Installation & Setup

Follow these simple steps to run the project on your local developer machine:

### 1. Clone the repository and navigate to the project directory:
```bash
cd student-attendance-system
```

### 2. Set up the MySQL Database:
* Ensure your MySQL service is running.
* Open your MySQL Command Line or tool (e.g., MySQL Workbench, phpMyAdmin).
* Run the SQL statements in the provided `database.sql` file:
```sql
SOURCE database.sql;
```
This script will automatically create the database `student_attendance_system`, establish all tables, set up constraints, indexes, and load a rich set of realistic sample B.Tech cohort data.

### 3. Create a Virtual Environment & Install Dependencies:
Using a virtual environment is highly recommended to prevent dependency conflicts:
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS / Linux
python3 -m venv venv
source venv/bin/activate

# Install requirements
pip install -r requirements.txt
```

### 4. Configure Environment Variables:
Create a `.env` file in the root directory to customize your local DB credentials:
```env
SECRET_KEY="your-secret-session-key"
DB_USER="root"
DB_PASSWORD="your_mysql_password_here"
DB_HOST="localhost"
DB_PORT="3306"
DB_NAME="student_attendance_system"
```

### 5. Start the Application:
Launch the Flask development server:
```bash
python app.py
```
* The server will initialize and connect to MySQL.
* Open your browser and navigate to: **`http://127.0.0.1:5000`**

### 🔓 Default Faculty Demo Credentials:
For instant testing, login with the pre-seeded faculty credentials:
* **Email:** `rajesh.cse@college.edu`
* **Password:** `admin123`
*(Or Register a fresh faculty account on the Sign Up page)*
