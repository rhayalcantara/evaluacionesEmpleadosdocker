#!/usr/bin/env python3
"""
Corrección masiva de totales de evaluaciones por periodo.

Flujo:
  1. Backup JSON de la tabla Evaluacion del periodo (antes de cambiar nada).
  2. Ejecuta la misma lógica de auditoría que audit_periodo.py.
  3. Para cada evaluación con divergencia > tolerancia, hace PUT con los
     valores recalculados (totalCalculo, totalcolaborador, totalsupervisor,
     puntuacioncompetenciacolaborador, puntuacioncompetenciasupervisor).

Uso:
    # Simular sin cambiar nada (recomendado primero)
    python corregir_evaluaciones.py --periodo-id 7 --dry-run

    # Aplicar correcciones (pide confirmación)
    python corregir_evaluaciones.py --periodo-id 7

    # Sin confirmación interactiva (para scripts CI)
    python corregir_evaluaciones.py --periodo-id 7 --si

    # Solo corregir evaluaciones con diferencia mayor a 1 punto
    python corregir_evaluaciones.py --periodo-id 7 --tolerancia 1.0
"""

import argparse
import json
import sys
import os
from datetime import datetime
from typing import List, Dict, Tuple, Optional
from concurrent.futures import ThreadPoolExecutor, as_completed
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# Reutiliza la lógica de auditoría
from audit_periodo import (
    API_URL as _DEFAULT_API_URL,
    TOLERANCE_DEFAULT,
    crear_session,
    get_json,
    cargar_datos_base,
    cargar_evaluaciones_periodo,
    recalcular_evaluacion,
    diferencias,
)

API_URL = _DEFAULT_API_URL


# ──────────────────────────────────────────────────────────────────────────────
# BACKUP
# ──────────────────────────────────────────────────────────────────────────────

def hacer_backup(session: requests.Session, periodo_id: int, directorio: str = ".") -> str:
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    archivo = os.path.join(directorio, f"backup_evaluaciones_p{periodo_id}_{ts}.json")

    print(f"  Descargando lista completa del periodo {periodo_id}...", end=" ", flush=True)
    raw = get_json(session, "/api/Evaluacions")
    todas = raw.get("data", raw) if isinstance(raw, dict) else (raw or [])
    del_periodo = [e for e in todas if e.get("periodId") == periodo_id]
    print(f"{len(del_periodo)} evaluaciones encontradas")

    print(f"  Descargando detalle de cada evaluacion ({len(del_periodo)} requests, 10 en paralelo)...")

    detalles = []
    completadas = 0

    def fetch_detalle(ev):
        sec = ev.get("empleadoSecuencial")
        det = get_json(session, f"/api/Evaluacions/evaluacion?empleadoid={sec}&periodoid={periodo_id}")
        return {"listado": ev, "detalle": det}

    with ThreadPoolExecutor(max_workers=10) as pool:
        futures = {pool.submit(fetch_detalle, ev): ev for ev in del_periodo}
        for future in as_completed(futures):
            completadas += 1
            print(f"    [{completadas:>3}/{len(del_periodo)}]", end="\r", flush=True)
            detalles.append(future.result())

    backup_data = {
        "timestamp":  ts,
        "periodo_id": periodo_id,
        "api_url":    API_URL,
        "total":      len(del_periodo),
        "evaluaciones": detalles,
    }

    with open(archivo, "w", encoding="utf-8") as f:
        json.dump(backup_data, f, ensure_ascii=False, indent=2, default=str)

    tam_kb = os.path.getsize(archivo) / 1024
    print(f"\n  Backup guardado: {archivo}  ({tam_kb:.0f} KB)")
    return archivo


# ──────────────────────────────────────────────────────────────────────────────
# PUT - actualizar totales
# ──────────────────────────────────────────────────────────────────────────────

# Solo excluir campos de solo-lectura. Las colecciones de datos DEBEN incluirse
# en el PUT para que EF Core no las borre como efecto secundario.
_CAMPOS_EXCLUIR_PUT = {
    "evaluacionGoals",  # navigation de solo lectura
    "empleado",         # navigation de solo lectura
}

# Campos escalares permitidos en goalEmpleadoRespuesta (sin navigation objects)
_GOAL_RESPUESTA_CAMPOS = {
    "id", "evaluacionId", "goalId", "repuesta", "repuestasupervisor",
    "weight", "observacion", "observacionsupervisor",
}

# Campos permitidos en evaluacionDesempenoMeta (escalares + respuesta anidada, sin navigation a evaluacion)
_DESEMPENO_META_CAMPOS = {
    "id", "evaluacionId", "tipo", "descripcion", "meta", "peso", "inverso", "perspectiva",
    "evaluacioneDesempenoMetaRespuestas",  # objeto de respuesta (logro, supervisado_logro, etc.)
}


