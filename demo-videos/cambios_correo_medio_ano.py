"""
DEMO — Ajustes solicitados por correo (Evaluación de Medio Año)

Graba contra el ambiente de PRUEBA local (ng serve --configuration prueba, API :7071,
que tiene el periodo de Medio Año activo). Muestra los cambios:

  A) Texto introductorio de Retroalimentación: más grande, en negrita, menciona "proyectos"
     y la justificación con competencias (hasta 3).
  B) Descripciones largas en las 4 categorías (Continuar / Hacer Más / Hacer Menos / Parar).
  C) Nueva sección "Comentarios, Compromisos y Próximos Pasos" con campo Comentarios
     (colaborador y supervisor).

Estructura: dos clips independientes (colaborador y supervisor), cada uno con su login medido
como pre-roll de silencio para sincronizar voz/video. Al final se concatenan en un solo mp4.

Requiere demo-videos/.env (gitignored) con EVAL_USERNAME/PASSWORD (RALCANTARA) y
EVAL_USERNAME_SUPER/PASSWORD_SUPER (PRODRIGUEZ).
"""
import os, sys, shutil, time, subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright

sys.path.insert(0, str(Path(__file__).parent))
from helpers import (Narrator, mix_video_audio, find_latest_webm,
                     login, goto_via_menu, scroll_to_section, dismiss_swal)

# Carga simple de .env
_envfile = Path(__file__).parent / ".env"
if _envfile.exists():
    for line in _envfile.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())

BASE_URL       = os.environ.get("EVAL_BASE_URL", "http://localhost:4200/evaluacionempleado-prueba/")
USERNAME       = os.environ.get("EVAL_USERNAME")
PASSWORD       = os.environ.get("EVAL_PASSWORD")
USERNAME_SUPER = os.environ.get("EVAL_USERNAME_SUPER", USERNAME)
PASSWORD_SUPER = os.environ.get("EVAL_PASSWORD_SUPER", PASSWORD)
if not USERNAME or not PASSWORD:
    raise SystemExit("ERROR: define EVAL_USERNAME y EVAL_PASSWORD (en demo-videos/.env).")

OUTPUT_MP4 = "cambios_correo_medio_ano.mp4"


def make_silence(seconds: float, out_file: str):
    subprocess.run([
        "ffmpeg", "-y", "-f", "lavfi", "-i", "anullsrc=r=24000:cl=mono",
        "-t", f"{max(seconds, 0.05):.3f}", "-q:a", "9", "-acodec", "libmp3lame", out_file
    ], capture_output=True)


