"""
VIDEO 3 — Evaluación de Subordinados (Supervisor)
=================================================
Muestra: supervisor accede a la pantalla de EvaluarSubordinados, ve el estado
de las autoevaluaciones de su equipo, abre la de un subordinado y registra su
evaluación supervisora.
Supervisor: PRODRIGUEZ (secuencial=55), ve a RALCANTARA(525) y SOTO BIDO(539).
Duración aprox.: 90-120 segundos.
"""

import sys, shutil
from pathlib import Path
from playwright.sync_api import sync_playwright

sys.path.insert(0, str(Path(__file__).parent))
from helpers import Narrator, mix_video_audio, find_latest_webm, login, goto_via_menu

# ═══════════════════════════════════════════════════════════════════
# CONFIGURACIÓN — editar antes de ejecutar
# ═══════════════════════════════════════════════════════════════════
BASE_URL   = "http://192.168.7.222/evaluacionempleado-prueba/"
USERNAME   = "***REMOVED***"
PASSWORD   = "***REMOVED***"
OUTPUT_MP4 = "video3_supervisor.mp4"
# ═══════════════════════════════════════════════════════════════════

TMP_AUDIO  = Path("_tmp_v3_audio")
RECORD_DIR = "_tmp_v3_video"
Path(RECORD_DIR).mkdir(exist_ok=True)


def run():
    narrator = Narrator(TMP_AUDIO)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, args=["--start-maximized"])
        context = browser.new_context(
            viewport={"width": 1280, "height": 720},
            record_video_dir=RECORD_DIR,
            record_video_size={"width": 1280, "height": 720},
            no_viewport=False
        )
        page = context.new_page()

        # ── 1. Login como supervisor ──────────────────────────────
        wait = narrator.add(
            "En este video vemos el flujo de evaluación desde la perspectiva del supervisor. "
            "Pablo Rodríguez accede al sistema para evaluar a su equipo.",
            delay_after_ms=400
        )
        login(page, BASE_URL, USERNAME, PASSWORD)
        page.wait_for_timeout(wait)

        # ── 2. Navegar a EvaluarSubordinados ─────────────────────
        wait = narrator.add(
            "El supervisor navega a la sección de Evaluación de Equipo, "
            "donde puede ver el estado de cada colaborador a su cargo.",
            delay_after_ms=300
        )
        goto_via_menu(page, "Evaluaciones", "Evaluar Equipo")
        page.wait_for_timeout(2000)   # esperar que carguen los estados
        page.wait_for_timeout(wait)

        # ── 3. Observar lista de subordinados ────────────────────
        wait = narrator.add(
            "La pantalla muestra todos los colaboradores del equipo junto con "
            "el estado de su autoevaluación del período de medio año.",
            delay_after_ms=500
        )
        page.wait_for_timeout(wait)

        # ── 4. Abrir evaluación de un subordinado ─────────────────
        wait = narrator.add(
            "Al hacer clic en Evaluar, el supervisor accede al formulario completo "
            "donde puede revisar la autoevaluación del colaborador y registrar su perspectiva.",
            delay_after_ms=400
        )
        # Buscar botón "Evaluar" del primer subordinado disponible
        evaluar_btn = page.locator(
            "button:has-text('Evaluar'), button:has-text('evaluar'), "
            "button:has-text('Abrir'), button:has-text('Ver')"
        ).first
        if evaluar_btn.is_visible():
            evaluar_btn.click()
            # Dismiss any swal that might confirm the action
            try:
                page.wait_for_selector(".swal2-popup", state="visible", timeout=4000)
                page.wait_for_timeout(300)
                page.evaluate("document.querySelector('.swal2-confirm').click()")
                page.wait_for_selector(".swal2-popup", state="hidden", timeout=4000)
            except Exception:
                pass
            # Esperar que se abra el dialog
            try:
                page.wait_for_selector(
                    "mat-dialog-container, .evaluation-dialog, app-form-evaluacion-supervisor",
                    state="visible", timeout=10000
                )
            except Exception:
                pass
            page.wait_for_load_state("networkidle")
            page.wait_for_timeout(1500)
        page.wait_for_timeout(wait)

        # ── 5. Revisar autoevaluación del colaborador ─────────────
        wait = narrator.add(
            "El supervisor puede ver las calificaciones que el colaborador asignó "
            "a cada competencia durante su autoevaluación.",
            delay_after_ms=400
        )
        page.wait_for_timeout(wait)

        # ── 6. Calificar desde perspectiva supervisora ────────────
        wait = narrator.add(
            "El supervisor completa su propia evaluación para cada competencia, "
            "basándose en las observaciones del período.",
            delay_after_ms=500
        )
        # Selectores de calificación del supervisor (repuestasupervisor)
        sup_selects = page.locator(
            "select[formcontrolname='repuestasupervisor'], "
            "select[name*='supervisor' i], "
            "app-criterialitem select:nth-child(2)"
        ).all()

        for i, sel in enumerate(sup_selects[:5]):
            if sel.is_visible():
                try:
                    sel.select_option(str((i % 3) + 3))
                    page.wait_for_timeout(400)
                except Exception:
                    pass
        page.wait_for_timeout(wait)

        # ── 7. Desplazar y continuar ──────────────────────────────
        wait = narrator.add(
            "El formulario permite agregar observaciones específicas para cada competencia, "
            "enriqueciendo la retroalimentación al colaborador.",
            delay_after_ms=400
        )
        page.keyboard.press("End")
        page.wait_for_timeout(1200)

        for i, sel in enumerate(sup_selects[5:10]):
            if sel.is_visible():
                try:
                    sel.select_option(str((i % 3) + 2))
                    page.wait_for_timeout(350)
                except Exception:
                    pass
        page.wait_for_timeout(wait)

        # ── 8. Guardar evaluación supervisora ────────────────────
        wait = narrator.add(
            "Al guardar, la evaluación supervisora queda registrada en el sistema. "
            "El colaborador podrá ver los resultados en su historial de evaluaciones.",
            delay_after_ms=500
        )
        # Dismiss any lingering swal before clicking save
        try:
            page.evaluate("document.querySelector('.swal2-confirm')?.click()")
            page.wait_for_timeout(400)
        except Exception:
            pass
        save_btn = page.locator(
            "button:has-text('Guardar'), button:has-text('guardar'), "
            "button:has-text('Completar'), button:has-text('Someter')"
        ).first
        if save_btn.is_visible():
            save_btn.evaluate("el => el.click()")
            page.wait_for_load_state("networkidle")
            page.wait_for_timeout(1500)
        # Dismiss swal after save
        try:
            page.wait_for_selector(".swal2-popup", state="visible", timeout=4000)
            page.wait_for_timeout(300)
            page.evaluate("document.querySelector('.swal2-confirm').click()")
            page.wait_for_selector(".swal2-popup", state="hidden", timeout=4000)
        except Exception:
            pass
        page.wait_for_timeout(wait)

        # ── 9. Cierre del dialog y regreso a lista ────────────────
        wait = narrator.add(
            "El supervisor regresa a la lista del equipo, donde puede ver el nuevo "
            "estado de la evaluación y continuar con los demás colaboradores.",
            delay_after_ms=1500
        )
        # Cerrar dialog si sigue abierto
        close_btn = page.locator(
            "button:has-text('Cerrar'), button[mat-dialog-close], "
            "[mat-dialog-close], button.close"
        ).first
        if close_btn.is_visible():
            close_btn.click()
            page.wait_for_timeout(800)
        page.wait_for_timeout(wait)

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
