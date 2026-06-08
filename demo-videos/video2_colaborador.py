"""
VIDEO 2 — Autoevaluación del Colaborador (Período Medio Año)
=============================================================
Muestra: colaborador accede a su evaluación de medio año, califica competencias,
guarda avance y somete para revisión del supervisor.
Colaborador: RALCANTARA (secuencial=525), evaluación id=1808, período 8.
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
OUTPUT_MP4 = "video2_colaborador.mp4"
# ═══════════════════════════════════════════════════════════════════

TMP_AUDIO  = Path("_tmp_v2_audio")
RECORD_DIR = "_tmp_v2_video"
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

        # ── 1. Login ──────────────────────────────────────────────
        wait = narrator.add(
            "En este video vemos el proceso de autoevaluación de medio año "
            "desde la perspectiva del colaborador.",
            delay_after_ms=400
        )
        login(page, BASE_URL, USERNAME, PASSWORD)
        page.wait_for_timeout(wait)

        # ── 2. Navegar a Evaluacion ───────────────────────────────
        wait = narrator.add(
            "Desde el menú principal, el colaborador accede a su evaluación de medio año. "
            "El sistema carga automáticamente el período activo.",
            delay_after_ms=300
        )
        goto_via_menu(page, "Evaluaciones", "AutoEvaluación")
        # Esperar que el loading dialog desaparezca
        try:
            page.wait_for_selector("app-loading, .loading-overlay", state="hidden", timeout=15000)
        except Exception:
            pass
        page.wait_for_timeout(1500)
        page.wait_for_timeout(wait)

        # ── 3. Observar el formulario cargado ─────────────────────
        wait = narrator.add(
            "El formulario de autoevaluación de medio año muestra las competencias "
            "definidas para el cargo del colaborador, organizadas por grupo.",
            delay_after_ms=500
        )
        page.wait_for_timeout(wait)

        # ── 4. Calificar competencias ─────────────────────────────
        wait = narrator.add(
            "El colaborador revisa cada competencia y selecciona la calificación "
            "que mejor describe su desempeño durante el primer semestre.",
            delay_after_ms=400
        )
        # Las competencias usan un sistema de rating (emoji o selector numérico)
        # Intentar hacer clic en los selectores de calificación
        rating_selects = page.locator(
            "select[formcontrolname='repuesta'], "
            "select[name*='repuesta' i], "
            "select.rating-select, "
            "app-emojirating select, "
            "app-criterialitem select"
        ).all()

        for i, sel in enumerate(rating_selects[:5]):
            if sel.is_visible():
                try:
                    sel.select_option(str((i % 4) + 2))   # valores 2-5
                    page.wait_for_timeout(400)
                except Exception:
                    pass

        page.wait_for_timeout(wait)

        # ── 5. Desplazarse por el formulario ─────────────────────
        wait = narrator.add(
            "El formulario incluye once competencias para el período de medio año. "
            "El colaborador evalúa cada una de forma reflexiva y honesta.",
            delay_after_ms=400
        )
        page.keyboard.press("End")
        page.wait_for_timeout(1200)
        # Continuar calificando las restantes
        rating_selects_all = page.locator(
            "select[formcontrolname='repuesta'], "
            "select[name*='repuesta' i], "
            "app-criterialitem select, "
            "app-emojirating select"
        ).all()
        for i, sel in enumerate(rating_selects_all[5:10]):
            if sel.is_visible():
                try:
                    sel.select_option(str((i % 3) + 3))
                    page.wait_for_timeout(350)
                except Exception:
                    pass
        page.wait_for_timeout(wait)

        # ── 6. Guardar avance ─────────────────────────────────────
        wait = narrator.add(
            "El colaborador puede guardar su avance en cualquier momento "
            "sin necesidad de completar todas las competencias de una vez.",
            delay_after_ms=500
        )
        save_btn = page.locator(
            "button:has-text('Guardar'), button:has-text('Guardar Avance'), "
            "button:has-text('guardar')"
        ).first
        if save_btn.is_visible():
            save_btn.click()
            page.wait_for_load_state("networkidle")
            page.wait_for_timeout(1500)
        page.wait_for_timeout(wait)

        # ── 7. Someter evaluación ─────────────────────────────────
        wait = narrator.add(
            "Una vez completadas todas las competencias, el colaborador somete "
            "su autoevaluación al supervisor para su revisión y retroalimentación.",
            delay_after_ms=500
        )
        submit_btn = page.locator(
            "button:has-text('Someter'), button:has-text('someter'), "
            "button:has-text('Enviar'), button:has-text('Completar')"
        ).first
        if submit_btn.is_visible():
            submit_btn.click()
            page.wait_for_load_state("networkidle")
            page.wait_for_timeout(1500)
        page.wait_for_timeout(wait)

        # ── 8. Confirmación ───────────────────────────────────────
        wait = narrator.add(
            "La autoevaluación de medio año queda registrada. "
            "El supervisor recibirá notificación para continuar el proceso.",
            delay_after_ms=1500
        )
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
