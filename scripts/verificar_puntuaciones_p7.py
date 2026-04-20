#!/usr/bin/env python3
"""
Verificación rápida de problemas en puntuaciones del periodo 7.

Detecta empleados con:
  - totalCalculo = 0 pero evaluación en estado activo (no Borrador/Pendiente)
  - totalCalculo negativo o anormalmente alto (>110)
  - Evaluación Completada/EvaluadoPorSupervisor sin respuestas de competencia del supervisor
  - Evaluación con competencias respondidas pero puntajeCompetencia = 0
  - Sin metas ni competencias respondidas
  - Divergencia entre totalCalculo almacenado y recalculado

Uso:
    python verificar_puntuaciones_p7.py
    python verificar_puntuaciones_p7.py --detalle
    python verificar_puntuaciones_p7.py --solo-problema CERO_ACTIVO
    python verificar_puntuaciones_p7.py --api-url http://localhost:7070
"""

import argparse
import sys
from typing import List, Dict, Tuple, Optional
from concurrent.futures import ThreadPoolExecutor, as_completed
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

API_URL     = "http://192.168.7.222:7070"
PERIODO_ID  = 7

# Tipos de problema (pueden combinarse)
P_CERO_ACTIVO        = "CERO_ACTIVO"           # totalCalculo=0 en estado no-borrador
P_FUERA_RANGO        = "FUERA_RANGO"           # <0 o >110
P_SIN_DATOS          = "SIN_DATOS"             # sin metas Y sin competencias respondidas
P_SUP_SIN_RESPUESTA  = "SUP_SIN_RESPUESTA"     # Completado pero supervisor no respondió competencias
P_COMP_CERO          = "COMP_CERO"             # competencias respondidas pero puntuación = 0
P_DIVERGENCIA        = "DIVERGENCIA"           # BD != recalculado (diferencia > 0.5)

ESTADOS_ACTIVOS = {"EvaluadoPorSupervisor", "Completado", "Enviado", "EvaluadoPorColaborador"}
ESTADOS_CON_SUP = {"EvaluadoPorSupervisor", "Completado"}


# ──────────────────────────────────────────────────────────────────────────────
# HTTP
# ──────────────────────────────────────────────────────────────────────────────

def crear_session() -> requests.Session:
    session = requests.Session()
    retry = Retry(total=3, backoff_factor=1,
                  status_forcelist=[429, 500, 502, 503, 504],
                  allowed_methods=["GET"])
    adapter = HTTPAdapter(max_retries=retry)
    session.mount("http://", adapter)
    session.mount("https://", adapter)
    return session


def get_json(session: requests.Session, path: str):
    url = f"{API_URL}{path}"
    resp = session.get(url, timeout=30)
    if resp.status_code == 404:
        return None
    resp.raise_for_status()
    return resp.json()


# ──────────────────────────────────────────────────────────────────────────────
# CÁLCULO (replica criterialitem.component.ts)
# ──────────────────────────────────────────────────────────────────────────────

def calcular_porciento_logro(logro: float, meta: float, inverso: bool) -> float:
    if inverso:
        return (meta / logro) * 100 if logro != 0 else 0.0
    return (logro / meta) * 100 if meta != 0 else 0.0


def buscar_valor_por_id(resp_id: int, valores: List[Dict]) -> float:
    v = next((v for v in valores if v["id"] == resp_id), None)
    return float(v["valor"]) if v else 0.0


def recalcular_total(ev: Dict, pdc_periodo: List[Dict], valores: List[Dict]) -> float:
    """Devuelve el totalCalculo recalculado."""
    metas        = ev.get("evaluacionDesempenoMetas") or []
    competencias = ev.get("goalEmpleadoRespuestas") or []

    pct_des = next((p["valor"] for p in pdc_periodo if p["descripcion"] == "Desempeño"),  0)
    pct_com = next((p["valor"] for p in pdc_periodo if p["descripcion"] == "Competencia"), 0)

    if len(metas) == 0:
        pct_des, pct_com = 0, 100

    # Promedio desempeño ponderado
    num = 0.0
    for m in metas:
        resp  = m.get("evaluacioneDesempenoMetaRespuestas") or {}
        logro = float(resp.get("logro") or 0)
        meta  = float(m.get("meta") or 1) or 1
        peso  = float(m.get("peso") or 0)
        inv   = bool(m.get("inverso", False))
        pct   = calcular_porciento_logro(logro, meta, inv)
        num  += (pct * peso) / 100.0

    promedio_desempeno = min(num, 110.0)
    desempeno_final    = (pct_des * promedio_desempeno) / 100.0

    n       = len(competencias) if competencias else 1
    sum_col = sum(
        buscar_valor_por_id(int(c.get("repuesta") or 0), valores)
        for c in competencias if int(c.get("repuesta") or 0) != 0
    )
    avg_col     = sum_col / n
    total_colab = desempeno_final + (avg_col * pct_com) / 100.0

    sup_responses = [c for c in competencias if int(c.get("repuestasupervisor") or 0) != 0]
    if sup_responses:
        sum_sup   = sum(buscar_valor_por_id(int(c.get("repuestasupervisor")), valores) for c in sup_responses)
        avg_sup   = sum_sup / n
        total_sup = desempeno_final + (avg_sup * pct_com) / 100.0
    else:
        total_sup = 0.0

    tiene_supervisor = bool(sup_responses)
    estado           = (ev.get("estadoevaluacion") or "").strip()
    es_supervisor    = tiene_supervisor or estado in ESTADOS_CON_SUP

    if es_supervisor and tiene_supervisor:
        return total_colab * 0.2 + total_sup * 0.8
    return total_colab


