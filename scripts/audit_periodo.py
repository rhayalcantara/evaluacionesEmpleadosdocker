#!/usr/bin/env python3
"""
Auditoría de cálculos de evaluaciones por periodo.

Toma todas las evaluaciones de un periodo, recalcula los valores usando
la misma lógica que el sistema Angular y compara contra los valores
almacenados en la BD. Reporta divergencias con desglose detallado.

Uso:
    python audit_periodo.py --periodo-id 3
    python audit_periodo.py --periodo-id 3 --detalle
    python audit_periodo.py --periodo-id 3 --tolerancia 0.5
    python audit_periodo.py --periodo-id 3 --solo-divergencias
"""

import argparse
import sys
from typing import List, Dict, Optional, Tuple
from concurrent.futures import ThreadPoolExecutor, as_completed
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

API_URL = "http://192.168.7.222:7070"
TOLERANCE_DEFAULT = 0.01   # diferencia máxima aceptable


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


def get_json(session: requests.Session, path: str) -> any:
    url = f"{API_URL}{path}"
    resp = session.get(url, timeout=30)
    if resp.status_code == 404:
        return None
    resp.raise_for_status()
    return resp.json()


# ──────────────────────────────────────────────────────────────────────────────
# LÓGICA DE CÁLCULO  (replica exacta de criterialitem.component.ts)
# ──────────────────────────────────────────────────────────────────────────────

def calcular_porciento_logro(logro: float, meta: float, inverso: bool) -> float:
    """
    Replica calcularresultadologro() de criterialitem.component.ts:
        inverso=True  → porcientologro = (meta / logro) × 100   (menos es mejor, ej: gastos)
        inverso=False → porcientologro = (logro / meta) × 100   (más es mejor, ej: ventas)
    """
    if inverso:
        return (meta / logro) * 100 if logro != 0 else 0.0
    else:
        return (logro / meta) * 100 if meta != 0 else 0.0


def buscar_valor_por_id(resp_id: int, valores: List[Dict]) -> float:
    """
    Dado el ID de respuesta de competencia (1-5), retorna el valor numérico
    de la tabla ValoresEvaluacions.
    """
    v = next((v for v in valores if v["id"] == resp_id), None)
    return float(v["valor"]) if v else 0.0


