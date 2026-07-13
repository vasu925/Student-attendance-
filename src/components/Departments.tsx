import React, { useEffect, useState } from "react";
import { Plus, Search, Edit3, Trash2, X, Building2, HelpCircle } from "lucide-react";
import { Department } from "../types";

interface DepartmentsProps {
  onNotify: (msg: string, type: "success" | "error" | "info") => void;
  triggerRefresh: () => void;
}

export default function Departments({ onNotify, triggerRefresh }: DepartmentsProps) {
  const [depts, setDepts] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;

  // Form Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentDept, setCurrentDept] = useState<Partial<Department> | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = () => {
    setLoading(true);
    fetch("/api/departments")
      .then((res) => res.json())
      .then((data) => {
        setDepts(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        onNotify("Failed to sync department nodes", "error");
        setLoading(false);
      });
  };

  const handleOpenModal = (dept: Partial<Department> | null = null) => {
    setCurrentDept(dept || { code: "", name: "", description: "" });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setCurrentDept(null);
    setIsModalOpen(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentDept) return;

    // Client-side validations
    const errors: Record<string, string> = {};
    if (!currentDept.code?.trim()) errors.code = "Department code is required";
    else if (currentDept.code.trim().length < 2) errors.code = "Code must be at least 2 chars";
    
    if (!currentDept.name?.trim()) errors.name = "Department name is required";
    else if (currentDept.name.trim().length < 3) errors.name = "Name must be at least 3 chars";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const isEdit = !!currentDept.id;
    const url = isEdit ? `/api/departments/${currentDept.id}` : "/api/departments";
    const method = isEdit ? "PUT" : "POST";

    fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(currentDept)
    })
      .then((res) => res.json())
      .then((resJson) => {
        if (resJson.success) {
          onNotify(isEdit ? "Department updated successfully" : "Department created successfully", "success");
          loadDepartments();
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
    if (!window.confirm(`Are you absolutely sure you want to delete the department ${code}? This action will wipe all related subjects and student listings!`)) {
      return;
    }

    fetch(`/api/departments/${id}`, { method: "DELETE" })
      .then((res) => res.json())
      .then((resJson) => {
        if (resJson.success) {
          onNotify(`Department ${code} removed successfully`, "success");
          loadDepartments();
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

  // Search filter
  const filteredDepts = depts.filter((d) => 
    d.name.toLowerCase().includes(search.toLowerCase()) || 
    d.code.toLowerCase().includes(search.toLowerCase())
  );

  // Pagination calculations
  const totalPages = Math.ceil(filteredDepts.length / itemsPerPage);
  const paginatedDepts = filteredDepts.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Title & Add Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-display font-semibold text-slate-800 dark:text-white">
            Departments Directory
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Register and update university departments, administrative details, and descriptions
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-md shadow-blue-500/15 flex items-center space-x-1.5 self-start sm:self-center transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Add Department</span>
        </button>
      </div>

      {/* Filter and Search Box */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex items-center justify-between">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by code or department name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 pl-10 pr-4 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
          />
        </div>
        <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono">
          Showing <strong>{filteredDepts.length}</strong> entries
        </span>
      </div>

      {/* Main Table Area */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-gray-500 mt-4">Syncing database registers...</p>
          </div>
        ) : paginatedDepts.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <Building2 className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">No departments found matching search criteria</p>
            <p className="text-[10px] text-gray-400">Create a new department node above to initiate academic setup</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                  <th className="py-4 px-6 w-32">Dept Code</th>
                  <th className="py-4 px-6">Official Name</th>
                  <th className="py-4 px-6 max-w-sm">Summary Description</th>
                  <th className="py-4 px-6 text-right w-36">Administrative Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                {paginatedDepts.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-blue-600 dark:text-blue-400">{d.code}</td>
                    <td className="py-4 px-6 font-semibold text-slate-800 dark:text-gray-100">{d.name}</td>
                    <td className="py-4 px-6 text-gray-500 dark:text-gray-400 truncate max-w-xs">{d.description || "-"}</td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => handleOpenModal(d)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors inline-flex items-center"
                        title="Edit Department"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(d.id, d.code)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors inline-flex items-center"
                        title="Delete Department"
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

        {/* Table Footer with Pagination */}
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

      {/* Form Dialog Modal */}
      {isModalOpen && currentDept && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-800 animate-scale-up">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-550/5 to-indigo-500/5">
              <h3 className="font-display font-semibold text-sm text-slate-800 dark:text-white">
                {currentDept.id ? "Edit Department Node" : "Register Department Node"}
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
                <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Department Code</label>
                <input
                  type="text"
                  placeholder="e.g., CSE, ECE, ME"
                  value={currentDept.code}
                  onChange={(e) => setCurrentDept({ ...currentDept, code: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 uppercase transition-all"
                />
                {formErrors.code && <p className="text-[10px] text-rose-500 font-medium">{formErrors.code}</p>}
              </div>

              {/* Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Department Name</label>
                <input
                  type="text"
                  placeholder="e.g., Computer Science & Engineering"
                  value={currentDept.name}
                  onChange={(e) => setCurrentDept({ ...currentDept, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                />
                {formErrors.name && <p className="text-[10px] text-rose-500 font-medium">{formErrors.name}</p>}
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Description</label>
                <textarea
                  placeholder="Summarize academic scope, vision, or labs..."
                  value={currentDept.description || ""}
                  onChange={(e) => setCurrentDept({ ...currentDept, description: e.target.value })}
                  rows={3}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                />
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
                  {currentDept.id ? "Save Changes" : "Create Node"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
