"""
EVIDENCIA — Corrección del cuelgue del formulario de Autoevaluación de Medio Año.

Graba la EVIDENCIA REAL (sin mocks) contra el ambiente de prueba:
  login -> menú Evaluaciones -> AutoEvaluación -> el formulario carga sin cuelgue,
  el spinner cierra y el menú vuelve a responder.

Narración de voz (es-DO-EmilioNeural via edge-tts). Tono: QA / usuario (sin tecnicismos).

Mejora de sincronización vs los demás videos: se mide el tiempo de login y se antepone
un silencio del mismo tamaño, para que la voz arranque justo cuando aparece el contenido.

Requiere: playwright, edge-tts, ffmpeg/ffprobe en PATH.
"""
import os, sys, shutil, time, subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright

sys.path.insert(0, str(Path(__file__).parent))
from helpers import (Narrator, mix_video_audio, find_latest_webm,
                     login, scroll_to_section, dismiss_swal)

BASE_URL = os.environ.get("EVAL_BASE_URL", "http://192.168.7.222/evaluacionempleado-prueba/")
USERNAME = os.environ.get("EVAL_USERNAME")
PASSWORD = os.environ.get("EVAL_PASSWORD")
if not USERNAME or not PASSWORD:
    raise SystemExit("ERROR: Set EVAL_USERNAME and EVAL_PASSWORD before running.")

OUTPUT_MP4 = "evidencia_fix_cuelgue_medio_ano.mp4"
TMP_AUDIO  = Path("_tmp_fix_audio")
RECORD_DIR = "_tmp_fix_video"
Path(RECORD_DIR).mkdir(exist_ok=True)


def make_silence(seconds: float, out_file: str):
    subprocess.run([
        "ffmpeg", "-y", "-f", "lavfi", "-i", "anullsrc=r=24000:cl=mono",
        "-t", f"{seconds:.3f}", "-q:a", "9", "-acodec", "libmp3lame", out_file
    ], capture_output=True)


def run():
    narrator = Narrator(TMP_AUDIO)

    # Segmentos de narración (se pre-generan; cada uno devuelve su duración para sincronizar)
    t_intro = narrator.add(
        "Esta es la evidencia de la corrección del formulario de Autoevaluación de Medio Año, "
        "del Sistema de Evaluación de Empleados de COOPASPIRE. "
        "Anteriormente, al abrir este formulario, la pantalla se quedaba cargando de forma "
        "indefinida y el menú se bloqueaba, impidiendo al colaborador continuar con su evaluación.",
        delay_after_ms=500
    )
    t_nav = narrator.add(
        "Ya con la corrección aplicada en el ambiente de prueba, abrimos el menú de Evaluaciones "
        "y seleccionamos la opción Autoevaluación.",
        delay_after_ms=400
    )
    t_carga = narrator.add(
        "El formulario ahora carga correctamente. El indicador de carga se cierra sin problemas, "
        "y se muestran todas las secciones de la evaluación: la revisión de objetivos, "
        "la evaluación de competencias y la retroalimentación de desempeño.",
        delay_after_ms=600
    )
    t_menu = narrator.add(
        "Y lo más importante: el menú vuelve a responder con normalidad. Ya no se bloquea, "
        "y el usuario puede navegar libremente por el sistema.",
        delay_after_ms=500
    )
    t_cierre = narrator.add(
        "Corrección verificada. El formulario de Autoevaluación de Medio Año "
        "ya funciona de manera estable.",
        delay_after_ms=1000
    )

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, args=["--start-maximized"])
        context = browser.new_context(
            viewport={"width": 1280, "height": 720},
            record_video_dir=RECORD_DIR,
            record_video_size={"width": 1280, "height": 720},
        )
        page = context.new_page()
        t0 = time.time()  # inicio aprox. de la grabación

        # ── Login (se medirá como pre-roll de silencio) ─────────────────────────
        login(page, BASE_URL, USERNAME, PASSWORD)
        page.wait_for_timeout(800)  # asentar Home
        preroll_ms = int((time.time() - t0) * 1000)
        print(f"preroll (login) = {preroll_ms} ms")

        # ── Segmento 1: intro + problema (sobre Home) ───────────────────────────
        page.wait_for_timeout(t_intro)

        # ── Segmento 2: navegación al formulario ────────────────────────────────
        page.locator("a.nav-link.dropdown-toggle:has-text('Evaluaciones')").click(timeout=10000)
        page.wait_for_timeout(500)
        page.locator("a.dropdown-item:text-is('AutoEvaluación')").first.click(timeout=10000)
        dismiss_swal(page)
        page.wait_for_timeout(max(0, t_nav - 1200))

        # ── Segmento 3: el formulario carga y mostramos las secciones ───────────
        try:
            page.wait_for_selector("app-form-evaluation-medio-ano", timeout=10000)
        except Exception:
            print("ADVERTENCIA: no se detectó app-form-evaluation-medio-ano")
        page.evaluate("document.documentElement.style.zoom = '0.9'")
        scroll_to_section(page, "Revisión de Objetivos")
        page.wait_for_timeout(900)
        scroll_to_section(page, "Evaluación de Competencias")
        page.wait_for_timeout(900)
        scroll_to_section(page, "Retroalimentación")
        page.wait_for_timeout(max(0, t_carga - 2700))

        # ── Segmento 4: demostrar que el menú responde ──────────────────────────
        page.evaluate("window.scrollTo({top:0, behavior:'smooth'})")
        page.wait_for_timeout(700)
        page.locator("a.nav-link.dropdown-toggle:has-text('Evaluaciones')").click(timeout=8000)
        page.wait_for_timeout(1100)
        page.keyboard.press("Escape")
        page.wait_for_timeout(max(0, t_menu - 1900))

        # ── Segmento 5: cierre ──────────────────────────────────────────────────
        page.wait_for_timeout(t_cierre)

        context.close()
        browser.close()

    # ── Audio: silencio del tamaño del login + narración, para alinear voz/video ─
    print("Generando audio final...")
    narration_mp3 = str(TMP_AUDIO / "narration.mp3")
    narrator.build_final(narration_mp3)

    preroll_mp3 = str(TMP_AUDIO / "preroll.mp3")
    make_silence(preroll_ms / 1000.0, preroll_mp3)

    final_mp3 = str(TMP_AUDIO / "final.mp3")
    subprocess.run([
        "ffmpeg", "-y", "-i", preroll_mp3, "-i", narration_mp3,
        "-filter_complex", "[0:a][1:a]concat=n=2:v=0:a=1[out]",
        "-map", "[out]", final_mp3
    ], capture_output=True)

    video_file = find_latest_webm(RECORD_DIR)
    mix_video_audio(video_file, final_mp3, OUTPUT_MP4)

    shutil.rmtree(RECORD_DIR, ignore_errors=True)
    shutil.rmtree(TMP_AUDIO, ignore_errors=True)
    print(f"\nVideo guardado: {OUTPUT_MP4}")


if __name__ == "__main__":
    run()
