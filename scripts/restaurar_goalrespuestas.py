"""
restaurar_goalrespuestas.py
===========================
Restaura las goalEmpleadoRespuestas eliminadas a partir del archivo de backup.

Uso:
    # Ver qué se va a restaurar (sin hacer cambios)
    python restaurar_goalrespuestas.py --dry-run

    # Restaurar todas las respuestas
    python restaurar_goalrespuestas.py

    # Restaurar solo una evaluación específica
    python restaurar_goalrespuestas.py --evaluacion-id 1356

    # Usar otro archivo de backup
    python restaurar_goalrespuestas.py --backup archivo.json
"""

import json
import argparse
import time
import sys
import logging
from pathlib import Path

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# ── Configuración ─────────────────────────────────────────────────────────────
DEFAULT_BACKUP = Path(__file__).parent / "backup_evaluaciones_p7_20260408_100932.json"
API_URL        = "http://192.168.7.222:7070"
TIMEOUT        = 60          # segundos por request
DELAY_BETWEEN  = 0.15        # segundos entre requests (para no saturar la API)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("restaurar_goalrespuestas.log", encoding="utf-8"),
    ],
)
log = logging.getLogger(__name__)


# ── Helpers ───────────────────────────────────────────────────────────────────

def build_session() -> requests.Session:
    session = requests.Session()
    retry = Retry(
        total=3,
        backoff_factor=1.5,
        status_forcelist=[429, 500, 502, 503, 504],
    )
    adapter = HTTPAdapter(max_retries=retry)
    session.mount("http://", adapter)
    session.mount("https://", adapter)
    session.headers.update({"Content-Type": "application/json"})
    return session


def build_dto(detalle: dict) -> dict:
    """Construye el payload para PUT /api/Evaluacions/{id}.
    Resetea el id de cada goalEmpleadoRespuesta a 0 para que
    el backend los inserte como registros nuevos (los originales
    ya fueron eliminados de la BD).
    """
    respuestas_nuevas = []
    for r in detalle.get("goalEmpleadoRespuestas", []):
        respuestas_nuevas.append({
            "id": 0,                               # ← nuevo registro
            "evaluacionId": detalle["id"],
            "goalId":       r["goalId"],
            "repuesta":     r["repuesta"],
            "repuestasupervisor": r.get("repuestasupervisor", 0),
            "weight":       r.get("weight", 0),
            "observacion":  r.get("observacion", ""),
            "observacionsupervisor": r.get("observacionsupervisor", ""),
        })

    return {
        "id":             detalle["id"],
        "periodId":       detalle["periodId"],
        "secuencialempleado": detalle["empleadoSecuencial"],
        "totalCalculo":   detalle["totalCalculo"],
        "fechaRepuestas": detalle["fechaRepuestas"],
        "observacion":    detalle.get("observacion", ""),
        "goalEmpleadoRespuestas": respuestas_nuevas,
        "evaluacionDesempenoMetas":    detalle.get("evaluacionDesempenoMetas", []),
        "evaluacionCursoCapacitacions": detalle.get("evaluacionCursoCapacitacions", []),
        "puntuaciondesempenocolaborador":   detalle["puntuaciondesempenocolaborador"],
        "puntuacioncompetenciacolaborador": detalle["puntuacioncompetenciacolaborador"],
        "totalcolaborador":                 detalle["totalcolaborador"],
        "puntuaciondesempenosupervidor":    detalle["puntuaciondesempenosupervidor"],
        "puntuacioncompetenciasupervisor":  detalle["puntuacioncompetenciasupervisor"],
        "totalsupervisor":                  detalle["totalsupervisor"],
        "estadoevaluacion":                 detalle["estadoevaluacion"],
        "entrevistaConSupervisor": detalle.get("entrevistaConSupervisor", False),
        "aceptaEnDisgusto":        detalle.get("aceptaEnDisgusto", False),
        "comentarioDisgusto":      detalle.get("comentarioDisgusto"),
    }


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Restaura goalEmpleadoRespuestas desde backup")
    parser.add_argument("--backup",        default=str(DEFAULT_BACKUP),
                        help="Ruta al archivo JSON de backup")
    parser.add_argument("--api-url",       default=API_URL,
                        help="URL base de la API")
    parser.add_argument("--dry-run",       action="store_true",
                        help="Solo muestra qué haría, sin llamar a la API")
    parser.add_argument("--evaluacion-id", type=int, default=None,
                        help="Restaurar solo esta evaluación")
    args = parser.parse_args()

    # Cargar backup
    backup_path = Path(args.backup)
    if not backup_path.exists():
        log.error(f"Archivo de backup no encontrado: {backup_path}")
        sys.exit(1)

    with open(backup_path, encoding="utf-8") as f:
        data = json.load(f)

    evaluaciones = data["evaluaciones"]
    log.info(f"Backup cargado — total registros: {len(evaluaciones)}")

    # Filtrar evaluaciones con respuestas
    pendientes = []
    for e in evaluaciones:
        detalle = e.get("detalle")
        if detalle is None:
            continue
        respuestas = detalle.get("goalEmpleadoRespuestas", [])
        if not respuestas:
            continue
        if args.evaluacion_id and detalle["id"] != args.evaluacion_id:
            continue
        pendientes.append(detalle)

    total_respuestas = sum(len(d["goalEmpleadoRespuestas"]) for d in pendientes)
    log.info(f"Evaluaciones a restaurar: {len(pendientes)}")
    log.info(f"Total goalEmpleadoRespuestas a restaurar: {total_respuestas}")

    if args.dry_run:
        log.info("=== MODO DRY-RUN — no se realizarán cambios ===")
        for d in pendientes[:10]:
            log.info(f"  [DRY] evaluacionId={d['id']}, "
                     f"empleado={d['empleadoSecuencial']}, "
                     f"respuestas={len(d['goalEmpleadoRespuestas'])}")
        if len(pendientes) > 10:
            log.info(f"  ... y {len(pendientes) - 10} más")
        return

    # Restaurar
    session   = build_session()
    ok        = 0
    errors    = []

    for i, detalle in enumerate(pendientes, 1):
        ev_id = detalle["id"]
        url   = f"{args.api_url}/api/Evaluacions/{ev_id}"
        dto   = build_dto(detalle)

        try:
            resp = session.put(url, json=dto, timeout=TIMEOUT)
            if resp.status_code in (200, 204):
                log.info(f"[{i}/{len(pendientes)}] OK  evaluacionId={ev_id} "
                         f"({len(dto['goalEmpleadoRespuestas'])} respuestas)")
                ok += 1
            else:
                msg = f"evaluacionId={ev_id} → HTTP {resp.status_code}: {resp.text[:200]}"
                log.error(f"[{i}/{len(pendientes)}] FAIL  {msg}")
                errors.append(msg)
        except Exception as exc:
            msg = f"evaluacionId={ev_id} → excepción: {exc}"
            log.error(f"[{i}/{len(pendientes)}] FAIL  {msg}")
            errors.append(msg)

        time.sleep(DELAY_BETWEEN)

    # Resumen
    log.info("=" * 60)
    log.info(f"Restauradas OK : {ok}/{len(pendientes)}")
    if errors:
        log.error(f"Fallos        : {len(errors)}")
        for e in errors:
            log.error(f"  • {e}")
        sys.exit(1)
    else:
        log.info("Restauración completada sin errores.")


if __name__ == "__main__":
    main()
