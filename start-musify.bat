@echo off
title Musify Music Player Launcher
echo ========================================================
echo             Musify - Liquid Glass Music Player
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/2] Launching Musify Backend Server (Port 3001)...
start "Musify Backend Server" cmd /k "cd backend && npm start"

timeout /t 2 /nobreak >nul

echo [2/2] Launching Musify Web Frontend (Port 3000)...
start "Musify Web Frontend" cmd /k "cd frontend && npm run preview"

echo.
echo ========================================================
echo Musify is now running!
echo Desktop/Local:   http://localhost:3000
echo Network/Mobile:  Check your local IP (e.g. http://192.168.x.x:3000)
echo ========================================================
echo Keep this window open or close it; the servers run in their own windows.
pause
