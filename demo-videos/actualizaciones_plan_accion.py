"""
DEMO — Actualizaciones tras la validación de QA (Plan de Acción)

Graba contra el ambiente de PRUEBA (QA directo o ng serve --configuration prueba).
Muestra las tres actualizaciones aplicadas el 2026-07-22:

  A) Sección de cierre renombrada a "Plan de Acción, Compromiso y Comentario",
     con el campo "Compromiso y Comentario" y su nueva descripción.
  B) Botón "Plan de acción" que abre la matriz de 7 columnas x 5 filas
     (se llena una fila de ejemplo y se graba la evaluación).
  C) Nuevo reporte "Planes de Acción por Período" en el menú de Reportes,
     con búsqueda, filtro de vencidas y exportación a Excel.

NOTA: la parte B GRABA la autoevaluación de EVAL_USERNAME en la base de prueba
(igual que test-grabar-medioano.mjs) para que el reporte de la parte C muestre datos.

Requiere demo-videos/.env con EVAL_USERNAME/EVAL_PASSWORD (usuario con rol Admin
para poder ver el menú de Reportes).
"""
import os, sys, shutil, time, subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright

sys.path.insert(0, str(Path(__file__).parent))
from helpers import (Narrator, mix_video_audio, find_latest_webm,
                     login, goto_via_menu, scroll_to_section, dismiss_swal)

_envfile = Path(__file__).parent / ".env"
if _envfile.exists():
    for line in _envfile.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())

BASE_URL = os.environ.get("EVAL_BASE_URL", "http://192.168.7.222/evaluacionempleado-prueba/")
USERNAME = os.environ.get("EVAL_USERNAME")
PASSWORD = os.environ.get("EVAL_PASSWORD")
if not USERNAME or not PASSWORD:
    raise SystemExit("ERROR: define EVAL_USERNAME y EVAL_PASSWORD (en demo-videos/.env).")

OUTPUT_MP4 = "actualizaciones_plan_accion.mp4"

FILA_DEMO = {
    "accion": "Completar el curso de análisis de datos del plan de capacitación",
    "objetivo": "Aprendizaje y crecimiento",
    "responsable": "Rhay Alcántara",
    "soporte": "Gestión Humana",
    "recursos": "Licencia de la plataforma de cursos",
    "fecha": "2026-09-30",
}


def make_silence(seconds: float, out_file: str):
    subprocess.run([
        "ffmpeg", "-y", "-f", "lavfi", "-i", "anullsrc=r=24000:cl=mono",
        "-t", f"{max(seconds, 0.05):.3f}", "-q:a", "9", "-acodec", "libmp3lame", out_file
    ], capture_output=True)


def hl_text(page, contains_text: str, duration_ms: int = 3000):
    page.evaluate(f"""
      () => {{
        const el = Array.from(document.querySelectorAll('p, h2, h6, label, button, span'))
                        .find(e => e.textContent.includes({contains_text!r}));
        if (!el) return;
        const prev = el.style.cssText;
        el.style.outline = '3px solid #f59e0b';
        el.style.boxShadow = '0 0 0 6px rgba(245,158,11,0.25)';
        el.style.borderRadius = '4px';
        el.scrollIntoView({{behavior: 'smooth', block: 'center'}});
        setTimeout(() => {{ el.style.cssText = prev; }}, {duration_ms});
      }}
    """)


def mix_with_preroll(record_dir, narration_mp3, preroll_ms, output_mp4, tmp_dir):
    preroll_mp3 = str(tmp_dir / "preroll.mp3")
    make_silence(preroll_ms / 1000.0, preroll_mp3)
    final_mp3 = str(tmp_dir / "final.mp3")
    subprocess.run([
        "ffmpeg", "-y", "-i", preroll_mp3, "-i", narration_mp3,
        "-filter_complex", "[0:a][1:a]concat=n=2:v=0:a=1[out]",
        "-map", "[out]", final_mp3
    ], capture_output=True)
    video_file = find_latest_webm(record_dir)
    mix_video_audio(video_file, final_mp3, output_mp4)