def _limpiar_colecciones(obj: Dict) -> None:
    """
    Elimina navigation objects anidados de las colecciones para que EF Core
    no intente rastrear ni modificar entidades hijas.
    Solo se tocan los registros existentes — no se agregan ni eliminan filas.
    """
    obj["goalEmpleadoRespuestas"] = [
        {k: v for k, v in item.items() if k in _GOAL_RESPUESTA_CAMPOS}
        for item in (obj.get("goalEmpleadoRespuestas") or [])
    ]
    obj["evaluacionDesempenoMetas"] = [
        {k: v for k, v in item.items() if k in _DESEMPENO_META_CAMPOS}
        for item in (obj.get("evaluacionDesempenoMetas") or [])
    ]
    if "evaluacionCursoCapacitacions" not in obj or obj["evaluacionCursoCapacitacions"] is None:
        obj["evaluacionCursoCapacitacions"] = []


def actualizar_evaluacion(
    session: requests.Session,
    ev_id: int,
    calc: Dict,
    secuencial: int,
    periodo_id: int,
) -> Tuple[bool, str]:
    """
    GET completo via endpoint detalle (incluye goalEmpleadoRespuestas),
    actualiza SOLO los campos de puntuación y hace PUT conservando todas las
    colecciones intactas para que EF Core no las borre ni las modifique.
    """
    # 1. GET completo via endpoint detalle (devuelve goalEmpleadoRespuestas)
    obj = get_json(session, f"/api/Evaluacions/evaluacion?empleadoid={secuencial}&periodoid={periodo_id}")
    if not obj:
        obj = get_json(session, f"/api/Evaluacions/{ev_id}")
    if not obj:
        return False, f"GET evaluacion sec={secuencial} retorno 404"

    # 2. Actualizar SOLO los campos de puntuación — nada más
    obj["totalCalculo"]                     = round(calc["calc_totalCalculo"],      4)
    obj["totalcolaborador"]                 = round(calc["calc_totalcolab"],        4)
    obj["totalsupervisor"]                  = round(calc["calc_totalsup"],          4)
    obj["puntuacioncompetenciacolaborador"] = round(calc["calc_puntColab"],         4)
    obj["puntuacioncompetenciasupervisor"]  = round(calc["calc_puntSup"],           4)
    obj["puntuaciondesempenocolaborador"]   = round(calc["calc_promedioDesempeno"], 4)
    obj["puntuaciondesempenosupervidor"]    = round(calc["calc_promedioDesempeno"], 4)

    # 3. Limpiar navigation objects de colecciones (sin alterar los datos)
    _limpiar_colecciones(obj)

    # 4. Excluir campos de solo-lectura
    payload = {k: v for k, v in obj.items() if k not in _CAMPOS_EXCLUIR_PUT}

    # 5. PUT
    url = f"{API_URL}/api/Evaluacions/{ev_id}"
    try:
        resp = session.put(url, json=payload, timeout=30)
        if resp.status_code in (200, 204):
            return True, f"OK (HTTP {resp.status_code})"
        else:
            return False, f"HTTP {resp.status_code}: {resp.text}"
    except Exception as exc:
        return False, str(exc)


# ──────────────────────────────────────────────────────────────────────────────
# MAIN
# ──────────────────────────────────────────────────────────────────────────────

