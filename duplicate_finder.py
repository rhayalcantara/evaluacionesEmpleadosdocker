#!/usr/bin/env python3
"""
Buscador de Archivos Duplicados
Encuentra archivos duplicados comparando su contenido mediante hash SHA-256.
Optimizado para rendimiento: agrupa por tamaño antes de calcular hashes.
"""

import os
import hashlib
import argparse
from collections import defaultdict
from pathlib import Path
from datetime import datetime

def get_file_hash(filepath, chunk_size=8192):
    """Calcula el hash SHA-256 de un archivo leyendo en chunks."""
    hasher = hashlib.sha256()
    try:
        with open(filepath, 'rb') as f:
            while chunk := f.read(chunk_size):
                hasher.update(chunk)
        return hasher.hexdigest()
    except (PermissionError, OSError) as e:
        print(f"  ⚠ No se pudo leer: {filepath} ({e})")
        return None

def format_size(size_bytes):
    """Convierte bytes a formato legible (KB, MB, GB)."""
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if size_bytes < 1024:
            return f"{size_bytes:.2f} {unit}"
        size_bytes /= 1024
    return f"{size_bytes:.2f} PB"

def scan_directory(directory, extensions=None, min_size=0, max_size=None):
    """
    Escanea un directorio y agrupa archivos por tamaño.
    
    Args:
        directory: Ruta del directorio a escanear
        extensions: Lista de extensiones a incluir (ej: ['.jpg', '.png'])
        min_size: Tamaño mínimo en bytes
        max_size: Tamaño máximo en bytes
    
    Returns:
        Diccionario {tamaño: [lista de rutas]}
    """
    size_groups = defaultdict(list)
    file_count = 0
    skipped = 0
    
    print(f"\n📁 Escaneando: {directory}")
    print("   Esto puede tomar unos minutos en directorios grandes...\n")
    
    for root, dirs, files in os.walk(directory):
        # Ignorar directorios del sistema y ocultos
        dirs[:] = [d for d in dirs if not d.startswith('.') and d not in 
                   ['node_modules', '__pycache__', '.git', 'venv', '.venv', '$RECYCLE.BIN', 'System Volume Information']]
        
        for filename in files:
            filepath = os.path.join(root, filename)
            
            try:
                stat = os.stat(filepath)
                size = stat.st_size
                
                # Filtrar por tamaño
                if size < min_size:
                    skipped += 1
                    continue
                if max_size and size > max_size:
                    skipped += 1
                    continue
                
                # Filtrar por extensión
                if extensions:
                    ext = Path(filepath).suffix.lower()
                    if ext not in extensions:
                        skipped += 1
                        continue
                
                size_groups[size].append(filepath)
                file_count += 1
                
                if file_count % 1000 == 0:
                    print(f"   Archivos escaneados: {file_count}...", end='\r')
                    
            except (PermissionError, OSError, FileNotFoundError):
                skipped += 1
                continue
    
    print(f"   ✓ Archivos escaneados: {file_count}")
    print(f"   ✓ Archivos omitidos: {skipped}")
    
    return size_groups

def find_duplicates(size_groups):
    """
    Encuentra duplicados calculando hashes solo de archivos con mismo tamaño.
    
    Args:
        size_groups: Diccionario {tamaño: [lista de rutas]}
    
    Returns:
        Lista de grupos de duplicados [(hash, tamaño, [rutas]), ...]
    """
    duplicates = []
    potential_duplicates = {size: paths for size, paths in size_groups.items() if len(paths) > 1}
    
    total_to_check = sum(len(paths) for paths in potential_duplicates.values())
    print(f"\n🔍 Verificando {total_to_check} archivos con tamaños coincidentes...")
    
    checked = 0
    for size, paths in potential_duplicates.items():
        hash_groups = defaultdict(list)
        
        for filepath in paths:
            file_hash = get_file_hash(filepath)
            if file_hash:
                hash_groups[file_hash].append(filepath)
            checked += 1
            
            if checked % 100 == 0:
                print(f"   Verificados: {checked}/{total_to_check}...", end='\r')
        
        # Guardar solo los grupos con duplicados
        for file_hash, file_paths in hash_groups.items():
            if len(file_paths) > 1:
                duplicates.append((file_hash, size, file_paths))
    
    print(f"   ✓ Verificación completada: {checked} archivos")
    
    return duplicates

