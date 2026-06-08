# =============================================================
# 02-setup-iis-servidor.ps1
# Ejecutar como ADMINISTRADOR en el servidor 192.168.7.222
# Configura IIS para el ambiente de prueba completo
# =============================================================
#Requires -RunAsAdministrator
#Requires -Version 5.1

$ErrorActionPreference = "Stop"

# ============================================================
# VARIABLES - Ajusta si es necesario
# ============================================================
$apiPath          = "C:\inetpub\wwwroot\EvaluacionEmpleadosApi_Prueba"
$frontendPath     = "C:\inetpub\wwwroot\evaluacionempleado-prueba"
$apiPort          = 7071
$apiSiteName      = "EvaluacionApi_Prueba"
$apiPoolName      = "EvaluacionApiPrueba"
$frontendPoolName = "EvaluacionFrontendPrueba"
$mainSiteName     = "Default Web Site"   # Sitio IIS donde vive el frontend de produccion
$frontendAlias    = "evaluacionempleado-prueba"
$firewallRuleName = "EvaluacionApi_Prueba_$apiPort"
# ============================================================

function Write-Step { param($msg) Write-Host "`n--- $msg ---" -ForegroundColor Cyan }
function Write-OK   { param($msg) Write-Host "  [OK] $msg" -ForegroundColor Green }
function Write-Warn { param($msg) Write-Host "  [WARN] $msg" -ForegroundColor Yellow }
function Fail       { param($msg) Write-Host "`n  [ERROR] $msg" -ForegroundColor Red; exit 1 }

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "  SETUP IIS - AMBIENTE DE PRUEBA" -ForegroundColor Cyan
Write-Host "  Servidor: 192.168.7.222" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# ============================================================
# VERIFICACIONES PREVIAS
# ============================================================
Write-Step "Verificando prerequisitos"

# Modulo IIS
if (-not (Get-Module -ListAvailable -Name WebAdministration)) {
    Fail "Modulo WebAdministration no encontrado. Verifica que IIS este instalado (Roles y caracteristicas)."
}
Import-Module WebAdministration -ErrorAction Stop
Write-OK "Modulo WebAdministration cargado"

# .NET 7 Hosting Bundle
$dotnetCmd = Get-Command dotnet -ErrorAction SilentlyContinue
if (-not $dotnetCmd) {
    Fail ".NET no encontrado. Descarga e instala el '.NET 7 Hosting Bundle' desde https://dotnet.microsoft.com/download/dotnet/7.0"
}
$runtimes = & dotnet --list-runtimes 2>&1
if ($runtimes -notmatch "Microsoft\.AspNetCore\.App 7\.") {
    Write-Warn ".NET 7 ASP.NET Core runtime no detectado. Si el API falla al arrancar, instala el .NET 7 Hosting Bundle."
} else {
    Write-OK ".NET 7 ASP.NET Core runtime detectado"
}

# Modulo URL Rewrite (para Angular routing)
$rewriteModule = Get-WebConfigurationProperty -PSPath "MACHINE/WEBROOT/APPHOST" `
    -Filter "system.webServer/globalModules/add[@name='RewriteModule']" `
    -Name "name" -ErrorAction SilentlyContinue
if (-not $rewriteModule) {
    Write-Warn "URL Rewrite Module no detectado. Angular routing puede no funcionar."
    Write-Warn "Descarga desde: https://www.iis.net/downloads/microsoft/url-rewrite"
} else {
    Write-OK "URL Rewrite Module detectado"
}

# Carpetas con los archivos copiados
foreach ($path in @($apiPath, $frontendPath)) {
    if (-not (Test-Path $path)) {
        Fail "Carpeta no encontrada: $path`nCopia los archivos desde tu maquina primero (ver script 01)."
    }
    Write-OK "Carpeta encontrada: $path"
}

# Verificar que el sitio principal existe
$mainSiteObj = Get-Website -Name $mainSiteName -ErrorAction SilentlyContinue
if (-not $mainSiteObj) {
    Fail "Sitio IIS '$mainSiteName' no encontrado.`nAjusta la variable `$mainSiteName en este script con el nombre correcto."
}
Write-OK "Sitio principal encontrado: '$mainSiteName'"

# ============================================================
# APP POOL - API (No Managed Code, AlwaysRunning)
# ============================================================
Write-Step "App Pool API: $apiPoolName"

