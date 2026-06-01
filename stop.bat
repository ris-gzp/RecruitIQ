@echo off
setlocal

:: ─────────────────────────────────────────────────────────────────
::  RecruitIQ — One-click stopper
::  Kills processes on ports: 8000 (uvicorn) and 5173/5174 (Vite)
:: ─────────────────────────────────────────────────────────────────

echo.
echo  ============================================
echo   RecruitIQ  --  Shutting down...
echo  ============================================
echo.

set KILLED=0

call :KillPort 8000 "Backend  (uvicorn)"
call :KillPort 5173 "Frontend (Vite)"
call :KillPort 5174 "Frontend (Vite fallback)"

echo.
if %KILLED%==0 (
    echo  No running RecruitIQ servers found.
) else (
    echo  All servers stopped.
)
echo.
pause
endlocal
exit /b

:: ─────────────────────────────────────────────────────────────────
::  Subroutine: kill all PIDs listening on a given port
::  Usage: call :KillPort <port> <label>
:: ─────────────────────────────────────────────────────────────────
:KillPort
set "PORT=%~1"
set "LABEL=%~2"
set FOUND_THIS=0

for /f "tokens=5" %%P in (
    'netstat -ano 2^>nul ^| findstr /R " [^ ]*:%PORT% " ^| findstr "LISTENING"'
) do (
    :: Skip header or non-numeric tokens
    echo %%P | findstr /R "^[0-9][0-9]*$" >nul 2>&1
    if not errorlevel 1 (
        taskkill /F /PID %%P >nul 2>&1
        if not errorlevel 1 (
            echo  [STOPPED] %LABEL%  -- PID %%P
            set KILLED=1
            set FOUND_THIS=1
        )
    )
)

if %FOUND_THIS%==0 (
    echo  [  --   ] %LABEL%  -- not running
)
exit /b
