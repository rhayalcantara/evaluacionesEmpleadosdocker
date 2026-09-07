# deploy_produccion_staging.ps1
# Despliegue del frontend a PRODUCCION (evaluacionempleado) con carpeta staging
# + swap por rename: la ventana de inconsistencia pasa de ~2 minutos (robocopy
# directo sobre el sitio vivo) a milisegundos.
#
# Gemelo de deploy_prueba_staging.ps1. La unica diferencia real es el objetivo:
# sitio 'evaluacionempleado', pool 'EvaluacionFrontendProd' y build --configuration production.
#
# El pool DEBE ser el dedicado: /evaluacionempleado estuvo bajo DefaultAppPool hasta
# el 2026-07-30, y reciclar ese pool cortaria Loginapp, FBS, overAspire y 8 apps mas.
#
# Uso (desde la raiz del repo):
#   .\scripts\deploy_produccion_staging.ps1              # build + deploy
#   .\scripts\deploy_produccion_staging.ps1 -SkipBuild   # usa dist\deploy-produccion existente
#   .\scripts\deploy_produccion_staging.ps1 -Rollback    # vuelve al despliegue anterior (_old)
#
# PowerShell 5.1 compatible. Requiere acceso al share administrativo c$ del servidor.

param(
    [switch]$SkipBuild,
    [switch]$Rollback
)

$ErrorActionPreference = 'Stop'

$Server   = '192.168.7.222'
$SiteName = 'evaluacionempleado'
$WwwRoot  = "\\$Server\c`$\inetpub\wwwroot"
$Live     = Join-Path $WwwRoot $SiteName
$Staging  = Join-Path $WwwRoot "$SiteName`_new"
$Backup   = Join-Path $WwwRoot "$SiteName`_old"
$DistDir  = 'dist\deploy-produccion'
$SiteUrl  = "http://$Server/$SiteName/"
$ServerFqdn = 'srv-sifizsoft3.aspiresa.local'   # WinRM exige hostname (Kerberos), no IP
$AppPool    = 'EvaluacionFrontendProd'          # pool dedicado - NO toca DefaultAppPool

# Node no esta en el PATH de PowerShell en esta maquina
if (Test-Path 'C:\nvm4w\nodejs') { $env:PATH = "C:\nvm4w\nodejs;$env:PATH" }

# El swap por rename deja el cache de archivos de IIS apuntando a los handles de la
# carpeta vieja (sigue sirviendo el build anterior aunque el disco ya tenga el nuevo).
# Reciclar el pool dedicado lo limpia; es instantaneo y solo afecta este sitio.
function Reset-CacheIIS {
    Invoke-Command -ComputerName $ServerFqdn -ScriptBlock {
        Import-Module WebAdministration
        Restart-WebAppPool $using:AppPool
    }
    Start-Sleep -Seconds 2
}

function Assert-SiteResponde {
    $resp = Invoke-WebRequest -Uri "$SiteUrl`index.html" -UseBasicParsing -TimeoutSec 30
    if ($resp.StatusCode -ne 200) { throw "El sitio respondio HTTP $($resp.StatusCode)" }
    $main = [regex]::Match($resp.Content, 'main\.[a-f0-9]+\.js').Value
    if (-not $main) { throw 'index.html servido no referencia ningun main.*.js' }
    $head = Invoke-WebRequest -Uri "$SiteUrl$main" -UseBasicParsing -TimeoutSec 30 -Method Head
    $tipo = $head.Headers['Content-Type']
    if ($tipo -notlike '*javascript*') { throw "El bundle $main se sirve como '$tipo' (esperado javascript)" }
    Write-Host "Verificacion HTTP: index 200, $main servido como $tipo" -ForegroundColor Green
}

# Guarda: el pool dedicado tiene que existir y estar asignado antes de desplegar,
# si no el reciclado no limpiaria el cache del sitio (o tumbaria DefaultAppPool).
function Assert-PoolDedicado {
    $pool = Invoke-Command -ComputerName $ServerFqdn -ScriptBlock {
        Import-Module WebAdministration
        (Get-WebApplication -Site 'Default Web Site' |
            Where-Object { $_.path -eq "/$using:SiteName" }).applicationPool
    }
    if ($pool -ne $AppPool) {
        throw "/$SiteName esta en el pool '$pool', se esperaba '$AppPool'. Revisar antes de desplegar."
    }
    Write-Host "Pool verificado: /$SiteName -> $AppPool" -ForegroundColor Green
}

# ---------- ROLLBACK ----------
if ($Rollback) {
    if (-not (Test-Path $Backup)) { throw "No existe $Backup - no hay despliegue anterior al cual volver." }
    Assert-PoolDedicado
    Write-Host "Rollback: intercambiando el sitio vivo por $SiteName`_old..." -ForegroundColor Yellow
    $tmp = Join-Path $WwwRoot "$SiteName`_swap"
    Rename-Item -Path $Live   -NewName "$SiteName`_swap"
    Rename-Item -Path $Backup -NewName $SiteName
    Rename-Item -Path $tmp    -NewName "$SiteName`_old"
    Reset-CacheIIS
    Assert-SiteResponde
    Write-Host 'Rollback completado. El despliegue revertido quedo en _old por si hay que volver.' -ForegroundColor Green
    exit 0
}

Assert-PoolDedicado