def recalcular_evaluacion(
    evaluacion: Dict,
    pdc_periodo: List[Dict],
    valores: List[Dict],
) -> Dict:
    """
    Recalcula todos los valores de una evaluacion replicando:
      - calcularresultadologro()  (criterialitem)
      - calculaelpromediodesempeno()  (Evaluacion.ts)

    Si la evaluacion es una duplicada sin datos (_sin_datos=True),
    devuelve directamente los stored con calc=0 y la marca.

    Retorna un dict con stored_* (BD) y calc_* (recalculado).
    """
    # Evaluacion duplicada sin sub-datos: reportar como caso especial
    if evaluacion.get("_sin_datos"):
        def _s(campo): return float(evaluacion.get(f"_stored_{campo}") or 0)
        return {
            "stored_totalCalculo": _s("totalCalculo"),
            "stored_totalcolab":   _s("totalcolaborador"),
            "stored_totalsup":     _s("totalsupervisor"),
            "stored_puntColab":    _s("puntuacioncompetenciacolaborador"),
            "stored_puntSup":      _s("puntuacioncompetenciasupervisor"),
            "calc_totalCalculo":   0.0,
            "calc_totalcolab":     0.0,
            "calc_totalsup":       0.0,
            "calc_puntColab":      0.0,
            "calc_puntSup":        0.0,
            "calc_promedioDesempeno": 0.0,
            "calc_desempenoFinal":    0.0,
            "n_metas": 0, "n_competencias": 0,
            "pct_des": 0, "pct_com": 0,
            "es_supervisor": False,
            "estado": evaluacion.get("estadoevaluacion", "Pendiente"),
            "_es_duplicada_sin_datos": True,
        }

    metas       = evaluacion.get("evaluacionDesempenoMetas") or []
    competencias = evaluacion.get("goalEmpleadoRespuestas") or []
    estado      = (evaluacion.get("estadoevaluacion") or "").strip()

    # ── PDC del periodo ───────────────────────────────────────────────────────
    pct_des = next((p["valor"] for p in pdc_periodo if p["descripcion"] == "Desempeño"),  0)
    pct_com = next((p["valor"] for p in pdc_periodo if p["descripcion"] == "Competencia"), 0)

    # Si no hay metas → desempeño=0, competencia=100 (igual que el código Angular)
    if len(metas) == 0:
        pct_des = 0
        pct_com = 100

    # ── 1. promedioDesempeno ponderado ────────────────────────────────────────
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

    # ── 2. Competencias colaborador ───────────────────────────────────────────
    n = len(competencias) if competencias else 1
    sum_col = sum(
        buscar_valor_por_id(int(c.get("repuesta") or 0), valores)
        for c in competencias
        if int(c.get("repuesta") or 0) != 0
    )
    avg_col        = sum_col / n
    total_colab    = desempeno_final + (avg_col * pct_com) / 100.0

    # ── 3. Competencias supervisor ────────────────────────────────────────────
    sup_responses = [c for c in competencias if int(c.get("repuestasupervisor") or 0) != 0]
    if sup_responses:
        sum_sup   = sum(buscar_valor_por_id(int(c.get("repuestasupervisor")), valores) for c in sup_responses)
        avg_sup   = sum_sup / n
        total_sup = desempeno_final + (avg_sup * pct_com) / 100.0
    else:
        avg_sup   = 0.0
        total_sup = 0.0

    # ── 4. totalCalculo final ─────────────────────────────────────────────────
    # El supervisor está activo si hay al menos una respuesta de supervisor
    tiene_supervisor = any(
        int(c.get("repuestasupervisor") or 0) != 0 for c in competencias
    )
    # También se activa por estado
    estado_con_sup = estado in ("EvaluadoPorSupervisor", "Completado", "Enviado")
    es_supervisor  = tiene_supervisor or estado_con_sup

    if es_supervisor and tiene_supervisor:
        total_calc = total_colab * 0.2 + total_sup * 0.8
    else:
        total_calc = total_colab

    # Valores almacenados: preferir los que vinieron del listado (_stored_*) ya que
    # el endpoint por empleado+periodo puede devolver un objeto sin los totales
    def _stored(campo):
        prefixed = evaluacion.get(f"_stored_{campo}")
        return float(prefixed if prefixed is not None else (evaluacion.get(campo) or 0))

    return {
        # Valores almacenados en BD
        "stored_totalCalculo": _stored("totalCalculo"),
        "stored_totalcolab":   _stored("totalcolaborador"),
        "stored_totalsup":     _stored("totalsupervisor"),
        "stored_puntColab":    _stored("puntuacioncompetenciacolaborador"),
        "stored_puntSup":      _stored("puntuacioncompetenciasupervisor"),
        # Valores recalculados
        "calc_totalCalculo":      total_calc,
        "calc_totalcolab":        total_colab,
        "calc_totalsup":          total_sup,
        "calc_puntColab":         avg_col,
        "calc_puntSup":           avg_sup,
        "calc_promedioDesempeno": promedio_desempeno,
        "calc_desempenoFinal":    desempeno_final,
        # Contexto
        "n_metas":       len(metas),
        "n_competencias": n,
        "pct_des":       pct_des,
        "pct_com":       pct_com,
        "es_supervisor": es_supervisor,
        "estado":        estado,
    }


# ──────────────────────────────────────────────────────────────────────────────
# CARGA DE DATOS
# ──────────────────────────────────────────────────────────────────────────────

