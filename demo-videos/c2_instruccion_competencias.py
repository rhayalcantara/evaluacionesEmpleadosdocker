"""
CORRECCIÓN 2 — Instrucción en la sección de Evaluación de Competencias
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

OUTPUT_MP4 = "correccion_2_instruccion_competencias.mp4"
TMP_AUDIO  = Path("_tmp_c2_audio")
RECORD_DIR = "_tmp_c2_video"
Path(RECORD_DIR).mkdir(exist_ok=True)


def run():
    narrator = Narrator(TMP_AUDIO)

    t_intro = narrator.add(
        "Corrección número dos: instrucción en la sección de evaluación de competencias. "
        "Navegamos a la autoevaluación de medio año.",
        delay_after_ms=500
    )
    t_instruccion = narrator.add(
        "Justo antes de la tabla de competencias, ahora aparece una instrucción clara "
        "que indica al colaborador cómo proceder: "
        "Seleccione la calificación correspondiente para cada competencia. "
        "Esto orienta al usuario antes de que interactúe con los dropdowns de calificación.",
        delay_after_ms=800
    )
    t_tabla = narrator.add(
        "A continuación se muestra la tabla con las columnas de Competencia, "
        "Colaborador y Supervisor, donde cada fila tiene su selector de calificación "
        "del uno al cinco.",
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
        page.wait_for_timeout(500)

        # Highlight the instruction paragraph
        highlight_briefly(page, "app-form-evaluation-medio-ano .my-4.text-dark p.text-muted", duration_ms=3000)
        page.wait_for_timeout(t_instruccion)

        # Scroll down to show the table
        page.evaluate("window.scrollBy(0, 150)")
        page.wait_for_timeout(t_tabla)

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
