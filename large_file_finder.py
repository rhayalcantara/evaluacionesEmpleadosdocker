#!/usr/bin/env python3
"""
Buscador de Archivos Grandes
Escanea un disco o directorio y reporta archivos mayores o iguales a un tamaño específico.
Por defecto busca archivos >= 1GB.
"""

import os
import argparse
from datetime import datetime
from pathlib import Path
from collections import defaultdict

# Carpetas a ignorar (sistema, ocultas, etc.)
SKIP_DIRS = {
    '$RECYCLE.BIN', 'System Volume Information', '$WinREAgent',
    'Windows.old', 'Recovery', '.git', 'node_modules',
    '__pycache__', '.venv', 'venv', 'AppData'  # AppData opcional, quitar si quieres incluirlo
}

def format_size(size_bytes):
    """Convierte bytes a formato legible."""
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if size_bytes < 1024:
            return f"{size_bytes:.2f} {unit}"
        size_bytes /= 1024
    return f"{size_bytes:.2f} PB"

def parse_size(size_str):
    """Convierte string de tamaño a bytes (ej: '1GB', '500MB')."""
    size_str = size_str.upper().strip()
    
    # Ordenados de mayor a menor longitud para evitar que 'B' coincida antes que 'MB', 'GB', etc.
    multipliers = [
        ('TB', 1024 ** 4),
        ('GB', 1024 ** 3),
        ('MB', 1024 ** 2),
        ('KB', 1024),
        ('B', 1),
    ]
    
    for suffix, multiplier in multipliers:
        if size_str.endswith(suffix):
            number = size_str[:-len(suffix)].strip()
            if number:
                return int(float(number) * multiplier)
    
    # Si no tiene sufijo, asumir bytes
    return int(size_str)

def get_file_info(filepath):
    """Obtiene información detallada de un archivo."""
    try:
        stat = os.stat(filepath)
        return {
            'path': filepath,
            'size': stat.st_size,
            'modified': datetime.fromtimestamp(stat.st_mtime),
            'created': datetime.fromtimestamp(stat.st_ctime),
            'extension': Path(filepath).suffix.lower() or '(sin extensión)'
        }
    except (PermissionError, OSError, FileNotFoundError):
        return None

def scan_for_large_files(directory, min_size, include_appdata=False, skip_dirs=None):
    """
    Escanea un directorio buscando archivos grandes.
    
    Args:
        directory: Ruta a escanear
        min_size: Tamaño mínimo en bytes
        include_appdata: Si incluir la carpeta AppData
        skip_dirs: Conjunto de carpetas a ignorar
    
    Returns:
        Lista de diccionarios con información de archivos
    """
    large_files = []
    scanned = 0
    errors = 0
    
    if skip_dirs is None:
        skip_dirs = SKIP_DIRS.copy()
    
    if include_appdata and 'AppData' in skip_dirs:
        skip_dirs.remove('AppData')
    
    print(f"\n{'═' * 60}")
    print(f"🔍 ESCANEANDO: {directory}")
    print(f"   Buscando archivos >= {format_size(min_size)}")
    print(f"{'═' * 60}\n")
    
    for root, dirs, files in os.walk(directory):
        # Filtrar directorios a ignorar
        dirs[:] = [d for d in dirs if d not in skip_dirs and not d.startswith('$')]
        
        for filename in files:
            filepath = os.path.join(root, filename)
            scanned += 1
            
            if scanned % 5000 == 0:
                print(f"   Escaneados: {scanned:,} archivos | Encontrados: {len(large_files)} grandes...", end='\r')
            
            try:
                size = os.path.getsize(filepath)
                
                if size >= min_size:
                    file_info = get_file_info(filepath)
                    if file_info:
                        large_files.append(file_info)
                        print(f"   ✓ Encontrado: {format_size(size):>10} | {filename[:50]}")
                        
            except (PermissionError, OSError, FileNotFoundError):
                errors += 1
                continue
    
    print(f"\n   {'─' * 50}")
    print(f"   Archivos escaneados: {scanned:,}")
    print(f"   Archivos grandes encontrados: {len(large_files)}")
    print(f"   Errores de acceso: {errors}")
    
    return large_files

def group_by_extension(files):
    """Agrupa archivos por extensión."""
    groups = defaultdict(lambda: {'count': 0, 'size': 0, 'files': []})
    
    for f in files:
        ext = f['extension']
        groups[ext]['count'] += 1
        groups[ext]['size'] += f['size']
        groups[ext]['files'].append(f)
    
    return dict(groups)

