import React, { useEffect, useState } from "react";
import { 
  Users, 
  Building2, 
  BookOpen, 
  Clock, 
  TrendingUp, 
  ArrowRight,
  PlusCircle,
  FileText,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { DashboardAnalytics } from "../types";

interface DashboardProps {
  setActiveTab: (tab: string) => void;
  triggerRefresh: boolean;
}

export default function Dashboard({ setActiveTab, triggerRefresh }: DashboardProps) {
  const [data, setData] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics/dashboard")
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading analytics", err);
        setLoading(false);
      });
  }, [triggerRefresh]);

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-gray-500 mt-4 font-medium">Synchronizing Academic Engine...</p>
      </div>
    );
  }

  // Calculate high and low performers
  const deptStats = Array.isArray(data?.deptStats) ? data.deptStats : [];
  const highestDept = [...deptStats].sort((a, b) => b.percentage - a.percentage)[0];
  const lowestDept = [...deptStats].sort((a, b) => a.percentage - b.percentage)[0];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Welcome Title Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 p-6 rounded-2xl text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase tracking-widest bg-white/10 px-2.5 py-1 rounded-full font-semibold text-blue-100">
            B.Tech Final Year Capstone
          </span>
          <h2 className="text-xl md:text-2xl font-display font-semibold mt-2 tracking-tight">
            Academic Attendance Analytics
          </h2>
          <p className="text-xs text-blue-100/80 mt-1 max-w-xl">
            Real-time biometric & roll logging database synchronization. Access structural reports, department statistics, and export-compliant final logs.
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveTab("attendance")}
            className="bg-white text-blue-900 hover:bg-blue-50 px-4 py-2 rounded-xl text-xs font-semibold shadow-md flex items-center space-x-1.5 transition-transform hover:-translate-y-0.5"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Mark Today's Log</span>
          </button>
          <button 
            onClick={() => setActiveTab("reports")}
            className="bg-blue-600/50 hover:bg-blue-600/80 text-white border border-blue-400/30 px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-transform hover:-translate-y-0.5"
          >
            <FileText className="h-4 w-4" />
            <span>Generate PDF</span>
          </button>
        </div>
      </div>

      {/* KPI Display Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Students */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono tracking-widest uppercase">Total Cohort</span>
            <h3 className="text-2xl font-display font-bold text-slate-800 dark:text-white">{data.totalStudents}</h3>
            <p className="text-[10px] text-emerald-500 font-medium flex items-center">
              <span>B.Tech Final Year</span>
            </p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-950/40 p-3 rounded-xl">
            <Users className="h-5 w-5 text-blue-600" />
          </div>
        </div>

        {/* KPI 2: Total Departments */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono tracking-widest uppercase">Departments</span>
            <h3 className="text-2xl font-display font-bold text-slate-800 dark:text-white">{data.totalDepartments}</h3>
            <p className="text-[10px] text-indigo-500 font-medium">
              <span>Full engineering disciplines</span>
            </p>
          </div>
          <div className="bg-indigo-50 dark:bg-indigo-950/40 p-3 rounded-xl">
            <Building2 className="h-5 w-5 text-indigo-600" />
          </div>
        </div>

        {/* KPI 3: Total Subjects */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono tracking-widest uppercase">Total Subjects</span>
            <h3 className="text-2xl font-display font-bold text-slate-800 dark:text-white">{data.totalSubjects}</h3>
            <p className="text-[10px] text-purple-500 font-medium">
              <span>Syllabus-mapped subjects</span>
            </p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-950/40 p-3 rounded-xl">
            <BookOpen className="h-5 w-5 text-purple-600" />
          </div>
        </div>

        {/* KPI 4: Today's Attendance Percentage */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono tracking-widest uppercase">Today's Attendance</span>
            <h3 className="text-2xl font-display font-bold text-slate-800 dark:text-white">{data.today_percentage}%</h3>
            <p className={`text-[10px] font-semibold flex items-center space-x-1 ${
              data.today_percentage >= 75 ? "text-emerald-500" : "text-rose-500 animate-pulse"
            }`}>
              {data.today_percentage >= 75 ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
              <span>{data.today_percentage >= 75 ? "Complies 75% Regulation" : "Shortage Warning"}</span>
            </p>
          </div>
          <div className={`p-3 rounded-xl ${data.today_percentage >= 75 ? "bg-emerald-50 dark:bg-emerald-950/40" : "bg-rose-50 dark:bg-rose-950/40"}`}>
            <Clock className={`h-5 w-5 ${data.today_percentage >= 75 ? "text-emerald-600" : "text-rose-600"}`} />
          </div>
        </div>
      </div>

      {/* SVG-based Analytical Visualizers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Visualizer 1: Department attendance ratios (Bar Chart) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-semibold text-xs text-slate-800 dark:text-white uppercase tracking-wider">
                Department Comparison
              </h3>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">
                Aggregated average student attendance by engineering discipline
              </p>
            </div>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </div>

          {/* SVG Bar Chart */}
          <div className="pt-2">
            <svg viewBox="0 0 500 200" className="w-full h-auto">
              {/* Grid Lines */}
              <line x1="40" y1="20" x2="480" y2="20" stroke="#f1f5f9" strokeWidth="1" className="dark:stroke-slate-700" />
              <line x1="40" y1="60" x2="480" y2="60" stroke="#f1f5f9" strokeWidth="1" className="dark:stroke-slate-700" />
              <line x1="40" y1="100" x2="480" y2="100" stroke="#f1f5f9" strokeWidth="1" className="dark:stroke-slate-700" />
              <line x1="40" y1="140" x2="480" y2="140" stroke="#f1f5f9" strokeWidth="1" className="dark:stroke-slate-700" />
              <line x1="40" y1="170" x2="480" y2="170" stroke="#cbd5e1" strokeWidth="1" className="dark:stroke-slate-600" />

              {/* Grid Labels (Y Axis) */}
              <text x="15" y="24" className="fill-gray-400 text-[8px] font-mono">100%</text>
              <text x="15" y="64" className="fill-gray-400 text-[8px] font-mono">75%</text>
              <text x="15" y="104" className="fill-gray-400 text-[8px] font-mono">50%</text>
              <text x="15" y="144" className="fill-gray-400 text-[8px] font-mono">25%</text>
              <text x="20" y="174" className="fill-gray-400 text-[8px] font-mono">0%</text>

              {/* Data Bars */}
              {deptStats.map((dept, idx) => {
                const barWidth = 35;
                const gap = 80;
                const x = 60 + idx * gap;
                const height = (dept.percentage / 100) * 150;
                const y = 170 - height;
                const isUnderRegulations = dept.percentage < 75;

                return (
                  <g key={dept.code} className="group cursor-pointer">
                    {/* Hover tooltip guide line */}
                    <rect 
                      x={x - 10} 
                      y="15" 
                      width={barWidth + 20} 
                      height="155" 
                      fill="transparent" 
                      className="hover:fill-slate-100/40 dark:hover:fill-slate-700/10 transition-colors rounded-lg"
                    />
                    
                    {/* Bar Shadow */}
                    <rect 
                      x={x} 
                      y={y} 
                      width={barWidth} 
                      height={height} 
                      rx="4"
                      fill={isUnderRegulations ? "#f43f5e" : "#3b82f6"} 
                      opacity="0.15"
                      className="translate-y-1 translate-x-1"
                    />

                    {/* True Bar */}
                    <rect 
                      x={x} 
                      y={y} 
                      width={barWidth} 
                      height={height} 
                      rx="4"
                      fill={isUnderRegulations ? "url(#roseGrad)" : "url(#blueGrad)"} 
                      className="transition-all duration-500 hover:opacity-90"
                    />

                    {/* Exact Percentage Tag */}
                    <text 
                      x={x + barWidth / 2} 
                      y={y - 6} 
                      textAnchor="middle" 
                      className={`text-[9px] font-mono font-semibold ${
                        isUnderRegulations ? "fill-rose-500" : "fill-blue-600 dark:fill-blue-400"
                      }`}
                    >
                      {dept.percentage}%
                    </text>

                    {/* Category Label (X Axis) */}
                    <text 
                      x={x + barWidth / 2} 
                      y="185" 
                      textAnchor="middle" 
                      className="fill-slate-600 dark:fill-slate-300 text-[9px] font-semibold font-mono"
                    >
                      {dept.code}
                    </text>
                  </g>
                );
              })}

              {/* SVG Gradients */}
              <defs>
                <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.4" />
                </linearGradient>
                <linearGradient id="roseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#e11d48" />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.4" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          
          {/* Legend indicator */}
          <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-4 text-[10px] font-medium text-slate-500 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 bg-blue-600 rounded-md"></span>
                <span>Above 75% Requirement</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 bg-rose-500 rounded-md"></span>
                <span>Shortage Warning (&lt;75%)</span>
              </div>
            </div>
            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono">
              Highest: <strong>{highestDept?.code} ({highestDept?.percentage}%)</strong>
            </span>
          </div>
        </div>

        {/* Visualizer 2: Status Breakdown circular (Donut Chart) */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm space-y-4">
          <div>
            <h3 className="font-display font-semibold text-xs text-slate-800 dark:text-white uppercase tracking-wider">
              Status Allocation
            </h3>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">
              Breakdown of today's roll records
            </p>
          </div>

          <div className="flex flex-col items-center justify-center space-y-4 py-2">
            <div className="relative w-36 h-36">
              {/* SVG Circular Donut Chart */}
              {/* Circumference of r=50 circle: 2 * pi * 50 = 314.15 */}
              {(() => {
                const total = data.today_present + data.today_absent + data.today_late;
                const pPercent = total > 0 ? (data.today_present / total) * 100 : 70;
                const lPercent = total > 0 ? (data.today_late / total) * 100 : 15;
                const aPercent = total > 0 ? (data.today_absent / total) * 100 : 15;

                const pOffset = 0;
                const lOffset = pPercent;
                const aOffset = pPercent + lPercent;

                const strokeP = (pPercent / 100) * 314;
                const strokeL = (lPercent / 100) * 314;
                const strokeA = (aPercent / 100) * 314;

                return (
                  <svg viewBox="0 0 120 120" className="w-full h-full transform -rotate-90">
                    {/* Background circle track */}
                    <circle cx="60" cy="60" r="48" fill="transparent" stroke="#f1f5f9" strokeWidth="10" className="dark:stroke-slate-700" />
                    
                    {/* Present slice */}
                    <circle 
                      cx="60" 
                      cy="60" 
                      r="48" 
                      fill="transparent" 
                      stroke="#10b981" 
                      strokeWidth="11" 
                      strokeDasharray={`${strokeP} 314`}
                      strokeDashoffset={-(pOffset / 100) * 314}
                      strokeLinecap="round"
                    />

                    {/* Late slice */}
                    <circle 
                      cx="60" 
                      cy="60" 
                      r="48" 
                      fill="transparent" 
                      stroke="#f59e0b" 
                      strokeWidth="11" 
                      strokeDasharray={`${strokeL} 314`}
                      strokeDashoffset={-(lOffset / 100) * 314}
                      strokeLinecap="round"
                    />

                    {/* Absent slice */}
                    <circle 
                      cx="60" 
                      cy="60" 
                      r="48" 
                      fill="transparent" 
                      stroke="#ef4444" 
                      strokeWidth="11" 
                      strokeDasharray={`${strokeA} 314`}
                      strokeDashoffset={-(aOffset / 100) * 314}
                      strokeLinecap="round"
                    />
                  </svg>
                );
              })()}
              
              {/* Donut Center Display */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white dark:bg-slate-800 rounded-full m-5 shadow-inner">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">Averages</span>
                <span className="text-xl font-display font-black text-slate-800 dark:text-white mt-0.5">
                  {data.overall_percentage}%
                </span>
                <span className="text-[8px] text-emerald-500 font-mono mt-0.5 font-bold">REGULAR</span>
              </div>
            </div>

            {/* Labels Grid */}
            <div className="w-full grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 text-center">
              <div className="space-y-0.5">
                <div className="flex items-center justify-center space-x-1">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                  <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 font-mono">Present</span>
                </div>
                <p className="text-xs font-bold text-slate-800 dark:text-white">{data.today_present}</p>
              </div>

              <div className="space-y-0.5">
                <div className="flex items-center justify-center space-x-1">
                  <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                  <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 font-mono">Late</span>
                </div>
                <p className="text-xs font-bold text-slate-800 dark:text-white">{data.today_late}</p>
              </div>

              <div className="space-y-0.5">
                <div className="flex items-center justify-center space-x-1">
                  <span className="w-2 h-2 bg-rose-500 rounded-full"></span>
                  <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 font-mono">Absent</span>
                </div>
                <p className="text-xs font-bold text-slate-800 dark:text-white">{data.today_absent}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row: Recent Activity feed + Subject Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Visualizer 3: Subject averages performance tracker */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm space-y-4">
          <div>
            <h3 className="font-display font-semibold text-xs text-slate-800 dark:text-white uppercase tracking-wider">
              Subject Attendance Rates
            </h3>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">
              Current attendance stats mapped across CSE Final Year syllabus
            </p>
          </div>

          <div className="space-y-3.5 pt-1">
            {data.subStats.slice(0, 4).map((sub) => {
              const isShortage = sub.percentage < 75;
              return (
                <div key={sub.code} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-700 dark:text-slate-300 truncate max-w-xs">
                      <strong>{sub.code}:</strong> {sub.name}
                    </span>
                    <span className={`font-mono font-bold ${isShortage ? "text-rose-500" : "text-emerald-500"}`}>
                      {sub.percentage}%
                    </span>
                  </div>
                  {/* Progress bar indicator */}
                  <div className="w-full bg-slate-100 dark:bg-slate-700/60 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        isShortage ? "bg-rose-500" : "bg-gradient-to-r from-blue-500 to-indigo-600"
                      }`}
                      style={{ width: `${sub.percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recents logs and activities feed */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-semibold text-xs text-slate-800 dark:text-white uppercase tracking-wider">
                System Activity Log
              </h3>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">
                Live audit logs of recent faculty attendance submittals
              </p>
            </div>
            <span className="text-[9px] bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 font-mono font-bold px-2 py-0.5 rounded-md uppercase">
              Audit Live
            </span>
          </div>

          <div className="space-y-4 pt-1 max-h-[190px] overflow-y-auto pr-1">
            {data.recentActivities.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6 font-medium">No recent activities found.</p>
            ) : (
              data.recentActivities.map((act, i) => (
                <div key={i} className="flex space-x-3 text-xs leading-normal">
                  <div className="pt-0.5">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full border-4 border-blue-100 dark:border-blue-900 ring-1 ring-blue-500 shadow-sm"></div>
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <p className="text-slate-600 dark:text-slate-300">{act.text}</p>
                    <div className="flex items-center space-x-1 text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                      <span>{act.time}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