def cargar_datos_base(session: requests.Session, periodo_id: int):
    """Carga ValoresEvaluacion, PDC y periodo en paralelo (3 requests)."""
    print("  Cargando tabla ValoresEvaluacion...", end=" ", flush=True)
    raw = get_json(session, "/api/ValoresEvaluacions")
    valores = raw.get("data", raw) if isinstance(raw, dict) else raw
    print(f"{len(valores)} registros")

    print("  Cargando PorcientoDesempenoCompetencia...", end=" ", flush=True)
    raw = get_json(session, "/api/PorcientoDesempenoCompetencias")
    pdc_all = raw.get("data", raw) if isinstance(raw, dict) else raw
    pdc_periodo = [p for p in pdc_all if p.get("periodId") == periodo_id]
    print(f"{len(pdc_periodo)} registros para el periodo {periodo_id}")

    print("  Verificando periodo...", end=" ", flush=True)
    periodo = get_json(session, f"/api/Periods/{periodo_id}")
    if not periodo:
        print(f"\n  [ERROR] Periodo {periodo_id} no encontrado")
        sys.exit(1)
    desc = periodo.get("descripcion", str(periodo_id))
    print(f"'{desc}'")

    return valores, pdc_periodo, desc


def _fetch_evaluacion_detalle(session: requests.Session, secuencial: int, periodo_id: int,
                               stored: Dict, nombres: Dict) -> Optional[Dict]:
    """Descarga una evaluacion completa por empleado+periodo y agrega los valores almacenados."""
    url = f"/api/Evaluacions/evaluacion?empleadoid={secuencial}&periodoid={periodo_id}"
    ev = get_json(session, url)
    if not ev:
        return None
    # Agregar valores almacenados del listado (el endpoint detalle puede no tenerlos actualizados)
    for campo in ("totalCalculo", "totalcolaborador", "totalsupervisor",
                  "puntuacioncompetenciacolaborador", "puntuacioncompetenciasupervisor"):
        if campo in stored:
            ev[f"_stored_{campo}"] = stored[campo]
    ev["_colaborador"] = nombres.get(secuencial, f"Empleado {secuencial}")
    return ev


