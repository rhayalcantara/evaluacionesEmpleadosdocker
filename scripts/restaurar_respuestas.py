#!/usr/bin/env python3
"""
Restaura goalEmpleadoRespuestas desde backup JSON.

El script corregir_evaluaciones.py hizo PUT sin incluir goalEmpleadoRespuestas,
lo que causó que el backend (EF Core) borrara todas las respuestas de competencias.

Este script lee el backup y las restaura via PUT completo.

Uso:
    # Ver cuántos se restaurarían (sin cambiar nada)
    python restaurar_respuestas.py --dry-run

    # Aplicar restauración
    python restaurar_respuestas.py

    # Usar backup específico
    python restaurar_respuestas.py --backup backup_evaluaciones_p7_20260420_092713.json
"""

import argparse
import json
import sys
import os
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

API_URL    = "http://192.168.7.222:7070"
PERIODO_ID = 7

# Campos que NO se envían en el PUT (navigation que el backend maneja por separado)
EXCLUIR_PUT = {"empleado", "evaluacionGoals"}


def crear_session() -> requests.Session:
    s = requests.Session()
    retry = Retry(total=3, backoff_factor=1,
                  status_forcelist=[429, 500, 502, 503, 504],
                  allowed_methods=["GET", "PUT"])
    adapter = HTTPAdapter(max_retries=retry)
    s.mount("http://", adapter)
    s.mount("https://", adapter)
    return s


def get_json(session, path):
    r = session.get(f"{API_URL}{path}", timeout=30)
    if r.status_code == 404:
        return None
    r.raise_for_status()
    return r.json()


# Solo campos escalares permitidos en goalEmpleadoRespuesta (sin navigation objects)
_GOAL_RESPUESTA_CAMPOS = {"id", "evaluacionId", "goalId", "repuesta", "repuestasupervisor", "weight", "observacion", "observacionsupervisor"}

def limpiar_goal_respuestas(goals: list) -> list:
    """Elimina navigation objects anidados que causan HTTP 500 en EF Core."""
    return [{k: v for k, v in g.items() if k in _GOAL_RESPUESTA_CAMPOS} for g in (goals or [])]


def construir_payload(det: dict) -> dict:
    """
    Construye el payload para PUT a partir del detalle del backup.
    Incluye goalEmpleadoRespuestas, evaluacionDesempenoMetas y evaluacionCursoCapacitacions.
    Limpia navigation objects anidados para evitar HTTP 500 en EF Core.
    """
    payload = {k: v for k, v in det.items() if k not in EXCLUIR_PUT}
    # Limpiar navigation objects anidados en cada respuesta de competencia
    payload["goalEmpleadoRespuestas"] = limpiar_goal_respuestas(payload.get("goalEmpleadoRespuestas"))
    # Asegurar que las colecciones críticas estén presentes (aunque vacías)
    for col in ("evaluacionDesempenoMetas", "evaluacionCursoCapacitacions"):
        if col not in payload:
            payload[col] = []
    return payload


def restaurar_evaluacion(session, ev_id: int, payload: dict):
    """PUT con el payload completo. Retorna (ok, mensaje)."""
    url = f"{API_URL}/api/Evaluacions/{ev_id}"
    try:
        r = session.put(url, json=payload, timeout=30)
        if r.status_code in (200, 204):
            return True, f"HTTP {r.status_code}"
        return False, f"HTTP {r.status_code}: {r.text[:200]}"
    except Exception as e:
        return False, str(e)


