#!/usr/bin/env python
"""Execute agentic coding tools via bash and capture output."""

import subprocess
import sys
from pathlib import Path


def fork_bash(command: str, timeout: int = 120) -> dict:
    """
    Execute a bash command and capture output.

    Args:
        command: The bash command to execute
        timeout: Timeout in seconds (default: 120)

    Returns:
        dict with stdout, stderr, and return_code
    """
    try:
        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            timeout=timeout,
            encoding='utf-8',
            errors='replace'
        )

        return {
            "success": result.returncode == 0,
            "stdout": result.stdout,
            "stderr": result.stderr,
            "return_code": result.returncode
        }

    except subprocess.TimeoutExpired as e:
        return {
            "success": False,
            "stdout": e.stdout.decode('utf-8', errors='replace') if e.stdout else "",
            "stderr": f"Command timed out after {timeout} seconds",
            "return_code": -1,
            "timeout": True
        }

    except Exception as e:
        return {
            "success": False,
            "stdout": "",
            "stderr": str(e),
            "return_code": -1,
            "error": str(e)
        }


def execute_gemini(prompt: str, model: str = None, timeout: int = 120) -> dict:
    """
    Execute Gemini CLI with a prompt.

    Args:
        prompt: The prompt to send to Gemini
        model: Optional model to use (default: gemini-exp-1206)
        timeout: Timeout in seconds

    Returns:
        dict with execution results
    """
    # Escape quotes in prompt
    escaped_prompt = prompt.replace('"', '\\"')

    # Build command
    if model:
        command = f'gemini -y --model {model} "{escaped_prompt}"'
    else:
        command = f'gemini -y "{escaped_prompt}"'

    return fork_bash(command, timeout)


def execute_claude_code(prompt: str, timeout: int = 120) -> dict:
    """
    Execute Claude Code CLI with a prompt.

    Args:
        prompt: The prompt to send to Claude Code
        timeout: Timeout in seconds

    Returns:
        dict with execution results
    """
    escaped_prompt = prompt.replace('"', '\\"')
    command = f'claude-code "{escaped_prompt}"'

    return fork_bash(command, timeout)


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage:")
        print("  python fork_bash.py gemini <prompt> [model] [timeout]")
        print("  python fork_bash.py claude-code <prompt> [timeout]")
        print("  python fork_bash.py bash <command> [timeout]")
        print()
        print("Examples:")
        print('  python fork_bash.py gemini "What is AI?" gemini-2.0-flash-exp 60')
        print('  python fork_bash.py bash "ls -la" 10')
        sys.exit(1)

    tool = sys.argv[1]

    if tool == "gemini":
        if len(sys.argv) < 3:
            print("Error: gemini requires a prompt")
            sys.exit(1)

        prompt = sys.argv[2]
        model = sys.argv[3] if len(sys.argv) > 3 and not sys.argv[3].isdigit() else None
        timeout = int(sys.argv[4]) if len(sys.argv) > 4 else (int(sys.argv[3]) if len(sys.argv) > 3 and sys.argv[3].isdigit() else 120)

        result = execute_gemini(prompt, model, timeout)

        print("=" * 60)
        print("GEMINI OUTPUT")
        print("=" * 60)
        print(result['stdout'])
        if result['stderr']:
            print("\n" + "=" * 60)
            print("ERRORS")
            print("=" * 60)
            print(result['stderr'])
        print("\n" + "=" * 60)
        print(f"Exit Code: {result['return_code']}")
        print("=" * 60)

    elif tool == "claude-code":
        if len(sys.argv) < 3:
            print("Error: claude-code requires a prompt")
            sys.exit(1)

        prompt = sys.argv[2]
        timeout = int(sys.argv[3]) if len(sys.argv) > 3 else 120

        result = execute_claude_code(prompt, timeout)

        print("=" * 60)
        print("CLAUDE CODE OUTPUT")
        print("=" * 60)
        print(result['stdout'])
        if result['stderr']:
            print("\n" + "=" * 60)
            print("ERRORS")
            print("=" * 60)
            print(result['stderr'])
        print("\n" + "=" * 60)
        print(f"Exit Code: {result['return_code']}")
        print("=" * 60)

    elif tool == "bash":
        if len(sys.argv) < 3:
            print("Error: bash requires a command")
            sys.exit(1)

        command = sys.argv[2]
        timeout = int(sys.argv[3]) if len(sys.argv) > 3 else 120

        result = fork_bash(command, timeout)

        print("=" * 60)
        print("BASH OUTPUT")
        print("=" * 60)
        print(result['stdout'])
        if result['stderr']:
            print("\n" + "=" * 60)
            print("ERRORS")
            print("=" * 60)
            print(result['stderr'])
        print("\n" + "=" * 60)
        print(f"Exit Code: {result['return_code']}")
        print("=" * 60)

    else:
        print(f"Unknown tool: {tool}")
        sys.exit(1)