def cargar_evaluaciones_periodo(session: requests.Session, periodo_id: int,
                                 workers: int = 10) -> Tuple[List[Dict], int]:
    """
    Estrategia:
    1. GET /api/Evaluacions -> lista ligera (1 request), filtra por periodo.
    2. GET /api/Empleadoes  -> nombres (1 request).
    3. GET .../evaluacion?empleadoid={}  en paralelo para los sub-datos completos.
    """
    print("  Descargando lista de evaluaciones...", end=" ", flush=True)
    raw = get_json(session, "/api/Evaluacions")
    todas = raw.get("data", raw) if isinstance(raw, dict) else (raw or [])
    print(f"{len(todas)} en total")

    del_periodo = [e for e in todas if e.get("periodId") == periodo_id]
    print(f"  Del periodo {periodo_id}: {len(del_periodo)} evaluaciones")

    if not del_periodo:
        print("  [AVISO] No hay evaluaciones para este periodo.")
        return [], 0

    print("  Cargando nombres de empleados...", end=" ", flush=True)
    raw_emp = get_json(session, "/api/Empleadoes")
    empleados_lista = raw_emp.get("data", raw_emp) if isinstance(raw_emp, dict) else (raw_emp or [])
    nombres = {e.get("secuencial"): e.get("nombreunido", f"ID {e.get('secuencial')}") for e in empleados_lista}
    print(f"{len(nombres)} cargados")

    # ── Detectar duplicados (mismo empleadoSecuencial, varias evals en el mismo periodo) ──
    from collections import defaultdict
    grupos = defaultdict(list)
    for e in del_periodo:
        grupos[e.get("empleadoSecuencial")].append(e)

    duplicados = {sec: evs for sec, evs in grupos.items() if len(evs) > 1}
    if duplicados:
        print(f"  [AVISO] {len(duplicados)} empleados tienen mas de una evaluacion en este periodo:")
        for sec, evs in sorted(duplicados.items()):
            ids     = [ev.get("id") for ev in evs]
            totales = [ev.get("totalCalculo", 0) for ev in evs]
            estados = [ev.get("estadoevaluacion", "?") for ev in evs]
            nombre  = nombres.get(sec, f"Secuencial {sec}")
            print(f"    Secuencial {sec} ({nombre[:30]}): IDs={ids} totales={totales} estados={estados}")

    # Indice stored por (secuencial, ev_id) para no mezclar valores entre duplicados
    def stored_de(e):
        return {
            "totalCalculo":                   e.get("totalCalculo", 0),
            "totalcolaborador":               e.get("totalcolaborador", 0),
            "totalsupervisor":                e.get("totalsupervisor", 0),
            "puntuacioncompetenciacolaborador": e.get("puntuacioncompetenciacolaborador", 0),
            "puntuacioncompetenciasupervisor":  e.get("puntuacioncompetenciasupervisor", 0),
        }

    # Para empleados con 1 evaluacion: fetcha normalmente.
    # Para empleados con duplicados: fetchea usando el endpoint individual por ID si tiene sub-datos,
    # sino usa el endpoint por empleado+periodo para el primario (mayor totalCalculo) y
    # registra los Pendiente como "sin_datos" para contabilizarlos igual.
    unicos     = [evs[0] for evs in grupos.values() if len(evs) == 1]
    primarios  = [max(evs, key=lambda e: e.get("totalCalculo", 0)) for evs in duplicados.values()]
    secundarios = [
        ev for evs in duplicados.values()
        for ev in evs
        if ev is not max(evs, key=lambda e: e.get("totalCalculo", 0))
    ]

    print(f"  Evaluaciones a auditar: {len(unicos + primarios)} principales + "
          f"{len(secundarios)} duplicadas (estado Pendiente/sin datos)")

    cola_fetch = unicos + primarios    # estas se fetchean con datos completos
    total_bd   = len(del_periodo)      # 451

    print(f"  Descargando detalle de {len(cola_fetch)} evaluaciones ({workers} en paralelo)...")
    completadas = 0
    evaluaciones = []

    def fetch(e):
        sec = e.get("empleadoSecuencial")
        return _fetch_evaluacion_detalle(session, sec, periodo_id, stored_de(e), nombres)

    with ThreadPoolExecutor(max_workers=workers) as pool:
        futures = {pool.submit(fetch, e): e for e in cola_fetch}
        for future in as_completed(futures):
            completadas += 1
            print(f"    [{completadas:>3}/{len(cola_fetch)}]   ", end="\r", flush=True)
            result = future.result()
            if result:
                evaluaciones.append(result)

    # Agregar los secundarios como registros "sin_datos" (solo valores almacenados)
    for e in secundarios:
        sec    = e.get("empleadoSecuencial")
        nombre = nombres.get(sec, f"Empleado {sec}")
        ev_sin_datos = {
            "_colaborador":          f"{nombre} [DUPLICADA ID={e.get('id')}]",
            "_sin_datos":            True,
            "estadoevaluacion":      e.get("estadoevaluacion", "Pendiente"),
            "evaluacionDesempenoMetas":  [],
            "goalEmpleadoRespuestas":    [],
        }
        for k, v in stored_de(e).items():
            ev_sin_datos[f"_stored_{k}"] = v
        evaluaciones.append(ev_sin_datos)

    print(f"    Total contabilizado: {len(evaluaciones)}/{total_bd} evaluaciones{' '*20}")
    if len(evaluaciones) != total_bd:
        faltantes = total_bd - len(evaluaciones)
        print(f"    [AVISO] {faltantes} evaluaciones no pudieron cargarse (endpoint devolvio 404).")
    return evaluaciones, total_bd


# ──────────────────────────────────────────────────────────────────────────────
# REPORTE
# ──────────────────────────────────────────────────────────────────────────────

def diferencias(resultado: Dict, tolerancia: float) -> List[str]:
    """Retorna lista de campos que divergen más allá de la tolerancia."""
    pares = [
        ("totalCalculo",   "stored_totalCalculo",  "calc_totalCalculo"),
        ("totalColab",     "stored_totalcolab",     "calc_totalcolab"),
        ("totalSup",       "stored_totalsup",       "calc_totalsup"),
        ("puntColab",      "stored_puntColab",      "calc_puntColab"),
        ("puntSup",        "stored_puntSup",        "calc_puntSup"),
    ]
    divs = []
    for nombre, s_key, c_key in pares:
        diff = abs(resultado[s_key] - resultado[c_key])
        if diff > tolerancia:
            divs.append(f"{nombre}(BD={resultado[s_key]:.2f} CALC={resultado[c_key]:.2f} d={diff:.4f})")
    return divs


