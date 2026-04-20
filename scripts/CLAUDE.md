# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Python utility scripts for bulk operations against the Employee Evaluation System (COOPASPIRE) REST API. These scripts run from the corporate VPN and interact with the same backend API used by the Angular frontend (parent project).

**Stack:** Python 3, `requests` library

## Commands

```bash
# Install dependencies
pip install -r requirements.txt

# Test API connectivity (run first to verify VPN/backend access)
python test_api.py

# Create evaluations for all active employees missing one in a period (always dry-run first)
python crear_evaluaciones_masivas.py --periodo-id 7 --dry-run
python crear_evaluaciones_masivas.py --periodo-id 7

# Create for a single employee
python crear_evaluaciones_masivas.py --periodo-id 7 --empleado-id 318

# Override API URL or timeout
python crear_evaluaciones_masivas.py --periodo-id 7 --api-url http://localhost:7070 --timeout 60
```

## Architecture

### Main Script: `crear_evaluaciones_masivas.py`
- `EvaluacionMasivaCreator` class: encapsulates all API interaction with retry logic (3 retries, backoff on 429/5xx)
- Flow: validate period exists → fetch active employees (`codigoestado == "A"`) → check each for existing evaluation → create "Borrador" (Draft) evaluations for those missing one
- Uses `requests.Session` with `HTTPAdapter` + `Retry` for resilience
- Exit code 1 if any creation fails, 0 otherwise

### Supporting Scripts
- `test_api.py` — Connectivity smoke test hitting `/api/Empleadoes`, `/api/Periods`, `/api/Evaluacions`
- `crear_32_evaluaciones.py`, `crear_4_evaluaciones.py`, `test_crear_una.py` — One-off scripts for specific batch/test runs with hardcoded employee IDs. Not intended for reuse.

### API Endpoints Used
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/Empleadoes` | GET | List all employees (filter `codigoestado == "A"`) |
| `/api/Periods/{id}` | GET | Validate period exists |
| `/api/Evaluacions/evaluacion?empleadoid={}&periodoid={}` | GET | Check if evaluation exists (200 = yes, 404 = no) |
| `/api/Evaluacions` | POST | Create draft evaluation |

### Evaluation Payload Structure
Evaluations are created with all scores at 0, `estadoevaluacion: "Borrador"`, empty arrays for goals/responses/courses, and `observacion: "Evaluación creada automáticamente"`. The employee completes the evaluation through the Angular UI.

## Network Requirements

Scripts must run from the corporate VPN. Default API URL: `http://192.168.7.222:7070` (same as the Angular app's `environment.apiUrl`).
