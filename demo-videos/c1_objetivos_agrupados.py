"""
CORRECCIÓN 1 — Tabla de Objetivos agrupada por tipo (KRI / KPI / Objetivo / Proyecto)

Video SIN narración de voz (decisión del usuario; edge-tts no garantizado tras VPN).
Usa DOBLE MOCK coherente:
  - /Evaluacions/evaluacion  → IEvaluacion con arrays vacíos (evita romper el forEach
                               de competencias y permite cerrar el spinner de carga)
  - /Evaluacions/results     → 5 objetivos con los 4 tipos (KRI/KPI/Objetivo/Proyecto)
Como las evaluaciones de medio año reales no tienen objetivos cargados, este mock es
la única forma de demostrar visualmente la tabla agrupada.
"""
import json, os, sys, shutil, subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright

sys.path.insert(0, str(Path(__file__).parent))
from helpers import find_latest_webm, login, goto_via_menu, scroll_to_section, dismiss_swal

BASE_URL = os.environ.get("EVAL_BASE_URL", "http://192.168.7.222/evaluacionempleado-prueba/")
USERNAME = os.environ.get("EVAL_USERNAME")
PASSWORD = os.environ.get("EVAL_PASSWORD")
if not USERNAME or not PASSWORD:
    raise SystemExit("ERROR: Set EVAL_USERNAME and EVAL_PASSWORD before running.")

OUTPUT_MP4 = "correccion_1_objetivos_agrupados.mp4"
RECORD_DIR = "_tmp_c1_video"
Path(RECORD_DIR).mkdir(exist_ok=True)

# Mock de la evaluación principal: arrays vacíos para no romper el flujo del componente.
MOCK_EVALUACION = {
    "id": 9999, "periodId": 8, "empleadoSecuencial": 525,
    "totalCalculo": 0, "fechaRepuestas": "2026-06-11", "observacion": "",
    "evaluacionGoals": [],
    "evaluacionDesempenoMetas": [],
    "goalEmpleadoRespuestas": [],
    "puntuaciondesempenocolaborador": 0, "puntuacioncompetenciacolaborador": 0,
    "totalcolaborador": 0, "puntuaciondesempenosupervidor": 0,
    "puntuacioncompetenciasupervisor": 0, "totalsupervisor": 0,
    "estadoevaluacion": "Borrador",
    "entrevistaConSupervisor": False, "aceptaEnDisgusto": False, "comentarioDisgusto": "",
    "porcentajeDesempeno": 0, "porcentajeCompetencia": 0,
    "colaboradorContinuar": "", "colaboradorHacerMas": "",
    "colaboradorHacerMenos": "", "colaboradorParar": "",
    "supervisorContinuar": "", "supervisorHacerMas": "",
    "supervisorHacerMenos": "", "supervisorParar": "",
    "colaboradorCompromisos": "", "supervisorCompromisos": "",
}

# Mock de objetivos: los 4 tipos para demostrar la agrupación.
MOCK_RESULTS = {
    "exito": 1, "mensaje": "OK", "count": 5,
    "data": [
        {"id": 1001, "evaluacionId": 9999, "tipo": "KRI",
         "objetivo": "Morosidad de la cartera de credito",
         "perspectiva": "Financiera", "meta": 3.5, "peso": 25, "inverso": True},
        {"id": 1002, "evaluacionId": 9999, "tipo": "KPI",
         "objetivo": "Crecimiento neto de socios activos",
         "perspectiva": "Cliente", "meta": 5.0, "peso": 20, "inverso": False},
        {"id": 1003, "evaluacionId": 9999, "tipo": "KPI",
         "objetivo": "Indice de satisfaccion de atencion al socio",
         "perspectiva": "Cliente", "meta": 90.0, "peso": 15, "inverso": False},
        {"id": 1004, "evaluacionId": 9999, "tipo": "Objetivo",
         "objetivo": "Implementar sistema de archivo digital en sucursales",
         "perspectiva": "Procesos Internos", "meta": 80.0, "peso": 25, "inverso": False},
        {"id": 1005, "evaluacionId": 9999, "tipo": "Proyecto",
         "objetivo": "Plan de capacitacion digital para colaboradores",
         "perspectiva": "Aprendizaje y Crecimiento", "meta": 70.0, "peso": 15, "inverso": False},
    ]
}