def imprimir_desglose(nombre: str, resultado: Dict):
    """Imprime el desglose detallado de una evaluacion."""
    r = resultado
    sep = "-" * 55
    print(f"\n    +- Desglose: {nombre}")
    print(f"    |  Estado: {r['estado']} | Metas: {r['n_metas']} | Competencias: {r['n_competencias']}")
    print(f"    |  PDC: Desempeno={r['pct_des']}%  Competencia={r['pct_com']}%")
    print(f"    |  promedioDesempeno = {r['calc_promedioDesempeno']:.4f}")
    print(f"    |  desempenoFinal    = {r['calc_desempenoFinal']:.4f}")
    print(f"    |  avgCompColab      = {r['calc_puntColab']:.4f}  -> totalColab = {r['calc_totalcolab']:.4f}")
    if r["es_supervisor"]:
        print(f"    |  avgCompSup        = {r['calc_puntSup']:.4f}  -> totalSup   = {r['calc_totalsup']:.4f}")
        print(f"    |  totalCalculo = colab*0.2 + sup*0.8 = {r['calc_totalcolab']:.4f}*0.2 + {r['calc_totalsup']:.4f}*0.8")
    print(f"    |")
    print(f"    |  {'Campo':<20} {'BD':>10} {'Calculado':>10} {'Diferencia':>10}")
    print(f"    |  {sep}")
    pares = [
        ("totalCalculo",  r["stored_totalCalculo"], r["calc_totalCalculo"]),
        ("totalColab",    r["stored_totalcolab"],    r["calc_totalcolab"]),
        ("totalSup",      r["stored_totalsup"],      r["calc_totalsup"]),
        ("puntColab",     r["stored_puntColab"],     r["calc_puntColab"]),
        ("puntSup",       r["stored_puntSup"],       r["calc_puntSup"]),
    ]
    for campo, bd, calc in pares:
        diff = calc - bd
        marker = " <--" if abs(diff) > 0.01 else ""
        print(f"    |  {campo:<20} {bd:>10.4f} {calc:>10.4f} {diff:>+10.4f}{marker}")
    print(f"    +{sep}")


def imprimir_resumen(
    periodo_desc: str,
    resultados: List[Tuple[str, Dict]],
    tolerancia: float,
    mostrar_detalle: bool,
    solo_divergencias: bool,
    total_bd: int = 0,
):
    procesadas = len(resultados)

    # Separar duplicadas-sin-datos del resto
    normales    = [(n, r) for n, r in resultados if not r.get("_es_duplicada_sin_datos")]
    duplicadas  = [(n, r) for n, r in resultados if r.get("_es_duplicada_sin_datos")]

    divs        = [(n, r, diferencias(r, tolerancia)) for n, r in normales]
    ok          = [x for x in divs if not x[2]]
    errores     = [x for x in divs if x[2]]

    sin_acceso = total_bd - procesadas if total_bd > procesadas else 0

    ancho = 80
    print("\n" + "=" * ancho)
    print(f"  RESULTADO AUDITORIA - Periodo: {periodo_desc}")
    print("=" * ancho)
    print(f"  Total BD                : {total_bd}")
    print(f"  Procesadas              : {procesadas}" + (f"  ({sin_acceso} sin acceso via API)" if sin_acceso else ""))
    print(f"  Evaluaciones auditadas  : {len(normales)}")
    print(f"  Correctas (d<={tolerancia:.2f})    : {len(ok)}")
    print(f"  Divergen                : {len(errores)}")
    if duplicadas:
        print(f"  Duplicadas/sin datos    : {len(duplicadas)}  [registros Pendiente con totalCalculo=0]")
    print("-" * ancho)

    # Tabla
    print(f"\n  {'#':>3}  {'Colaborador':<35} {'BD Total':>9} {'Calc':>9} {'Dif':>8}  Estado")
    print(f"  {'---'}  {'-'*35} {'-'*9} {'-'*9} {'-'*8}  {'-'*20}")

    for i, (nombre, resultado, divs_ev) in enumerate(divs, 1):
        if solo_divergencias and not divs_ev:
            continue
        bd   = resultado["stored_totalCalculo"]
        calc = resultado["calc_totalCalculo"]
        diff = calc - bd
        icon = "[OK]" if not divs_ev else "[DIVERGE]"
        print(f"  {i:>3}  {nombre[:35]:<35} {bd:>9.2f} {calc:>9.2f} {diff:>+8.4f}  {icon}")
        if mostrar_detalle:
            imprimir_desglose(nombre, resultado)

    # Sección de duplicadas
    if duplicadas:
        print(f"\n  --- Registros duplicados en BD (estado Pendiente, totalCalculo=0) ---")
        for nombre, r in duplicadas:
            bd = r["stored_totalCalculo"]
            print(f"       {nombre[:55]:<55}  BD={bd:.2f}  [DUPLICADA - no auditada]")

    print()

    if errores:
        print("-" * ancho)
        print(f"  DETALLE DE DIVERGENCIAS ({len(errores)} evaluaciones)")
        print("-" * ancho)
        for nombre, resultado, divs_ev in errores:
            print(f"\n  >> {nombre}")
            for d in divs_ev:
                print(f"    - {d}")
            if not mostrar_detalle:
                imprimir_desglose(nombre, resultado)
    else:
        print(f"  Todas las evaluaciones auditadas coinciden con el calculo.")

    print("\n" + "=" * ancho)
    return len(errores) > 0