def main():
    global API_URL
    parser = argparse.ArgumentParser(
        description="Backup + corrección masiva de totales de evaluaciones",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument("--periodo-id", type=int, required=True,
                        help="ID del periodo a corregir")
    parser.add_argument("--tolerancia", type=float, default=TOLERANCE_DEFAULT,
                        help=f"Diferencia minima para corregir (default: {TOLERANCE_DEFAULT})")
    parser.add_argument("--dry-run", action="store_true",
                        help="Mostrar que se correria sin hacer cambios")
    parser.add_argument("--si", action="store_true",
                        help="No pedir confirmacion interactiva")
    parser.add_argument("--api-url", default=API_URL,
                        help=f"URL base del API (default: {API_URL})")
    parser.add_argument("--backup-dir", default=".",
                        help="Directorio donde guardar el backup JSON (default: .)")
    parser.add_argument("--solo-id", type=int, default=None,
                        help="Corregir solo la evaluacion con este ID (para pruebas)")
    args = parser.parse_args()
    API_URL = args.api_url.rstrip("/")

    import audit_periodo
    audit_periodo.API_URL = API_URL

    modo = "DRY-RUN" if args.dry_run else "APLICAR"
    print(f"\n{'='*65}")
    print(f"  CORRECCION DE EVALUACIONES - Periodo {args.periodo_id}  [{modo}]")
    print(f"  API: {API_URL}  |  Tolerancia: +/-{args.tolerancia}")
    print(f"{'='*65}\n")

    session = crear_session()

    # ── 1. BACKUP ─────────────────────────────────────────────────────────────
    print("[1/4] Realizando backup de la tabla Evaluacion...")
    archivo_backup = hacer_backup(session, args.periodo_id, args.backup_dir)

    # ── 2. Cargar datos de referencia ─────────────────────────────────────────
    print("\n[2/4] Cargando tablas de referencia...")
    valores, pdc_periodo, periodo_desc = cargar_datos_base(session, args.periodo_id)

    if not pdc_periodo:
        print(f"\n[AVISO] No hay PDC para el periodo {args.periodo_id}.")

    # ── 3. Auditar ────────────────────────────────────────────────────────────
    print(f"\n[3/4] Auditando evaluaciones del periodo '{periodo_desc}'...")
    evaluaciones, total_bd = cargar_evaluaciones_periodo(session, args.periodo_id)

    if not evaluaciones:
        print("No hay evaluaciones para procesar.")
        sys.exit(0)

    resultados: List[Tuple[Dict, Dict, str]] = []
    for ev in evaluaciones:
        nombre = ev.get("_colaborador", f"Empleado {ev.get('empleadoSecuencial','?')}")
        calc   = recalcular_evaluacion(ev, pdc_periodo, valores)
        divs   = diferencias(calc, args.tolerancia)
        if divs and not calc.get("_es_duplicada_sin_datos"):
            resultados.append((ev, calc, nombre, divs))

    if args.solo_id:
        resultados = [r for r in resultados if r[0].get("id") == args.solo_id]

    ancho = 65
    print(f"\n  Total auditadas  : {len(evaluaciones)}")
    print(f"  Con divergencias : {len(resultados)}")

    if not resultados:
        print("\n  Todas las evaluaciones estan correctas. No hay nada que corregir.")
        sys.exit(0)

    print(f"\n  {'#':>3}  {'Colaborador':<38} {'BD':>7} {'Calc':>7} {'Dif':>8}  ID")
    print(f"  {'---'}  {'-'*38} {'-'*7} {'-'*7} {'-'*8}  {'-'*6}")
    for i, (ev, calc, nombre, divs) in enumerate(resultados, 1):
        bd    = calc["stored_totalCalculo"]
        cal   = calc["calc_totalCalculo"]
        dif   = cal - bd
        ev_id = ev.get("id", "?")
        print(f"  {i:>3}  {nombre[:38]:<38} {bd:>7.2f} {cal:>7.2f} {dif:>+8.4f}  {ev_id}")

    print(f"\n  Total a corregir: {len(resultados)} evaluaciones")

    if args.dry_run:
        print("\n  [DRY-RUN] No se realizaron cambios.")
        print(f"  Backup disponible en: {archivo_backup}")
        sys.exit(0)

    # ── 4. Confirmacion ───────────────────────────────────────────────────────
    if not args.si:
        print(f"\n  ADVERTENCIA: Esto modificara {len(resultados)} registros en la BD.")
        print(f"  Backup guardado en: {archivo_backup}")
        resp = input("  Desea continuar? (si/no): ").strip().lower()
        if resp not in ("si", "s", "yes", "y"):
            print("  Cancelado.")
            sys.exit(0)

    # ── 4. APLICAR CORRECCIONES ───────────────────────────────────────────────
    print(f"\n[4/4] Aplicando correcciones ({len(resultados)} evaluaciones)...")
    ok_count  = 0
    err_count = 0
    errores   = []

    for i, (ev, calc, nombre, divs) in enumerate(resultados, 1):
        ev_id = ev.get("id")
        if not ev_id:
            print(f"  [{i:>3}] {nombre[:38]:<38}  SIN ID - omitida")
            err_count += 1
            continue

        secuencial = ev.get("empleadoSecuencial") or ev.get("_secuencial")
        ok, msg = actualizar_evaluacion(session, ev_id, calc, secuencial, args.periodo_id)
        bd  = calc["stored_totalCalculo"]
        cal = calc["calc_totalCalculo"]

        if ok:
            ok_count += 1
            print(f"  [{i:>3}] {nombre[:38]:<38}  {bd:.2f} -> {cal:.2f}  [OK]")
        else:
            err_count += 1
            errores.append((nombre, ev_id, msg))
            print(f"  [{i:>3}] {nombre[:38]:<38}  [ERROR] {msg}")

    print(f"\n{'='*ancho}")
    print(f"  RESUMEN")
    print(f"{'='*ancho}")
    print(f"  Corregidas correctamente : {ok_count}")
    print(f"  Errores                  : {err_count}")
    print(f"  Backup en               : {archivo_backup}")

    if errores:
        print(f"\n  Errores detalle:")
        for nombre, ev_id, msg in errores:
            print(f"    ID={ev_id}  {nombre[:38]}: {msg}")

    print(f"{'='*ancho}\n")
    sys.exit(1 if err_count > 0 else 0)


if __name__ == "__main__":
    main()
