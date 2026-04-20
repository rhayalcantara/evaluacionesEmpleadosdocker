#!/usr/bin/env python3
"""
Script de prueba para crear UNA evaluación y ver el error detallado
"""

import requests
import json
from datetime import datetime, timezone

API_URL = "http://localhost:5197"
PERIODO_ID = 7
EMPLEADO_ID = 31  # Empleado con 6 Goals configurados

def test_crear_evaluacion():
    """Prueba crear una evaluación con debug completo"""

    fecha_actual = datetime.now(timezone.utc).isoformat()

    evaluacion = {
        "id": 0,
        "periodId": PERIODO_ID,
        "empleadoSecuencial": EMPLEADO_ID,
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

    print("="*70)
    print("PRUEBA DE CREACION DE EVALUACION CON DEBUG")
    print("="*70)
    print(f"URL: {API_URL}/api/Evaluacions")
    print(f"Empleado ID: {EMPLEADO_ID}")
    print(f"Periodo ID: {PERIODO_ID}")
    print(f"Fecha: {fecha_actual}")
    print("\nJSON a enviar:")
    print(json.dumps(evaluacion, indent=2))
    print("="*70)

    try:
        response = requests.post(
            f"{API_URL}/api/Evaluacions",
            json=evaluacion,
            headers={'Content-Type': 'application/json'},
            timeout=30
        )

        print(f"\nStatus Code: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")

        if response.status_code >= 400:
            print(f"\n[ERROR] Request fallido")
            print(f"Status: {response.status_code}")
            print(f"Reason: {response.reason}")

            # Intentar parsear como JSON
            try:
                error_json = response.json()
                print(f"\nRespuesta JSON:")
                print(json.dumps(error_json, indent=2))

                # Si tiene errores de validación, mostrarlos
                if 'errors' in error_json:
                    print("\n[ERRORES DE VALIDACION]:")
                    for campo, mensajes in error_json['errors'].items():
                        print(f"  - {campo}: {mensajes}")

                # Si tiene observacion (mensaje del servicio)
                if 'observacion' in error_json:
                    print(f"\n[OBSERVACION DEL SERVICIO]: {error_json['observacion']}")

            except:
                print(f"\nRespuesta texto:")
                print(response.text)

                # El mensaje podría ser el observacion directamente
                if "Error:" in response.text:
                    print(f"\n[MENSAJE DE ERROR]: {response.text}")
        else:
            print(f"\n[EXITO] Evaluacion creada!")
            resultado = response.json()
            print(json.dumps(resultado, indent=2))

    except requests.exceptions.RequestException as e:
        print(f"\n[ERROR] Excepcion durante request: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Status: {e.response.status_code}")
            print(f"Response: {e.response.text}")

if __name__ == '__main__':
    test_crear_evaluacion()
