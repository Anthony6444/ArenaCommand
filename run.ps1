# PowerShell script to start the FastAPI app
# Activate the virtual environment, install requirements, and run the app

$venvPath = "./venv/Scripts/Activate.ps1"
if (-Not (Test-Path $venvPath)) {
    Write-Host "Virtual environment not found. Creating venv..."
    python -m venv venv
}

Write-Host "Activating virtual environment..."
. $venvPath

Write-Host "Installing requirements..."
pip install --upgrade pip
pip install -r requirements.txt

Write-Host "Starting FastAPI app with Uvicorn..."
Start-Process "http://127.0.0.1"
uvicorn main:app --port 80 --host "0.0.0.0"