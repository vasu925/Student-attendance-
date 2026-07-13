import React, { useEffect, useState } from "react";
import { Plus, Search, Edit3, Trash2, X, BookOpen } from "lucide-react";
import { Subject, Department } from "../types";

interface SubjectsProps {
  onNotify: (msg: string, type: "success" | "error" | "info") => void;
  triggerRefresh: () => void;
}

export default function Subjects({ onNotify, triggerRefresh }: SubjectsProps) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const itemsPerPage = 8;

  // Form Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSub, setCurrentSub] = useState<Partial<Subject> | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/subjects").then((res) => res.json()),
      fetch("/api/departments").then((res) => res.json())
    ])
      .then(([subData, deptData]) => {
        setSubjects(Array.isArray(subData) ? subData : []);
        setDepartments(Array.isArray(deptData) ? deptData : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        onNotify("Failed to fetch subject registries", "error");
        setLoading(false);
      });
  };

  const handleOpenModal = (sub: Partial<Subject> | null = null) => {
    setCurrentSub(
      sub || {
        code: "",
        name: "",
        department_id: departments.length ? departments[0].id : 0,
        year: 4,
        semester: 8
      }
    );
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setCurrentSub(null);
    setIsModalOpen(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSub) return;

    // Validate fields
    const errors: Record<string, string> = {};
    if (!currentSub.code?.trim()) errors.code = "Subject code is required";
    if (!currentSub.name?.trim()) errors.name = "Subject name is required";
    if (!currentSub.department_id) errors.department_id = "Please map to a department";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const isEdit = !!currentSub.id;
    const url = isEdit ? `/api/subjects/${currentSub.id}` : "/api/subjects";
    const method = isEdit ? "PUT" : "POST";

    fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(currentSub)
    })
      .then((res) => res.json())
      .then((resJson) => {
        if (resJson.success) {
          onNotify(isEdit ? "Subject updated successfully" : "Subject registered successfully", "success");
          loadData();
          triggerRefresh();
          handleCloseModal();
        } else {
          onNotify(resJson.message || "An error occurred", "error");
        }
      })
      .catch((err) => {
        console.error(err);
        onNotify("Server connectivity failure", "error");
      });
  };

  const handleDelete = (id: number, code: string) => {
    if (!window.confirm(`Are you absolutely sure you want to delete subject ${code}? This will remove all associated attendance history!`)) {
      return;
    }

    fetch(`/api/subjects/${id}`, { method: "DELETE" })
      .then((res) => res.json())
      .then((resJson) => {
        if (resJson.success) {
          onNotify(`Subject ${code} removed successfully`, "success");
          loadData();
          triggerRefresh();
        } else {
          onNotify(resJson.message || "Deletion failed", "error");
        }
      })
      .catch((err) => {
        console.error(err);
        onNotify("Server connectivity failure", "error");
      });
  };

  // Resolve department details helper
  const getDeptCode = (deptId: number) => {
    const dept = departments.find((d) => d.id === deptId);
    return dept ? dept.code : "N/A";
  };

  // Search filter
  const filteredSubs = subjects.filter((s) => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.code.toLowerCase().includes(search.toLowerCase()) ||
    getDeptCode(s.department_id).toLowerCase().includes(search.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredSubs.length / itemsPerPage);
  const paginatedSubs = filteredSubs.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-display font-semibold text-slate-800 dark:text-white">
            Subjects Syllabus Directory
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Configure subjects, map academic year/semesters, and assign specific engineering departments
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          disabled={departments.length === 0}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-md shadow-blue-500/15 flex items-center space-x-1.5 self-start sm:self-center transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add Subject</span>
        </button>
      </div>

      {/* Search & Filter bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex items-center justify-between">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by code, subject name, or department..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 pl-10 pr-4 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
          />
        </div>
        <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono">
          Showing <strong>{filteredSubs.length}</strong> subjects
        </span>
      </div>

      {/* Table List */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-gray-500 mt-4">Syncing database registers...</p>
          </div>
        ) : paginatedSubs.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <BookOpen className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto animate-bounce" />
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">No subjects registered yet</p>
            <p className="text-[10px] text-gray-400">Create a new subject assigned to a department to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                  <th className="py-4 px-6 w-32">Subject Code</th>
                  <th className="py-4 px-6">Subject Name</th>
                  <th className="py-4 px-6 w-40">Assigned Department</th>
                  <th className="py-4 px-6 w-28">Year / Sem</th>
                  <th className="py-4 px-6 text-right w-36">Administrative Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                {paginatedSubs.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-indigo-600 dark:text-indigo-400">{sub.code}</td>
                    <td className="py-4 px-6 font-semibold text-slate-800 dark:text-gray-100">{sub.name}</td>
                    <td className="py-4 px-6">
                      <span className="bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 font-semibold px-2 py-0.5 rounded-md font-mono text-[10px]">
                        {getDeptCode(sub.department_id)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-500 dark:text-gray-400 font-medium">
                      Year {sub.year} / Sem {sub.semester}
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => handleOpenModal(sub)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors inline-flex items-center"
                        title="Edit Subject"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(sub.id, sub.code)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors inline-flex items-center"
                        title="Delete Subject"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Pagination */}
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

      {/* Modal Dialog */}
      {isModalOpen && currentSub && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-800 animate-scale-up">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-500/5 to-indigo-500/5">
              <h3 className="font-display font-semibold text-sm text-slate-800 dark:text-white">
                {currentSub.id ? "Edit Subject" : "Register Subject"}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              {/* Code */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Subject Code</label>
                <input
                  type="text"
                  placeholder="e.g., CS-401, EC-402"
                  value={currentSub.code}
                  onChange={(e) => setCurrentSub({ ...currentSub, code: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 uppercase transition-all"
                />
                {formErrors.code && <p className="text-[10px] text-rose-500 font-medium">{formErrors.code}</p>}
              </div>

              {/* Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Subject Name</label>
                <input
                  type="text"
                  placeholder="e.g., Cryptography & Network Security"
                  value={currentSub.name}
                  onChange={(e) => setCurrentSub({ ...currentSub, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                />
                {formErrors.name && <p className="text-[10px] text-rose-500 font-medium">{formErrors.name}</p>}
              </div>

              {/* Department Mapping */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Map to Department</label>
                <select
                  value={currentSub.department_id}
                  onChange={(e) => setCurrentSub({ ...currentSub, department_id: Number(e.target.value) })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.code} - {d.name}
                    </option>
                  ))}
                </select>
                {formErrors.department_id && <p className="text-[10px] text-rose-500 font-medium">{formErrors.department_id}</p>}
              </div>

              {/* Grid: Year & Sem */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Year</label>
                  <select
                    value={currentSub.year}
                    onChange={(e) => setCurrentSub({ ...currentSub, year: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                  >
                    {[1, 2, 3, 4].map((y) => (
                      <option key={y} value={y}>Year {y}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Semester</label>
                  <select
                    value={currentSub.semester}
                    onChange={(e) => setCurrentSub({ ...currentSub, semester: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
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
                  {currentSub.id ? "Save Changes" : "Register Subject"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
