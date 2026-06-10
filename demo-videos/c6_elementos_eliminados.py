"""
CORRECCIÓN 6 — Eliminación de Cursos de Capacitación y Comentario Adicional
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

OUTPUT_MP4 = "correccion_6_elementos_eliminados.mp4"
TMP_AUDIO  = Path("_tmp_c6_audio")
RECORD_DIR = "_tmp_c6_video"
Path(RECORD_DIR).mkdir(exist_ok=True)


def run():
    narrator = Narrator(TMP_AUDIO)

    t_intro = narrator.add(
        "Corrección número seis: dos elementos han sido removidos del formulario "
        "de evaluación de medio año. Abrimos la autoevaluación para verificarlo.",
        delay_after_ms=500
    )
    t_firmas = narrator.add(
        "Nos desplazamos hacia el final del formulario. "
        "Después de la sección de Compromisos y Próximos Pasos "
        "y del bloque de Firmas y Fecha de Acuerdo...",
        delay_after_ms=600
    )
    t_eliminados = narrator.add(
        "La sección de Cursos de Capacitación Sugeridos ya no aparece. "
        "Tampoco el campo de Comentario Adicional. "
        "El formulario finaliza directamente con los botones de acción: "
        "Grabar Evaluación y Regresar. "
        "El flujo es más limpio y enfocado en los elementos propios de la evaluación de medio año.",
        delay_after_ms=1400
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

        # Scroll to firma section
        scroll_to_section(page, "Firmas y Fecha")
        page.wait_for_timeout(t_firmas)

        # Scroll to very bottom to show action buttons and absence of removed sections
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        page.wait_for_timeout(t_eliminados)

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
