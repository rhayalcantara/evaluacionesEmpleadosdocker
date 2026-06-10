"""
CORRECCIÓN 3 — Ver descripción al pinchar cada competencia (expand inline)
"""
import os, sys, shutil
from pathlib import Path
from playwright.sync_api import sync_playwright

sys.path.insert(0, str(Path(__file__).parent))
from helpers import (Narrator, mix_video_audio, find_latest_webm,
                     login, goto_via_menu, scroll_to_section, dismiss_swal)

BASE_URL   = os.environ.get("EVAL_BASE_URL", "http://192.168.7.222/evaluacionempleado-prueba/")
USERNAME   = os.environ.get("EVAL_USERNAME")
PASSWORD   = os.environ.get("EVAL_PASSWORD")
if not USERNAME or not PASSWORD:
    raise SystemExit("ERROR: Set EVAL_USERNAME and EVAL_PASSWORD before running.")

OUTPUT_MP4 = "correccion_3_descripcion_competencia.mp4"
TMP_AUDIO  = Path("_tmp_c3_audio")
RECORD_DIR = "_tmp_c3_video"
Path(RECORD_DIR).mkdir(exist_ok=True)


def run():
    narrator = Narrator(TMP_AUDIO)

    t_intro = narrator.add(
        "Corrección número tres: al hacer clic en el nombre de una competencia, "
        "se despliega su descripción completa directamente en la tabla. "
        "Abrimos la autoevaluación de medio año.",
        delay_after_ms=500
    )
    t_click1 = narrator.add(
        "Nos ubicamos en la tabla de competencias. Cada nombre tiene una flecha indicadora. "
        "Hacemos clic en la primera competencia.",
        delay_after_ms=400
    )
    t_descripcion = narrator.add(
        "La descripción aparece de inmediato debajo del nombre, resaltada con una línea "
        "índigo a la izquierda. El colaborador puede leer el detalle de la competencia "
        "antes de seleccionar su calificación.",
        delay_after_ms=600
    )
    t_collapse = narrator.add(
        "Al hacer clic nuevamente, la descripción se oculta. "
        "La funcionalidad aplica a todas las competencias de la lista de forma independiente.",
        delay_after_ms=400
    )
    t_segunda = narrator.add(
        "Abrimos una segunda competencia para confirmar que el comportamiento "
        "es consistente en toda la tabla.",
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

        scroll_to_section(page, "Evaluación de Competencias")
        page.wait_for_timeout(800)
        page.wait_for_timeout(t_click1)

        # Click first competency name cell
        primera = page.locator(".comp-nombre-cell").first
        if primera.is_visible():
            primera.scroll_into_view_if_needed()
            page.wait_for_timeout(400)
            primera.click()
            page.wait_for_timeout(t_descripcion)

            # Collapse
            primera.click()
            page.wait_for_timeout(t_collapse)

            # Open second competency
            celdas = page.locator(".comp-nombre-cell")
            if celdas.count() >= 2:
                celdas.nth(1).click()
                page.wait_for_timeout(t_segunda)

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
