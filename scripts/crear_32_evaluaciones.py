#!/usr/bin/env python3
"""
Script rápido para crear las 32 evaluaciones faltantes
"""

import requests
from datetime import datetime, timezone

API_URL = "http://192.168.7.222:7070"
PERIODO_ID = 7

# IDs de los 32 empleados sin evaluación (identificados previamente)
EMPLEADOS_SIN_EVALUACION = [
    886, 1092, 318, 1085, 1089, 31, 1104, 631, 1070, 1076,
    1088, 1090, 1093, 1095, 1097, 1098, 1099, 1101, 1103, 1105,
    1106, 1107, 1108, 1110, 1094, 1096, 1084, 1086, 1091, 1100,
    1109, 639
]

def crear_evaluacion(empleado_id):
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
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"[ERROR] Empleado {empleado_id}: {e}")
        if hasattr(e, 'response') and e.response is not None:
            try:
                error_json = e.response.json()
                print(f"  Respuesta JSON: {error_json}")
            except:
                print(f"  Respuesta texto: {e.response.text[:500]}")
        return None

def main():
    print("="*70)
    print("CREACION RAPIDA DE 32 EVALUACIONES FALTANTES")
    print("="*70)
    print(f"Periodo: {PERIODO_ID}")
    print(f"Empleados a procesar: {len(EMPLEADOS_SIN_EVALUACION)}")
    print("-"*70)

    exitosas = 0
    fallidas = 0

    for i, empleado_id in enumerate(EMPLEADOS_SIN_EVALUACION, 1):
        print(f"[{i}/{len(EMPLEADOS_SIN_EVALUACION)}] Creando evaluacion para empleado {empleado_id}...", end=" ")

        resultado = crear_evaluacion(empleado_id)

        if resultado:
            exitosas += 1
            print(f"[OK] Creada (ID: {resultado.get('id')})")
        else:
            fallidas += 1
            print("[FALLO]")

    print("\n" + "="*70)
    print("RESUMEN")
    print("="*70)
    print(f"Evaluaciones creadas exitosamente: {exitosas}")
    print(f"Evaluaciones fallidas:             {fallidas}")
    print("="*70)

if __name__ == '__main__':
    main()