# ──────────────────────────────────────────────────────────────────────────────
# DETECCIÓN DE PROBLEMAS
# ──────────────────────────────────────────────────────────────────────────────

def detectar_problemas(ev: Dict, total_calculado: float) -> List[str]:
    problemas   = []
    estado      = (ev.get("estadoevaluacion") or "").strip()
    total_bd    = float(ev.get("totalCalculo") or 0)
    metas       = ev.get("evaluacionDesempenoMetas") or []
    competencias = ev.get("goalEmpleadoRespuestas") or []

    col_respondidas = [c for c in competencias if int(c.get("repuesta") or 0) != 0]
    sup_respondidas = [c for c in competencias if int(c.get("repuestasupervisor") or 0) != 0]

    # 1. Cero en estado activo
    if total_bd == 0 and estado in ESTADOS_ACTIVOS:
        problemas.append(P_CERO_ACTIVO)

    # 2. Fuera de rango
    if total_bd < 0 or total_bd > 110:
        problemas.append(P_FUERA_RANGO)

    # 3. Sin ningún dato respondido
    if not metas and not col_respondidas:
        if estado in ESTADOS_ACTIVOS:
            problemas.append(P_SIN_DATOS)

    # 4. Completado/EvaluadoPorSupervisor sin respuestas del supervisor
    if estado in ESTADOS_CON_SUP and not sup_respondidas and competencias:
        problemas.append(P_SUP_SIN_RESPUESTA)

    # 5. Competencias respondidas pero puntuaciónCompetenciaColaborador = 0
    punt_comp = float(ev.get("puntuacioncompetenciacolaborador") or 0)
    if col_respondidas and punt_comp == 0:
        problemas.append(P_COMP_CERO)

    # 6. Divergencia BD vs recalculado (tolerancia 0.5)
    if abs(total_bd - total_calculado) > 0.5:
        problemas.append(P_DIVERGENCIA)

    return problemas


# ──────────────────────────────────────────────────────────────────────────────
# CARGA DE DATOS
# ──────────────────────────────────────────────────────────────────────────────

def cargar_referencias(session: requests.Session) -> Tuple[List[Dict], List[Dict]]:
    print("  Cargando ValoresEvaluacion...", end=" ", flush=True)
    raw    = get_json(session, "/api/ValoresEvaluacions")
    valores = raw.get("data", raw) if isinstance(raw, dict) else raw
    print(f"{len(valores)} registros")

    print("  Cargando PorcientoDesempenoCompetencia...", end=" ", flush=True)
    raw     = get_json(session, "/api/PorcientoDesempenoCompetencias")
    pdc_all = raw.get("data", raw) if isinstance(raw, dict) else raw
    pdc     = [p for p in pdc_all if p.get("periodId") == PERIODO_ID]
    print(f"{len(pdc)} registros para el periodo {PERIODO_ID}")

    return valores, pdc


def cargar_empleados(session: requests.Session) -> Dict[int, str]:
    print("  Cargando empleados...", end=" ", flush=True)
    raw  = get_json(session, "/api/Empleadoes")
    lista = raw.get("data", raw) if isinstance(raw, dict) else (raw or [])
    mapa  = {e.get("secuencial"): e.get("nombreunido", f"ID {e.get('secuencial')}") for e in lista}
    print(f"{len(mapa)} cargados")
    return mapa


def fetch_evaluacion(session: requests.Session, secuencial: int) -> Optional[Dict]:
    return get_json(session, f"/api/Evaluacions/evaluacion?empleadoid={secuencial}&periodoid={PERIODO_ID}")