if (Test-Path "IIS:\AppPools\$apiPoolName") {
    Write-Warn "App Pool '$apiPoolName' ya existe, se reconfigura"
} else {
    New-WebAppPool -Name $apiPoolName | Out-Null
    Write-OK "App Pool '$apiPoolName' creado"
}

Set-ItemProperty "IIS:\AppPools\$apiPoolName" -Name "managedRuntimeVersion" -Value ""
Set-ItemProperty "IIS:\AppPools\$apiPoolName" -Name "startMode"             -Value "AlwaysRunning"
Set-ItemProperty "IIS:\AppPools\$apiPoolName" -Name "processModel.idleTimeout" -Value ([TimeSpan]::Zero)
Set-ItemProperty "IIS:\AppPools\$apiPoolName" -Name "recycling.periodicRestart.time" -Value ([TimeSpan]::Zero)
Write-OK "Configurado: No Managed Code, AlwaysRunning, sin idle timeout"

# ============================================================
# APP POOL - FRONTEND
# ============================================================
Write-Step "App Pool Frontend: $frontendPoolName"

if (Test-Path "IIS:\AppPools\$frontendPoolName") {
    Write-Warn "App Pool '$frontendPoolName' ya existe"
} else {
    New-WebAppPool -Name $frontendPoolName | Out-Null
    Set-ItemProperty "IIS:\AppPools\$frontendPoolName" -Name "managedRuntimeVersion" -Value ""
    Write-OK "App Pool '$frontendPoolName' creado"
}

# ============================================================
# SITIO IIS - API en puerto 7071
# ============================================================
Write-Step "Sitio IIS API: '$apiSiteName' en puerto $apiPort"

# Verificar conflicto de puerto
$portConflict = Get-WebBinding | Where-Object { $_.bindingInformation -like "*:${apiPort}:*" }
if ($portConflict) {
    Write-Warn "Ya hay un binding en puerto $apiPort. Se continuara pero verifica que no haya conflicto."
}

if (Test-Path "IIS:\Sites\$apiSiteName") {
    Write-Warn "Sitio '$apiSiteName' ya existe, se actualiza"
    Set-ItemProperty "IIS:\Sites\$apiSiteName" -Name "physicalPath"     -Value $apiPath
    Set-ItemProperty "IIS:\Sites\$apiSiteName" -Name "applicationPool"  -Value $apiPoolName
} else {
    New-Website -Name $apiSiteName `
                -Port $apiPort `
                -PhysicalPath $apiPath `
                -ApplicationPool $apiPoolName | Out-Null
    Write-OK "Sitio '$apiSiteName' creado en http://192.168.7.222:$apiPort"
}

# ============================================================
# WEB.CONFIG API - Inyectar ASPNETCORE_ENVIRONMENT=Development
# (activa appsettings.Development.json => Evaluaciones_Test)
# ============================================================
Write-Step "Configurando web.config API (apuntando a Evaluaciones_Test)"

$apiWebConfig = Join-Path $apiPath "web.config"
if (-not (Test-Path $apiWebConfig)) {
    Fail "web.config no encontrado en $apiPath. Verifica que la publicacion del backend este completa."
}

[xml]$xml = Get-Content $apiWebConfig -Encoding UTF8
$aspNetCoreNode = $xml.SelectSingleNode("//aspNetCore")

if (-not $aspNetCoreNode) {
    Fail "Elemento <aspNetCore> no encontrado en $apiWebConfig. El archivo puede estar corrupto."
}

# Obtener o crear nodo environmentVariables
$envVarsNode = $aspNetCoreNode.SelectSingleNode("environmentVariables")
if (-not $envVarsNode) {
    $envVarsNode = $xml.CreateElement("environmentVariables")
    $aspNetCoreNode.AppendChild($envVarsNode) | Out-Null
}

# Agregar o actualizar ASPNETCORE_ENVIRONMENT
$existingVar = $envVarsNode.SelectSingleNode("environmentVariable[@name='ASPNETCORE_ENVIRONMENT']")
if ($existingVar) {
    $existingVar.SetAttribute("value", "Development")
    Write-Warn "ASPNETCORE_ENVIRONMENT ya existia, actualizado a 'Development'"
} else {
    $envVar = $xml.CreateElement("environmentVariable")
    $envVar.SetAttribute("name", "ASPNETCORE_ENVIRONMENT")
    $envVar.SetAttribute("value", "Development")
    $envVarsNode.AppendChild($envVar) | Out-Null
    Write-OK "ASPNETCORE_ENVIRONMENT=Development agregado"
}

$xml.Save($apiWebConfig)
Write-OK "web.config API guardado => usara DB: Evaluaciones_Test"

# ============================================================
# APLICACION IIS - FRONTEND Angular bajo sitio principal
# ============================================================
Write-Step "Aplicacion IIS Frontend: /$frontendAlias"

$existingApp = Get-WebApplication -Site $mainSiteName -Name $frontendAlias -ErrorAction SilentlyContinue
if ($existingApp) {
    Write-Warn "Aplicacion '/$frontendAlias' ya existe, se actualiza"
    Set-ItemProperty "IIS:\Sites\$mainSiteName\$frontendAlias" -Name "physicalPath" -Value $frontendPath
    Set-ItemProperty "IIS:\Sites\$mainSiteName\$frontendAlias" -Name "applicationPool" -Value $frontendPoolName
} else {
    New-WebApplication -Site $mainSiteName `
                       -Name $frontendAlias `
                       -PhysicalPath $frontendPath `
                       -ApplicationPool $frontendPoolName | Out-Null
    Write-OK "Aplicacion '/$frontendAlias' creada bajo '$mainSiteName'"
}

