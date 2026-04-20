#!/usr/bin/env python3
"""
Script para crear las 4 evaluaciones con Goals recién configurados
"""

import requests
import json
from datetime import datetime, timezone

API_URL = "http://192.168.7.222:7070"
PERIODO_ID = 7

# Los 4 empleados que ahora tienen Goals configurados
EMPLEADOS_CON_GOALS = [
    {"id": 318, "nombre": "ROSANNA IRIS CONTRERAS JIMENEZ", "puesto": 21},
    {"id": 631, "nombre": "JEFFRY RAFAEL ROSARIO MARIZAN", "puesto": 269},
    {"id": 886, "nombre": "ANA LUCIA ESPINO ACOSTA", "puesto": 19},
    {"id": 1070, "nombre": "HEIMI NATALIA PEREZ VASQUEZ", "puesto": 233}
]

def crear_evaluacion(empleado_id, nombre):
    """Crea una evaluación para un empleado"""
    fecha_actual = datetime.now(timezone.utc).isoformat()

    evaluacion = {
        "id": 0,
        "periodId": PERIODO_ID,
        "empleadoSecuencial": empleado_id,
        "secuencialsupervisor": 0,
        "totalCalculo": 0,
        "fechaRepuestas": fecha_actual,
        "observacion": "Evaluación creada automáticamente",
        "puntuaciondesempenocolaborador": 0,
        "puntuacioncompetenciacolaborador": 0,
        "totalcolaborador": 0,
        "puntuaciondesempenosupervidor": 0,
        "puntuacioncompetenciasupervisor": 0,
        "totalsupervisor": 0,
        "estadoevaluacion": "Borrador",
        "entrevistaConSupervisor": False,
        "aceptaEnDisgusto": False,
        "comentarioDisgusto": "",
        "evaluacionGoals": [],
        "goalEmpleadoRespuestas": [],
        "evaluacionDesempenoMetas": [],
        "evaluacionCursoCapacitacions": []
    }

    try:
        response = requests.post(
            f"{API_URL}/api/Evaluacions",
            json=evaluacion,
            headers={'Content-Type': 'application/json'},
            timeout=30
        )

        if response.status_code >= 400:
            # Intentar obtener mensaje de error
            try:
                error_text = response.json() if response.headers.get('Content-Type', '').startswith('application/json') else response.text
                print(f"[ERROR] {error_text}")
            except:
                print(f"[ERROR] {response.text}")
            return None

        response.raise_for_status()
        return response.json()

    except Exception as e:
        print(f"[ERROR] Excepción: {e}")
        if hasattr(e, 'response') and e.response is not None:
            try:
                error_json = e.response.json()
                print(f"  Detalle: {json.dumps(error_json, indent=2)}")
            except:
                print(f"  Respuesta: {e.response.text}")
        return None

def main():
    print("="*70)
    print("CREACION DE 4 EVALUACIONES CON GOALS CONFIGURADOS")
    print("="*70)
    print(f"URL API: {API_URL}")
    print(f"Periodo: {PERIODO_ID}")
    print(f"Empleados a procesar: {len(EMPLEADOS_CON_GOALS)}")
    print("-"*70)

    exitosas = 0
    fallidas = 0

    for i, emp in enumerate(EMPLEADOS_CON_GOALS, 1):
        print(f"\n[{i}/{len(EMPLEADOS_CON_GOALS)}] {emp['nombre']}")
        print(f"    ID: {emp['id']}, Puesto: {emp['puesto']}")
        print(f"    Creando evaluacion...", end=" ", flush=True)

        resultado = crear_evaluacion(emp['id'], emp['nombre'])

        if resultado:
            exitosas += 1
            evaluacion_id = resultado.get('id', 'N/A')
            print(f"[EXITO] Evaluacion ID: {evaluacion_id}")
        else:
            fallidas += 1
            print(f"[FALLO]")

    print("\n" + "="*70)
    print("RESUMEN FINAL")
    print("="*70)
    print(f"Evaluaciones creadas exitosamente: {exitosas}")
    print(f"Evaluaciones fallidas:             {fallidas}")
    print("="*70)

    if exitosas > 0:
        print(f"\n✓ Se crearon {exitosas} evaluaciones en estado 'Borrador'")
        print(f"  Puedes verlas en: http://localhost:4200/evaluacionempleado")

    if fallidas > 0:
        print(f"\n✗ {fallidas} evaluaciones fallaron. Revisa los errores arriba.")

if __name__ == '__main__':
    main()
