# Student Attendance Management System

A high-performance, responsive, and robust student attendance monitoring and audit system designed for B.Tech institutions. This application integrates a professional Express and React (Vite + Tailwind CSS) single-page application with optional support for companion Python/Flask biometric microservices and relational SQLite/PostgreSQL storage engines.

---

## 🚀 Key Features

*   **Secure Faculty Portal**: Complete credential registration, multi-factor credential validations, secure session state persistence, and direct profile update routes.
*   **Dynamic Cohort Registries**: Full-stack CRUD management for Departments, Subjects, and Student profiles under designated academic sections.
*   **Intelligent Roll-Call Ingestion**:
    *   *Optical Facial Verification*: Simulated multi-camera video scanner that matches face frames with 99%+ indexing accuracy.
    *   *NFC/RFID Scanners*: Secure integration hooks to simulated local physical biometrics.
    *   *Interactive QR Portals*: Self check-in gateways using high-frequency rotating access codes.
*   **Deep Academic Analytics**: Rich metrics reporting with real-time dynamic trend lines (built with D3 and Recharts), section attendance distribution histograms, and interactive student engagement charts.
*   **Downloadable Companion Code**: Embedded source explorer offering direct download/copy access to a local standalone Python/Flask companion service complete with clean MySQL schemas.
*   **Elegant Visual Interface**: Immersive fully responsive visual system with optimized light/dark aesthetic states and smooth micro-animations.

---

## 🛠️ Technology Stack

### Front-End
*   **Core Library**: React 19 (TypeScript)
*   **Build Tool**: Vite 6
*   **Styling & Theming**: Tailwind CSS v4, Lucide Icons, and Framer Motion micro-animations
*   **Analytical Visualizations**: Recharts and D3.js

### Back-End (Monolith & Companion API)
*   **Application Server**: Node.js & Express.js (v4)
*   **Database ORM**: Drizzle ORM
*   **Primary Database**: Better-SQLite3 (local state tracking) with easy transition to cloud-hosted PostgreSQL (via pg)
*   **Companion Framework**: Python 3.x, Flask, WTForms, and Flask-Login (SQLAlchemy schema included)
*   **Notification Dispatcher**: Nodemailer (via standard SMTP gateways)

---

## 📦 Installation & Setup

Ensure you have [Node.js](https://nodejs.org/) (version 18 or above) installed on your system.

### 1. Clone the Repository
```bash
git clone https://github.com/vvasu7932/student-attendance-system.git
cd student-attendance-system
```

### 2. Install Dependencies
Install all package dependencies via `npm`:
```bash
npm install
```

### 3. Environment Variables
Create a local `.env` configuration file by duplicating the provided sample:
```bash
cp .env.example .env
```
Update any port, salt, database endpoints, or mailer credentials according to your specific server topology.

### 4. Running the Development Server
Launch the combined Express backend and Vite client bundler:
```bash
npm run dev
```
The application will launch on port `3000` and will be accessible at:
*   [http://localhost:3000](http://localhost:3000)

---

## 💼 Usage Instructions

### 1. Register & Login
*   Navigate to the registration tab to sign up your faculty account under any default department.
*   Log in using your registered email and secure password.

### 2. Configure Class Cohorts
*   Navigate to the **Departments**, **Subjects**, or **Students** panels.
*   Populate registries by creating sample courses, semesters, sections, and listing individual student profiles.

### 3. Record Roll-Calls
*   Open the **Attendance Recorder** and choose the subject, section, and date.
*   Initiate recording manually or click on one of our automated simulations (e.g. **Optical Facial Scanner**) to ingest biometric data instantly.
*   Add any specific attendance remarks (e.g., "Late due to transport") and hit **Save Session**.

### 4. Audit & Download Reports
*   Head over to the **Dashboard** to examine dynamic analytics.
*   Use the **Reports** view to instantly query, aggregate, and download spreadsheet formats of any cohort attendance sheet.

---

## 🔮 Future Improvements

1.  **Direct WebRTC Streams**: Transition from simulated camera streams to real-time WebRTC browser cameras for live facial tracking.
2.  **Edge Compute Microcontrollers**: Connect physical ESP32 or Raspberry Pi biometrics boards directly over MQTT protocols to standard database webhooks.
3.  **Autonomous Absence Alerts**: Auto-dispatch SMS notifications or email templates via Twilio or SMTP when a student's cumulative attendance drops below standard thresholds (e.g. 75%).
4.  **Decentralized Academic Ledger**: Secure student biometric logs on private cryptographic chains to prevent administrative tampering.

---

## 🛠️ Localhost Troubleshooting Guide

If you clone the repository and find that it is not opening on `localhost`, please check the following common issues and solutions:

### 1. Port 3000 Already in Use
By default, the backend runs on port `3000`. If you already have another app or server running on port `3000`, the server will fail to start.
*   **Solution**: Create a `.env` file in the root directory (by copying `.env.example`) and configure the `PORT` variable to use a different port:
    ```env
    PORT=3005
    ```
    Now, the application will launch on [http://localhost:3005](http://localhost:3005) instead.

### 2. Node.js Version Compatibility
Ensure you are using Node.js **version 18 or higher** (v20+ is highly recommended). Older versions of Node do not support modern ES Module features or global standard fetch.
*   **Check version**: Run `node -v` in your terminal.
*   **Update**: If your version is old, download the latest LTS release from [nodejs.org](https://nodejs.org/).

### 3. Native Binary Compilations (`better-sqlite3` issues)
`better-sqlite3` is a fast database connector but compiles C++ binaries during installation. If `npm install` prints errors about `node-gyp` or missing visual compiler tools:
*   **On Windows**: Run PowerShell as Administrator and execute `npm install --global --production windows-build-tools` or install [Build Tools for Visual Studio](https://visualstudio.microsoft.com/visual-cpp-build-tools/).
*   **On Mac**: Make sure Xcode command-line tools are installed by running `xcode-select --install` in your terminal.
*   **Alternative**: You can also use Node's built-in modules or run the dependencies with `--legacy-peer-deps`.

### 4. Browser Blank Page or Cache issue
If the terminal logs that the server is running but your browser shows a blank page:
*   Open the browser's developer console (F12 or right-click -> Inspect -> Console) and check for errors.
*   Try accessing the page via `http://127.0.0.1:3000` instead of `http://localhost:3000` (some operating systems resolve `localhost` differently).
*   Perform a hard refresh (`Ctrl + F5` on Windows or `Cmd + Shift + R` on Mac) to clear any cached assets.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) - see the LICENSE file for details.
