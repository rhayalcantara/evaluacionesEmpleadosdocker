"""
CORRECCIÓN 5 — Instrucción en Compromisos y visibilidad del campo del Supervisor
Muestra ambas perspectivas: colaborador y supervisor.
"""
import os, sys, shutil
from pathlib import Path
from playwright.sync_api import sync_playwright

sys.path.insert(0, str(Path(__file__).parent))
from helpers import (Narrator, mix_video_audio, find_latest_webm,
                     login, goto_via_menu, scroll_to_section, highlight_briefly, dismiss_swal)

BASE_URL       = os.environ.get("EVAL_BASE_URL", "http://192.168.7.222/evaluacionempleado-prueba/")
USERNAME       = os.environ.get("EVAL_USERNAME")
PASSWORD       = os.environ.get("EVAL_PASSWORD")
USERNAME_SUPER = os.environ.get("EVAL_USERNAME_SUPER", USERNAME)
PASSWORD_SUPER = os.environ.get("EVAL_PASSWORD_SUPER", PASSWORD)

if not USERNAME or not PASSWORD:
    raise SystemExit("ERROR: Set EVAL_USERNAME and EVAL_PASSWORD before running.")

OUTPUT_MP4 = "correccion_5_compromisos_supervisor.mp4"
TMP_AUDIO  = Path("_tmp_c5_audio")
RECORD_DIR = "_tmp_c5_video"
Path(RECORD_DIR).mkdir(exist_ok=True)


def run():
    narrator = Narrator(TMP_AUDIO)

    t_intro = narrator.add(
        "Corrección número cinco: instrucción en la sección de Compromisos y "
        "visibilidad del campo del supervisor. Primero vemos la perspectiva del colaborador.",
        delay_after_ms=500
    )
    t_instruccion = narrator.add(
        "En la sección Compromisos y Próximos Pasos, ahora aparece la instrucción: "
        "Registre los acuerdos concretos que resultan de esta conversación. "
        "Deben ser específicos y con fecha de seguimiento.",
        delay_after_ms=600
    )
    t_colab_campo = narrator.add(
        "El colaborador ve únicamente su propio campo de compromisos. "
        "El campo del supervisor no es visible en esta vista, "
        "ya que esos acuerdos son completados por el supervisor durante la entrevista.",
        delay_after_ms=600
    )
    t_super_intro = narrator.add(
        "Ahora iniciamos sesión como supervisor para demostrar que el campo "
        "de compromisos del supervisor sí es visible desde esa perspectiva.",
        delay_after_ms=500
    )
    t_super_vista = narrator.add(
        "Como supervisor, al abrir la evaluación de un colaborador, "
        "la sección de Compromisos muestra ambos campos: "
        "el del colaborador, que es solo de lectura, "
        "y el del supervisor, que puede ser completado durante la entrevista de retroalimentación.",
        delay_after_ms=1200
    )

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, args=["--start-maximized"])

        # ── PARTE 1: Vista del colaborador ────────────────────────────
        ctx1 = browser.new_context(
            viewport={"width": 1280, "height": 720},
            record_video_dir=RECORD_DIR,
            record_video_size={"width": 1280, "height": 720},
        )
        page1 = ctx1.new_page()

        login(page1, BASE_URL, USERNAME, PASSWORD)
        goto_via_menu(page1, "Evaluaciones", "AutoEvaluación")
        dismiss_swal(page1)
        page1.wait_for_timeout(t_intro)

        scroll_to_section(page1, "Compromisos y Próximos Pasos")
        page1.wait_for_timeout(500)

        highlight_briefly(page1, ".my-4.card.p-4 p.text-muted.mb-3", duration_ms=3000)
        page1.wait_for_timeout(t_instruccion)

        page1.evaluate("window.scrollBy(0, 120)")
        page1.wait_for_timeout(t_colab_campo)

        ctx1.close()
        page1.close()

        # ── PARTE 2: Vista del supervisor ─────────────────────────────
        ctx2 = browser.new_context(
            viewport={"width": 1280, "height": 720},
            record_video_dir=RECORD_DIR,
            record_video_size={"width": 1280, "height": 720},
        )
        page2 = ctx2.new_page()

        login(page2, BASE_URL, USERNAME_SUPER, PASSWORD_SUPER)
        page2.wait_for_timeout(t_super_intro)

        goto_via_menu(page2, "Evaluaciones", "Evaluar Equipo")
        page2.wait_for_load_state("networkidle")
        page2.wait_for_timeout(1500)

        # Click on the first available "Iniciar" / "Continuar" evaluation button
        btn = page2.locator("button:has-text('Iniciar'), button:has-text('Continuar'), button:has-text('Ver')").first
        if btn.is_visible():
            btn.click()
            page2.wait_for_load_state("networkidle")
            page2.wait_for_timeout(2000)
            dismiss_swal(page2)

        scroll_to_section(page2, "Compromisos y Próximos Pasos")
        page2.wait_for_timeout(500)
        page2.evaluate("window.scrollBy(0, 120)")
        page2.wait_for_timeout(t_super_vista)

        ctx2.close()
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
