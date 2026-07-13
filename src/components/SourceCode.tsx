import React, { useEffect, useState } from "react";
import { 
  Code2, 
  FileText, 
  Database, 
  Terminal, 
  Copy, 
  CheckCircle2, 
  ArrowRight, 
  GitBranch, 
  Cpu, 
  Workflow, 
  Check, 
  RefreshCw, 
  ShieldCheck, 
  Zap 
} from "lucide-react";

interface SourceCodeProps {
  onNotify: (msg: string, type: "success" | "error" | "info") => void;
}

interface SourceFile {
  name: string;
  content: string;
}

export default function SourceCode({ onNotify }: SourceCodeProps) {
  const [activeSubTab, setActiveSubTab] = useState<"explorer" | "roadmap" | "sandbox">("explorer");
  const [files, setFiles] = useState<SourceFile[]>([]);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedFile, setCopiedFile] = useState(false);

  // Sandbox simulation state
  const [simulatedRoll, setSimulatedRoll] = useState("2023CSE01");
  const [simulatedStatus, setSimulatedStatus] = useState<"Present" | "Absent" | "Late">("Present");
  const [simulatedSubject, setSimulatedSubject] = useState("1");
  const [simulationResponse, setSimulationResponse] = useState<any | null>(null);
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch("/api/source-code")
      .then((res) => res.json())
      .then((data) => {
        setFiles(data);
        if (data.length) {
          setSelectedFileName(data[0].name);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        onNotify("Failed to fetch Python Flask source files", "error");
        setLoading(false);
      });
  }, []);

  const selectedFile = files.find((f) => f.name === selectedFileName);

  const handleCopyCode = () => {
    if (!selectedFile) return;
    navigator.clipboard.writeText(selectedFile.content);
    setCopiedFile(true);
    onNotify("Code block copied to system clipboard!", "success");
    setTimeout(() => setCopiedFile(false), 2000);
  };

  const handleTriggerSimulation = (e: React.FormEvent) => {
    e.preventDefault();
    setSimulating(true);
    setSimulationResponse(null);

    // Simulate an external API ingestion to /api/attendance/save from Flask / Biometrics
    setTimeout(() => {
      const dbUrl = `/api/students`;
      fetch(dbUrl)
        .then((res) => res.json())
        .then((studentList) => {
          const match = studentList.find((s: any) => s.roll_number === simulatedRoll);
          if (!match) {
            setSimulationResponse({
              status: "Rejected",
              timestamp: new Date().toISOString(),
              error: `Verification Failure: Roll ${simulatedRoll} not recognized in active registries`,
              device: "RFID_Node_Flask_Sim_01"
            });
            onNotify(`Biometric rejection: student registry missing`, "error");
            setSimulating(false);
            return;
          }

          // Trigger server side mock attendance registry save
          const payload = {
            date: new Date().toISOString().split("T")[0],
            department_id: match.department_id,
            semester: match.semester,
            section: match.section,
            subject_id: Number(simulatedSubject),
            created_by: 1, // Simulated System Admin
            records: [
              {
                student_id: match.id,
                status: simulatedStatus,
                remarks: "Logged via Flask Biometrics Simulation"
              }
            ]
          };

          fetch("/api/attendance/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          })
            .then((res) => res.json())
            .then((resJson) => {
              if (resJson.success) {
                setSimulationResponse({
                  status: "Synchronized",
                  timestamp: new Date().toISOString(),
                  student: match.full_name,
                  roll_number: match.roll_number,
                  marked: simulatedStatus,
                  message: "Flask REST Proxy Handshake Completed Successfully",
                  device: "Biometric_FaceScan_Sim_02"
                });
                onNotify(`RFID / Face scan simulated successfully for ${match.full_name}`, "success");
              } else {
                setSimulationResponse({
                  status: "Failed",
                  timestamp: new Date().toISOString(),
                  error: resJson.message || "Database write rejected"
                });
              }
              setSimulating(false);
            })
            .catch(() => {
              setSimulationResponse({
                status: "Gateway Error",
                timestamp: new Date().toISOString(),
                error: "Vite/Express dev proxy connection timeout"
              });
              setSimulating(false);
            });
        });
    }, 800);
  };

  const getFileIcon = (name: string) => {
    if (name.endsWith(".py")) return <Code2 className="h-4 w-4 text-emerald-500" />;
    if (name.endsWith(".sql")) return <Database className="h-4 w-4 text-blue-500" />;
    if (name.endsWith(".txt")) return <Terminal className="h-4 w-4 text-amber-500" />;
    return <FileText className="h-4 w-4 text-slate-400" />;
  };

  return (
    <div className="space-y-6">
      
      {/* Sub Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveSubTab("explorer")}
          id="tab-source-explorer"
          className={`px-5 py-2.5 font-sans text-xs font-semibold border-b-2 flex items-center space-x-2 transition-all cursor-pointer ${
            activeSubTab === "explorer" 
              ? "border-blue-600 text-blue-600" 
              : "border-transparent text-gray-500 hover:text-slate-800 hover:border-slate-200"
          }`}
        >
          <Code2 className="h-4 w-4" />
          <span>Flask Repository Explorer</span>
        </button>
        <button
          onClick={() => setActiveSubTab("roadmap")}
          id="tab-source-roadmap"
          className={`px-5 py-2.5 font-sans text-xs font-semibold border-b-2 flex items-center space-x-2 transition-all cursor-pointer ${
            activeSubTab === "roadmap" 
              ? "border-blue-600 text-blue-600" 
              : "border-transparent text-gray-500 hover:text-slate-800 hover:border-slate-200"
          }`}
        >
          <Workflow className="h-4 w-4" />
          <span>Full-Stack Migration Roadmap</span>
        </button>
        <button
          onClick={() => setActiveSubTab("sandbox")}
          id="tab-source-sandbox"
          className={`px-5 py-2.5 font-sans text-xs font-semibold border-b-2 flex items-center space-x-2 transition-all cursor-pointer ${
            activeSubTab === "sandbox" 
              ? "border-blue-600 text-blue-600" 
              : "border-transparent text-gray-500 hover:text-slate-800 hover:border-slate-200"
          }`}
        >
          <Cpu className="h-4 w-4" />
          <span>Flask REST API Ingestion Simulation</span>
        </button>
      </div>

      {activeSubTab === "explorer" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* File Explorer Tree Panel */}
          <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-4">
            <div>
              <h3 className="font-sans font-bold text-xs text-slate-800 dark:text-white uppercase tracking-wider">
                Project Files
              </h3>
              <p className="text-[10px] text-slate-400">Underlying Flask legacy code structure</p>
            </div>
            
            <div className="space-y-1">
              {files.map((f) => (
                <button
                  key={f.name}
                  id={`file-btn-${f.name.replace(".", "-")}`}
                  onClick={() => setSelectedFileName(f.name)}
                  className={`w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-left text-xs font-medium transition-all ${
                    selectedFileName === f.name 
                      ? "bg-blue-50/80 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 font-semibold" 
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  }`}
                >
                  {getFileIcon(f.name)}
                  <span className="truncate">{f.name}</span>
                </button>
              ))}
            </div>

            <div className="p-3 bg-blue-50/40 dark:bg-blue-950/10 border border-blue-100/60 dark:border-blue-900/30 rounded-xl">
              <div className="flex items-start space-x-2 text-[10px] text-blue-800 dark:text-blue-300">
                <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold">Execution Safe</span>
                  <p className="leading-normal">These Flask components represent our standalone, local backend models. They remain available for educational review and full-stack roadmap matching.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Active Code Box Editor */}
          <div className="lg:col-span-3 bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 shadow-lg overflow-hidden flex flex-col h-[520px]">
            <div className="bg-slate-950 px-5 py-3 border-b border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <GitBranch className="h-4 w-4 text-slate-400" />
                <span className="font-mono text-xs font-semibold text-slate-300">{selectedFileName}</span>
              </div>
              <button
                onClick={handleCopyCode}
                id="btn-copy-source-code"
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center space-x-1.5 transition-all cursor-pointer"
              >
                {copiedFile ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                <span>{copiedFile ? "Copied!" : "Copy Code"}</span>
              </button>
            </div>

            <div className="p-6 overflow-auto font-mono text-xs leading-relaxed text-slate-350 bg-slate-900/90 flex-1">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center space-y-2">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-[10px] text-slate-400">Loading code ledger...</p>
                </div>
              ) : selectedFile ? (
                <pre className="whitespace-pre">{selectedFile.content}</pre>
              ) : (
                <div className="text-center text-slate-500 py-12">No file content loaded.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "roadmap" && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-6">
          <div>
            <h3 className="font-sans font-bold text-xs text-slate-800 dark:text-white uppercase tracking-wider">
              Python Flask to React Node.js Migration Audit
            </h3>
            <p className="text-[10px] text-slate-400">Cohesive ledger verification matching the standalone local Flask implementation with our present production system</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Architecture comparison</h4>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                <div className="py-3 flex justify-between text-xs items-center">
                  <span className="font-medium text-slate-500">Database Engine</span>
                  <div className="flex items-center space-x-2 text-right">
                    <span className="text-[10px] bg-slate-100 text-slate-500 dark:bg-slate-800 px-2 py-0.5 rounded">SQLite (Flask)</span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-[10px] bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 font-bold">JSON Server (React Node)</span>
                  </div>
                </div>
                <div className="py-3 flex justify-between text-xs items-center">
                  <span className="font-medium text-slate-500">API Endpoint Mapping</span>
                  <div className="flex items-center space-x-2 text-right">
                    <span className="text-[10px] bg-slate-100 text-slate-500 dark:bg-slate-800 px-2 py-0.5 rounded">Jinja2 Web Views</span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-[10px] bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 font-bold">Express REST Handshakes</span>
                  </div>
                </div>
                <div className="py-3 flex justify-between text-xs items-center">
                  <span className="font-medium text-slate-500">Faculty Authentication</span>
                  <div className="flex items-center space-x-2 text-right">
                    <span className="text-[10px] bg-slate-100 text-slate-500 dark:bg-slate-800 px-2 py-0.5 rounded">Flask-Login</span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-[10px] bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 font-bold">Encrypted Web Credentials</span>
                  </div>
                </div>
                <div className="py-3 flex justify-between text-xs items-center">
                  <span className="font-medium text-slate-500">Reporting Engine</span>
                  <div className="flex items-center space-x-2 text-right">
                    <span className="text-[10px] bg-slate-100 text-slate-500 dark:bg-slate-800 px-2 py-0.5 rounded">CSV File Export</span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-[10px] bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 font-bold">High Contrast PDF Print Sheets</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Implementation status checklist</h4>
              <div className="space-y-2.5">
                <div className="flex items-start space-x-2.5 text-xs">
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">Department Registers (100% migrated)</span>
                    <p className="text-[10px] text-slate-400">Complete Department CRUD, descriptions, and database schema synchronized.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2.5 text-xs">
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">Subject Database Models (100% migrated)</span>
                    <p className="text-[10px] text-slate-400">Syllabus-mapped subjects, year structure, and semester listings aligned.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2.5 text-xs">
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">Student Profiles & Photo registries (100% migrated)</span>
                    <p className="text-[10px] text-slate-400">Automatic student roll listings, avatar photos, and parent contact logs fully ported.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2.5 text-xs">
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">Attendance Roll Marking Engine (100% migrated)</span>
                    <p className="text-[10px] text-slate-400">Take attendance, modify entries, bulk action checklists, and full historical log audits.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "sandbox" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form Parameters */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-4">
            <div>
              <h3 className="font-sans font-bold text-xs text-slate-800 dark:text-white uppercase tracking-wider">
                External Ingest Trigger
              </h3>
              <p className="text-[10px] text-slate-400">Simulate a student scanning an RFID card or triggering Biometric Facial Recognition through our API</p>
            </div>

            <form onSubmit={handleTriggerSimulation} className="space-y-4">
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Student Roll Number</label>
                  <select
                    value={simulatedRoll}
                    onChange={(e) => setSimulatedRoll(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all text-slate-800 dark:text-white"
                  >
                    <option value="2023CSE01">2023CSE01 (Aarav Sharma)</option>
                    <option value="2023CSE02">2023CSE02 (Ananya Iyer)</option>
                    <option value="2023CSE03">2023CSE03 (Kabir Verma)</option>
                    <option value="2023CSE04">2023CSE04 (Diya Patel)</option>
                    <option value="2023CSE99">2023CSE99 (Non-Existent student)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Scanned Class Subject</label>
                  <select
                    value={simulatedSubject}
                    onChange={(e) => setSimulatedSubject(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all text-slate-800 dark:text-white"
                  >
                    <option value="1">CS-401 (Cryptography)</option>
                    <option value="2">CS-402 (Cloud Computing)</option>
                    <option value="3">CS-403 (Deep Learning)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Automatic Marking Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["Present", "Late", "Absent"] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setSimulatedStatus(status)}
                      className={`py-2 rounded-xl text-xs font-semibold transition-all border ${
                        simulatedStatus === status 
                          ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/10" 
                          : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-600 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-400"
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={simulating}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white dark:bg-blue-600 dark:hover:bg-blue-700 py-2.5 rounded-xl text-xs font-bold shadow-md flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-40"
              >
                {simulating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Processing Scan Handshake...</span>
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 text-amber-400" />
                    <span>Fire Simulated Biometric / RFID Scan</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Sandbox Response Console */}
          <div className="bg-slate-950 rounded-2xl border border-slate-900 shadow-xl overflow-hidden flex flex-col min-h-[280px]">
            <div className="bg-slate-900 px-5 py-3 border-b border-slate-950/80 flex items-center justify-between">
              <span className="font-mono text-xs font-semibold text-slate-400">Response Handshake logs</span>
              <span className="text-[9px] bg-slate-800 text-emerald-400 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">REST PROXY</span>
            </div>

            <div className="p-5 flex-1 font-mono text-xs text-slate-300 overflow-auto">
              {simulationResponse ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-[11px] border-b border-slate-900 pb-2">
                    <span className="text-slate-500">REST Status code:</span>
                    <span className={`font-bold ${simulationResponse.error ? "text-rose-500" : "text-emerald-400"}`}>
                      {simulationResponse.error ? "400 BAD REQUEST" : "200 SUCCESS"}
                    </span>
                  </div>

                  <pre className="text-slate-350 overflow-x-auto text-[11px] leading-relaxed">
                    {JSON.stringify(simulationResponse, null, 2)}
                  </pre>

                  {!simulationResponse.error && (
                    <div className="p-2.5 bg-emerald-950/20 border border-emerald-900/30 rounded-xl text-[10px] text-emerald-400 leading-normal flex items-start space-x-2">
                      <Check className="h-4 w-4 shrink-0 mt-0.5" />
                      <p>The student's attendance status was successfully written into our database. You can instantly view the changes in our <strong>Dashboard Analytics</strong> or <strong>Sessions Audit Log</strong>!</p>
                    </div>
                  )}
                </div>
              ) : simulating ? (
                <div className="h-full flex flex-col items-center justify-center space-y-2 py-10">
                  <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
                  <p className="text-[10px] text-slate-500 font-mono">Proxy handshake in progress...</p>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center py-10 text-slate-500 text-center space-y-2">
                  <Terminal className="h-8 w-8 text-slate-700" />
                  <p className="text-[11px] max-w-xs">Fire a simulated scan on the left to inspect the REST JSON response payload logs.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
