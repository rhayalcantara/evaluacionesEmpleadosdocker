# ============================================================
# 🚀 REDUCIR PAGEFILE AUTOMÁTICAMENTE
# Para: ralcantara
# Objetivo: Liberar ~15 GB adicionales
# ============================================================
# EJECUTAR COMO ADMINISTRADOR
# ============================================================

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🚀 REDUCIR PAGEFILE Y LIBERAR ESPACIO" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Pagefile actual: 19.72 GB" -ForegroundColor Yellow
Write-Host "  Pagefile recomendado: 4 GB (tienes 16GB RAM)" -ForegroundColor Green
Write-Host "  Espacio a liberar: ~15-16 GB" -ForegroundColor Green
Write-Host ""

# Verificar si es administrador
$isAdmin = [bool]([System.Security.Principal.WindowsIdentity]::GetCurrent().Groups -match "S-1-5-32-544")

if (-not $isAdmin) {
    Write-Host "❌ ERROR: Debes ejecutar este script como Administrador" -ForegroundColor Red
    Write-Host ""
    Write-Host "Pasos:" -ForegroundColor Yellow
    Write-Host "1. Presiona Win + X" -ForegroundColor White
    Write-Host "2. Selecciona 'Terminal de Windows (Administrador)' o 'PowerShell (Administrador)'" -ForegroundColor White
    Write-Host "3. Copia y pega este comando:" -ForegroundColor White
    Write-Host ""
    Write-Host "   Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force; & '$PSScriptRoot\reducir_pagefile.ps1'" -ForegroundColor Cyan
    Write-Host ""
    Read-Host "Presiona Enter para salir"
    exit 1
}

Write-Host "✓ Ejecutando como Administrador" -ForegroundColor Green
Write-Host ""

# ============================================================
# CONFIGURAR PAGEFILE
# ============================================================

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  ⚙️  CONFIGURANDO PAGEFILE..." -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

try {
    # Ruta del Registro para Virtual Memory
    $regPath = "HKLM:\SYSTEM\CurrentControlSet\Control\Session Manager\Memory Management"
    
    Write-Host "  Configurando valores del Registro..." -ForegroundColor White
    
    # Establecer pagefile inicial a 2048 MB (2 GB)
    Set-ItemProperty -Path $regPath -Name "PagingFiles" -Value "C:\pagefile.sys 2048 4096" -ErrorAction Stop
    Write-Host "    ✓ Pagefile configurado: 2GB inicial, 4GB máximo" -ForegroundColor Green
    
    # Asegurar que está configurado correctamente
    $currentValue = Get-ItemProperty -Path $regPath -Name "PagingFiles" -ErrorAction Stop
    Write-Host "    ✓ Valor registrado: $($currentValue.PagingFiles)" -ForegroundColor Green
    
} catch {
    Write-Host "    ✗ Error al configurar pagefile: $($_.Exception.Message)" -ForegroundColor Red
    Read-Host "Presiona Enter para salir"
    exit 1
}

# ============================================================
# HIBERNACIÓN (OPCIONAL)
# ============================================================

Write-Host ""
Write-Host "─────────────────────────────────────────────────────────────" -ForegroundColor Gray
Write-Host ""

$hibConfirm = Read-Host "¿Desactivar hibernación también? (+6 GB) [S/N]"

if ($hibConfirm -eq "S" -or $hibConfirm -eq "s") {
    try {
        Write-Host "  Desactivando hibernación..." -ForegroundColor White
        powercfg /h off
        Write-Host "  ✓ Hibernación desactivada" -ForegroundColor Green
    } catch {
        Write-Host "  ✗ Error al desactivar hibernación: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# ============================================================
# LIMPIAR TEMP (OPCIONAL)
# ============================================================

Write-Host ""
Write-Host "─────────────────────────────────────────────────────────────" -ForegroundColor Gray
Write-Host ""

$tempConfirm = Read-Host "¿Limpiar archivos temporales también? [S/N]"

if ($tempConfirm -eq "S" -or $tempConfirm -eq "s") {
    Write-Host "  Limpiando temporales..." -ForegroundColor White
    
    $tempPaths = @(
        "$env:TEMP",
        "C:\Windows\Temp"
    )
    
    $tempLiberado = 0
    $itemsElimados = 0
    
    foreach ($tempPath in $tempPaths) {
        if (Test-Path $tempPath) {
            $items = Get-ChildItem $tempPath -Recurse -ErrorAction SilentlyContinue | Where-Object { -not $_.PSIsContainer }
            foreach ($item in $items) {
                try {
                    $tempLiberado += $item.Length
                    Remove-Item $item.FullName -Force -ErrorAction SilentlyContinue
                    $itemsElimados++
                } catch { }
            }
        }
    }
    
    $tempMB = [math]::Round($tempLiberado / 1MB, 2)
    Write-Host "  ✓ Temporales limpiados: ~$tempMB MB ($itemsElimados archivos)" -ForegroundColor Green
}

# ============================================================
# RESUMEN FINAL
# ============================================================

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  ✅ CONFIGURACIÓN COMPLETADA" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "  📊 CAMBIOS A APLICAR:" -ForegroundColor Yellow
Write-Host "     • Pagefile: 19.72 GB → 4 GB (libera ~15 GB)" -ForegroundColor White

if ($hibConfirm -eq "S" -or $hibConfirm -eq "s") {
    Write-Host "     • Hibernación: DESACTIVADA (libera ~6 GB)" -ForegroundColor White
}

if ($tempConfirm -eq "S" -or $tempConfirm -eq "s") {
    Write-Host "     • Temporales: LIMPIOS" -ForegroundColor White
}

Write-Host ""
Write-Host "  ⚠️  IMPORTANTE:" -ForegroundColor Yellow
Write-Host "     • Debes REINICIAR el PC para que los cambios se apliquen" -ForegroundColor White
Write-Host "     • Tras reiniciar se liberará el espacio automáticamente" -ForegroundColor White
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$reiniciar = Read-Host "¿Deseas reiniciar ahora? [S/N]"

if ($reiniciar -eq "S" -or $reiniciar -eq "s") {
    Write-Host ""
    Write-Host "  🔄 Reiniciando en 30 segundos..." -ForegroundColor Cyan
    Write-Host "  Presiona Ctrl+C para cancelar" -ForegroundColor Yellow
    Write-Host ""
    Start-Sleep -Seconds 5
    Write-Host "  25 segundos..." -NoNewline
    Start-Sleep -Seconds 5
    Write-Host " 20 segundos..." -NoNewline
    Start-Sleep -Seconds 5
    Write-Host " 15 segundos..." -NoNewline
    Start-Sleep -Seconds 5
    Write-Host " 10 segundos..." -NoNewline
    Start-Sleep -Seconds 5
    Write-Host " 5 segundos..." -NoNewline
    Start-Sleep -Seconds 5
    
    Restart-Computer -Force
} else {
    Write-Host "  Reinicio cancelado." -ForegroundColor Yellow
    Write-Host "  Recuerda reiniciar después para que los cambios se apliquen." -ForegroundColor White
    Write-Host ""
    Read-Host "Presiona Enter para salir"
}