"""
CORRECCIÓN 4 — Instrucciones actualizadas en Retroalimentación (Start-Stop-Continue)
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

OUTPUT_MP4 = "correccion_4_instrucciones_ssc.mp4"
TMP_AUDIO  = Path("_tmp_c4_audio")
RECORD_DIR = "_tmp_c4_video"
Path(RECORD_DIR).mkdir(exist_ok=True)


def run():
    narrator = Narrator(TMP_AUDIO)

    t_intro = narrator.add(
        "Corrección número cuatro: instrucciones de la sección de Retroalimentación de Desempeño. "
        "Navegamos a la autoevaluación de medio año.",
        delay_after_ms=500
    )
    t_instruccion_principal = narrator.add(
        "La instrucción principal de la sección ahora indica: "
        "Basado en los objetivos y competencias evaluados, registre acciones concretas "
        "en cada categoría. Esto conecta directamente la retroalimentación con "
        "lo que fue evaluado previamente en el formulario.",
        delay_after_ms=600
    )
    t_continuar = narrator.add(
        "El primer cuadro, Continuar Haciendo, tiene la descripción: "
        "Actividades o prácticas que funcionan bien y deben mantenerse.",
        delay_after_ms=400
    )
    t_mas = narrator.add(
        "El segundo cuadro, Hacer Más, indica: "
        "Acciones que necesitan mayor esfuerzo o frecuencia para lograr los objetivos.",
        delay_after_ms=400
    )
    t_menos = narrator.add(
        "El tercer cuadro, Hacer Menos, dice: "
        "Actividades que consumen demasiado tiempo sin el resultado esperado.",
        delay_after_ms=400
    )
    t_parar = narrator.add(
        "Y el cuarto cuadro, Parar de Hacer, especifica: "
        "Prácticas o hábitos perjudiciales o ineficientes que deben detenerse. "
        "Las mismas descripciones aplican tanto para el bloque del colaborador "
        "como para el del supervisor.",
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

        scroll_to_section(page, "Retroalimentación de Desempeño")
        page.wait_for_timeout(500)

        # Highlight main instruction
        highlight_briefly(page, ".my-4.card.p-4 > p.text-muted", duration_ms=3000)
        page.wait_for_timeout(t_instruccion_principal)

        # Scroll to show cards
        page.evaluate("window.scrollBy(0, 180)")
        page.wait_for_timeout(400)

        # Highlight "Continuar Haciendo" card
        highlight_briefly(page, ".border-success", duration_ms=2000)
        page.wait_for_timeout(t_continuar)

        # Highlight "Hacer Más" card
        highlight_briefly(page, ".border-primary", duration_ms=2000)
        page.wait_for_timeout(t_mas)

        page.evaluate("window.scrollBy(0, 250)")
        page.wait_for_timeout(400)

        # Highlight "Hacer Menos" card
        highlight_briefly(page, ".border-warning", duration_ms=2000)
        page.wait_for_timeout(t_menos)

        # Highlight "Parar de Hacer" card
        highlight_briefly(page, ".border-danger", duration_ms=2000)
        page.wait_for_timeout(t_parar)

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
