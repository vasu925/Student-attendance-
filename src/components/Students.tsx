import React, { useEffect, useState } from "react";
import { Plus, Search, Edit3, Trash2, X, Users, Eye, ArrowLeft, Calendar, Mail, Phone, MapPin, User, ChevronRight } from "lucide-react";
import { Student, Department } from "../types";

interface StudentsProps {
  onNotify: (msg: string, type: "success" | "error" | "info") => void;
  triggerRefresh: () => void;
}

export default function Students({ onNotify, triggerRefresh }: StudentsProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [semFilter, setSemFilter] = useState("");
  const [secFilter, setSecFilter] = useState("");

  const [page, setPage] = useState(1);
  const itemsPerPage = 8;

  // Active sub-views
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [studentDetails, setStudentDetails] = useState<any | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Form Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStud, setCurrentStud] = useState<Partial<Student> | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/students").then((res) => res.json()),
      fetch("/api/departments").then((res) => res.json())
    ])
      .then(([studData, deptData]) => {
        setStudents(Array.isArray(studData) ? studData : []);
        setDepartments(Array.isArray(deptData) ? deptData : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        onNotify("Failed to fetch student directories", "error");
        setLoading(false);
      });
  };

  // Fetch individual details when clicking Eye
  const handleViewDetails = (id: number) => {
    setSelectedStudentId(id);
    setDetailsLoading(true);
    fetch(`/api/students/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setStudentDetails(data);
        setDetailsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        onNotify("Failed to retrieve detailed logs", "error");
        setDetailsLoading(false);
      });
  };

  const handleOpenModal = (stud: Partial<Student> | null = null) => {
    setCurrentStud(
      stud || {
        roll_number: "",
        full_name: "",
        gender: "Male",
        dob: "2004-01-01",
        department_id: departments.length ? departments[0].id : 0,
        year: 4,
        semester: 8,
        section: "A",
        email: "",
        phone: "",
        address: "",
        parent_name: "",
        parent_phone: "",
        photo: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"
      }
    );
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setCurrentStud(null);
    setIsModalOpen(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStud) return;

    // Client validators
    const errors: Record<string, string> = {};
    if (!currentStud.roll_number?.trim()) errors.roll_number = "Roll number is required";
    if (!currentStud.full_name?.trim()) errors.full_name = "Full name is required";
    if (!currentStud.email?.trim()) errors.email = "Email is required";
    if (!currentStud.department_id) errors.department_id = "Please select a department";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const isEdit = !!currentStud.id;
    const url = isEdit ? `/api/students/${currentStud.id}` : "/api/students";
    const method = isEdit ? "PUT" : "POST";

    fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(currentStud)
    })
      .then((res) => res.json())
      .then((resJson) => {
        if (resJson.success) {
          onNotify(isEdit ? "Student details updated" : "Student profile created", "success");
          loadData();
          triggerRefresh();
          handleCloseModal();
          // If viewing details of the updated student, refresh details too
          if (isEdit && selectedStudentId === currentStud.id) {
            handleViewDetails(currentStud.id);
          }
        } else {
          onNotify(resJson.message || "An error occurred", "error");
        }
      })
      .catch((err) => {
        console.error(err);
        onNotify("Database write failure", "error");
      });
  };

  const handleDelete = (id: number, roll: string) => {
    if (!window.confirm(`Are you absolutely sure you want to delete Student Roll ${roll}? This will completely purge their history!`)) {
      return;
    }

    fetch(`/api/students/${id}`, { method: "DELETE" })
      .then((res) => res.json())
      .then((resJson) => {
        if (resJson.success) {
          onNotify(`Student ${roll} purged from system`, "success");
          setSelectedStudentId(null);
          setStudentDetails(null);
          loadData();
          triggerRefresh();
        } else {
          onNotify(resJson.message || "Purge failed", "error");
        }
      })
      .catch((err) => {
        console.error(err);
        onNotify("Connectivity failure", "error");
      });
  };

  const getDeptCode = (id: number) => {
    const dept = departments.find((d) => d.id === id);
    return dept ? dept.code : "N/A";
  };

  // Filter application
  const filteredStudents = students.filter((s) => {
    const matchSearch = s.full_name.toLowerCase().includes(search.toLowerCase()) || 
                        s.roll_number.toLowerCase().includes(search.toLowerCase()) ||
                        s.email.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter ? s.department_id === Number(deptFilter) : true;
    const matchYear = yearFilter ? s.year === Number(yearFilter) : true;
    const matchSem = semFilter ? s.semester === Number(semFilter) : true;
    const matchSec = secFilter ? s.section === secFilter : true;
    return matchSearch && matchDept && matchYear && matchSem && matchSec;
  });

  // Pagination
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const paginatedStudents = filteredStudents.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div className="space-y-6">
      
      {/* Dynamic Header: Normal Directory vs Individual Details */}
      {selectedStudentId && studentDetails ? (
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              setSelectedStudentId(null);
              setStudentDetails(null);
            }}
            className="p-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4 text-slate-600 dark:text-slate-300" />
          </button>
          <div>
            <h2 className="text-lg font-display font-semibold text-slate-800 dark:text-white">
              Student Attendance Card
            </h2>
            <p className="text-[10px] text-gray-500 font-mono tracking-wider">
              {studentDetails.student.roll_number} / {studentDetails.student.full_name.toUpperCase()}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-display font-semibold text-slate-800 dark:text-white">
              Students Registry
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Add new student profiles, filter listings, and check individual attendances
            </p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-md shadow-blue-500/15 flex items-center space-x-1.5 self-start sm:self-center transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Student Profile</span>
          </button>
        </div>
      )}

      {/* Primary Detail View */}
      {selectedStudentId ? (
        detailsLoading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/50">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-gray-500 mt-4">Streaming student database registries...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left: General Profile & Parent Info */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm overflow-hidden p-6 space-y-6">
              <div className="flex flex-col items-center text-center">
                <img
                  src={studentDetails.student.photo}
                  alt="Student Profile"
                  referrerPolicy="no-referrer"
                  className="w-24 h-24 rounded-full object-cover border-4 border-blue-50 shadow-lg"
                />
                <h3 className="font-display font-semibold text-sm text-slate-800 dark:text-white mt-3.5">
                  {studentDetails.student.full_name}
                </h3>
                <span className="bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full mt-1.5 uppercase">
                  {studentDetails.student.roll_number}
                </span>
              </div>

              {/* Attendance circular KPI widget */}
              <div className="bg-slate-50 dark:bg-slate-900/40 rounded-xl p-4 flex items-center justify-between border border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">Attendance Percentage</span>
                  <div className="flex items-baseline space-x-1.5">
                    <span className={`text-2xl font-black font-mono ${
                      studentDetails.attendance_ratio >= 75 ? "text-emerald-500" : "text-rose-500"
                    }`}>
                      {studentDetails.attendance_ratio}%
                    </span>
                    <span className="text-[10px] font-bold text-gray-400">({studentDetails.attended_classes}/{studentDetails.total_classes} lectures)</span>
                  </div>
                </div>
                <div className={`p-2 rounded-xl font-bold text-[10px] ${
                  studentDetails.attendance_ratio >= 75 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600 animate-pulse"
                }`}>
                  {studentDetails.attendance_ratio >= 75 ? "SAFE" : "SHORTAGE"}
                </div>
              </div>

              {/* Bio details list */}
              <div className="space-y-3.5 text-xs">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-600 dark:text-slate-300">Born: <strong>{new Date(studentDetails.student.dob).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" })}</strong> ({studentDetails.student.gender})</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-600 dark:text-slate-300 truncate">{studentDetails.student.email}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-600 dark:text-slate-300">{studentDetails.student.phone || "No phone added"}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-600 dark:text-slate-300 line-clamp-2">{studentDetails.student.address || "No address added"}</span>
                </div>
              </div>

              {/* Parent Guardians Info */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <h4 className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Parent / Guardian Credentials</h4>
                <div className="bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
                  <p className="text-slate-600 dark:text-slate-300">Name: <strong>{studentDetails.student.parent_name || "-"}</strong></p>
                  <p className="text-slate-600 dark:text-slate-300">Phone: <strong>{studentDetails.student.parent_phone || "-"}</strong></p>
                </div>
              </div>

              {/* Profile action items */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => handleOpenModal(studentDetails.student)}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 text-xs font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center space-x-1 cursor-pointer"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Edit Profile</span>
                </button>
                <button
                  onClick={() => handleDelete(studentDetails.student.id, studentDetails.student.roll_number)}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 text-xs font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center space-x-1 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Purge Record</span>
                </button>
              </div>
            </div>

            {/* Right: Personal attendance timeline logs */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm overflow-hidden p-6 space-y-4 flex flex-col">
              <div>
                <h3 className="font-display font-semibold text-xs text-slate-800 dark:text-white uppercase tracking-wider">Attendance Register History</h3>
                <p className="text-[10px] text-gray-500">Chronological history log of subject lectures and student presence</p>
              </div>

              <div className="flex-1 overflow-y-auto max-h-[460px] pr-1">
                {studentDetails.history.length === 0 ? (
                  <div className="text-center py-20 text-xs text-gray-400">
                    <Eye className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    No attendance records logged for this student yet.
                  </div>
                ) : (
                  <div className="border-l border-slate-100 dark:border-slate-700/60 ml-3.5 pl-5 space-y-5">
                    {studentDetails.history.map((h: any) => {
                      const isPresent = h.status === "Present";
                      const isLate = h.status === "Late";
                      const isAbsent = h.status === "Absent";
                      return (
                        <div key={h.id} className="relative flex items-start text-xs">
                          {/* Timeline dot */}
                          <div className={`absolute -left-[27.5px] top-1.5 w-3.5 h-3.5 rounded-full border-4 ${
                            isPresent 
                              ? "bg-emerald-500 border-emerald-100 dark:border-emerald-950" 
                              : isLate 
                                ? "bg-amber-500 border-amber-100 dark:border-amber-950" 
                                : "bg-rose-500 border-rose-100 dark:border-rose-950"
                          }`} />
                          
                          <div className="flex-1 bg-slate-50/50 dark:bg-slate-900/30 p-3 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-[10px] text-slate-400 font-bold">{new Date(h.date).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" })}</span>
                              <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-md ${
                                isPresent 
                                  ? "bg-emerald-50 text-emerald-600" 
                                  : isLate 
                                    ? "bg-amber-50 text-amber-600" 
                                    : "bg-rose-50 text-rose-600"
                              }`}>
                                {h.status.toUpperCase()}
                              </span>
                            </div>
                            <p className="text-slate-700 dark:text-slate-300 font-semibold">
                              {h.subject_code} &mdash; {h.subject_name}
                            </p>
                            {h.remarks && <p className="text-[10px] text-gray-500 italic">Comment: "{h.remarks}"</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

          </div>
        )
      ) : (
        /* Normal Directory Grid View */
        <>
          {/* Quick Filters Area */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm space-y-4">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Search input */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search name, roll..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 pl-9 pr-3 py-2 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                />
              </div>

              {/* Department filter */}
              <select
                value={deptFilter}
                onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.code} - {d.name}</option>
                ))}
              </select>

              {/* Year filter */}
              <select
                value={yearFilter}
                onChange={(e) => { setYearFilter(e.target.value); setPage(1); }}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
              >
                <option value="">All Years</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>

              {/* Sem filter */}
              <select
                value={semFilter}
                onChange={(e) => { setSemFilter(e.target.value); setPage(1); }}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
              >
                <option value="">All Semesters</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>Semester {s}</option>
                ))}
              </select>

              {/* Section filter */}
              <select
                value={secFilter}
                onChange={(e) => { setSecFilter(e.target.value); setPage(1); }}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
              >
                <option value="">All Sections</option>
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
                <option value="D">Section D</option>
              </select>
            </div>
          </div>

          {/* Directory Listings Table */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-gray-500 mt-4">Streaming student database registries...</p>
              </div>
            ) : paginatedStudents.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <Users className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">No students matching filtering parameters</p>
                <p className="text-[10px] text-gray-400">Adjust your criteria or create a fresh profile above</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                      <th className="py-4 px-6 w-16">Profile</th>
                      <th className="py-4 px-6 w-32">Roll Number</th>
                      <th className="py-4 px-6">Full Student Name</th>
                      <th className="py-4 px-6">Department</th>
                      <th className="py-4 px-6">Mapping (Sem/Section)</th>
                      <th className="py-4 px-6 text-right w-36">Administrative Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                    {paginatedStudents.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-6">
                          <img
                            src={s.photo}
                            alt=""
                            referrerPolicy="no-referrer"
                            className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-inner"
                          />
                        </td>
                        <td className="py-3 px-6 font-mono font-bold text-blue-600 dark:text-blue-400">{s.roll_number}</td>
                        <td className="py-3 px-6 font-semibold text-slate-800 dark:text-gray-100">
                          <div className="flex flex-col">
                            <span>{s.full_name}</span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono font-normal">{s.email}</span>
                          </div>
                        </td>
                        <td className="py-3 px-6 font-medium">
                          <span className="bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300 font-bold px-2 py-0.5 rounded-md font-mono text-[10px]">
                            {getDeptCode(s.department_id)}
                          </span>
                        </td>
                        <td className="py-3 px-6 font-medium text-gray-500 dark:text-gray-400">
                          Semester {s.semester} / Section {s.section}
                        </td>
                        <td className="py-3 px-6 text-right space-x-2">
                          <button
                            onClick={() => handleViewDetails(s.id)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors inline-flex items-center"
                            title="View Register Details"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenModal(s)}
                            className="p-1.5 text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-950/40 rounded-lg transition-colors inline-flex items-center"
                            title="Edit Student Details"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination footer */}
            {!loading && totalPages > 1 && (
              <div className="bg-slate-50 dark:bg-slate-900/30 px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400">
                  Page <strong>{page}</strong> of <strong>{totalPages}</strong>
                </span>
                <div className="flex space-x-1.5">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold disabled:opacity-40 transition-all cursor-pointer"
                  >
                    Previous
                  </button>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold disabled:opacity-40 transition-all cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Form Dialog Modal */}
      {isModalOpen && currentStud && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-800 animate-scale-up">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-500/5 to-indigo-500/5">
              <h3 className="font-display font-semibold text-sm text-slate-800 dark:text-white">
                {currentStud.id ? "Edit Student Profile" : "Register Student Profile"}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Roll number */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Roll Number (Unique ID)</label>
                  <input
                    type="text"
                    placeholder="e.g., 2023CSE01"
                    value={currentStud.roll_number}
                    onChange={(e) => setCurrentStud({ ...currentStud, roll_number: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 uppercase transition-all"
                  />
                  {formErrors.roll_number && <p className="text-[10px] text-rose-500 font-medium">{formErrors.roll_number}</p>}
                </div>

                {/* Full name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Full Student Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Aarav Sharma"
                    value={currentStud.full_name}
                    onChange={(e) => setCurrentStud({ ...currentStud, full_name: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                  />
                  {formErrors.full_name && <p className="text-[10px] text-rose-500 font-medium">{formErrors.full_name}</p>}
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g., aarav@college.edu"
                    value={currentStud.email}
                    onChange={(e) => setCurrentStud({ ...currentStud, email: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                  />
                  {formErrors.email && <p className="text-[10px] text-rose-500 font-medium">{formErrors.email}</p>}
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Phone Number</label>
                  <input
                    type="text"
                    placeholder="e.g., +919111111111"
                    value={currentStud.phone}
                    onChange={(e) => setCurrentStud({ ...currentStud, phone: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                  />
                </div>

                {/* Gender */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Gender</label>
                  <select
                    value={currentStud.gender}
                    onChange={(e) => setCurrentStud({ ...currentStud, gender: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* DOB */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Date of Birth</label>
                  <input
                    type="date"
                    value={currentStud.dob}
                    onChange={(e) => setCurrentStud({ ...currentStud, dob: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                  />
                </div>

                {/* Dept mapping */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Academic Department</label>
                  <select
                    value={currentStud.department_id}
                    onChange={(e) => setCurrentStud({ ...currentStud, department_id: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.code} - {d.name}</option>
                    ))}
                  </select>
                </div>

                {/* Section Mapping */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1 col-span-1">
                    <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Year</label>
                    <select
                      value={currentStud.year}
                      onChange={(e) => setCurrentStud({ ...currentStud, year: Number(e.target.value) })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-2 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                    >
                      {[1, 2, 3, 4].map((y) => (
                        <option key={y} value={y}>Y-{y}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-1 col-span-1">
                    <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Sem</label>
                    <select
                      value={currentStud.semester}
                      onChange={(e) => setCurrentStud({ ...currentStud, semester: Number(e.target.value) })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-2 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                        <option key={s} value={s}>S-{s}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1 col-span-1">
                    <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Sec</label>
                    <select
                      value={currentStud.section}
                      onChange={(e) => setCurrentStud({ ...currentStud, section: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-2 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                    >
                      {["A", "B", "C", "D"].map((sc) => (
                        <option key={sc} value={sc}>Sec {sc}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Photo link */}
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Profile Image URL</label>
                  <input
                    type="text"
                    placeholder="https://images.unsplash.com/..."
                    value={currentStud.photo}
                    onChange={(e) => setCurrentStud({ ...currentStud, photo: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                  />
                </div>

                {/* Address */}
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Residential Address</label>
                  <textarea
                    placeholder="Full residential address..."
                    value={currentStud.address}
                    onChange={(e) => setCurrentStud({ ...currentStud, address: e.target.value })}
                    rows={2}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                  />
                </div>

                {/* Parent name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Parent / Guardian Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Sanjay Sharma"
                    value={currentStud.parent_name}
                    onChange={(e) => setCurrentStud({ ...currentStud, parent_name: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                  />
                </div>

                {/* Parent phone */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Parent Contact Phone</label>
                  <input
                    type="text"
                    placeholder="e.g., +919222222222"
                    value={currentStud.parent_phone}
                    onChange={(e) => setCurrentStud({ ...currentStud, parent_phone: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/10 transition-all cursor-pointer"
                >
                  {currentStud.id ? "Save Changes" : "Register Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
