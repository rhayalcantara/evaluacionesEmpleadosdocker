# deploy_api_prueba_dll.ps1
# Despliega SOLO EvaluacionEmpleadosApi.dll al API de PRUEBA (:7071, sitio EvaluacionApi_Prueba,
# pool EvaluacionApiPrueba, base Evaluaciones_Test). Nunca copia web.config ni appsettings*.json:
# el web.config del servidor lleva ASPNETCORE_ENVIRONMENT=Development y es lo unico que apunta a la
# base de prueba (ver memoria deploy-api-prueba-7071).
#
# Uso:  .\scripts\deploy_api_prueba_dll.ps1 -ProyectoDir C:\Proyectos\evaluacionesEmpleadosdocker\build\B1
#       .\scripts\deploy_api_prueba_dll.ps1 -Rollback
param(
    [string]$ProyectoDir = 'C:\Users\ralcantara\source\repos\EvaluacionEmpleadosApi',
    [switch]$Rollback
)
$ErrorActionPreference = 'Stop'
$Server     = '192.168.7.222'
$ServerFqdn = 'srv-sifizsoft3.aspiresa.local'
$AppPool    = 'EvaluacionApiPrueba'
$Destino    = "\\$Server\c`$\inetpub\wwwroot\EvaluacionEmpleadosApi_Prueba"
$Dll        = 'EvaluacionEmpleadosApi.dll'
$Live       = Join-Path $Destino $Dll
$Bak        = Join-Path $Destino "$Dll.bak"
$UrlCheck   = "http://$Server`:7071/api/Periods"

function Set-Pool([string]$accion) {
    Invoke-Command -ComputerName $ServerFqdn -ScriptBlock {
        Import-Module WebAdministration
        if ($using:accion -eq 'stop') { Stop-WebAppPool $using:AppPool } else { Start-WebAppPool $using:AppPool }
    }
    Start-Sleep -Seconds 3
}
function Assert-BasePrueba {
    $resp = Invoke-WebRequest -Uri $UrlCheck -UseBasicParsing -TimeoutSec 60
    # Evaluaciones_Test tiene el periodo 8 como 'Mitad de año 2026' (a minuscula); produccion lo tiene como 'Mitad de Año 2026'.
    if ($resp.Content -cnotmatch 'Mitad de a.o 2026') { throw "ALERTA: :7071 no devuelve el periodo 8 de Evaluaciones_Test: puede estar contra produccion. Revisar web.config." }
    Write-Host "Verificacion: :7071 responde y sigue sobre Evaluaciones_Test" -ForegroundColor Green
}

if ($Rollback) {
    if (-not (Test-Path $Bak)) { throw "No hay respaldo $Bak" }
    Set-Pool 'stop'; Copy-Item $Bak $Live -Force; Set-Pool 'start'; Assert-BasePrueba; exit 0
}

$publish = Join-Path $ProyectoDir 'publish_prueba'
if (Test-Path $publish) { Remove-Item $publish -Recurse -Force }
Push-Location $ProyectoDir
try { dotnet publish -c Release -o $publish -nologo -v q | Out-Null; if ($LASTEXITCODE -ne 0) { throw "dotnet publish fallo ($LASTEXITCODE)" } }
finally { Pop-Location }
$nuevo = Join-Path $publish $Dll
if (-not (Test-Path $nuevo)) { throw "No se genero $nuevo" }

Copy-Item $Live $Bak -Force
Write-Host "Respaldo: $Bak"
Set-Pool 'stop'
Copy-Item $nuevo $Live -Force
Set-Pool 'start'
Assert-BasePrueba
Write-Host ("Desplegado {0} ({1:N0} bytes) a {2}" -f $Dll, (Get-Item $nuevo).Length, $Destino) -ForegroundColor Green
