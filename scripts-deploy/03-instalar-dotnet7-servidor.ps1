# =============================================================
# 03-instalar-dotnet7-servidor.ps1
# Instala el .NET 7 Hosting Bundle en el servidor IIS
# Ejecutar como ADMINISTRADOR en el servidor 192.168.7.222
# =============================================================
#Requires -RunAsAdministrator
#Requires -Version 5.1

$ErrorActionPreference = "Stop"

$tempDir    = "C:\Temp\DotNet7Install"
$instalador = "$tempDir\dotnet-hosting-7-win.exe"

function Write-Step { param($msg) Write-Host "`n--- $msg ---" -ForegroundColor Cyan }
function Write-OK   { param($msg) Write-Host "  [OK] $msg" -ForegroundColor Green }
function Write-Warn { param($msg) Write-Host "  [WARN] $msg" -ForegroundColor Yellow }
function Fail       { param($msg) Write-Host "`n  [ERROR] $msg" -ForegroundColor Red; exit 1 }

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "  INSTALACION .NET 7 HOSTING BUNDLE" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# ============================================================
# PASO 1: Verificar si ya esta instalado
# ============================================================
Write-Step "Verificando instalacion actual de .NET"

$dotnet = Get-Command dotnet -ErrorAction SilentlyContinue
if ($dotnet) {
    $runtimes = & dotnet --list-runtimes 2>&1
    if ($runtimes -match "Microsoft\.AspNetCore\.App 7\.") {
        Write-OK ".NET 7 ASP.NET Core Runtime YA esta instalado:"
        $runtimes | Where-Object { $_ -match "AspNetCore.*7\." } | ForEach-Object {
            Write-Host "    $_" -ForegroundColor White
        }
        Write-Host "`n  No se requiere instalacion." -ForegroundColor Green

        # Verificar que el modulo de IIS este activo
        Write-Step "Verificando modulo ASP.NET Core en IIS"
        Import-Module WebAdministration -ErrorAction SilentlyContinue
        $modulo = Get-WebConfigurationProperty -PSPath "MACHINE/WEBROOT/APPHOST" `
            -Filter "system.webServer/globalModules/add[@name='AspNetCoreModuleV2']" `
            -Name "name" -ErrorAction SilentlyContinue
        if ($modulo) {
            Write-OK "AspNetCoreModuleV2 activo en IIS"
        } else {
            Write-Warn "AspNetCoreModuleV2 NO encontrado en IIS. Reinstala el Hosting Bundle."
        }

        exit 0
    }
}

Write-Warn ".NET 7 Hosting Bundle NO esta instalado. Procediendo con la instalacion..."

# ============================================================
# PASO 2: Preparar carpeta temporal
# ============================================================
Write-Step "Preparando carpeta temporal"

New-Item -ItemType Directory -Force -Path $tempDir | Out-Null
Write-OK "Carpeta lista: $tempDir"

# ============================================================
# PASO 3: Intentar descarga con winget (metodo preferido)
# ============================================================
Write-Step "Intentando instalacion via winget"

