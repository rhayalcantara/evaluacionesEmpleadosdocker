#!/usr/bin/env python3
"""
Script de prueba rápida de conectividad del API
"""

import requests
import sys

API_URL = "http://192.168.7.222:7070"

def test_api():
    """Prueba la conectividad básica del API"""

    print("="*60)
    print("PRUEBA DE CONECTIVIDAD API")
    print("="*60)
    print(f"API URL: {API_URL}\n")

    # Test 1: Empleados
    print("[1] Probando endpoint /api/Empleadoes...")
    try:
        r = requests.get(f"{API_URL}/api/Empleadoes", timeout=10)
        if r.status_code == 200:
            data = r.json()
            total = data.get('count', 0)
            activos = len([e for e in data.get('data', []) if e.get('codigoestado') == 'A'])
            print(f"    [OK] Empleados totales: {total}, Activos: {activos}")
        else:
            print(f"    [ERROR] Status: {r.status_code}")
    except Exception as e:
        print(f"    [ERROR] {e}")

    # Test 2: Periodos
    print("\n[2] Probando endpoint /api/Periods...")
    try:
        r = requests.get(f"{API_URL}/api/Periods", timeout=10)
        if r.status_code == 200:
            data = r.json()
            periodos = data.get('data', [])
            print(f"    [OK] Periodos encontrados: {len(periodos)}")
            if periodos:
                print("\n    Periodos disponibles:")
                for p in periodos[:5]:  # Mostrar solo primeros 5
                    print(f"      - ID: {p.get('id', 'N/A'):3} | {p.get('descripcion', 'N/A')}")
                if len(periodos) > 5:
                    print(f"      ... y {len(periodos) - 5} más")
        else:
            print(f"    [ERROR] Status: {r.status_code}")
    except Exception as e:
        print(f"    [ERROR] {e}")

    # Test 3: Evaluaciones
    print("\n[3] Probando endpoint /api/Evaluacions...")
    try:
        r = requests.get(f"{API_URL}/api/Evaluacions", timeout=10)
        if r.status_code == 200:
            data = r.json()
            total = data.get('count', 0)
            print(f"    [OK] Evaluaciones totales: {total}")
        else:
            print(f"    [ERROR] Status: {r.status_code}")
    except Exception as e:
        print(f"    [ERROR] {e}")

    print("\n" + "="*60)
    print("Prueba completada")
    print("="*60)

if __name__ == '__main__':
    test_api()