def cargar_evaluaciones(session: requests.Session, nombres: Dict[int, int],
                         workers: int = 10) -> List[Dict]:
    print("  Descargando lista de evaluaciones del periodo...", end=" ", flush=True)
    raw   = get_json(session, "/api/Evaluacions")
    todas = raw.get("data", raw) if isinstance(raw, dict) else (raw or [])
    del_periodo = [e for e in todas if e.get("periodId") == PERIODO_ID]
    print(f"{len(del_periodo)} evaluaciones")

    if not del_periodo:
        return []

    # Agrupar por secuencial, quedarse con el principal (mayor totalCalculo)
    from collections import defaultdict
    grupos   = defaultdict(list)
    for e in del_periodo:
        grupos[e.get("empleadoSecuencial")].append(e)

    principales = [max(evs, key=lambda e: e.get("totalCalculo") or 0)
                   for evs in grupos.values()]
    duplicados  = sum(1 for evs in grupos.values() if len(evs) > 1)
    if duplicados:
        print(f"  [AVISO] {duplicados} empleado(s) con evaluaciones duplicadas en el periodo")

    print(f"  Descargando detalle de {len(principales)} evaluaciones ({workers} en paralelo)...")
    resultados  = []
    completadas = 0

    def fetch(e):
        sec  = e.get("empleadoSecuencial")
        det  = fetch_evaluacion(session, sec)
        if det is None:
            return None
        # Inyectar totalCalculo del listado (más confiable) si el detalle no lo trae
        for campo in ("totalCalculo", "totalcolaborador", "totalsupervisor",
                      "puntuacioncompetenciacolaborador", "puntuacioncompetenciasupervisor"):
            if campo in e and not det.get(campo):
                det[campo] = e[campo]
        det["_nombre"] = nombres.get(sec, f"Secuencial {sec}")
        det["_secuencial"] = sec
        return det

    with ThreadPoolExecutor(max_workers=workers) as pool:
        futures = {pool.submit(fetch, e): e for e in principales}
        for future in as_completed(futures):
            completadas += 1
            print(f"    [{completadas:>3}/{len(principales)}]", end="\r", flush=True)
            r = future.result()
            if r:
                resultados.append(r)

    print(f"    Cargadas: {len(resultados)}/{len(principales)}{' '*20}")
    return resultados


# ──────────────────────────────────────────────────────────────────────────────
# REPORTE
# ──────────────────────────────────────────────────────────────────────────────

DESCRIPCIONES = {
    P_CERO_ACTIVO:       "Puntuación 0 en estado activo",
    P_FUERA_RANGO:       "Puntuación fuera de rango (< 0 o > 110)",
    P_SIN_DATOS:         "Sin metas ni competencias respondidas",
    P_SUP_SIN_RESPUESTA: "Estado supervisor pero sin respuestas del supervisor",
    P_COMP_CERO:         "Competencias respondidas pero puntuación = 0",
    P_DIVERGENCIA:       "Divergencia BD vs recalculado (> 0.5 puntos)",
}

COLORES = {
    P_CERO_ACTIVO:       "!!",
    P_FUERA_RANGO:       "!!",
    P_SIN_DATOS:         "!! ",
    P_SUP_SIN_RESPUESTA: "?? ",
    P_COMP_CERO:         "?? ",
    P_DIVERGENCIA:       "~~ ",
}


