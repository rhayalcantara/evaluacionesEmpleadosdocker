# =============================================================
# 01-build-publicar-local.ps1
# Ejecutar en tu maquina de desarrollo ANTES de ir al servidor
# =============================================================
#Requires -Version 5.1

$ErrorActionPreference = "Stop"

# ---- RUTAS (ajusta si cambian) ----------------------------
$frontendDir     = "C:\Proyectos\evaluacionesEmpleadosdocker"
$backendDir      = "C:\Users\ralcantara\source\repos\EvaluacionEmpleadosApi"
$outputBase      = "C:\PublishPrueba"
$apiFolderLocal  = "$outputBase\EvaluacionEmpleadosApi_Prueba"
$frontendFolderLocal = "$outputBase\evaluacionempleado-prueba"
# -----------------------------------------------------------

function Write-Step { param($n, $msg) Write-Host "`n[$n] $msg" -ForegroundColor Cyan }
function Write-OK   { param($msg) Write-Host "    OK: $msg" -ForegroundColor Green }
function Write-Fail { param($msg) Write-Host "    ERROR: $msg" -ForegroundColor Red; exit 1 }

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  BUILD AMBIENTE DE PRUEBA" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# ---- PASO 1: Build Angular (configuracion prueba) ---------
Write-Step "1/2" "Compilando frontend Angular (--configuration=prueba)"

Set-Location $frontendDir

if (-not (Test-Path "package.json")) {
    Write-Fail "No se encontro package.json en $frontendDir"
}

$env:PUBLIC_PATH = "/evaluacionempleado-prueba/"
npm run build -- --configuration=prueba
if ($LASTEXITCODE -ne 0) { Write-Fail "ng build fallo. Revisa los errores arriba." }

# Fijar base href en index.html (ngx-build-plus no respeta --base-href por configuracion)
$idx = "$frontendDir\dist\evaluacionempleado\index.html"
(Get-Content $idx) -replace '<base href="/evaluacionempleado/">', '<base href="/evaluacionempleado-prueba/">' | Set-Content $idx -Encoding UTF8

# Copiar dist al output
New-Item -ItemType Directory -Force -Path $frontendFolderLocal | Out-Null
Copy-Item -Path "$frontendDir\dist\evaluacionempleado\*" `
          -Destination $frontendFolderLocal `
          -Recurse -Force

Write-OK "Frontend compilado en: $frontendFolderLocal"

# ---- PASO 2: Publicar backend .NET 7 ----------------------
Write-Step "2/2" "Publicando backend ASP.NET Core 7 (Release)"

if (-not (Test-Path "$backendDir\EvaluacionEmpleadosApi.csproj")) {
    Write-Fail "No se encontro el .csproj en $backendDir"
}

dotnet publish "$backendDir\EvaluacionEmpleadosApi.csproj" `
               -c Release `
               -o $apiFolderLocal `
               --nologo

if ($LASTEXITCODE -ne 0) { Write-Fail "dotnet publish fallo. Revisa los errores arriba." }

Write-OK "Backend publicado en: $apiFolderLocal"

# ---- RESUMEN ----------------------------------------------
Write-Host "`n============================================" -ForegroundColor Green
Write-Host "  ARCHIVOS LISTOS - PROXIMOS PASOS" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Carpeta local con todo: $outputBase" -ForegroundColor White
Write-Host ""
Write-Host "  1. Copia via RDP al servidor 192.168.7.222:" -ForegroundColor Yellow
Write-Host "     $apiFolderLocal"
Write-Host "       --> C:\inetpub\wwwroot\EvaluacionEmpleadosApi_Prueba"
Write-Host ""
Write-Host "     $frontendFolderLocal"
Write-Host "       --> C:\inetpub\wwwroot\evaluacionempleado-prueba"
Write-Host ""
Write-Host "  2. En el servidor, ejecuta como Administrador:" -ForegroundColor Yellow
Write-Host "     .\02-setup-iis-servidor.ps1"
Write-Host ""