def generate_report(duplicates, output_file=None):
    """Genera un reporte de los duplicados encontrados."""
    if not duplicates:
        print("\n✨ ¡No se encontraron archivos duplicados!")
        return
    
    # Ordenar por tamaño (mayor primero)
    duplicates.sort(key=lambda x: x[1], reverse=True)
    
    total_groups = len(duplicates)
    total_duplicates = sum(len(paths) - 1 for _, _, paths in duplicates)
    wasted_space = sum(size * (len(paths) - 1) for _, size, paths in duplicates)
    
    report_lines = []
    report_lines.append("=" * 70)
    report_lines.append("📊 REPORTE DE ARCHIVOS DUPLICADOS")
    report_lines.append(f"   Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    report_lines.append("=" * 70)
    report_lines.append(f"\n📈 RESUMEN:")
    report_lines.append(f"   • Grupos de duplicados: {total_groups}")
    report_lines.append(f"   • Total de archivos duplicados: {total_duplicates}")
    report_lines.append(f"   • Espacio desperdiciado: {format_size(wasted_space)}")
    report_lines.append("\n" + "-" * 70)
    report_lines.append("📁 DETALLE DE DUPLICADOS:")
    report_lines.append("-" * 70)
    
    for i, (file_hash, size, paths) in enumerate(duplicates, 1):
        report_lines.append(f"\n🔹 Grupo {i} | Tamaño: {format_size(size)} | Hash: {file_hash[:16]}...")
        for j, path in enumerate(paths):
            marker = "  [ORIGINAL]" if j == 0 else "  [DUPLICADO]"
            report_lines.append(f"   {marker} {path}")
    
    report_lines.append("\n" + "=" * 70)
    report_lines.append("💡 CONSEJO: Revisa cuidadosamente antes de eliminar archivos.")
    report_lines.append("=" * 70)
    
    report_text = "\n".join(report_lines)
    print(report_text)
    
    # Guardar reporte si se especifica archivo
    if output_file:
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(report_text)
        print(f"\n💾 Reporte guardado en: {output_file}")
    
    return duplicates

def interactive_delete(duplicates):
    """Modo interactivo para eliminar duplicados."""
    if not duplicates:
        return
    
    print("\n" + "=" * 70)
    print("🗑️  MODO DE ELIMINACIÓN INTERACTIVA")
    print("=" * 70)
    print("Opciones: [s]í eliminar | [n]o saltar | [t]odos del grupo | [q]salir\n")
    
    deleted_count = 0
    freed_space = 0
    
    for i, (file_hash, size, paths) in enumerate(duplicates, 1):
        print(f"\n━━━ Grupo {i}/{len(duplicates)} | {format_size(size)} ━━━")
        print(f"Original (se conservará): {paths[0]}")
        
        for dup_path in paths[1:]:
            print(f"\n  Duplicado: {dup_path}")
            
            while True:
                choice = input("  ¿Eliminar? [s/n/t/q]: ").lower().strip()
                
                if choice == 'q':
                    print(f"\n✓ Eliminados: {deleted_count} archivos")
                    print(f"✓ Espacio liberado: {format_size(freed_space)}")
                    return
                elif choice == 's':
                    try:
                        os.remove(dup_path)
                        print(f"  ✓ Eliminado")
                        deleted_count += 1
                        freed_space += size
                    except Exception as e:
                        print(f"  ✗ Error: {e}")
                    break
                elif choice == 'n':
                    print(f"  → Saltado")
                    break
                elif choice == 't':
                    # Eliminar todos los duplicados de este grupo
                    for remaining in paths[1:]:
                        if remaining == dup_path or os.path.exists(remaining):
                            try:
                                os.remove(remaining)
                                print(f"  ✓ Eliminado: {remaining}")
                                deleted_count += 1
                                freed_space += size
                            except Exception as e:
                                print(f"  ✗ Error en {remaining}: {e}")
                    break
                else:
                    print("  Opción no válida. Usa: s, n, t, o q")
    
    print(f"\n{'=' * 70}")
    print(f"✓ Proceso completado")
    print(f"✓ Archivos eliminados: {deleted_count}")
    print(f"✓ Espacio liberado: {format_size(freed_space)}")
    print("=" * 70)

def main():
    parser = argparse.ArgumentParser(
        description='🔍 Buscador de Archivos Duplicados',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Ejemplos de uso:
  python duplicate_finder.py C:\\Users\\Usuario\\Downloads
  python duplicate_finder.py D:\\Fotos --ext .jpg .png .jpeg
  python duplicate_finder.py . --min-size 1048576 --delete
  python duplicate_finder.py /home/user --output reporte.txt
        """
    )
    
    parser.add_argument('directory', help='Directorio a escanear')
    parser.add_argument('--ext', nargs='+', help='Filtrar por extensiones (ej: --ext .jpg .png)')
    parser.add_argument('--min-size', type=int, default=1, help='Tamaño mínimo en bytes (default: 1)')
    parser.add_argument('--max-size', type=int, help='Tamaño máximo en bytes')
    parser.add_argument('--output', '-o', help='Guardar reporte en archivo')
    parser.add_argument('--delete', '-d', action='store_true', help='Modo interactivo de eliminación')
    
    args = parser.parse_args()
    
    # Validar directorio
    if not os.path.isdir(args.directory):
        print(f"❌ Error: '{args.directory}' no es un directorio válido")
        return 1
    
    # Normalizar extensiones
    extensions = None
    if args.ext:
        extensions = [ext if ext.startswith('.') else f'.{ext}' for ext in args.ext]
        extensions = [ext.lower() for ext in extensions]
    
    print("\n" + "=" * 70)
    print("🔍 BUSCADOR DE ARCHIVOS DUPLICADOS")
    print("=" * 70)
    
    # Ejecutar búsqueda
    size_groups = scan_directory(
        args.directory,
        extensions=extensions,
        min_size=args.min_size,
        max_size=args.max_size
    )
    
    duplicates = find_duplicates(size_groups)
    generate_report(duplicates, args.output)
    
    # Modo de eliminación
    if args.delete and duplicates:
        confirm = input("\n¿Iniciar modo de eliminación interactiva? [s/N]: ").lower().strip()
        if confirm == 's':
            interactive_delete(duplicates)
    
    return 0

if __name__ == '__main__':
    exit(main())