import React, { useEffect, useState } from "react";
import { Mail, Lock, User, PlusCircle, ArrowLeft, Building2, Phone } from "lucide-react";
import { Department } from "../types";

interface RegisterProps {
  onRegisterSuccess: (user: any) => void;
  onNotify: (msg: string, type: "success" | "error" | "info") => void;
  onNavigateToLogin: () => void;
}

export default function Register({ onRegisterSuccess, onNotify, onNavigateToLogin }: RegisterProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/departments")
      .then((res) => res.json())
      .then((data) => {
        const checkedDepts = Array.isArray(data) ? data : [];
        setDepartments(checkedDepts);
        if (checkedDepts.length) setDepartmentId(String(checkedDepts[0].id));
      })
      .catch((err) => console.error(err));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !username.trim() || !email.trim() || !password || !departmentId) {
      onNotify("All core fields are required", "error");
      return;
    }
    if (password !== confirmPassword) {
      onNotify("Passwords do not match", "error");
      return;
    }
    if (password.length < 6) {
      onNotify("Password must be at least 6 characters long", "error");
      return;
    }

    setLoading(true);
    const payload = {
      full_name: fullName,
      username,
      email,
      phone,
      password,
      department_id: Number(departmentId)
    };

    fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then((res) => res.json())
      .then((resJson) => {
        if (resJson.success) {
          onNotify("Faculty account successfully provisioned!", "success");
          onRegisterSuccess(resJson.user);
        } else {
          onNotify(resJson.message || "Registration failed", "error");
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        onNotify("Registration server connectivity failure", "error");
        setLoading(false);
      });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      
      {/* Brand logo header */}
      <div className="w-full max-w-md text-center space-y-2 mb-6">
        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white mx-auto shadow-md shadow-blue-500/25">
          <PlusCircle className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-display font-bold text-slate-800 dark:text-white">
          University Attendance Console
        </h1>
        <p className="text-xs text-gray-400">
          Faculty and Academic Coordinator Registration Node
        </p>
      </div>

      {/* Main card box */}
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg p-8 rounded-3xl border border-slate-200/40 dark:border-slate-800 shadow-xl space-y-6">
        <div className="flex items-center space-x-2">
          <button
            onClick={onNavigateToLogin}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 rounded-lg cursor-pointer transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h2 className="font-display font-semibold text-sm text-slate-800 dark:text-white uppercase tracking-wider">
              Faculty Registration
            </h2>
            <p className="text-[10px] text-gray-500">Register a new faculty coordinator account</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full name */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g., Prof. Rajesh Patel"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 pl-11 pr-4 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all text-slate-800 dark:text-white"
                />
              </div>
            </div>

            {/* Username */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Username</label>
              <input
                type="text"
                placeholder="e.g., rajesh_p"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all text-slate-800 dark:text-white"
              />
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  placeholder="rajesh@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 pl-11 pr-4 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all text-slate-800 dark:text-white"
                />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g., +919000000000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 pl-11 pr-4 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all text-slate-800 dark:text-white"
                />
              </div>
            </div>

            {/* Department */}
            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Assigned Department</label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 px-3 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.code} - {d.name}</option>
                ))}
              </select>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 pl-11 pr-4 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all text-slate-800 dark:text-white"
                />
              </div>
            </div>

            {/* Confirm password */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 pl-11 pr-4 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all text-slate-800 dark:text-white"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-xs font-semibold shadow-md shadow-blue-500/15 flex items-center justify-center space-x-1.5 transition-all cursor-pointer disabled:opacity-40"
          >
            <span>Create Faculty Node</span>
          </button>
        </form>

        {/* Back link */}
        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span>Already registered?</span>{" "}
          <button
            onClick={onNavigateToLogin}
            className="text-blue-600 hover:text-blue-700 font-bold hover:underline cursor-pointer"
          >
            Sign In Here
          </button>
        </div>

      </div>

    </div>
  );
}
