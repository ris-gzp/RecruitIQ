@echo off
setlocal

:: ─────────────────────────────────────────────────────────────────
::  RecruitIQ — One-click launcher
::  Opens two Windows Terminal tabs:
::    Tab 1 → FastAPI backend  (http://localhost:8000)
::    Tab 2 → Vite frontend    (http://localhost:5173)
:: ─────────────────────────────────────────────────────────────────

set "ROOT=%~dp0"
set "BACKEND=%ROOT%backend"
set "FRONTEND=%ROOT%frontend"

echo.
echo  ============================================
echo   RecruitIQ  --  Starting up...
echo  ============================================
echo.
echo   Backend   ^>  http://localhost:8000
echo   Frontend  ^>  http://localhost:5173
echo   API Docs  ^>  http://localhost:8000/docs
echo.

:: ── Launch both tabs in Windows Terminal ─────────────────────────
wt --title "RecruitIQ" ^
   new-tab --title "RecruitIQ Backend" --startingDirectory "%BACKEND%" ^
       cmd /k "echo. && echo  [Backend] Activating venv... && call venv\Scripts\activate.bat && echo  [Backend] Starting uvicorn on :8000 && echo. && uvicorn main:app --reload --port 8000" ^
   ^; new-tab --title "RecruitIQ Frontend" --startingDirectory "%FRONTEND%" ^
       cmd /k "echo. && echo  [Frontend] Starting Vite on :5173 && echo. && npm run dev"

:: ── Wait for servers to boot, then open browser ──────────────────
echo  Waiting for servers to start...
timeout /t 4 /nobreak >nul
start http://localhost:5173

echo.
echo  Done! Browser opened at http://localhost:5173
echo  Run stop.bat to shut everything down.
echo.
endlocal
