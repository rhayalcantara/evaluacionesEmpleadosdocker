#!/usr/bin/env python3
"""
Copia las 12 competencias del puesto GERENTE DE SUCURSAL MEDIANA (54) del
periodo 8 a los dos puestos de sucursal que quedaron sin configurar:

    270  GERENTE DE CAPTACIONES Y SUCURSAL   -> Manuel Antonio Puello Rosario
    271  GERENTE DE SUCURSAL PEQUENA         -> Murienny Perez, Junior Almonte, Medardo Brito

Sin esas filas el sistema no genera la evaluacion del periodo y esas cuatro
personas no pueden autoevaluarse.

Autorizado por Rhay el 2026-08-26 (plantilla elegida: puesto 54).

Uso:
    python copiar_competencias_sucursal_p8.py            # muestra lo que haria
    python copiar_competencias_sucursal_p8.py --ejecutar # crea las filas

Ojo con la asimetria del API: al LEER el campo llega como `objetivoId`, pero el
POST espera `objetivoid` (documentado en clonar_goals_gh_p7_a_p8.py).
"""
import sys
import requests

API = "http://192.168.7.222:7070"          # PRODUCCION
PERIODO = 8
ORIGEN = 54
DESTINOS = [270, 271]

ejecutar = "--ejecutar" in sys.argv


def objetivo_de(g):
    return g.get("objetivoId") or g.get("objetivoid") or 0


def goals_de(puesto):
    r = requests.get(f"{API}/api/Goals/puesto/{puesto}", timeout=60)
    r.raise_for_status()
    cuerpo = r.json()
    filas = cuerpo["data"] if isinstance(cuerpo, dict) and "data" in cuerpo else cuerpo
    return [g for g in (filas or []) if g.get("periodId") == PERIODO]


plantilla = goals_de(ORIGEN)
print(f"Plantilla: puesto {ORIGEN} tiene {len(plantilla)} competencias en el periodo {PERIODO}")
if len(plantilla) != 12:
    sys.exit(f"ABORTA: se esperaban 12 competencias en el puesto {ORIGEN}, hay {len(plantilla)}")

total_creadas = total_saltadas = total_fallidas = 0

for destino in DESTINOS:
    existentes = goals_de(destino)
    ya = {(objetivo_de(g), (g.get("name") or "").strip().upper()) for g in existentes}
    print(f"\n== Puesto {destino}: {len(existentes)} competencias antes ==")

    for g in sorted(plantilla, key=objetivo_de):
        clave = (objetivo_de(g), (g.get("name") or "").strip().upper())
        if clave in ya:
            total_saltadas += 1
            print(f"  [ya existe] obj {clave[0]:>3} - {g['name'][:60]}")
            continue

        payload = {
            "id": 0,
            "name": g["name"],
            "periodId": PERIODO,
            "weight": g["weight"],
            "positionSecuencial": destino,
            "objetivoid": objetivo_de(g),
        }
        if not ejecutar:
            total_creadas += 1
            print(f"  [simulado] obj {payload['objetivoid']:>3} peso {payload['weight']:>2} - {payload['name'][:60]}")
            continue

        r = requests.post(f"{API}/api/Goals", json=payload, timeout=60)
        if r.status_code in (200, 201):
            total_creadas += 1
            print(f"  [creada  ] obj {payload['objetivoid']:>3} peso {payload['weight']:>2} - {payload['name'][:60]}")
        else:
            total_fallidas += 1
            print(f"  [ERROR {r.status_code}] obj {payload['objetivoid']}: {r.text[:150]}")

print()
if ejecutar:
    print("== Verificacion: releyendo del API ==")
    for destino in DESTINOS:
        filas = goals_de(destino)
        pesos = sum(f.get("weight") or 0 for f in filas)
        print(f"  puesto {destino}: {len(filas)} competencias, peso total {pesos}")

modo = "EJECUTADO" if ejecutar else "SIMULACION (nada escrito; usa --ejecutar)"
print(f"\n{modo}: {total_creadas} creadas, {total_saltadas} ya existian, {total_fallidas} fallidas")
sys.exit(1 if total_fallidas else 0)
