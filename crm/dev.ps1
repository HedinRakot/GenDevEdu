# Startet CRM-API (:5210) und Web-Dev-Server (:5173) parallel in eigenen Fenstern.
$root = $PSScriptRoot

Start-Process -FilePath "dotnet" -ArgumentList "run", "--project", "$root\api" -WorkingDirectory $root
Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd '$root\web'; npm run dev" -WorkingDirectory "$root\web"

Write-Host "API:  http://localhost:5210"
Write-Host "Web:  http://localhost:5173"
