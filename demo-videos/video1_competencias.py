"""
VIDEO 1 — Gestión de Competencias (Objetivo)
=============================================
Flujo:
  1. Login
  2. Navegar a Competencias
  3. Observar lista existente
  4. Copiar competencias del período anterior  <── escena principal
  5. Agregar una competencia individual nueva  <── complementario
  6. Resultado final
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
OUTPUT_MP4 = "video1_competencias.mp4"

TMP_AUDIO  = Path("_tmp_v1_audio")
RECORD_DIR = "_tmp_v1_video"
Path(RECORD_DIR).mkdir(exist_ok=True)


def dismiss_swal(page):
    """Cierra un SweetAlert si está visible."""
    try:
        page.wait_for_selector(".swal2-popup", state="visible", timeout=4000)
        page.wait_for_timeout(500)
        page.evaluate("document.querySelector('.swal2-confirm').click()")
        page.wait_for_selector(".swal2-popup", state="hidden", timeout=4000)
    except Exception:
        pass


def select_angular(page, selector, value):
    """Selecciona un valor en un select con [(ngModel)] disparando los eventos que Angular necesita."""
    page.evaluate(f"""
      () => {{
        const el = document.querySelector('{selector}');
        if (!el) return;
        const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
        setter.call(el, '{value}');
        el.dispatchEvent(new Event('change', {{ bubbles: true }}));
        el.dispatchEvent(new Event('input',  {{ bubbles: true }}));
      }}
    """)
    page.wait_for_timeout(600)


def run():
    narrator = Narrator(TMP_AUDIO)

    # ── Pre-generar todo el audio antes de abrir el browser ───────
    # Esto garantiza que los tiempos de espera ya están calculados
    # cuando arranca la grabación.
    t_login = narrator.add(
        "Bienvenidos al Sistema de Evaluación de Empleados de COOPASPIRE. "
        "En este video veremos cómo gestionar las competencias del período de medio año.",
        delay_after_ms=600
    )
    t_nav = narrator.add(
        "Desde el menú Configuración accedemos a la pantalla de Competencias, "
        "donde se definen los criterios de evaluación para cada período.",
        delay_after_ms=400
    )
    t_lista = narrator.add(
        "La pantalla muestra todas las competencias registradas. "
        "Para un período nuevo, en lugar de crearlas una a una, "
        "podemos copiar la configuración completa de un período anterior.",
        delay_after_ms=500
    )
    t_open_copy = narrator.add(
        "Hacemos clic en Copiar competencias para abrir el panel de copia entre períodos.",
        delay_after_ms=400
    )
    t_select = narrator.add(
        "Seleccionamos el período 7 del año 2025 como origen, "
        "y el período 8 —nuestro período de medio año 2026— como destino.",
        delay_after_ms=600
    )
    t_confirm = narrator.add(
        "Al confirmar, el sistema traslada todas las competencias del período anterior "
        "al período de medio año 2026 en segundos, sin necesidad de configurarlas manualmente.",
        delay_after_ms=800
    )
    t_add_intro = narrator.add(
        "Además de la copia masiva, podemos agregar competencias específicas nuevas. "
        "Hacemos clic en Agregar para abrir el formulario.",
        delay_after_ms=400
    )
    t_fill = narrator.add(
        "Ingresamos el nombre de la competencia y una descripción clara "
        "que orientará al colaborador durante su autoevaluación.",
        delay_after_ms=500
    )
    t_save = narrator.add(
        "Al guardar, la nueva competencia queda disponible de inmediato "
        "para el período activo.",
        delay_after_ms=600
    )
    t_final = narrator.add(
        "Las competencias del período de medio año 2026 están configuradas. "
        "Los colaboradores pueden iniciar su proceso de autoevaluación.",
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

        # ── 2. Navegar a Competencias ─────────────────────────────
        goto_via_menu(page, "Configuración", "Competencias")
        page.wait_for_timeout(t_nav)

        # ── 3. Observar lista ─────────────────────────────────────
        # Filtrar por período 8 para mostrar el contexto
        try:
            period_select = page.locator("select.form-control").first
            if period_select.is_visible():
                period_select.select_option("8")
                page.wait_for_timeout(800)
        except Exception:
            pass
        page.wait_for_timeout(t_lista)

        # ── 4. Abrir panel de copia ───────────────────────────────
        copy_btn = page.locator("button:has-text('Copiar competencias')").first
        if copy_btn.is_visible():
            copy_btn.click()
            page.wait_for_timeout(800)
        page.wait_for_timeout(t_open_copy)

        # ── 5. Seleccionar períodos origen/destino ────────────────
        # Usar JS para forzar actualización del ngModel de Angular
        # Los selects del panel de copia son los form-control-sm dentro del .card
        copy_selects = page.locator(".card select.form-control-sm")
        count = copy_selects.count()
        if count >= 2:
            # Obtener las opciones disponibles para elegir valores reales
            options_origen = page.evaluate("""
              () => Array.from(document.querySelectorAll('.card select.form-control-sm')[0]?.options || [])
                         .map(o => o.value).filter(v => v && v !== '0')
            """)
            options_destino = page.evaluate("""
              () => Array.from(document.querySelectorAll('.card select.form-control-sm')[1]?.options || [])
                         .map(o => o.value).filter(v => v && v !== '0')
            """)
            val_origen  = options_origen[0]  if options_origen  else "7"
            val_destino = options_destino[1] if len(options_destino) > 1 else (options_destino[0] if options_destino else "8")

            # Disparar cambio con setter nativo para que Angular detecte el cambio
            page.evaluate(f"""
              () => {{
                const sels = document.querySelectorAll('.card select.form-control-sm');
                const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
                setter.call(sels[0], '{val_origen}');
                sels[0].dispatchEvent(new Event('change', {{ bubbles: true }}));
                sels[0].dispatchEvent(new Event('input',  {{ bubbles: true }}));
              }}
            """)
            page.wait_for_timeout(600)
            page.evaluate(f"""
              () => {{
                const sels = document.querySelectorAll('.card select.form-control-sm');
                const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
                setter.call(sels[1], '{val_destino}');
                sels[1].dispatchEvent(new Event('change', {{ bubbles: true }}));
                sels[1].dispatchEvent(new Event('input',  {{ bubbles: true }}));
              }}
            """)
            page.wait_for_timeout(600)
        page.wait_for_timeout(t_select)

        # ── 6. Confirmar copia ────────────────────────────────────
        confirm_btn = page.locator("button:has-text('Confirmar')").first
        if confirm_btn.is_visible():
            try:
                confirm_btn.click(timeout=6000)
                page.wait_for_load_state("networkidle")
                page.wait_for_timeout(800)
                dismiss_swal(page)
            except Exception:
                pass
        page.wait_for_timeout(t_confirm)

        # ── 7. Abrir formulario de nueva competencia ──────────────
        add_btn = page.locator("button:has-text('Agregar')").first
        if add_btn.is_visible():
            add_btn.click()
            page.wait_for_selector("mat-dialog-container", state="visible", timeout=8000)
            page.wait_for_timeout(600)
        page.wait_for_timeout(t_add_intro)

        # ── 8. Rellenar formulario ────────────────────────────────
        page.locator("input[formcontrolname='nombre'], input[placeholder*='ombre' i]").first.fill(
            "Trabajo en Equipo y Colaboración"
        )
        page.wait_for_timeout(400)
        page.locator("textarea[formcontrolname='descripcion'], textarea").first.fill(
            "Fomenta la cooperación con sus compañeros, comparte información "
            "y contribuye al logro de los objetivos del equipo."
        )
        page.wait_for_timeout(t_fill)

        # ── 9. Guardar nueva competencia ──────────────────────────
        save_btn = page.locator("mat-dialog-container button:has-text('Guardar'), "
                                "mat-dialog-container button[type='submit']").first
        save_btn.evaluate("el => el.click()")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(800)
        dismiss_swal(page)
        page.wait_for_timeout(t_save)

        # ── 10. Pausa final sobre la lista actualizada ────────────
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
