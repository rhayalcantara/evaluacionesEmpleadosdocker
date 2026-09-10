#!/usr/bin/env python3
"""
Lanza un constructor qwen3.8 (agente_core2) DETACHED para una tarea del plan.
CONFIGURACION-TRABAJO.md §3.4: Popen directo con DETACHED_PROCESS | CREATE_NEW_PROCESS_GROUP |
CREATE_NO_WINDOW (nunca `cmd.exe start`, Kaspersky lo mata en silencio).

    python scripts/lanzar_constructor.py <T1|T1-r2|...> <archivo_objetivo_relativo_al_workspace>

El workspace es build/<T sin sufijo de ronda>/ ; el spec es Docs/specs/<T>.md.
Escribe build/<T>/build[_rK].out|.err, metricas[_rK].json y done_qwen2.txt al terminar.
"""
import os, subprocess, sys

RAIZ   = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PY     = r"C:\Users\ralcantara\AppData\Local\Programs\Python\Python311\python.exe"
DRIVER = r"C:\COOPASPIRE\agenteIAlocal\activos-fijos\experimento\build_qwen2.py"

def main():
    tarea, objetivo = sys.argv[1], sys.argv[2]
    base = tarea.split("-r")[0]
    ronda = tarea[len(base):]            # '' o '-r2'
    sufijo = ronda.replace("-", "_")     # '' o '_r2'
    ws = os.path.join(RAIZ, "build", base)
    spec = os.path.join(RAIZ, "Docs", "specs", tarea + ".md")
    met = os.path.join(ws, f"metricas{sufijo}.json")
    os.makedirs(ws, exist_ok=True)
    done = os.path.join(ws, "done_qwen2.txt")
    if os.path.exists(done):
        os.remove(done)
    out = open(os.path.join(ws, f"build{sufijo}.out"), "w", encoding="utf-8")
    err = open(os.path.join(ws, f"build{sufijo}.err"), "w", encoding="utf-8")
    env = dict(os.environ)
    env["PATH"] = r"C:\nvm4w\nodejs;" + env.get("PATH", "")   # npx tsc dentro del workspace
    env["PYTHONIOENCODING"] = "utf-8"
    flags = (subprocess.DETACHED_PROCESS | subprocess.CREATE_NEW_PROCESS_GROUP
             | getattr(subprocess, "CREATE_NO_WINDOW", 0))
    p = subprocess.Popen([PY, DRIVER, spec, ws, objetivo, met], cwd=ws, env=env,
                         stdout=out, stderr=err, stdin=subprocess.DEVNULL, creationflags=flags)
    print(f"{tarea} lanzado: pid={p.pid} ws={ws} objetivo={objetivo}")

if __name__ == "__main__":
    main()
