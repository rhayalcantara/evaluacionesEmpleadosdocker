# Fork Bash Skill

Execute agentic coding tools (Gemini, Claude Code, Codex) directly via bash commands and capture their output in real-time.

## Overview

This skill provides a simple and reliable way to execute AI agents from Claude Code and get their results immediately. Unlike `fork-terminal` which opens new windows, `fork-bash` executes commands synchronously and captures output directly.

## Features

- ✅ Direct bash execution with output capture
- ✅ Support for multiple agentic tools (Gemini, Claude Code, Codex)
- ✅ Configurable timeouts for different task complexities
- ✅ YOLO mode auto-approval for automation
- ✅ Chrome DevTools support (via Gemini)

## Usage

### Via Slash Command

```bash
/fork-bash gemini "Your prompt here"
```

### Direct Tool Usage

```bash
python .claude/skills/fork-bash/tools/fork_bash.py gemini "Scrape news from CNN"
```

## Examples

### Simple Query
```bash
/fork-bash gemini "What is the capital of France?"
```

### Web Scraping
```bash
/fork-bash gemini "Use Chrome DevTools to open https://diariolibre.com and get the top 3 headlines"
```

### With Specific Model
```bash
python fork_bash.py gemini "Analyze this data" gemini-2.0-flash-exp 60
```

## Comparison: fork-bash vs fork-terminal

| Feature | fork-bash | fork-terminal |
|---------|-----------|---------------|
| Execution | Synchronous | Asynchronous (new window) |
| Output Capture | Direct stdout/stderr | File-based sessions |
| Complexity | Simple | Complex |
| Use Case | One-off tasks | Interactive sessions |
| Reliability | High | Medium (Windows API issues) |

## Configuration

Edit `.claude/skills/fork-bash/SKILL.md` to enable/disable tools:

```markdown
ENABLE_GEMINI_CLI: true
ENABLE_CLAUDE_CODE: true
ENABLE_CODEX_CLI: true
```

## Models

Default models configured in `cookbook/gemini-cli.md`:

- DEFAULT_MODEL: `gemini-exp-1206`
- FAST_MODEL: `gemini-2.0-flash-exp`
- HEAVY_MODEL: `gemini-exp-1206`

## Timeouts

Recommended timeouts by task type:

- Simple queries: 60s
- Web scraping: 120s
- Complex analysis: 180s

## Architecture

```
.claude/skills/fork-bash/
├── SKILL.md              # Skill definition
├── README.md             # This file
├── tools/
│   └── fork_bash.py      # Main execution tool
└── cookbook/
    └── gemini-cli.md     # Gemini-specific instructions
```

## Notes

- Always use `-y` (YOLO mode) for automated execution
- DO NOT use `-i` (interactive mode) when executing from bash
- Output is captured in real-time from stdout/stderr
- Errors and diagnostics appear in stderr

## Testing

Test the skill with:

```bash
/fork-bash gemini "Hello, respond with a joke"
```

Expected output: Gemini's response captured and displayed directly.