def generate_report(large_files, output_file=None, top_n=50):
    """Genera un reporte detallado de los archivos grandes."""
    if not large_files:
        print("\n✨ No se encontraron archivos grandes.")
        return
    
    # Ordenar por tamaño (mayor primero)
    large_files.sort(key=lambda x: x['size'], reverse=True)
    
    total_size = sum(f['size'] for f in large_files)
    ext_groups = group_by_extension(large_files)
    
    report = []
    report.append("=" * 70)
    report.append("📊 REPORTE DE ARCHIVOS GRANDES")
    report.append(f"   Generado: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    report.append("=" * 70)
    
    # Resumen general
    report.append(f"\n📈 RESUMEN GENERAL:")
    report.append(f"   • Total de archivos grandes: {len(large_files)}")
    report.append(f"   • Espacio total ocupado: {format_size(total_size)}")
    
    # Resumen por tipo de archivo
    report.append(f"\n📁 RESUMEN POR TIPO DE ARCHIVO:")
    report.append(f"   {'Extensión':<15} {'Cantidad':>10} {'Tamaño Total':>15}")
    report.append(f"   {'-' * 42}")
    
    sorted_ext = sorted(ext_groups.items(), key=lambda x: x[1]['size'], reverse=True)
    for ext, data in sorted_ext[:15]:
        report.append(f"   {ext:<15} {data['count']:>10} {format_size(data['size']):>15}")
    
    # Lista de archivos más grandes
    report.append(f"\n{'─' * 70}")
    report.append(f"📋 TOP {min(top_n, len(large_files))} ARCHIVOS MÁS GRANDES:")
    report.append(f"{'─' * 70}")
    
    for i, f in enumerate(large_files[:top_n], 1):
        report.append(f"\n{i:3}. {format_size(f['size']):>12} | {f['extension']:<10}")
        report.append(f"     📍 {f['path']}")
        report.append(f"     📅 Modificado: {f['modified'].strftime('%Y-%m-%d %H:%M')}")
    
    # Lista completa si hay más archivos
    if len(large_files) > top_n:
        report.append(f"\n{'─' * 70}")
        report.append(f"📋 LISTA COMPLETA ({len(large_files)} archivos):")
        report.append(f"{'─' * 70}")
        report.append(f"\n{'#':>4} {'Tamaño':>12} {'Extensión':<10} Ruta")
        report.append(f"{'-' * 70}")
        
        for i, f in enumerate(large_files, 1):
            report.append(f"{i:4} {format_size(f['size']):>12} {f['extension']:<10} {f['path']}")
    
    # Recomendaciones
    report.append(f"\n{'═' * 70}")
    report.append("💡 RECOMENDACIONES:")
    report.append("═" * 70)
    
    # Detectar tipos comunes de archivos que podrían limpiarse
    recommendations = []
    
    if '.iso' in ext_groups:
        iso_size = ext_groups['.iso']['size']
        recommendations.append(f"   • Imágenes ISO: {format_size(iso_size)} - ¿Ya no necesitas estos instaladores?")
    
    if '.zip' in ext_groups or '.rar' in ext_groups:
        archive_size = ext_groups.get('.zip', {}).get('size', 0) + ext_groups.get('.rar', {}).get('size', 0)
        recommendations.append(f"   • Archivos comprimidos: {format_size(archive_size)} - ¿Ya extrajiste el contenido?")
    
    if '.bak' in ext_groups or '.old' in ext_groups:
        backup_size = ext_groups.get('.bak', {}).get('size', 0) + ext_groups.get('.old', {}).get('size', 0)
        recommendations.append(f"   • Archivos de respaldo: {format_size(backup_size)} - Considera eliminar backups antiguos")
    
    video_exts = ['.mp4', '.mkv', '.avi', '.mov', '.wmv']
    video_size = sum(ext_groups.get(ext, {}).get('size', 0) for ext in video_exts)
    if video_size > 0:
        recommendations.append(f"   • Videos: {format_size(video_size)} - ¿Podrías moverlos a un disco externo?")
    
    if '.vhdx' in ext_groups or '.vhd' in ext_groups:
        vm_size = ext_groups.get('.vhdx', {}).get('size', 0) + ext_groups.get('.vhd', {}).get('size', 0)
        recommendations.append(f"   • Discos virtuales: {format_size(vm_size)} - Revisa VMs que ya no uses")
    
    if recommendations:
        report.extend(recommendations)
    else:
        report.append("   • Revisa los archivos listados y elimina los que ya no necesites")
        report.append("   • Considera mover archivos grandes a un disco externo")
    
    report.append("=" * 70)
    
    report_text = "\n".join(report)
    print(report_text)
    
    # Guardar reporte
    if output_file:
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(report_text)
        print(f"\n💾 Reporte guardado en: {output_file}")
    
    return large_files

def main():
    parser = argparse.ArgumentParser(
        description='🔍 Buscador de Archivos Grandes',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Ejemplos de uso:
  python large_file_finder.py C:\\
  python large_file_finder.py C:\\ --min-size 500MB
  python large_file_finder.py D:\\ --min-size 2GB -o reporte.txt
  python large_file_finder.py C:\\Users --include-appdata
  python large_file_finder.py . --min-size 100MB --top 100
        """
    )
    
    parser.add_argument('directory', help='Directorio o disco a escanear (ej: C:\\)')
    parser.add_argument('--min-size', '-s', default='1GB', 
                        help='Tamaño mínimo (default: 1GB). Ejemplos: 500MB, 2GB, 100MB')
    parser.add_argument('--output', '-o', help='Guardar reporte en archivo')
    parser.add_argument('--top', '-t', type=int, default=50, 
                        help='Cantidad de archivos a mostrar en el top (default: 50)')
    parser.add_argument('--include-appdata', action='store_true',
                        help='Incluir la carpeta AppData en el escaneo')
    
    args = parser.parse_args()
    
    # Validar directorio
    if not os.path.exists(args.directory):
        print(f"❌ Error: '{args.directory}' no existe")
        return 1
    
    # Parsear tamaño mínimo
    try:
        min_size = parse_size(args.min_size)
    except ValueError:
        print(f"❌ Error: Tamaño inválido '{args.min_size}'")
        print("   Usa formatos como: 1GB, 500MB, 2TB")
        return 1
    
    print("\n" + "═" * 60)
    print("🔍 BUSCADOR DE ARCHIVOS GRANDES")
    print("═" * 60)
    
    # Escanear
    large_files = scan_for_large_files(
        args.directory,
        min_size,
        include_appdata=args.include_appdata
    )
    
    # Generar reporte
    generate_report(large_files, args.output, args.top)
    
    return 0

if __name__ == '__main__':
    exit(main())