"""
VIDEO 3 — Evaluación de Subordinados (Supervisor)
=================================================
Flujo:
  1. Login como PRODRIGUEZ (supervisor)
  2. Navegar a Evaluar Equipo
  3. Observar la lista de subordinados y estados
  4. Abrir evaluación de un colaborador
  5. Calificar competencias desde perspectiva supervisora
  6. Guardar evaluación
  7. Regresar a la lista
"""

import os, sys, shutil
from pathlib import Path
from playwright.sync_api import sync_playwright

sys.path.insert(0, str(Path(__file__).parent))
from helpers import Narrator, mix_video_audio, find_latest_webm, login, goto_via_menu

BASE_URL      = os.environ.get("EVAL_BASE_URL",   "http://192.168.7.222/evaluacionempleado-prueba/")
USERNAME      = os.environ.get("EVAL_USERNAME_SUPER", os.environ.get("EVAL_USERNAME"))
PASSWORD      = os.environ.get("EVAL_PASSWORD_SUPER", os.environ.get("EVAL_PASSWORD"))

if not USERNAME or not PASSWORD:
    raise SystemExit("ERROR: Set EVAL_USERNAME_SUPER (or EVAL_USERNAME) and EVAL_PASSWORD_SUPER (or EVAL_PASSWORD) before running.")
OUTPUT_MP4 = "video3_supervisor.mp4"

TMP_AUDIO  = Path("_tmp_v3_audio")
RECORD_DIR = "_tmp_v3_video"
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
        "En este video vemos la evaluación desde la perspectiva del supervisor. "
        "Pablo Rodríguez accede al sistema para evaluar a su equipo.",
        delay_after_ms=500
    )
    t_nav = narrator.add(
        "Desde el menú Evaluaciones, el supervisor accede a Evaluar Equipo, "
        "donde puede ver el estado de las autoevaluaciones de cada colaborador a su cargo.",
        delay_after_ms=400
    )
    t_lista = narrator.add(
        "La pantalla muestra el equipo completo del supervisor junto con el estado "
        "de cada autoevaluación del período de medio año.",
        delay_after_ms=500
    )
    t_abrir = narrator.add(
        "Al hacer clic en Evaluar, el supervisor accede al formulario del colaborador "
        "para revisar su autoevaluación y registrar su perspectiva supervisora.",
        delay_after_ms=400
    )
    t_revisar = narrator.add(
        "El supervisor puede ver las calificaciones que el colaborador asignó "
        "a cada competencia durante su autoevaluación.",
        delay_after_ms=400
    )
    t_calificar1 = narrator.add(
        "El supervisor completa su propia evaluación para cada competencia, "
        "basándose en las observaciones del período.",
        delay_after_ms=400
    )
    t_scroll = narrator.add(
        "El formulario permite agregar observaciones específicas para cada competencia, "
        "enriqueciendo la retroalimentación al colaborador.",
        delay_after_ms=400
    )
    t_calificar2 = narrator.add(
        "Continúa completando las competencias restantes con su valoración objetiva "
        "del desempeño del colaborador durante el primer semestre.",
        delay_after_ms=400
    )
    t_guardar = narrator.add(
        "Al guardar, la evaluación supervisora queda registrada en el sistema. "
        "El colaborador podrá ver los resultados en su historial de evaluaciones.",
        delay_after_ms=500
    )
    t_final = narrator.add(
        "El supervisor regresa a la lista del equipo, donde puede ver el nuevo estado "
        "de la evaluación y continuar con los demás colaboradores.",
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

        # ── 2. Navegar a Evaluar Equipo ───────────────────────────
        goto_via_menu(page, "Evaluaciones", "Evaluar Equipo")
        page.wait_for_timeout(2000)
        page.wait_for_timeout(t_nav)

        # ── 3. Observar lista de subordinados ─────────────────────
        page.wait_for_timeout(t_lista)

        # ── 4. Abrir evaluación de un subordinado ─────────────────
        evaluar_btn = page.locator("button:has-text('Evaluar'), button:has-text('evaluar')").first
        if evaluar_btn.is_visible():
            evaluar_btn.click()
            dismiss_swal(page)
            try:
                page.wait_for_selector(
                    "mat-dialog-container, app-form-evaluacion-supervisor",
                    state="visible", timeout=10000
                )
            except Exception:
                pass
            page.wait_for_load_state("networkidle")
            page.wait_for_timeout(1200)
        page.wait_for_timeout(t_abrir)

        # ── 5. Revisar autoevaluación del colaborador ─────────────
        page.wait_for_timeout(t_revisar)

        # ── 6. Calificar desde perspectiva supervisora ────────────
        sup_selects = page.locator(
            "select[formcontrolname='repuestasupervisor'], "
            "app-criterialitem select:last-child"
        ).all()
        for i, sel in enumerate(sup_selects[:5]):
            if sel.is_visible():
                try:
                    sel.select_option(str((i % 3) + 3))
                    page.wait_for_timeout(350)
                except Exception:
                    pass
        page.wait_for_timeout(t_calificar1)

        # ── 7. Scroll y continuar ─────────────────────────────────
        page.keyboard.press("End")
        page.wait_for_timeout(1000)
        page.wait_for_timeout(t_scroll)

        for i, sel in enumerate(sup_selects[5:11]):
            if sel.is_visible():
                try:
                    sel.select_option(str((i % 3) + 2))
                    page.wait_for_timeout(300)
                except Exception:
                    pass
        page.wait_for_timeout(t_calificar2)

        # ── 8. Guardar evaluación supervisora ────────────────────
        # Limpiar cualquier swal pendiente antes de guardar
        try:
            page.evaluate("document.querySelector('.swal2-confirm')?.click()")
            page.wait_for_timeout(300)
        except Exception:
            pass
        save_btn = page.locator(
            "button:has-text('Guardar Avance'), button:has-text('Guardar avance'), "
            "button:has-text('Guardar'), button:has-text('Someter')"
        ).first
        if save_btn.is_visible():
            save_btn.evaluate("el => el.click()")
            page.wait_for_load_state("networkidle")
            page.wait_for_timeout(800)
            dismiss_swal(page)
        page.wait_for_timeout(t_guardar)

        # ── 9. Cerrar dialog y ver lista actualizada ──────────────
        close_btn = page.locator(
            "button:has-text('Cerrar'), button[mat-dialog-close], [mat-dialog-close]"
        ).first
        if close_btn.is_visible():
            close_btn.click()
            page.wait_for_timeout(800)
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