# ──────────────────────────────────────────────────────────────────────────────
# MAIN
# ──────────────────────────────────────────────────────────────────────────────

def main():
    global API_URL
    parser = argparse.ArgumentParser(
        description="Auditoría de cálculos de evaluaciones por periodo",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )
    parser.add_argument("--periodo-id", type=int, required=True,
                        help="ID del periodo a auditar")
    parser.add_argument("--tolerancia", type=float, default=TOLERANCE_DEFAULT,
                        help=f"Diferencia máxima aceptable (default: {TOLERANCE_DEFAULT})")
    parser.add_argument("--detalle", action="store_true",
                        help="Mostrar desglose completo de TODAS las evaluaciones")
    parser.add_argument("--solo-divergencias", action="store_true",
                        help="Mostrar en la tabla solo las evaluaciones que divergen")
    parser.add_argument("--api-url", default=API_URL,
                        help=f"URL base del API (default: {API_URL})")
    args = parser.parse_args()
    API_URL = args.api_url.rstrip("/")

    print(f"\n{'='*60}")
    print(f"  AUDITORIA DE EVALUACIONES - Periodo {args.periodo_id}")
    print(f"  API: {API_URL}  |  Tolerancia: +/-{args.tolerancia}")
    print(f"{'='*60}\n")

    session = crear_session()

    # 1. Cargar datos de referencia
    print("[1/3] Cargando tablas de referencia...")
    valores, pdc_periodo, periodo_desc = cargar_datos_base(session, args.periodo_id)

    if not pdc_periodo:
        print(f"\n[AVISO] No se encontraron registros PDC para el periodo {args.periodo_id}.")
        print("        Verifica que el periodo tenga configurados los porcentajes Desempeño/Competencia.")

    # 2. Cargar evaluaciones del periodo
    print(f"\n[2/3] Cargando evaluaciones del periodo '{periodo_desc}'...")
    evaluaciones, total_bd = cargar_evaluaciones_periodo(session, args.periodo_id)

    if not evaluaciones:
        print("\nNo hay evaluaciones para auditar.")
        sys.exit(0)

    # 3. Recalcular y comparar
    print(f"\n[3/3] Recalculando {len(evaluaciones)} evaluaciones...")
    resultados: List[Tuple[str, Dict]] = []
    for ev in evaluaciones:
        nombre    = ev.get("_colaborador", f"Empleado {ev.get('empleadoSecuencial', '?')}")
        resultado = recalcular_evaluacion(ev, pdc_periodo, valores)
        resultados.append((nombre, resultado))

    # 4. Imprimir reporte
    hay_errores = imprimir_resumen(
        periodo_desc, resultados,
        args.tolerancia, args.detalle, args.solo_divergencias,
        total_bd=total_bd,
    )

    sys.exit(1 if hay_errores else 0)


if __name__ == "__main__":
    main()
