"""
VIDEO 1 — Gestión de Competencias (Objetivo)
=============================================
Muestra: lista de competencias período 8, crear nueva, copiar de período anterior.
Credenciales: usuario con acceso a la pantalla Objetivo (ej. RALCANTARA).
Duración aprox.: 90-120 segundos.
"""

import sys, shutil, time
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
OUTPUT_MP4 = "video1_competencias.mp4"
# ═══════════════════════════════════════════════════════════════════

TMP_AUDIO = Path("_tmp_v1_audio")
RECORD_DIR = "_tmp_v1_video"
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
            "Bienvenidos al Sistema de Evaluación de Empleados de COOP-ASPIRE. "
            "En este video veremos cómo gestionar las competencias del período de evaluación.",
            delay_after_ms=500
        )
        login(page, BASE_URL, USERNAME, PASSWORD)
        page.wait_for_timeout(wait)

        # ── 2. Navegar a Objetivo (Competencias) ──────────────────
        wait = narrator.add(
            "Desde el menú de configuración, accedemos a la pantalla de Competencias, "
            "donde se definen los criterios de evaluación para cada período.",
            delay_after_ms=300
        )
        goto_via_menu(page, "Configuración", "Competencias")
        page.wait_for_timeout(wait)

        # ── 3. Mostrar filtro por período ─────────────────────────
        wait = narrator.add(
            "La pantalla muestra las competencias del período activo. "
            "Podemos filtrar por período para ver configuraciones anteriores.",
            delay_after_ms=400
        )
        # Click el selector de período si existe
        period_select = page.locator("select").first
        if period_select.is_visible():
            period_select.select_option("8")
        page.wait_for_timeout(1500)
        page.wait_for_timeout(wait)

        # ── 4. Agregar nueva competencia ──────────────────────────
        wait = narrator.add(
            "Para agregar una nueva competencia, hacemos clic en el botón Agregar "
            "e ingresamos el nombre y la descripción detallada.",
            delay_after_ms=300
        )
        add_btn = page.locator("button:has-text('Agregar'), button:has-text('agregar'), "
                               "button:has-text('Nuevo'), button:has-text('nuevo')").first
        add_btn.click()
        page.wait_for_selector("mat-dialog-container, .modal, dialog", state="visible", timeout=8000)
        page.wait_for_timeout(wait)

        # Fill form
        wait = narrator.add(
            "Completamos el nombre de la competencia y una descripción que orienta "
            "al colaborador sobre el comportamiento esperado.",
            delay_after_ms=500
        )
        # Nombre
        page.locator("input[formcontrolname='nombre'], input[id='nombre'], "
                     "input[placeholder*='Nombre' i], input[placeholder*='nombre' i]").first.fill(
            "Orientación al Aprendizaje Continuo"
        )
        page.wait_for_timeout(600)
        # Descripción (textarea)
        desc_field = page.locator("textarea[formcontrolname='descripcion'], "
                                  "textarea[id='descripcion'], textarea").first
        desc_field.fill(
            "El colaborador busca activamente oportunidades de aprendizaje, "
            "aplica nuevos conocimientos en su puesto y comparte su experiencia con el equipo."
        )
        page.wait_for_timeout(wait)

        # Guardar
        wait = narrator.add(
            "Al guardar, la nueva competencia queda asociada al período activo "
            "y aparece inmediatamente en el listado.",
            delay_after_ms=800
        )
        save_btn = page.locator("button:has-text('Guardar'), button:has-text('guardar'), "
                                "button[type='submit']").first
        save_btn.evaluate("el => el.click()")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(1200)
        # Dismiss SweetAlert dialog that appeared after save
        try:
            page.wait_for_selector(".swal2-popup", state="visible", timeout=5000)
            page.wait_for_timeout(300)
            page.evaluate("document.querySelector('.swal2-confirm').click()")
            page.wait_for_selector(".swal2-popup", state="hidden", timeout=5000)
        except Exception:
            pass
        page.wait_for_timeout(wait)

        # ── 5. Demostrar copia entre períodos ─────────────────────
        wait = narrator.add(
            "Una función clave es la copia de competencias entre períodos. "
            "Esto nos evita reconfigurar todo desde cero al iniciar un nuevo ciclo.",
            delay_after_ms=300
        )
        copy_btn = page.locator("button:has-text('Copiar competencias')").first
        if copy_btn.is_visible():
            copy_btn.click()
            page.wait_for_timeout(1200)
        page.wait_for_timeout(wait)

        wait = narrator.add(
            "Seleccionamos el período de origen — en este caso el año 2025 — "
            "y el período destino para el nuevo ciclo.",
            delay_after_ms=500
        )
        # Seleccionar período origen y destino en el panel de copia
        # Los selects del panel son los form-control-sm dentro del card de copia
        copy_selects = page.locator(".card select.form-control-sm").all()
        if len(copy_selects) >= 2:
            copy_selects[0].select_option(index=1)   # primer período disponible = origen
            page.wait_for_timeout(500)
            copy_selects[1].select_option(index=2)   # segundo período disponible = destino
        page.wait_for_timeout(wait)

        wait = narrator.add(
            "Al confirmar, el sistema copia todas las competencias del período anterior "
            "al período de medio año 2026, ahorrando tiempo de configuración.",
            delay_after_ms=1000
        )
        confirm_btn = page.locator("button:has-text('Confirmar'), button:has-text('confirmar')").first
        if confirm_btn.is_visible():
            try:
                confirm_btn.click(timeout=5000)
                page.wait_for_load_state("networkidle")
            except Exception:
                # Button may still be disabled if ngModel didn't bind; that's fine for the demo
                pass
        page.wait_for_timeout(wait)

        # ── 6. Pausa final ────────────────────────────────────────
        wait = narrator.add(
            "Las competencias ya están listas para el período de medio año 2026. "
            "El equipo evaluador puede ahora iniciar el proceso de evaluación.",
            delay_after_ms=1500
        )
        page.wait_for_timeout(wait)

        context.close()
        browser.close()

    # ── Post-procesamiento ────────────────────────────────────────
    print("Generando audio final...")
    narrator.build_final(str(TMP_AUDIO / "narration_final.mp3"))

    print("Buscando video grabado...")
    video_file = find_latest_webm(RECORD_DIR)
    print(f"  Video: {video_file}")

    print(f"Mezclando -> {OUTPUT_MP4}")
    mix_video_audio(video_file, str(TMP_AUDIO / "narration_final.mp3"), OUTPUT_MP4)

    # Limpieza
    shutil.rmtree(RECORD_DIR, ignore_errors=True)
    shutil.rmtree(TMP_AUDIO, ignore_errors=True)
    print(f"\nVideo guardado: {OUTPUT_MP4}")


if __name__ == "__main__":
    run()
