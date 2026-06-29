@echo off
echo Starting Applicant Scorecard...
echo.
echo [1/2] Starting Backend on http://localhost:5000
start "Scorecard Backend" cmd /k "cd /d %~dp0backend && node server.js"
timeout /t 2 /nobreak >nul

echo [2/2] Starting Frontend on http://localhost:3000
start "Scorecard Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
timeout /t 3 /nobreak >nul

echo.
echo Both servers started!
echo Backend : http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Admin     login: admin     / Admin@123
echo Employee  login: haroon    / Emp@1234  (or any employee below)
echo Employees: haroon, abigail, tehreen, mkhalid, pratik,
echo            salman, dilshad, employee8, employee9, employee10
echo.
start http://localhost:3000

@REM New employees can log in with their auto-generated username (first.last format) and password Emp@1234.