# ─── PARTE 1: FORMULARIO (sección + matriz) ───────────────────────────────────
def grabar_formulario(p, out_mp4):
    tmp_audio = Path("_tmp_plan_audio")
    rec_dir = "_tmp_plan_video"
    Path(rec_dir).mkdir(exist_ok=True)
    narrator = Narrator(tmp_audio)

    t_intro = narrator.add(
        "Demostración de las actualizaciones aplicadas a la evaluación de mitad de año, "
        "según lo solicitado en la validación de calidad.", delay_after_ms=300)
    t_seccion = narrator.add(
        "La sección de cierre ahora se titula Plan de Acción, Compromiso y Comentario. "
        "El campo Compromiso y Comentario incorpora la nueva descripción: escriba su "
        "compromiso para el cumplimiento de los objetivos establecidos, incrementar la "
        "ejecución en el puesto y cualquier comentario adicional.", delay_after_ms=500)
    t_boton = narrator.add(
        "El plan de acción ahora se registra con el nuevo botón, que abre el cuadro "
        "solicitado.", delay_after_ms=400)
    t_matriz = narrator.add(
        "La matriz tiene las siete columnas del formato acordado: acciones, objetivo o "
        "competencia que impacta, responsable, soporte requerido, recursos requeridos y "
        "fecha de cierre, con cinco filas disponibles.", delay_after_ms=400)
    t_llenar = narrator.add(
        "Registramos una acción de ejemplo con su responsable, soporte, recursos y fecha "
        "de cierre, y la grabamos.", delay_after_ms=400)
    t_contador = narrator.add(
        "El formulario muestra cuántas acciones quedaron registradas. Al grabar la "
        "evaluación, el plan de acción se guarda junto con ella.", delay_after_ms=800)

    ctx = p.new_context(viewport={"width": 1280, "height": 720},
                        record_video_dir=rec_dir,
                        record_video_size={"width": 1280, "height": 720})
    page = ctx.new_page()
    t0 = time.time()

    login(page, BASE_URL, USERNAME, PASSWORD)
    goto_via_menu(page, "Evaluaciones", "AutoEvaluación")
    dismiss_swal(page)
    try:
        page.wait_for_selector("app-form-evaluation-medio-ano", timeout=15000)
    except Exception:
        print("ADVERTENCIA: no se detectó app-form-evaluation-medio-ano")
    page.evaluate("document.documentElement.style.zoom = '0.9'")
    page.wait_for_timeout(400)
    preroll_ms = int((time.time() - t0) * 1000)
    print(f"preroll formulario = {preroll_ms} ms")

    page.wait_for_timeout(t_intro)

    # A) Sección renombrada + campo nuevo
    scroll_to_section(page, "Plan de Acción, Compromiso y Comentario")
    hl_text(page, "Compromiso y Comentario:", duration_ms=min(t_seccion, 7000))
    page.wait_for_timeout(t_seccion)

    # B) Botón + matriz
    hl_text(page, "Plan de acción", duration_ms=min(t_boton, 4000))
    page.wait_for_timeout(t_boton)
    page.locator("button:has-text('Plan de acción')").first.click()
    page.wait_for_selector("app-plan-accion-matriz", timeout=10000)
    page.wait_for_timeout(t_matriz)

    fila1 = page.locator("app-plan-accion-matriz tbody tr").first
    fila1.locator("textarea").nth(0).fill(FILA_DEMO["accion"])
    fila1.locator("textarea").nth(1).fill(FILA_DEMO["objetivo"])
    fila1.locator("input[type='text']").nth(0).fill(FILA_DEMO["responsable"])
    fila1.locator("input[type='text']").nth(1).fill(FILA_DEMO["soporte"])
    fila1.locator("textarea").nth(2).fill(FILA_DEMO["recursos"])
    fila1.locator("input[type='date']").fill(FILA_DEMO["fecha"])
    page.wait_for_timeout(max(t_llenar - 4000, 500))
    page.locator("app-plan-accion-matriz button:has-text('Grabar')").click()
    page.wait_for_selector("app-plan-accion-matriz", state="hidden", timeout=8000)
    page.wait_for_timeout(600)

    # C) Contador + grabar evaluación
    hl_text(page, "acciones registradas", duration_ms=min(t_contador, 5000))
    page.wait_for_timeout(t_contador)
    btn_grabar = page.locator("button:has-text('Grabar Evaluación')").first
    if btn_grabar.count() and btn_grabar.is_visible():
        btn_grabar.click()
        dismiss_swal(page, timeout_ms=20000)
        page.wait_for_timeout(1500)
    else:
        print("ADVERTENCIA: botón 'Grabar Evaluación' no visible (¿evaluación completada?)")

    ctx.close()
    print("Audio formulario...")
    narrator.build_final(str(tmp_audio / "narration.mp3"))
    mix_with_preroll(rec_dir, str(tmp_audio / "narration.mp3"), preroll_ms, out_mp4, tmp_audio)
    shutil.rmtree(rec_dir, ignore_errors=True)
    shutil.rmtree(tmp_audio, ignore_errors=True)


