export interface Department {
  id: number;
  code: string;
  name: string;
  description: string;
}

export interface Subject {
  id: number;
  code: string;
  name: string;
  department_id: number;
  year: number;
  semester: number;
}

export interface Student {
  id: number;
  roll_number: string;
  full_name: string;
  gender: string;
  dob: string;
  department_id: number;
  year: number;
  semester: number;
  section: string;
  email: string;
  phone: string;
  address: string;
  parent_name: string;
  parent_phone: string;
  photo: string;
}

export interface Faculty {
  id: number;
  name: string;
  email: string;
  password?: string;
  phone: string;
  department_id: number;
  profile_pic: string;
}

export interface AttendanceHeader {
  id: number;
  date: string;
  department_id: number;
  semester: number;
  section: string;
  subject_id: number;
  created_by: number;
  created_at: string;
}

export interface AttendanceDetail {
  id: number;
  attendance_id: number;
  student_id: number;
  status: "Present" | "Absent" | "Late";
  remarks: string;
}

export interface AttendanceSessionRecord {
  id: number;
  date: string;
  department: string;
  semester: number;
  section: string;
  subject: string;
  marked_by: string;
  summary: string;
}

export interface DashboardAnalytics {
  totalStudents: number;
  totalDepartments: number;
  totalSubjects: number;
  today_present: number;
  today_absent: number;
  today_late: number;
  today_percentage: number;
  overall_percentage: number;
  recentActivities: { time: string; text: string }[];
  deptStats: { code: string; name: string; percentage: number }[];
  subStats: { code: string; name: string; percentage: number }[];
  trendStats: { date: string; percentage: number }[];
}

export interface ReportRecord {
  roll_number: string;
  name: string;
  total_lectures: number;
  attended: number;
  late: number;
  absent: number;
  percentage: number;
  eligibility: string;
}