def hl_text(page, contains_text: str, duration_ms: int = 3000):
    """Resalta y centra el primer p/h2/h6/label que contiene el texto dado."""
    page.evaluate(f"""
      () => {{
        const el = Array.from(document.querySelectorAll('p, h2, h6, label'))
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


def hl_card(page, border_class: str, duration_ms: int = 3000):
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


def mix_with_preroll(record_dir, narration_mp3, preroll_ms, output_mp4, tmp_dir):
    """Antepone un silencio (preroll) a la narración y lo mezcla con el último webm."""
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


# ─── PARTE 1: COLABORADOR ──────────────────────────────────────────────────────
def grabar_colaborador(p, out_mp4):
    tmp_audio = Path("_tmp_colab_audio")
    rec_dir = "_tmp_colab_video"
    Path(rec_dir).mkdir(exist_ok=True)
    narrator = Narrator(tmp_audio)

    t_intro = narrator.add(
        "Demostración de los ajustes solicitados por correo para la evaluación de medio año. "
        "Vista del colaborador.", delay_after_ms=300)
    t_instr = narrator.add(
        "La instrucción principal de la sección de Retroalimentación ahora aparece más grande y "
        "en negrita. Indica: basado en el progreso de los objetivos, proyectos y competencias "
        "evaluadas, registre acciones concretas en cada categoría; justifíquela con las "
        "competencias que aplican, puede usar hasta tres.", delay_after_ms=500)
    t_cont = narrator.add(
        "Las cuatro categorías tienen descripciones ampliadas. Continuar Haciendo: actividades "
        "que funcionan bien y deben mantenerse para apoyar el logro de los objetivos y proyectos, "
        "y porque evidencian los comportamientos esperados según las competencias del puesto.",
        delay_after_ms=300)
    t_mas = narrator.add(
        "Hacer Más: acciones que necesitan mayor esfuerzo o frecuencia para apoyar el logro de los "
        "objetivos y proyectos, además de realizar el trabajo según las competencias del puesto.",
        delay_after_ms=300)
    t_mp = narrator.add(
        "Hacer Menos y Parar de Hacer también amplían su descripción, conectando cada acción con "
        "los objetivos y los comportamientos esperados según las competencias del puesto.",
        delay_after_ms=500)
    t_com = narrator.add(
        "La sección de cierre ahora se titula Comentarios, Compromisos y Próximos Pasos, e "
        "incorpora un nuevo campo de Comentarios para el colaborador.", delay_after_ms=800)

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
        print("ADVERTENCIA(colab): no se detectó app-form-evaluation-medio-ano")
    page.evaluate("document.documentElement.style.zoom = '0.9'")
    page.wait_for_timeout(400)
    preroll_ms = int((time.time() - t0) * 1000)
    print(f"preroll colaborador = {preroll_ms} ms")

    scroll_to_section(page, "Retroalimentación de Desempeño")
    page.wait_for_timeout(t_intro)
    hl_text(page, "Basado en el progreso", duration_ms=min(t_instr, 6000))
    page.wait_for_timeout(t_instr)
    hl_card(page, "border-success", duration_ms=min(t_cont, 5500))
    page.wait_for_timeout(t_cont)
    hl_card(page, "border-primary", duration_ms=min(t_mas, 5000))
    page.wait_for_timeout(t_mas)
    page.evaluate("window.scrollBy({top: 340, behavior: 'smooth'})")
    page.wait_for_timeout(500)
    hl_card(page, "border-warning", duration_ms=2500)
    hl_card(page, "border-danger", duration_ms=4500)
    page.wait_for_timeout(t_mp)
    scroll_to_section(page, "Comentarios, Compromisos y Próximos Pasos")
    page.wait_for_timeout(300)
    hl_text(page, "Comentarios del Colaborador", duration_ms=min(t_com, 5500))
    page.wait_for_timeout(t_com)

    ctx.close()
    print("Audio colaborador...")
    narrator.build_final(str(tmp_audio / "narration.mp3"))
    mix_with_preroll(rec_dir, str(tmp_audio / "narration.mp3"), preroll_ms, out_mp4, tmp_audio)
    shutil.rmtree(rec_dir, ignore_errors=True)
    shutil.rmtree(tmp_audio, ignore_errors=True)


# ─── PARTE 2: SUPERVISOR ───────────────────────────────────────────────────────
def grabar_supervisor(p, out_mp4):
    tmp_audio = Path("_tmp_super_audio")
    rec_dir = "_tmp_super_video"
    Path(rec_dir).mkdir(exist_ok=True)
    narrator = Narrator(tmp_audio)

    t_intro = narrator.add(
        "Ahora la misma evaluación desde la perspectiva del supervisor, Pablo Rodríguez. "
        "Abrimos la evaluación del colaborador desde la opción Evaluar Equipo.", delay_after_ms=400)
    t_com = narrator.add(
        "Desde la vista del supervisor, la sección de cierre muestra también el nuevo campo de "
        "Comentarios del supervisor, junto con sus compromisos y próximos pasos.", delay_after_ms=1200)

    ctx = p.new_context(viewport={"width": 1280, "height": 720},
                        record_video_dir=rec_dir,
                        record_video_size={"width": 1280, "height": 720})
    page = ctx.new_page()
    t0 = time.time()

    login(page, BASE_URL, USERNAME_SUPER, PASSWORD_SUPER)
    goto_via_menu(page, "Evaluaciones", "Evaluar Equipo")
    # Esperar a que carguen los estados y aparezca el botón "Evaluar"
    try:
        page.wait_for_selector("button:has-text('Evaluar')", timeout=20000)
    except Exception:
        print("ADVERTENCIA(super): no apareció el botón 'Evaluar' (¿sin subordinados evaluables?)")
    page.wait_for_timeout(500)
    btn = page.locator("button:has-text('Evaluar')").first
    if btn.count() and btn.is_visible():
        btn.click()
    dismiss_swal(page)
    try:
        page.wait_for_selector("app-form-evaluation-medio-ano", timeout=15000)
    except Exception:
        print("ADVERTENCIA(super): no se detectó el formulario de medio año del supervisor")
    page.evaluate("document.documentElement.style.zoom = '0.9'")
    page.wait_for_timeout(500)
    preroll_ms = int((time.time() - t0) * 1000)
    print(f"preroll supervisor = {preroll_ms} ms")

    scroll_to_section(page, "Retroalimentación de Desempeño")
    page.wait_for_timeout(t_intro)
    scroll_to_section(page, "Comentarios, Compromisos y Próximos Pasos")
    page.wait_for_timeout(300)
    hl_text(page, "Comentarios del Supervisor", duration_ms=min(t_com, 6000))
    page.wait_for_timeout(t_com)

    ctx.close()
    print("Audio supervisor...")
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
    part_colab = "_part_colaborador.mp4"
    part_super = "_part_supervisor.mp4"
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, args=["--start-maximized"])
        grabar_colaborador(browser, part_colab)
        grabar_supervisor(browser, part_super)
        browser.close()

    print("Concatenando partes...")
    concat_mp4([part_colab, part_super], OUTPUT_MP4)
    for f in (part_colab, part_super):
        Path(f).unlink(missing_ok=True)
    print(f"\nVideo guardado: {OUTPUT_MP4}")


if __name__ == "__main__":
    run()