# ─── PARTE 2: REPORTE ─────────────────────────────────────────────────────────
def grabar_reporte(p, out_mp4):
    tmp_audio = Path("_tmp_rep_audio")
    rec_dir = "_tmp_rep_video"
    Path(rec_dir).mkdir(exist_ok=True)
    narrator = Narrator(tmp_audio)

    t_intro = narrator.add(
        "Además, se agregó al menú de Reportes la opción Planes de Acción por Período.",
        delay_after_ms=400)
    t_reporte = narrator.add(
        "El reporte consolida todas las acciones registradas por los colaboradores en el "
        "período seleccionado, con el empleado, su departamento, el estado de la evaluación "
        "y las siete columnas de la matriz.", delay_after_ms=400)
    t_filtros = narrator.add(
        "Permite buscar por empleado, departamento, acción o responsable; filtrar las "
        "acciones con fecha de cierre vencida; y exportar el resultado a Excel para su "
        "seguimiento.", delay_after_ms=1000)

    ctx = p.new_context(viewport={"width": 1280, "height": 720},
                        record_video_dir=rec_dir,
                        record_video_size={"width": 1280, "height": 720})
    page = ctx.new_page()
    t0 = time.time()

    login(page, BASE_URL, USERNAME, PASSWORD)
    goto_via_menu(page, "Reportes", "Planes de Acción por Período")
    try:
        page.wait_for_selector("app-reporte-plan-accion", timeout=15000)
    except Exception:
        print("ADVERTENCIA: no se detectó app-reporte-plan-accion")
    page.evaluate("document.documentElement.style.zoom = '0.9'")
    page.wait_for_timeout(1500)
    preroll_ms = int((time.time() - t0) * 1000)
    print(f"preroll reporte = {preroll_ms} ms")

    page.wait_for_timeout(t_intro)
    hl_text(page, "Reporte — Planes de Acción", duration_ms=min(t_reporte, 6000))
    page.wait_for_timeout(t_reporte)
    hl_text(page, "Exportar a Excel", duration_ms=min(t_filtros, 6000))
    page.wait_for_timeout(t_filtros)

    ctx.close()
    print("Audio reporte...")
    narrator.build_final(str(tmp_audio / "narration.mp3"))
    mix_with_preroll(rec_dir, str(tmp_audio / "narration.mp3"), preroll_ms, out_mp4, tmp_audio)
    shutil.rmtree(rec_dir, ignore_errors=True)
    shutil.rmtree(tmp_audio, ignore_errors=True)


def concat_mp4(parts, output):
    inputs = []
    for f in parts:
        inputs += ["-i", f]
    n = len(parts)
    streams = "".join(f"[{i}:v:0][{i}:a:0]" for i in range(n))
    subprocess.run(
        ["ffmpeg", "-y"] + inputs + [
            "-filter_complex", f"{streams}concat=n={n}:v=1:a=1[v][a]",
            "-map", "[v]", "-map", "[a]",
            "-c:v", "libx264", "-preset", "fast", "-crf", "22",
            "-c:a", "aac", "-b:a", "128k", output
        ], check=True)


def run():
    part_form = "_part_formulario.mp4"
    part_rep = "_part_reporte.mp4"
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, args=["--start-maximized"])
        grabar_formulario(browser, part_form)
        grabar_reporte(browser, part_rep)
        browser.close()

    print("Concatenando partes...")
    concat_mp4([part_form, part_rep], OUTPUT_MP4)
    for f in (part_form, part_rep):
        Path(f).unlink(missing_ok=True)
    print(f"\nVideo guardado: {OUTPUT_MP4}")


if __name__ == "__main__":
    run()