def main():
    global API_URL

    parser = argparse.ArgumentParser(
        description="Restaura goalEmpleadoRespuestas desde backup JSON",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )
    parser.add_argument("--backup", default=None,
                        help="Ruta al archivo de backup JSON (default: el más reciente en .)")
    parser.add_argument("--dry-run", action="store_true",
                        help="Mostrar qué se restauraría sin hacer cambios")
    parser.add_argument("--todos", action="store_true",
                        help="Restaurar todos (no solo los dañados), forzando PUT en todos")
    parser.add_argument("--api-url", default=API_URL)
    parser.add_argument("--workers", type=int, default=5)
    args = parser.parse_args()

    API_URL = args.api_url.rstrip("/")

    # Encontrar backup
    backup_path = args.backup
    if not backup_path:
        # Buscar el más reciente en el directorio actual
        archivos = sorted(
            [f for f in os.listdir(".") if f.startswith(f"backup_evaluaciones_p{PERIODO_ID}_") and f.endswith(".json")],
            reverse=True
        )
        if not archivos:
            print(f"[ERROR] No se encontró ningún backup backup_evaluaciones_p{PERIODO_ID}_*.json en el directorio actual.")
            sys.exit(1)
        backup_path = archivos[0]

    print(f"\n{'='*65}")
    print(f"  RESTAURACION DE RESPUESTAS DESDE BACKUP")
    print(f"  Backup : {backup_path}")
    print(f"  API    : {API_URL}")
    print(f"  Modo   : {'DRY-RUN' if args.dry_run else 'APLICAR'}")
    print(f"{'='*65}\n")

    # Cargar backup
    print(f"[1/3] Leyendo backup...")
    with open(backup_path, encoding="utf-8") as f:
        data = json.load(f)

    evaluaciones_backup = data.get("evaluaciones", [])
    print(f"  Total en backup: {len(evaluaciones_backup)}")

    # Filtrar las que tienen goalEmpleadoRespuestas en el detalle
    candidatas = []
    for item in evaluaciones_backup:
        det = item.get("detalle") or {}
        lst = item.get("listado") or {}
        goals = det.get("goalEmpleadoRespuestas") or []
        if not goals:
            continue
        ev_id = lst.get("id") or det.get("id")
        if not ev_id:
            continue
        nombre = lst.get("colaborador") or det.get("colaborador") or f"Sec {det.get('empleadoSecuencial','?')}"
        candidatas.append({
            "id": ev_id,
            "nombre": nombre,
            "n_respuestas": len(goals),
            "payload": construir_payload(det),
        })

    print(f"  Con goalEmpleadoRespuestas: {len(candidatas)}")

    # Verificar cuáles están realmente dañadas (0 respuestas actualmente)
    print(f"\n[2/3] Verificando estado actual en API ({len(candidatas)} evaluaciones)...")
    session = crear_session()

    a_restaurar = []
    ya_ok       = 0
    errores_get = 0

    def verificar(c):
        ev_id = c["id"]
        obj = get_json(session, f"/api/Evaluacions/{ev_id}")
        if obj is None:
            return "404"
        current_goals = obj.get("goalEmpleadoRespuestas") or []
        if len(current_goals) == 0:
            return "dañada"
        return "ok"

    completadas = 0
    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        futures = {pool.submit(verificar, c): c for c in candidatas}
        for future in as_completed(futures):
            completadas += 1
            print(f"  [{completadas:>3}/{len(candidatas)}]", end="\r", flush=True)
            c = futures[future]
            resultado = future.result()
            if resultado == "dañada":
                a_restaurar.append(c)
            elif resultado == "ok":
                ya_ok += 1
            else:
                errores_get += 1

    if args.todos:
        a_restaurar = candidatas
        print(f"\n  Modo --todos: se restaurarán las {len(a_restaurar)} evaluaciones del backup.")
    else:
        print(f"\n  Estado actual:")
        print(f"    Dañadas (0 respuestas): {len(a_restaurar)}")
        print(f"    Ya correctas          : {ya_ok}")
        print(f"    No encontradas (404)  : {errores_get}")

    if not a_restaurar:
        print("\n  No hay nada que restaurar.")
        sys.exit(0)

    if args.dry_run:
        print(f"\n  [DRY-RUN] Se restaurarían {len(a_restaurar)} evaluaciones:")
        for c in a_restaurar[:10]:
            print(f"    ID {c['id']:>6}  {c['nombre'][:45]}  ({c['n_respuestas']} respuestas)")
        if len(a_restaurar) > 10:
            print(f"    ... y {len(a_restaurar) - 10} más")
        sys.exit(0)

    # Aplicar restauración
    print(f"\n[3/3] Restaurando {len(a_restaurar)} evaluaciones...")
    ok_count  = 0
    err_count = 0
    errores   = []

    for i, c in enumerate(a_restaurar, 1):
        ok, msg = restaurar_evaluacion(session, c["id"], c["payload"])
        if ok:
            ok_count += 1
            print(f"  [{i:>3}/{len(a_restaurar)}] {c['nombre'][:45]:<45}  [OK] ({c['n_respuestas']} respuestas)")
        else:
            err_count += 1
            errores.append((c["id"], c["nombre"], msg))
            print(f"  [{i:>3}/{len(a_restaurar)}] {c['nombre'][:45]:<45}  [ERROR] {msg}")

    print(f"\n{'='*65}")
    print(f"  RESUMEN")
    print(f"{'='*65}")
    print(f"  Restauradas correctamente : {ok_count}")
    print(f"  Errores                   : {err_count}")

    if errores:
        print(f"\n  Errores detalle:")
        for ev_id, nombre, msg in errores:
            print(f"    ID={ev_id}  {nombre[:40]}: {msg}")

    print(f"{'='*65}\n")
    sys.exit(1 if err_count > 0 else 0)


if __name__ == "__main__":
    main()
