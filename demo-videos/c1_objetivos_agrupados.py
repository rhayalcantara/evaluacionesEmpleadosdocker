"""
CORRECCIÓN 1 — Tabla de Objetivos agrupada por tipo (KRI / KPI / Objetivo / Proyecto)
"""
import os, sys, shutil
from pathlib import Path
from playwright.sync_api import sync_playwright

sys.path.insert(0, str(Path(__file__).parent))
from helpers import (Narrator, mix_video_audio, find_latest_webm,
                     login, goto_via_menu, scroll_to_section, highlight_briefly, dismiss_swal)

BASE_URL   = os.environ.get("EVAL_BASE_URL", "http://192.168.7.222/evaluacionempleado-prueba/")
USERNAME   = os.environ.get("EVAL_USERNAME")
PASSWORD   = os.environ.get("EVAL_PASSWORD")
if not USERNAME or not PASSWORD:
    raise SystemExit("ERROR: Set EVAL_USERNAME and EVAL_PASSWORD before running.")

OUTPUT_MP4 = "correccion_1_objetivos_agrupados.mp4"
TMP_AUDIO  = Path("_tmp_c1_audio")
RECORD_DIR = "_tmp_c1_video"
Path(RECORD_DIR).mkdir(exist_ok=True)


def run():
    narrator = Narrator(TMP_AUDIO)

    t_intro = narrator.add(
        "Corrección número uno: estructura de la tabla de objetivos. "
        "Ingresamos al sistema y abrimos la autoevaluación de medio año.",
        delay_after_ms=500
    )
    t_tabla = narrator.add(
        "En la sección Revisión de Objetivos del Año, los registros ahora aparecen "
        "agrupados por tipo de indicador. Cada grupo tiene un sub-encabezado "
        "resaltado en color índigo que identifica la categoría.",
        delay_after_ms=600
    )
    t_grupos = narrator.add(
        "Las categorías son: KRI, para Indicadores Clave de Riesgo; "
        "KPI, para Indicadores Clave de Desempeño; "
        "Objetivo, para metas estratégicas directas; "
        "y Proyecto, para iniciativas específicas. "
        "Esto permite al colaborador y al supervisor revisar cada tipo de indicador de forma organizada.",
        delay_after_ms=800
    )
    t_cierre = narrator.add(
        "El peso total sigue visible al final de la tabla, y todas las columnas de avance "
        "y porcentaje de logro funcionan igual que antes.",
        delay_after_ms=1200
    )

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, args=["--start-maximized"])
        context = browser.new_context(
            viewport={"width": 1280, "height": 720},
            record_video_dir=RECORD_DIR,
            record_video_size={"width": 1280, "height": 720},
        )
        page = context.new_page()

        login(page, BASE_URL, USERNAME, PASSWORD)
        goto_via_menu(page, "Evaluaciones", "AutoEvaluación")
        dismiss_swal(page)
        page.wait_for_timeout(t_intro)

        scroll_to_section(page, "Revisión de Objetivos")
        page.wait_for_timeout(t_tabla)

        # Highlight the first tipo-header row
        highlight_briefly(page, ".tipo-header-row td", duration_ms=2500)
        page.wait_for_timeout(t_grupos)

        # Scroll down to show the full table and footer
        page.evaluate("window.scrollBy(0, 300)")
        page.wait_for_timeout(t_cierre)

        context.close()
        browser.close()

    print("Generando audio final...")
    narrator.build_final(str(TMP_AUDIO / "narration_final.mp3"))
    video_file = find_latest_webm(RECORD_DIR)
    mix_video_audio(video_file, str(TMP_AUDIO / "narration_final.mp3"), OUTPUT_MP4)
    shutil.rmtree(RECORD_DIR, ignore_errors=True)
    shutil.rmtree(TMP_AUDIO, ignore_errors=True)
    print(f"\nVideo guardado: {OUTPUT_MP4}")


if __name__ == "__main__":
    run()
