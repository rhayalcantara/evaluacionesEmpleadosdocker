"""
Orquestador: genera los 6 videos de evidencia de las correcciones de Lissette Abad.

Uso:
  cd demo-videos
  set EVAL_USERNAME=TU_USUARIO
  set EVAL_PASSWORD=TU_CLAVE
  set EVAL_USERNAME_SUPER=USUARIO_SUPERVISOR   (para video 5)
  set EVAL_PASSWORD_SUPER=CLAVE_SUPERVISOR     (para video 5)
  python run_correcciones.py

Los mp4 se generan en el directorio actual (demo-videos/).
"""
import importlib, os, sys, time
from pathlib import Path

SCRIPTS = [
    ("c1_objetivos_agrupados",      "Corrección 1 — Tabla de objetivos agrupada"),
    ("c2_instruccion_competencias", "Corrección 2 — Instrucción en competencias"),
    ("c3_descripcion_competencia",  "Corrección 3 — Descripción al pinchar competencia"),
    ("c4_instrucciones_ssc",        "Corrección 4 — Instrucciones Retroalimentación SSC"),
    ("c5_compromisos_supervisor",   "Corrección 5 — Compromisos e instrucción supervisor"),
    ("c6_elementos_eliminados",     "Corrección 6 — Elementos eliminados"),
]

if not (os.environ.get("EVAL_USERNAME") and os.environ.get("EVAL_PASSWORD")):
    print("ERROR: Set EVAL_USERNAME and EVAL_PASSWORD environment variables before running.")
    sys.exit(1)

# Ensure we can import sibling modules
sys.path.insert(0, str(Path(__file__).parent))

results = []
total_start = time.time()

for module_name, label in SCRIPTS:
    print(f"\n{'='*60}")
    print(f"  {label}")
    print(f"{'='*60}")
    start = time.time()
    try:
        mod = importlib.import_module(module_name)
        mod.run()
        elapsed = time.time() - start
        results.append((label, "OK", f"{elapsed:.0f}s"))
        print(f"  ✓ Completado en {elapsed:.0f}s")
    except Exception as e:
        elapsed = time.time() - start
        results.append((label, "ERROR", str(e)))
        print(f"  ✗ Error: {e}")

total = time.time() - total_start
print(f"\n{'='*60}")
print(f"  RESUMEN  ({total:.0f}s total)")
print(f"{'='*60}")
for label, status, detail in results:
    icon = "✓" if status == "OK" else "✗"
    print(f"  {icon}  {label}  —  {detail}")

mp4s = sorted(Path(".").glob("correccion_*.mp4"))
if mp4s:
    print(f"\nVideos generados ({len(mp4s)}):")
    for f in mp4s:
        size_mb = f.stat().st_size / 1_048_576
        print(f"  {f.name}  ({size_mb:.1f} MB)")
