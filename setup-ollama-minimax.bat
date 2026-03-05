@echo off
REM Setup script for minimax-m2.5:cloud model on Windows

echo🚀 Setting up minimax-m2.5:cloud model for Ollama...

REM Check if Ollama is installed
where ollama >nul 2>&1
if %errorlevel% neq 0 (
    echo❌ Ollama is not installed. Please install it first from https://ollama.com/
    pause
    exit /b 1
)

echo✅ Ollama is installed

REM Start Ollama service if not running
tasklist | findstr "ollama" >nul
if %errorlevel% neq 0 (
    echo⚠  O  Ollama service is not running. Starting it...
    start /b ollama serve
    timeout /t 5 /nobreak >nul
)

echo✅ Ollama service is running

REM Pull the minimax-m2.5:cloud model
echo📥ing minimax-m2.5:cloud model...
ollama pull minimax-m2.5:cloud

if %errorlevel% equ 0 (
    echo ✅ minimax-m2.5:cloud model downloaded successfully!
    echo can now test the integration with:
    echo    cd backend && node test-ollama.js
) else (
    echo❌ Failed to download minimax-m2.5:cloud model
    echo Please check your internet connection and try again
)

pause