# Tiempos fijos (ms) — sin TTS
T_INTRO  = 2500
T_TABLA  = 5000
T_GRUPOS = 7000
T_CIERRE = 4000


def run():
    eval_body = json.dumps(MOCK_EVALUACION)
    results_body = json.dumps(MOCK_RESULTS)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, args=["--start-maximized"])
        context = browser.new_context(
            viewport={"width": 1280, "height": 720},
            record_video_dir=RECORD_DIR,
            record_video_size={"width": 1280, "height": 720},
        )
        page = context.new_page()

        # DOBLE MOCK — registrar antes de navegar
        page.route("**/Evaluacions/evaluacion**",
                   lambda r: r.fulfill(status=200, content_type="application/json", body=eval_body))
        page.route("**/Evaluacions/results**",
                   lambda r: r.fulfill(status=200, content_type="application/json", body=results_body))

        login(page, BASE_URL, USERNAME, PASSWORD)
        goto_via_menu(page, "Evaluaciones", "AutoEvaluación")
        dismiss_swal(page)
        page.wait_for_timeout(1500)

        # Zoom 90% para ver la tabla completa
        page.evaluate("document.documentElement.style.zoom = '0.9'")
        page.wait_for_timeout(600)
        page.wait_for_timeout(T_INTRO)

        # Esperar a que la sección de objetivos aparezca (spinner cerrado, tabla renderizada)
        try:
            page.wait_for_selector(".tipo-header-row", timeout=10000)
        except Exception:
            print("ADVERTENCIA: .tipo-header-row no apareció — revisar mock")

        # Scroll a la sección de objetivos
        scroll_to_section(page, "Revisión de Objetivos")
        page.wait_for_timeout(1200)

        # Resaltar los sub-encabezados de tipo en secuencia
        page.evaluate("""
          () => {
            const rows = document.querySelectorAll('.tipo-header-row td');
            rows.forEach((el, i) => {
              setTimeout(() => {
                const prev = el.style.cssText;
                el.style.outline = '3px solid #f59e0b';
                el.style.boxShadow = '0 0 0 6px rgba(245,158,11,0.25)';
                el.style.backgroundColor = '#fffbeb';
                setTimeout(() => { el.style.cssText = prev; }, 2200);
              }, i * 900);
            });
          }
        """)
        page.wait_for_timeout(T_TABLA)

        # Scroll suave para revelar todos los grupos
        page.evaluate("window.scrollBy({top: 220, behavior: 'smooth'})")
        page.wait_for_timeout(1500)
        page.evaluate("window.scrollBy({top: 220, behavior: 'smooth'})")
        page.wait_for_timeout(1500)
        page.wait_for_timeout(T_GRUPOS)

        # Resaltar footer Total Peso
        page.evaluate("""
          () => {
            const tfoot = document.querySelector('.objetivos-table tfoot');
            if (tfoot) {
              tfoot.scrollIntoView({ behavior: 'smooth', block: 'end' });
              tfoot.style.outline = '2px solid #4f46e5';
              setTimeout(() => { tfoot.style.outline = ''; }, 3000);
            }
          }
        """)
        page.wait_for_timeout(T_CIERRE)

        context.close()
        browser.close()

    video_file = find_latest_webm(RECORD_DIR)

    # Convertir a MP4 sin audio (video mudo)
    subprocess.run([
        "ffmpeg", "-y", "-i", video_file,
        "-c:v", "libx264", "-crf", "22", "-an",
        OUTPUT_MP4
    ], check=True)

    shutil.rmtree(RECORD_DIR, ignore_errors=True)
    print(f"\nVideo guardado: {OUTPUT_MP4}")


if __name__ == "__main__":
    run()