# ============================================================
# WEB.CONFIG FRONTEND - URL Rewrite para Angular HTML5 routing
# ============================================================
Write-Step "web.config Angular (HTML5 routing)"

$frontendWebConfig = Join-Path $frontendPath "web.config"

# Solo sobreescribir si el URL Rewrite module existe
$rewriteContent = @"
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="Angular Routes Prueba" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile"      negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory"  negate="true" />
          </conditions>
          <action type="Rewrite" url="/$frontendAlias/index.html" />
        </rule>
      </rules>
    </rewrite>
    <staticContent>
      <remove fileExtension=".js" />
      <mimeMap fileExtension=".js" mimeType="application/javascript" />
      <remove fileExtension=".mjs" />
      <mimeMap fileExtension=".mjs" mimeType="application/javascript" />
    </staticContent>
  </system.webServer>
</configuration>
"@

$rewriteContent | Out-File -FilePath $frontendWebConfig -Encoding UTF8 -Force
Write-OK "web.config Angular creado en $frontendWebConfig"

# ============================================================
# FIREWALL - Puerto 7071
# ============================================================
Write-Step "Regla de Firewall para puerto $apiPort (TCP Inbound)"

$existingRule = Get-NetFirewallRule -DisplayName $firewallRuleName -ErrorAction SilentlyContinue
if ($existingRule) {
    Write-Warn "Regla '$firewallRuleName' ya existe"
} else {
    New-NetFirewallRule `
        -DisplayName $firewallRuleName `
        -Direction   Inbound `
        -Protocol    TCP `
        -LocalPort   $apiPort `
        -Action      Allow `
        -Profile     Any `
        -Description "EvaluacionEmpleados - API ambiente de prueba" | Out-Null
    Write-OK "Regla de firewall creada para TCP:$apiPort"
}

# ============================================================
# ARRANCAR SITIO Y REINICIAR IIS
# ============================================================
Write-Step "Iniciando servicios IIS"

Start-Website -Name $apiSiteName -ErrorAction SilentlyContinue
Write-OK "Sitio API iniciado"

iisreset /restart | Out-Null
Write-OK "IIS reiniciado correctamente"

# ============================================================
# RESUMEN FINAL
# ============================================================
Write-Host "`n============================================" -ForegroundColor Green
Write-Host "  AMBIENTE DE PRUEBA CONFIGURADO" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "  API (Swagger):   http://192.168.7.222:$apiPort/swagger" -ForegroundColor White
Write-Host "  Frontend:        http://192.168.7.222/$frontendAlias" -ForegroundColor White
Write-Host "  Base de datos:   Evaluaciones_Test" -ForegroundColor White
Write-Host ""
Write-Host "  Produccion sigue en:" -ForegroundColor DarkGray
Write-Host "  API:             http://192.168.7.222:7070" -ForegroundColor DarkGray
Write-Host "  Frontend:        http://192.168.7.222/evaluacionempleado" -ForegroundColor DarkGray
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