def imprimir_reporte(resultados: List[Tuple[Dict, List[str], float]],
                     mostrar_detalle: bool, filtro_problema: Optional[str]):
    with_problems = [(ev, ps, calc) for ev, ps, calc in resultados if ps]
    sin_problemas = [(ev, ps, calc) for ev, ps, calc in resultados if not ps]

    # Aplicar filtro
    if filtro_problema:
        with_problems = [(ev, ps, calc) for ev, ps, calc in with_problems
                         if filtro_problema in ps]

    ancho = 90
    print("\n" + "=" * ancho)
    print(f"  VERIFICACION DE PUNTUACIONES — Periodo {PERIODO_ID}")
    print("=" * ancho)
    print(f"  Total evaluaciones analizadas : {len(resultados)}")
    print(f"  Sin problemas detectados      : {len(sin_problemas)}")
    print(f"  Con algún problema            : {len(with_problems)}")
    if filtro_problema:
        print(f"  Filtro activo                 : {filtro_problema}")
    print("-" * ancho)

    # Resumen por tipo de problema
    print("\n  Resumen por tipo de problema:")
    conteos = {}
    for _, ps, _ in [(ev, ps, calc) for ev, ps, calc in resultados if ps]:
        for p in ps:
            conteos[p] = conteos.get(p, 0) + 1
    if conteos:
        for tipo, n in sorted(conteos.items(), key=lambda x: -x[1]):
            print(f"    {COLORES.get(tipo,'  ')} {tipo:<25}  {n:>3} empleado(s)  — {DESCRIPCIONES[tipo]}")
    else:
        print("    (ninguno)")

    if not with_problems:
        print(f"\n  Todas las evaluaciones del periodo {PERIODO_ID} lucen correctas.")
        print("=" * ancho)
        return

    # Detalle por empleado
    print(f"\n  {'#':>3}  {'Colaborador':<38} {'Total BD':>9} {'Calculado':>9}  Problemas")
    print(f"  {'---'}  {'-'*38} {'-'*9} {'-'*9}  {'-'*30}")

    for i, (ev, ps, calc) in enumerate(
            sorted(with_problems, key=lambda x: len(x[1]), reverse=True), 1):
        nombre   = ev.get("_nombre", "?")[:38]
        total_bd = float(ev.get("totalCalculo") or 0)
        estado   = (ev.get("estadoevaluacion") or "")[:22]
        dif      = calc - total_bd
        tags     = " | ".join(ps)
        print(f"  {i:>3}  {nombre:<38} {total_bd:>9.2f} {calc:>9.2f}  [{tags}]")

        if mostrar_detalle:
            metas        = ev.get("evaluacionDesempenoMetas") or []
            competencias = ev.get("goalEmpleadoRespuestas") or []
            col_resp     = sum(1 for c in competencias if int(c.get("repuesta") or 0) != 0)
            sup_resp     = sum(1 for c in competencias if int(c.get("repuestasupervisor") or 0) != 0)
            pcomp        = float(ev.get("puntuacioncompetenciacolaborador") or 0)
            pcomp_sup    = float(ev.get("puntuacioncompetenciasupervisor") or 0)
            print(f"        Estado: {estado}")
            print(f"        Metas: {len(metas)} | Competencias registradas: {len(competencias)}")
            print(f"        Respuestas colaborador: {col_resp} | Respuestas supervisor: {sup_resp}")
            print(f"        PuntCompColab BD: {pcomp:.2f} | PuntCompSup BD: {pcomp_sup:.2f}")
            print(f"        Diferencia BD vs calc: {dif:+.4f}")
            for p in ps:
                print(f"        >> {COLORES.get(p,'')} {DESCRIPCIONES[p]}")
            print()

    print("\n" + "=" * ancho)


# ──────────────────────────────────────────────────────────────────────────────
# MAIN
# ──────────────────────────────────────────────────────────────────────────────

def main():
    global API_URL, PERIODO_ID

    parser = argparse.ArgumentParser(
        description=f"Verifica problemas en puntuaciones del periodo {PERIODO_ID}",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )
    parser.add_argument("--periodo-id", type=int, default=PERIODO_ID,
                        help=f"ID del periodo (default: {PERIODO_ID})")
    parser.add_argument("--detalle", action="store_true",
                        help="Mostrar desglose detallado de cada empleado con problema")
    parser.add_argument("--solo-problema",
                        choices=[P_CERO_ACTIVO, P_FUERA_RANGO, P_SIN_DATOS,
                                 P_SUP_SIN_RESPUESTA, P_COMP_CERO, P_DIVERGENCIA],
                        help="Filtrar por tipo de problema específico")
    parser.add_argument("--api-url", default=API_URL,
                        help=f"URL base del API (default: {API_URL})")
    args = parser.parse_args()

    API_URL    = args.api_url.rstrip("/")
    PERIODO_ID = args.periodo_id

    print(f"\n{'='*60}")
    print(f"  VERIFICACION PUNTUACIONES — Periodo {PERIODO_ID}")
    print(f"  API: {API_URL}")
    print(f"{'='*60}\n")

    session = crear_session()

    print("[1/3] Cargando tablas de referencia...")
    valores, pdc = cargar_referencias(session)
    if not pdc:
        print(f"  [AVISO] Sin configuración PDC para el periodo {PERIODO_ID}. "
              f"El recálculo asumirá 100% competencia.")

    nombres = cargar_empleados(session)

    print(f"\n[2/3] Cargando evaluaciones del periodo {PERIODO_ID}...")
    evaluaciones = cargar_evaluaciones(session, nombres)

    if not evaluaciones:
        print("  No hay evaluaciones para verificar.")
        sys.exit(0)

    print(f"\n[3/3] Analizando {len(evaluaciones)} evaluaciones...")
    resultados: List[Tuple[Dict, List[str], float]] = []
    for ev in evaluaciones:
        calc     = recalcular_total(ev, pdc, valores)
        problemas = detectar_problemas(ev, calc)
        resultados.append((ev, problemas, calc))

    imprimir_reporte(resultados, args.detalle, args.solo_problema)

    tiene_problemas = any(ps for _, ps, _ in resultados)
    sys.exit(1 if tiene_problemas else 0)


if __name__ == "__main__":
    main()
