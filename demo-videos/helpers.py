"""
Helpers compartidos para los scripts de video demo.
Requiere: playwright, edge-tts, ffmpeg en PATH
"""
import asyncio
import subprocess
import shutil
import threading
import time
from pathlib import Path


# ─── TTS ──────────────────────────────────────────────────────────────────────

async def _tts_save(text: str, filename: str):
    import edge_tts
    communicate = edge_tts.Communicate(text, "es-DO-EmilioNeural")
    await communicate.save(filename)


def gen_audio(text: str, filename: str):
    # Run in a fresh thread with its own event loop to avoid conflicts with Playwright's loop
    exc_holder = []
    def _run():
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            loop.run_until_complete(_tts_save(text, filename))
        except Exception as e:
            exc_holder.append(e)
        finally:
            loop.close()
    t = threading.Thread(target=_run)
    t.start()
    t.join()
    if exc_holder:
        raise exc_holder[0]


def audio_duration_ms(filename: str) -> int:
    """Return duration of audio file in milliseconds using ffprobe."""
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", filename],
        capture_output=True, text=True
    )
    try:
        return int(float(result.stdout.strip()) * 1000)
    except ValueError:
        return 4000


# ─── Narration segment helper ─────────────────────────────────────────────────

class Narrator:
    """Accumulates narration segments; generates one audio file at the end."""

    def __init__(self, tmp_dir: Path):
        self.tmp_dir = tmp_dir
        self.tmp_dir.mkdir(parents=True, exist_ok=True)
        self.segments: list[tuple[str, int]] = []   # (text, delay_after_ms)

    def add(self, text: str, delay_after_ms: int = 0):
        """
        Register a narration segment.
        delay_after_ms: extra silence AFTER this speech segment.
        Returns the estimated speaking duration so Playwright can wait.
        """
        seg_file = str(self.tmp_dir / f"seg_{len(self.segments):03d}.mp3")
        gen_audio(text, seg_file)
        dur = audio_duration_ms(seg_file)
        self.segments.append((seg_file, delay_after_ms))
        return dur + delay_after_ms  # total pause caller should wait

    def build_final(self, output: str):
        """Concatenate all segments (with silences) into one audio file."""
        if not self.segments:
            return

        inputs = []
        filter_parts = []

        for i, (seg_file, delay_ms) in enumerate(self.segments):
            inputs += ["-i", seg_file]
            filter_parts.append(f"[{i}:a]")
            if delay_ms > 0:
                # Generate silence
                sil_file = str(self.tmp_dir / f"sil_{i:03d}.mp3")
                subprocess.run([
                    "ffmpeg", "-y", "-f", "lavfi",
                    "-i", f"anullsrc=r=24000:cl=mono",
                    "-t", f"{delay_ms / 1000:.3f}",
                    "-q:a", "9", "-acodec", "libmp3lame", sil_file
                ], capture_output=True)
                filter_parts.append(f"[{len(self.segments) + i}:a]")
                inputs += ["-i", sil_file]

        n = len(filter_parts)
        concat_filter = "".join(filter_parts) + f"concat=n={n}:v=0:a=1[out]"

        subprocess.run(
            ["ffmpeg", "-y"] + inputs + [
                "-filter_complex", concat_filter,
                "-map", "[out]",
                output
            ],
            capture_output=True
        )


# ─── Video / ffmpeg ───────────────────────────────────────────────────────────

def mix_video_audio(video_webm: str, audio_mp3: str, output_mp4: str):
    """Combine Playwright webm recording + narration into final mp4."""
    subprocess.run([
        "ffmpeg", "-y",
        "-i", video_webm,
        "-i", audio_mp3,
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "22",
        "-c:a", "aac",
        "-b:a", "128k",
        "-shortest",
        output_mp4
    ], check=True)


def find_latest_webm(record_dir: str) -> str:
    """Find the most recently modified .webm in a directory."""
    files = list(Path(record_dir).glob("*.webm"))
    if not files:
        raise FileNotFoundError(f"No .webm found in {record_dir}")
    return str(sorted(files, key=lambda f: f.stat().st_mtime)[-1])


# ─── Login helper ─────────────────────────────────────────────────────────────

def login(page, base_url: str, username: str, password: str, timeout_ms: int = 30_000):
    """
    Navigate to the app, wait for login form, fill credentials, submit.
    Waits for redirect to 'Home' route.
    """
    page.goto(base_url, wait_until="networkidle")
    # The navmenu redirects to /login automatically on init
    page.wait_for_url("**/login**", timeout=timeout_ms)

    # Fill username (first visible text input)
    page.locator("input:not([type='password']):visible").first.fill(username)
    page.locator("input[type='password']:visible").first.fill(password)

    # Submit — loginapp uses <button type="button">Entrar</button>
    submit = page.locator("button:has-text('Entrar'):visible").first
    submit.click()

    # Wait for redirect to Home
    page.wait_for_url("**/Home**", timeout=timeout_ms)
    page.wait_for_load_state("networkidle")


def goto_via_menu(page, dropdown_text: str, item_text: str, timeout_ms: int = 10_000):
    """
    Navigate to a route by clicking through the Bootstrap navbar dropdown.
    Avoids direct URL navigation (which returns 404 on servers without SPA rewrite rules).
    dropdown_text: text of the top-level dropdown link (e.g. 'Configuración', 'Evaluaciones')
    item_text:     text of the dropdown-item link (e.g. 'Competencias', 'AutoEvaluación')
    """
    # Open the dropdown
    page.locator(f"a.nav-link.dropdown-toggle:has-text('{dropdown_text}')").click()
    page.wait_for_timeout(400)
    # Click the menu item — use :text-is() for exact match (avoid substring hits)
    page.locator(f"a.dropdown-item:text-is('{item_text}')").first.click()
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(1500)  # Angular lazy-loads components
