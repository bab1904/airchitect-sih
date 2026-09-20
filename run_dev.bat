@echo off
echo ========================================================
echo   Starting TimeAgent Link (SIH PS 26122 - Oil India Ltd)
echo   FastAPI + Vite React + Sentence-Transformers
echo ========================================================

start "TimeAgent Backend (FastAPI)" cmd /k "cd /d %~dp0backend && python main.py"
start "TimeAgent Frontend (Vite React)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo Servers launched!
echo - Frontend UI: http://localhost:5173
echo - Backend API Docs: http://localhost:8000/docs
echo ========================================================
