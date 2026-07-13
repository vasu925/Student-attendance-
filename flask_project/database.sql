-- ==========================================
-- Student Attendance Management System Database
-- Target Database Engine: MySQL 8.0+
-- File: database.sql
-- ==========================================

CREATE DATABASE IF NOT EXISTS student_attendance_system;
USE student_attendance_system;

-- 1. Departments Table
CREATE TABLE IF NOT EXISTS departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_dept_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Faculty Table
CREATE TABLE IF NOT EXISTS faculty (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(15),
    department_id INT,
    profile_pic VARCHAR(255) DEFAULT 'default_avatar.png',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    INDEX idx_fac_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Subjects Table
CREATE TABLE IF NOT EXISTS subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(15) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    department_id INT NOT NULL,
    year INT NOT NULL, -- 1, 2, 3, 4 (B.Tech Years)
    semester INT NOT NULL, -- 1 to 8
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
    INDEX idx_sub_dept (department_id),
    INDEX idx_sub_sem (year, semester)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Students Table
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    roll_number VARCHAR(20) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    gender ENUM('Male', 'Female', 'Other') NOT NULL,
    dob DATE NOT NULL,
    department_id INT NOT NULL,
    year INT NOT NULL, -- 1, 2, 3, 4 (B.Tech Years)
    semester INT NOT NULL, -- 1 to 8
    section VARCHAR(5) NOT NULL, -- 'A', 'B', 'C', etc.
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(15),
    address TEXT,
    parent_name VARCHAR(100),
    parent_phone VARCHAR(15),
    photo VARCHAR(255) DEFAULT 'default_student.png',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
    INDEX idx_stud_roll (roll_number),
    INDEX idx_stud_dept_sem (department_id, year, semester, section)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Attendance (Header) Table
CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    department_id INT NOT NULL,
    semester INT NOT NULL,
    section VARCHAR(5) NOT NULL,
    subject_id INT NOT NULL,
    created_by INT, -- Faculty ID
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES faculty(id) ON DELETE SET NULL,
    UNIQUE KEY uq_attendance_session (date, department_id, semester, section, subject_id),
    INDEX idx_att_date (date),
    INDEX idx_att_lookup (department_id, semester, section, subject_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Attendance Details Table (Many-to-Many between Attendance & Students)
CREATE TABLE IF NOT EXISTS attendance_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    attendance_id INT NOT NULL,
    student_id INT NOT NULL,
    status ENUM('Present', 'Absent', 'Late') NOT NULL,
    remarks VARCHAR(255),
    FOREIGN KEY (attendance_id) REFERENCES attendance(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    UNIQUE KEY uq_student_attendance_entry (attendance_id, student_id),
    INDEX idx_det_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- INSERT SAMPLE DATA
-- ==========================================

-- 1. Insert Departments
INSERT INTO departments (id, code, name, description) VALUES
(1, 'CSE', 'Computer Science & Engineering', 'Focuses on computing theory, systems, algorithms, software development, and machine learning.'),
(2, 'ECE', 'Electronics & Communication Engineering', 'Deals with electronics devices, communication networks, VLSI design, and signal processing.'),
(3, 'ME', 'Mechanical Engineering', 'Covers thermal engineering, design, dynamics, thermodynamics, and manufacturing processes.'),
(4, 'EE', 'Electrical Engineering', 'Focuses on power systems, electrical machinery, control systems, and renewable energy.');

-- 2. Insert Faculty
-- Note: Passwords are "admin123" hashed using pbkdf2:sha256
-- pbkdf2:sha256:600000$t0K2cId9lO... mock hash
INSERT INTO faculty (id, name, email, password_hash, phone, department_id, profile_pic) VALUES
(1, 'Dr. Rajesh Sharma', 'rajesh.cse@college.edu', 'pbkdf2:sha256:600000$p59eZf8SNDjO$e164478f7e273f0be7cc9df1969a53f0da59fb36d0f5e1f0e8ebf4b00ca32eb0', '+919876543210', 1, 'faculty_rajesh.png'),
(2, 'Dr. Priya Nair', 'priya.ece@college.edu', 'pbkdf2:sha256:600000$p59eZf8SNDjO$e164478f7e273f0be7cc9df1969a53f0da59fb36d0f5e1f0e8ebf4b00ca32eb0', '+919876543211', 2, 'faculty_priya.png');

-- 3. Insert Subjects for CSE & ECE Final Year (B.Tech Year 4, Semester 8)
INSERT INTO subjects (id, code, name, department_id, year, semester) VALUES
(1, 'CS-401', 'Cryptography & Network Security', 1, 4, 8),
(2, 'CS-402', 'Cloud Computing Architecture', 1, 4, 8),
(3, 'CS-403', 'Neural Networks & Deep Learning', 1, 4, 8),
(4, 'CS-404', 'Software Project Management', 1, 4, 8),
(5, 'EC-401', 'Wireless Communications', 2, 4, 8),
(6, 'EC-402', 'Embedded Systems & IoT', 2, 4, 8);

-- 4. Insert Students for CSE Final Year (Year 4, Semester 8, Section A)
INSERT INTO students (id, roll_number, full_name, gender, dob, department_id, year, semester, section, email, phone, address, parent_name, parent_phone, photo) VALUES
(1, '2023CSE01', 'Aarav Sharma', 'Male', '2004-05-15', 1, 4, 8, 'A', 'aarav.sharma@gmail.com', '+919111111111', '12, MG Road, Bangalore', 'Sanjay Sharma', '+919222222222', 'student_1.png'),
(2, '2023CSE02', 'Ananya Iyer', 'Female', '2004-09-22', 1, 4, 8, 'A', 'ananya.iyer@gmail.com', '+919111111112', '45, Jayanagar, Bangalore', 'Kalyan Iyer', '+919222222223', 'student_2.png'),
(3, '2023CSE03', 'Kabir Verma', 'Male', '2004-02-10', 1, 4, 8, 'A', 'kabir.verma@gmail.com', '+919111111113', '78, Indiranagar, Bangalore', 'Ramesh Verma', '+919222222224', 'student_3.png'),
(4, '2023CSE04', 'Diya Patel', 'Female', '2004-12-05', 1, 4, 8, 'A', 'diya.patel@gmail.com', '+919111111114', '11, Koramangala, Bangalore', 'Bharat Patel', '+919222222225', 'student_4.png'),
(5, '2023CSE05', 'Rohan Das', 'Male', '2004-07-19', 1, 4, 8, 'A', 'rohan.das@gmail.com', '+919111111115', '302, Whitefield, Bangalore', 'Amit Das', '+919222222226', 'student_5.png'),
(6, '2023CSE06', 'Sneha Reddy', 'Female', '2004-03-30', 1, 4, 8, 'A', 'sneha.reddy@gmail.com', '+919111111116', '88, HSR Layout, Bangalore', 'Prabhakar Reddy', '+919222222227', 'student_6.png'),
(7, '2023CSE07', 'Vihaan Rao', 'Male', '2004-10-12', 1, 4, 8, 'A', 'vihaan.rao@gmail.com', '+919111111117', '55, Electronic City, Bangalore', 'Srinivas Rao', '+919222222228', 'student_7.png'),
(8, '2023CSE08', 'Meera Joshi', 'Female', '2004-06-25', 1, 4, 8, 'A', 'meera.joshi@gmail.com', '+919111111118', '19, Bannerghatta Road, Bangalore', 'Dinesh Joshi', '+919222222229', 'student_8.png'),
(9, '2023CSE09', 'Aditya Sen', 'Male', '2004-01-14', 1, 4, 8, 'A', 'aditya.sen@gmail.com', '+919111111119', '104, Outer Ring Road, Bangalore', 'Nitin Sen', '+919222222230', 'student_9.png'),
(10, '2023CSE10', 'Ishaan Gupta', 'Male', '2004-08-08', 1, 4, 8, 'A', 'ishaan.gupta@gmail.com', '+919111111120', '42, Marathahalli, Bangalore', 'Anil Gupta', '+919222222231', 'student_10.png');

-- 5. Insert Attendance Header Record
INSERT INTO attendance (id, date, department_id, semester, section, subject_id, created_by) VALUES
(1, CURDATE(), 1, 8, 'A', 1, 1),
(2, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 1, 8, 'A', 2, 1),
(3, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 1, 8, 'A', 3, 1);

-- 6. Insert Attendance Details (Status for each student)
-- Session 1 (Today, Cryptography): Mix of Present, Late, Absent
INSERT INTO attendance_details (attendance_id, student_id, status, remarks) VALUES
(1, 1, 'Present', 'On time'),
(1, 2, 'Present', 'On time'),
(1, 3, 'Absent', 'No notification'),
(1, 4, 'Present', 'On time'),
(1, 5, 'Late', 'Bus delay'),
(1, 6, 'Present', 'On time'),
(1, 7, 'Present', 'On time'),
(1, 8, 'Absent', 'Medical sick leave'),
(1, 9, 'Present', 'On time'),
(1, 10, 'Present', 'On time');

-- Session 2 (Yesterday, Cloud Computing): Excellent Attendance
INSERT INTO attendance_details (attendance_id, student_id, status, remarks) VALUES
(2, 1, 'Present', ''),
(2, 2, 'Present', ''),
(2, 3, 'Present', ''),
(2, 4, 'Present', ''),
(2, 5, 'Present', ''),
(2, 6, 'Present', ''),
(2, 7, 'Present', ''),
(2, 8, 'Absent', 'Fever'),
(2, 9, 'Present', ''),
(2, 10, 'Late', 'Rain delay');

-- Session 3 (2 Days Ago, Deep Learning)
INSERT INTO attendance_details (attendance_id, student_id, status, remarks) VALUES
(3, 1, 'Present', ''),
(3, 2, 'Present', ''),
(3, 3, 'Absent', 'Family function'),
(3, 4, 'Present', ''),
(3, 5, 'Present', ''),
(3, 6, 'Present', ''),
(3, 7, 'Present', ''),
(3, 8, 'Present', ''),
(3, 9, 'Absent', 'No notification'),
(3, 10, 'Present', '');
