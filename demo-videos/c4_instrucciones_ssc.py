"""
CORRECCIÓN 4 — Instrucciones actualizadas en Retroalimentación (Start-Stop-Continue)

Fixes aplicados:
- Zoom 90% para que las 4 tarjetas queden dentro del viewport
- Scroll INMEDIATO a la sección SSC (sin wait extra post-navegación)
  para evitar el desfase entre narración y video
- Selectores robustos para el párrafo de instrucción y las tarjetas
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


def highlight_by_text(page, contains_text: str, duration_ms: int = 2500):
    """Resalta el primer párrafo que contiene el texto dado."""
    page.evaluate(f"""
      () => {{
        const el = Array.from(document.querySelectorAll('p.text-muted, h6'))
                        .find(e => e.textContent.includes('{contains_text}'));
        if (!el) return;
        const prev = el.style.cssText;
        el.style.outline = '3px solid #f59e0b';
        el.style.boxShadow = '0 0 0 6px rgba(245,158,11,0.25)';
        el.style.borderRadius = '4px';
        setTimeout(() => {{ el.style.cssText = prev; }}, {duration_ms});
      }}
    """)


def highlight_card(page, border_class: str, duration_ms: int = 2500):
    """Resalta la primera tarjeta con la clase de borde dada."""
    page.evaluate(f"""
      () => {{
        const el = document.querySelector('.{border_class}');
        if (!el) return;
        const prev = el.style.cssText;
        el.style.outline = '3px solid #f59e0b';
        el.style.boxShadow = '0 0 0 8px rgba(245,158,11,0.3)';
        el.style.borderRadius = '8px';
        setTimeout(() => {{ el.style.cssText = prev; }}, {duration_ms});
      }}
    """)


def run():
    narrator = Narrator(TMP_AUDIO)

    t_intro = narrator.add(
        "Corrección número cuatro: instrucciones de la sección de Retroalimentación de Desempeño. "
        "Navegamos a la autoevaluación de medio año.",
        delay_after_ms=300
    )
    t_instruccion_principal = narrator.add(
        "La instrucción principal de la sección ahora indica: "
        "Basado en los objetivos y competencias evaluados, registre acciones concretas "
        "en cada categoría. Esto conecta directamente la retroalimentación con "
        "lo que fue evaluado previamente en el formulario.",
        delay_after_ms=500
    )
    t_continuar = narrator.add(
        "El primer cuadro, Continuar Haciendo, tiene la descripción: "
        "Actividades o prácticas que funcionan bien y deben mantenerse.",
        delay_after_ms=300
    )
    t_mas = narrator.add(
        "El segundo cuadro, Hacer Más, indica: "
        "Acciones que necesitan mayor esfuerzo o frecuencia para lograr los objetivos.",
        delay_after_ms=300
    )
    t_menos = narrator.add(
        "El tercer cuadro, Hacer Menos, dice: "
        "Actividades que consumen demasiado tiempo sin el resultado esperado.",
        delay_after_ms=300
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
        page.wait_for_timeout(800)

        # Aplicar zoom 90% para que las 4 tarjetas SSC quepan en pantalla
        page.evaluate("document.documentElement.style.zoom = '0.9'")
        page.wait_for_timeout(400)

        # CLAVE: scroll INMEDIATO a la sección SSC — sin esperar t_intro.
        # La narración del intro sigue sonando mientras el navegador se desplaza,
        # evitando el desfase de ~6s que causaba el wait post-navegación anterior.
        scroll_to_section(page, "Retroalimentación de Desempeño")
        page.wait_for_timeout(t_intro)   # intro termina mientras la sección ya está visible

        # Resaltar el párrafo de instrucción principal
        highlight_by_text(page, "Basado en los objetivos", duration_ms=min(t_instruccion_principal - 300, 4000))
        page.wait_for_timeout(t_instruccion_principal)

        # Fila 1 de tarjetas: "Continuar Haciendo" + "Hacer Más"
        # Las dos primeras tarjetas ya deben estar en vista tras el scroll
        highlight_card(page, "border-success", duration_ms=min(t_continuar - 200, 3000))
        page.wait_for_timeout(t_continuar)

        highlight_card(page, "border-primary", duration_ms=min(t_mas - 200, 3000))
        page.wait_for_timeout(t_mas)

        # Fila 2 de tarjetas: "Hacer Menos" + "Parar de Hacer" — desplazar para verlas
        page.evaluate("window.scrollBy({top: 380, behavior: 'smooth'})")
        page.wait_for_timeout(700)

        highlight_card(page, "border-warning", duration_ms=min(t_menos - 200, 3000))
        page.wait_for_timeout(t_menos)

        highlight_card(page, "border-danger", duration_ms=min(t_parar - 200, 3000))
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
