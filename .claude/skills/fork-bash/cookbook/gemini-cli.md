# Purpose

Execute Gemini CLI directly via bash and capture output.

## Variables

DEFAULT_MODEL: gemini-exp-1206
HEAVY_MODEL: gemini-exp-1206
BASE_MODEL: gemini-2.0-flash-exp
FAST_MODEL: gemini-2.0-flash-exp

## Instructions

1. Always use YOLO mode with the `-y` flag (auto-approve tool calls)
2. DO NOT use the `-i` (interactive) flag when executing from bash
3. For the `--model` argument, use the DEFAULT_MODEL if not specified
   - If 'fast' is requested, use the FAST_MODEL
   - If 'heavy' is requested, use the HEAVY_MODEL
4. Set appropriate timeout based on task complexity:
   - Simple queries: 60000ms (1 minute)
   - Web scraping/DevTools: 120000ms (2 minutes)
   - Complex analysis: 180000ms (3 minutes)
5. The command format is: `gemini -y [--model MODEL] "prompt here"`

## Examples

### Simple Query
```bash
gemini -y "What is the capital of France?"
```

### Web Scraping with Chrome DevTools
```bash
gemini -y "Use Chrome DevTools to open https://example.com and extract the main headline"
```

### With Specific Model
```bash
gemini -y --model gemini-2.0-flash-exp "Analyze this data"
```

## Notes

- Output is captured directly from stdout
- Errors appear in stderr
- Chrome DevTools capabilities are available
- All tool calls are auto-approved with `-y` flag
