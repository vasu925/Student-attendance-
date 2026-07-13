import React, { useState, useEffect } from "react";
import { User, Key, Mail, Phone, Lock, Eye, EyeOff, ShieldCheck, Camera, HelpCircle } from "lucide-react";
import { Department } from "../types";

interface ProfileProps {
  onNotify: (msg: string, type: "success" | "error" | "info") => void;
  facultyUser: any;
  setFacultyUser: (user: any) => void;
}

export default function Profile({ onNotify, facultyUser, setFacultyUser }: ProfileProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [fullName, setFullName] = useState(facultyUser?.full_name || "");
  const [username, setUsername] = useState(facultyUser?.username || "");
  const [email, setEmail] = useState(facultyUser?.email || "");
  const [phone, setPhone] = useState(facultyUser?.phone || "");
  const [departmentId, setDepartmentId] = useState(facultyUser?.department_id || "");
  const [photo, setPhoto] = useState(facultyUser?.photo || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80");

  // Passwords
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/departments")
      .then((res) => res.json())
      .then((data) => {
        setDepartments(data);
        if (data.length && !departmentId) {
          setDepartmentId(data[0].id);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !username.trim() || !email.trim()) {
      onNotify("Required fields must not be left empty", "error");
      return;
    }

    setLoading(true);
    const payload = {
      id: facultyUser?.id,
      full_name: fullName,
      username,
      email,
      phone,
      department_id: Number(departmentId),
      photo
    };

    fetch("/api/faculty/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then((res) => res.json())
      .then((resJson) => {
        if (resJson.success) {
          onNotify("Faculty profile details synchronized", "success");
          setFacultyUser(resJson.user);
          localStorage.setItem("faculty_user", JSON.stringify(resJson.user));
        } else {
          onNotify(resJson.message || "Failed to update details", "error");
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        onNotify("Database write failure", "error");
        setLoading(false);
      });
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      onNotify("All password fields are required", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      onNotify("New passwords do not match", "error");
      return;
    }
    if (newPassword.length < 6) {
      onNotify("Password must be at least 6 characters long", "error");
      return;
    }

    setLoading(true);
    fetch("/api/faculty/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: facultyUser?.id,
        current_password: currentPassword,
        new_password: newPassword
      })
    })
      .then((res) => res.json())
      .then((resJson) => {
        if (resJson.success) {
          onNotify("Password updated successfully!", "success");
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
        } else {
          onNotify(resJson.message || "Password update failed", "error");
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        onNotify("Database security error", "error");
        setLoading(false);
      });
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h2 className="text-xl font-display font-semibold text-slate-800 dark:text-white">
          Faculty Profile Controls
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Manage your personal university profile, credentials, avatar photo, and security passwords
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Card: Account Avatar Summary */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex flex-col items-center justify-between text-center space-y-4">
          <div className="space-y-3 flex flex-col items-center w-full">
            <div className="relative group">
              <img
                src={photo}
                alt="Faculty profile"
                referrerPolicy="no-referrer"
                className="w-28 h-28 rounded-full object-cover border-4 border-blue-50 dark:border-slate-700 shadow-md transition-all"
              />
              <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-white cursor-pointer transition-opacity">
                <Camera className="h-5 w-5" />
              </div>
            </div>

            <div>
              <h3 className="font-display font-semibold text-sm text-slate-800 dark:text-white">
                {fullName}
              </h3>
              <p className="text-[10px] text-gray-500 font-mono">@{username}</p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/40 w-full p-3 rounded-xl border border-slate-100 dark:border-slate-700/60 text-left text-xs space-y-1.5">
              <p className="text-gray-400 uppercase tracking-wider text-[8px] font-bold">Official Role Mapping</p>
              <p className="text-slate-700 dark:text-slate-300 font-semibold">Faculty / Professor</p>
              <p className="text-slate-500">Dept Code: <span className="font-mono text-[10px] font-bold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">{departments.find((d) => d.id === Number(departmentId))?.code || "N/A"}</span></p>
            </div>
          </div>

          <div className="text-[10px] text-gray-400 font-medium flex items-center justify-center space-x-1 w-full pt-4 border-t border-slate-100 dark:border-slate-700/60">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>Active Session Security Authenticated</span>
          </div>
        </div>

        {/* Right Area: Split Forms */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Form 1: General Details */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm space-y-4">
            <h4 className="font-display font-semibold text-xs text-slate-800 dark:text-white uppercase tracking-wider">
              Profile Configuration
            </h4>

            <form onSubmit={handleUpdateProfile} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 pl-10 pr-4 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* Username */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                />
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 pl-10 pr-4 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Phone Contact</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 pl-10 pr-4 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* Department mapping selection */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Map Department</label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.code} - {d.name}</option>
                  ))}
                </select>
              </div>

              {/* Image url */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Avatar Image URL</label>
                <input
                  type="text"
                  value={photo}
                  onChange={(e) => setPhoto(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                />
              </div>

              <div className="md:col-span-2 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-md shadow-blue-500/15 cursor-pointer transition-all"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>

          {/* Form 2: Password Modifiers */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm space-y-4">
            <h4 className="font-display font-semibold text-xs text-slate-800 dark:text-white uppercase tracking-wider flex items-center space-x-1.5">
              <Key className="h-4 w-4 text-blue-500" />
              <span>Security Credentials & Passwords</span>
            </h4>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Current pass */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Current Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type={showPass ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 pl-10 pr-4 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                {/* New pass */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type={showPass ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 pl-10 pr-4 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                {/* Confirm pass */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Confirm New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type={showPass ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 pl-10 pr-4 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Show toggle */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="text-[10px] text-gray-500 hover:text-slate-800 flex items-center space-x-1 font-semibold transition-colors cursor-pointer"
                >
                  {showPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  <span>{showPass ? "Hide Passwords" : "Show Passwords"}</span>
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700 dark:hover:bg-slate-600 px-5 py-2 rounded-xl text-xs font-semibold transition-all shadow-md cursor-pointer"
                >
                  Change Password Credentials
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>

    </div>
  );
}
