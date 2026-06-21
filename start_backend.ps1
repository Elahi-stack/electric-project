# start_backend.ps1 — Run this in one terminal
Set-Location "$PSScriptRoot\backend"
uvicorn main:app --reload --port 8000
