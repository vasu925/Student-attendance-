import { pgTable, serial, text, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// 1. Departments table
export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  code: text("code").unique().notNull(),
  name: text("name").notNull(),
  description: text("description"),
});

// 2. Faculty table
export const faculty = pgTable("faculty", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").unique().notNull(),
  password: text("password"),
  phone: text("phone"),
  departmentId: integer("department_id").references(() => departments.id),
  profilePic: text("profile_pic"),
  photo: text("photo"),
  uid: text("uid").unique(), // Optional Firebase Auth UID connection
});

// 3. Subjects table
export const subjects = pgTable("subjects", {
  id: serial("id").primaryKey(),
  code: text("code").unique().notNull(),
  name: text("name").notNull(),
  departmentId: integer("department_id").references(() => departments.id),
  year: integer("year"),
  semester: integer("semester"),
});

// 4. Students table
export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  rollNumber: text("roll_number").unique().notNull(),
  fullName: text("full_name").notNull(),
  gender: text("gender"),
  dob: text("dob"),
  departmentId: integer("department_id").references(() => departments.id),
  year: integer("year"),
  semester: integer("semester"),
  section: text("section"),
  email: text("email").unique().notNull(),
  phone: text("phone"),
  address: text("address"),
  parentName: text("parent_name"),
  parentPhone: text("parent_phone"),
  photo: text("photo"),
});

// 5. Attendance table
export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(), // format: YYYY-MM-DD
  departmentId: integer("department_id").references(() => departments.id),
  semester: integer("semester"),
  section: text("section"),
  subjectId: integer("subject_id").references(() => subjects.id),
  createdBy: integer("created_by").references(() => faculty.id),
  createdAt: text("created_at"),
});

// 6. Attendance Details table
export const attendanceDetails = pgTable("attendance_details", {
  id: serial("id").primaryKey(),
  attendanceId: integer("attendance_id").references(() => attendance.id, { onDelete: "cascade" }),
  studentId: integer("student_id").references(() => students.id, { onDelete: "cascade" }),
  status: text("status").notNull(), // 'Present', 'Absent'
  remarks: text("remarks"),
});

// Relationships
export const departmentsRelations = relations(departments, ({ many }) => ({
  faculty: many(faculty),
  subjects: many(subjects),
  students: many(students),
  attendance: many(attendance),
}));

export const facultyRelations = relations(faculty, ({ one, many }) => ({
  department: one(departments, {
    fields: [faculty.departmentId],
    references: [departments.id],
  }),
  attendanceCreated: many(attendance),
}));

export const subjectsRelations = relations(subjects, ({ one, many }) => ({
  department: one(departments, {
    fields: [subjects.departmentId],
    references: [departments.id],
  }),
  attendance: many(attendance),
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  department: one(departments, {
    fields: [students.departmentId],
    references: [departments.id],
  }),
  attendanceDetails: many(attendanceDetails),
}));

export const attendanceRelations = relations(attendance, ({ one, many }) => ({
  department: one(departments, {
    fields: [attendance.departmentId],
    references: [departments.id],
  }),
  subject: one(subjects, {
    fields: [attendance.subjectId],
    references: [subjects.id],
  }),
  creator: one(faculty, {
    fields: [attendance.createdBy],
    references: [faculty.id],
  }),
  details: many(attendanceDetails),
}));

export const attendanceDetailsRelations = relations(attendanceDetails, ({ one }) => ({
  attendance: one(attendance, {
    fields: [attendanceDetails.attendanceId],
    references: [attendance.id],
  }),
  student: one(students, {
    fields: [attendanceDetails.studentId],
    references: [students.id],
  }),
}));