$winget = Get-Command winget -ErrorAction SilentlyContinue
if ($winget) {
    Write-OK "winget encontrado. Instalando Microsoft.DotNet.HostingBundle.7..."
    try {
        winget install --id Microsoft.DotNet.HostingBundle.7 `
                       --silent `
                       --accept-source-agreements `
                       --accept-package-agreements

        if ($LASTEXITCODE -eq 0) {
            Write-OK "Instalacion via winget completada"
            $usedWinget = $true
        } else {
            Write-Warn "winget retorno codigo $LASTEXITCODE. Se intentara descarga manual."
            $usedWinget = $false
        }
    } catch {
        Write-Warn "winget fallo: $($_.Exception.Message). Se intentara descarga manual."
        $usedWinget = $false
    }
} else {
    Write-Warn "winget no disponible. Se descargara el instalador manualmente."
    $usedWinget = $false
}

# ============================================================
# PASO 4: Descarga manual si winget no funciono
# ============================================================
if (-not $usedWinget) {
    Write-Step "Descargando .NET 7 Hosting Bundle desde Microsoft"

    # URL oficial del Hosting Bundle .NET 7 (ultima version LTS)
    # Fuente: https://dotnet.microsoft.com/download/dotnet/7.0
    $downloadUrl = "https://download.visualstudio.microsoft.com/download/pr/e6b2c89e-71ad-4d8e-8586-bfe8a2e0a0b7/94bb9e2a4b56b5cfc5e1ba12b6e97d6d/dotnet-hosting-7.0.20-win.exe"

    Write-Host "  Descargando desde Microsoft..." -ForegroundColor White
    Write-Host "  Destino: $instalador" -ForegroundColor White

    try {
        # Usar TLS 1.2 (requerido por Microsoft)
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

        $webClient = New-Object System.Net.WebClient
        $webClient.DownloadFile($downloadUrl, $instalador)
        Write-OK "Descarga completada: $('{0:N1}' -f ((Get-Item $instalador).Length / 1MB)) MB"
    } catch {
        Write-Host "`n  [ERROR] No se pudo descargar automaticamente." -ForegroundColor Red
        Write-Host "`n  DESCARGA MANUAL:" -ForegroundColor Yellow
        Write-Host "  1. Abre un navegador en el servidor" -ForegroundColor White
        Write-Host "  2. Ve a: https://dotnet.microsoft.com/download/dotnet/7.0" -ForegroundColor White
        Write-Host "  3. Descarga: 'Hosting Bundle' (seccion ASP.NET Core Runtime 7.x)" -ForegroundColor White
        Write-Host "  4. Guarda en: $instalador" -ForegroundColor White
        Write-Host "  5. Vuelve a ejecutar este script" -ForegroundColor White
        exit 1
    }

    # ============================================================
    # PASO 5: Verificar hash / ejecutar instalador
    # ============================================================
    Write-Step "Instalando .NET 7 Hosting Bundle"

    if (-not (Test-Path $instalador)) {
        Fail "El instalador no se encontro en $instalador"
    }

    Write-Host "  Ejecutando instalador (modo silencioso)..." -ForegroundColor White

    $proceso = Start-Process -FilePath $instalador `
                             -ArgumentList "/install", "/quiet", "/norestart", `
                                           "OPT_NO_X86=1" `
                             -Wait `
                             -PassThru

    switch ($proceso.ExitCode) {
        0       { Write-OK "Instalacion completada exitosamente" }
        3010    { Write-OK "Instalacion completada. Se requiere REINICIAR el servidor para finalizar." }
        1638    { Write-Warn "Ya existe una version del producto instalada." }
        default { Fail "El instalador retorno codigo $($proceso.ExitCode). Revisa el Event Viewer." }
    }

    # Limpiar instalador
    Remove-Item $instalador -Force -ErrorAction SilentlyContinue
    Write-OK "Instalador temporal eliminado"
}

# ============================================================
# PASO 6: Verificar instalacion
# ============================================================
Write-Step "Verificando instalacion"

# Refrescar PATH
$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" +
            [System.Environment]::GetEnvironmentVariable("Path", "User")

$dotnet2 = Get-Command dotnet -ErrorAction SilentlyContinue
if ($dotnet2) {
    $runtimes = & dotnet --list-runtimes 2>&1
    $found = $runtimes | Where-Object { $_ -match "AspNetCore.*7\." }
    if ($found) {
        Write-OK ".NET 7 ASP.NET Core Runtime instalado:"
        $found | ForEach-Object { Write-Host "    $_" -ForegroundColor White }
    } else {
        Write-Warn "Runtime no visible aun. Puede requerir reinicio del servidor."
    }
} else {
    Write-Warn "dotnet.exe no visible en PATH aun. Puede requerir reinicio del servidor."
}

# Verificar modulo IIS
Import-Module WebAdministration -ErrorAction SilentlyContinue
$modulo = Get-WebConfigurationProperty -PSPath "MACHINE/WEBROOT/APPHOST" `
    -Filter "system.webServer/globalModules/add[@name='AspNetCoreModuleV2']" `
    -Name "name" -ErrorAction SilentlyContinue
if ($modulo) {
    Write-OK "AspNetCoreModuleV2 registrado en IIS"
} else {
    Write-Warn "AspNetCoreModuleV2 no visible aun. Reinicia el servidor si persiste."
}

# ============================================================
# PASO 7: Reiniciar IIS
# ============================================================
Write-Step "Reiniciando IIS"

iisreset /restart | Out-Null
Write-OK "IIS reiniciado"

# ============================================================
# RESUMEN
# ============================================================
Write-Host "`n============================================" -ForegroundColor Green
Write-Host "  INSTALACION COMPLETADA" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Prueba la API ahora:" -ForegroundColor White
Write-Host "  http://192.168.7.222:7071/swagger" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Si el sitio aun no carga, reinicia el servidor" -ForegroundColor DarkGray
Write-Host "  y vuelve a intentarlo." -ForegroundColor DarkGray
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
