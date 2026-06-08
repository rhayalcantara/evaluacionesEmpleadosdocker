"""
VIDEO 2 — Autoevaluación del Colaborador (Período Medio Año)
=============================================================
Flujo:
  1. Login como RALCANTARA
  2. Navegar a AutoEvaluación
  3. Observar el formulario con las competencias cargadas
  4. Calificar competencias (primeras y segundas tras scroll)
  5. Guardar avance
  6. Someter al supervisor
"""

import os, sys, shutil
from pathlib import Path
from playwright.sync_api import sync_playwright

sys.path.insert(0, str(Path(__file__).parent))
from helpers import Narrator, mix_video_audio, find_latest_webm, login, goto_via_menu

BASE_URL   = os.environ.get("EVAL_BASE_URL", "http://192.168.7.222/evaluacionempleado-prueba/")
USERNAME   = os.environ.get("EVAL_USERNAME")
PASSWORD   = os.environ.get("EVAL_PASSWORD")

if not USERNAME or not PASSWORD:
    raise SystemExit("ERROR: Set EVAL_USERNAME and EVAL_PASSWORD environment variables before running.")
OUTPUT_MP4 = "video2_colaborador.mp4"

TMP_AUDIO  = Path("_tmp_v2_audio")
RECORD_DIR = "_tmp_v2_video"
Path(RECORD_DIR).mkdir(exist_ok=True)


def dismiss_swal(page):
    try:
        page.wait_for_selector(".swal2-popup", state="visible", timeout=4000)
        page.wait_for_timeout(500)
        page.evaluate("document.querySelector('.swal2-confirm').click()")
        page.wait_for_selector(".swal2-popup", state="hidden", timeout=4000)
    except Exception:
        pass


def run():
    narrator = Narrator(TMP_AUDIO)

    # ── Pre-generar todo el audio ──────────────────────────────────
    t_login = narrator.add(
        "En este video vemos el proceso de autoevaluación de medio año "
        "desde la perspectiva del colaborador.",
        delay_after_ms=500
    )
    t_nav = narrator.add(
        "Desde el menú Evaluaciones, el colaborador accede a su AutoEvaluación. "
        "El sistema carga automáticamente el formulario del período activo.",
        delay_after_ms=400
    )
    t_form = narrator.add(
        "El formulario muestra las competencias definidas para el cargo del colaborador. "
        "Cada una incluye una descripción del comportamiento esperado.",
        delay_after_ms=500
    )
    t_rate1 = narrator.add(
        "El colaborador evalúa cada competencia seleccionando la calificación "
        "que mejor refleja su desempeño durante el primer semestre.",
        delay_after_ms=400
    )
    t_scroll = narrator.add(
        "El formulario incluye todas las competencias del período. "
        "El colaborador puede desplazarse para continuar completando su autoevaluación.",
        delay_after_ms=400
    )
    t_rate2 = narrator.add(
        "Continúa calificando las competencias restantes con la misma reflexión "
        "sobre su desempeño y comportamiento durante el período.",
        delay_after_ms=400
    )
    t_save = narrator.add(
        "El colaborador puede guardar su avance en cualquier momento "
        "para retomar la evaluación más tarde sin perder lo completado.",
        delay_after_ms=500
    )
    t_submit = narrator.add(
        "Una vez completadas todas las competencias, somete su autoevaluación al supervisor "
        "para iniciar la etapa de revisión y retroalimentación.",
        delay_after_ms=500
    )
    t_final = narrator.add(
        "La autoevaluación de medio año queda registrada en el sistema. "
        "El supervisor recibirá notificación para continuar el proceso.",
        delay_after_ms=1500
    )

    # ── Grabación del browser ──────────────────────────────────────
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, args=["--start-maximized"])
        context = browser.new_context(
            viewport={"width": 1280, "height": 720},
            record_video_dir=RECORD_DIR,
            record_video_size={"width": 1280, "height": 720},
            no_viewport=False
        )
        page = context.new_page()

        # ── 1. Login ──────────────────────────────────────────────
        login(page, BASE_URL, USERNAME, PASSWORD)
        page.wait_for_timeout(t_login)

        # ── 2. Navegar a AutoEvaluación ───────────────────────────
        goto_via_menu(page, "Evaluaciones", "AutoEvaluación")
        try:
            page.wait_for_selector("app-loading, .loading-overlay", state="hidden", timeout=12000)
        except Exception:
            pass
        page.wait_for_timeout(1200)
        page.wait_for_timeout(t_nav)

        # ── 3. Observar formulario ────────────────────────────────
        page.wait_for_timeout(t_form)

        # ── 4. Calificar primeras competencias ────────────────────
        rating_selects = page.locator(
            "select[formcontrolname='repuesta'], app-criterialitem select, app-emojirating select"
        ).all()
        for i, sel in enumerate(rating_selects[:5]):
            if sel.is_visible():
                try:
                    sel.select_option(str((i % 4) + 2))
                    page.wait_for_timeout(350)
                except Exception:
                    pass
        page.wait_for_timeout(t_rate1)

        # ── 5. Scroll para ver más competencias ───────────────────
        page.keyboard.press("End")
        page.wait_for_timeout(1000)
        page.wait_for_timeout(t_scroll)

        # ── 6. Calificar competencias restantes ───────────────────
        rating_selects_all = page.locator(
            "select[formcontrolname='repuesta'], app-criterialitem select, app-emojirating select"
        ).all()
        for i, sel in enumerate(rating_selects_all[5:11]):
            if sel.is_visible():
                try:
                    sel.select_option(str((i % 3) + 3))
                    page.wait_for_timeout(300)
                except Exception:
                    pass
        page.wait_for_timeout(t_rate2)

        # ── 7. Guardar avance ─────────────────────────────────────
        save_btn = page.locator(
            "button:has-text('Guardar Avance'), button:has-text('Guardar avance'), "
            "button:has-text('Guardar')"
        ).first
        if save_btn.is_visible():
            save_btn.evaluate("el => el.click()")
            page.wait_for_load_state("networkidle")
            page.wait_for_timeout(800)
            dismiss_swal(page)
        page.wait_for_timeout(t_save)

        # ── 8. Someter al supervisor ──────────────────────────────
        submit_btn = page.locator(
            "button:has-text('Someter'), button:has-text('Enviar'), button:has-text('Completar')"
        ).first
        if submit_btn.is_visible():
            submit_btn.evaluate("el => el.click()")
            page.wait_for_load_state("networkidle")
            page.wait_for_timeout(800)
            dismiss_swal(page)
        page.wait_for_timeout(t_submit)

        # ── 9. Pausa final ────────────────────────────────────────
        page.wait_for_timeout(t_final)

        context.close()
        browser.close()

    print("Generando audio final...")
    narrator.build_final(str(TMP_AUDIO / "narration_final.mp3"))

    print("Buscando video grabado...")
    video_file = find_latest_webm(RECORD_DIR)
    print(f"  Video: {video_file}")

    print(f"Mezclando -> {OUTPUT_MP4}")
    mix_video_audio(video_file, str(TMP_AUDIO / "narration_final.mp3"), OUTPUT_MP4)

    shutil.rmtree(RECORD_DIR, ignore_errors=True)
    shutil.rmtree(TMP_AUDIO, ignore_errors=True)
    print(f"\nVideo guardado: {OUTPUT_MP4}")


if __name__ == "__main__":
    run()