# ---------- BUILD ----------
if (-not $SkipBuild) {
    Write-Host 'Construyendo con --configuration production...' -ForegroundColor Cyan
    npx ng build --configuration production --output-path $DistDir
    if ($LASTEXITCODE -ne 0) { throw "El build fallo (exit $LASTEXITCODE)" }
}

# Sanidad del build antes de tocar el servidor
foreach ($f in 'index.html', 'web.config') {
    if (-not (Test-Path (Join-Path $DistDir $f))) { throw "Falta $f en $DistDir - build invalido" }
}
$mainLocal = (Get-ChildItem $DistDir -Filter 'main.*.js' | Select-Object -First 1).Name
if (-not $mainLocal) { throw "No hay main.*.js en $DistDir" }
$indexLocal = Get-Content (Join-Path $DistDir 'index.html') -Raw
if ($indexLocal -notmatch [regex]::Escape($mainLocal)) { throw "index.html no referencia $mainLocal - build inconsistente" }
# El build de produccion debe apuntar al API de produccion, no al de prueba
if ($indexLocal -match '7071') { throw 'El index.html referencia el puerto 7071 (prueba) - configuracion equivocada' }
# src/web.config reescribe a /evaluacionempleado-prueba/index.html (ruta del sitio de
# prueba). En produccion eso deja 403 en cualquier ruta profunda (/login tras logout,
# /Home al refrescar). Se corrige en el build antes de subirlo. Detectado 2026-09-07.
$webcfgPath = Join-Path $DistDir 'web.config'
$webcfg = Get-Content $webcfgPath -Raw
$webcfg = $webcfg -replace '/evaluacionempleado-prueba/index.html', "/$SiteName/index.html"
if ($webcfg -notmatch [regex]::Escape("/$SiteName/index.html")) { throw 'web.config no reescribe a /evaluacionempleado/index.html' }
Set-Content -Path $webcfgPath -Value $webcfg -Encoding UTF8
Write-Host "Build OK: $mainLocal (web.config -> /$SiteName/index.html)" -ForegroundColor Green

# ---------- STAGING (lento, sin afectar el sitio vivo) ----------
Write-Host "Copiando a staging $Staging (el sitio vivo NO se toca durante esta fase)..." -ForegroundColor Cyan
robocopy $DistDir $Staging /MIR /R:2 /W:5 /NP /NDL /NFL | Out-Null
if ($LASTEXITCODE -ge 8) { throw "robocopy a staging fallo (exit $LASTEXITCODE)" }
Write-Host "Staging listo (robocopy exit $LASTEXITCODE)" -ForegroundColor Green

# Sanidad del staging: mismo conteo de archivos que el build
$nLocal = (Get-ChildItem $DistDir -Recurse -File | Measure-Object).Count
$nStage = (Get-ChildItem $Staging -Recurse -File | Measure-Object).Count
if ($nLocal -ne $nStage) { throw "Staging incompleto: $nStage archivos vs $nLocal locales" }

# ---------- SWAP (ventana de milisegundos) ----------
Write-Host 'Ejecutando swap...' -ForegroundColor Cyan
# Borrar el backup anterior con reintentos: SMB sobre el enlace lento a veces da
# errores transitorios ("network path not found") a mitad de un borrado recursivo.
# Si aun asi falla, se renombra para no bloquear el despliegue.
if (Test-Path $Backup) {
    $borrado = $false
    foreach ($intento in 1..3) {
        try {
            Remove-Item $Backup -Recurse -Force -Confirm:$false -ErrorAction Stop
            $borrado = $true
            break
        } catch {
            if (-not (Test-Path $Backup)) { $borrado = $true; break }  # el borrado si termino
            Write-Host "Intento $intento de borrar _old fallo: $($_.Exception.Message)" -ForegroundColor Yellow
            Start-Sleep -Seconds 3
        }
    }
    if (-not $borrado) {
        $trash = "$SiteName`_old_descartado_$(Get-Date -Format yyyyMMddHHmmss)"
        Write-Host "No se pudo borrar _old; se renombra a $trash (borrarlo luego a mano)" -ForegroundColor Yellow
        Rename-Item -Path $Backup -NewName $trash
    }
}

Rename-Item -Path $Live -NewName "$SiteName`_old"
try {
    Rename-Item -Path $Staging -NewName $SiteName
} catch {
    # Si el segundo rename falla el sitio quedaria caido: restaurar el anterior YA
    Write-Host 'FALLO el rename de staging - restaurando el sitio anterior...' -ForegroundColor Red
    Rename-Item -Path $Backup -NewName $SiteName
    throw
}
Write-Host 'Swap completado. Reciclando app pool para limpiar el cache de IIS...' -ForegroundColor Cyan
Reset-CacheIIS

# ---------- VERIFICACION ----------
Assert-SiteResponde
$mainRemoto = [regex]::Match((Invoke-WebRequest -Uri "$SiteUrl`index.html" -UseBasicParsing -TimeoutSec 30).Content, 'main\.[a-f0-9]+\.js').Value
if ($mainRemoto -ne $mainLocal) { throw "El sitio sirve $mainRemoto pero el build es $mainLocal" }

Write-Host ''
Write-Host "Despliegue completado: $SiteUrl sirviendo $mainLocal" -ForegroundColor Green
Write-Host "El despliegue anterior quedo en $SiteName`_old - rollback instantaneo con: .\scripts\deploy_produccion_staging.ps1 -Rollback" -ForegroundColor Yellow
exit 0
