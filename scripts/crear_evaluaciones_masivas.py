#!/usr/bin/env python3
"""
Script para crear evaluaciones masivas en el sistema de evaluación de empleados
Genera evaluaciones en estado 'Borrador' para todos los empleados activos
que no tengan evaluación en un periodo específico.

Uso:
    python crear_evaluaciones_masivas.py --periodo-id 7
    python crear_evaluaciones_masivas.py --periodo-id 7 --dry-run
    python crear_evaluaciones_masivas.py --periodo-id 7 --empleado-id 318

Autor: Sistema de Evaluaciones COOPASPIRE
Fecha: 2025-02-13
"""

import argparse
import json
import sys
from datetime import datetime, timezone
from typing import List, Dict, Optional
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry


class EvaluacionMasivaCreator:
    """Clase para crear evaluaciones masivas"""

    def __init__(self, api_url: str = "http://192.168.7.222:7070", timeout: int = 30):
        """
        Inicializa el creador de evaluaciones

        Args:
            api_url: URL base del API
            timeout: Timeout para las peticiones HTTP en segundos
        """
        self.api_url = api_url.rstrip('/')
        self.timeout = timeout
        self.session = self._create_session()

    def _create_session(self) -> requests.Session:
        """Crea una sesión HTTP con reintentos automáticos"""
        session = requests.Session()
        retry_strategy = Retry(
            total=3,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["HEAD", "GET", "POST", "PUT"]
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        session.mount("http://", adapter)
        session.mount("https://", adapter)
        return session

    def obtener_empleados_activos(self) -> List[Dict]:
        """
        Obtiene todos los empleados activos del sistema

        Returns:
            Lista de empleados activos
        """
        try:
            url = f"{self.api_url}/api/Empleadoes"
            response = self.session.get(url, timeout=self.timeout)
            response.raise_for_status()

            data = response.json()
            empleados = data.get('data', [])

            # Filtrar solo empleados activos
            empleados_activos = [emp for emp in empleados if emp.get('codigoestado') == 'A']

            print(f"[OK] Empleados activos encontrados: {len(empleados_activos)}")
            return empleados_activos

        except requests.exceptions.RequestException as e:
            print(f"[ERROR] Error al obtener empleados: {e}")
            sys.exit(1)

    def obtener_periodo(self, periodo_id: int) -> Optional[Dict]:
        """
        Obtiene información de un periodo específico

        Args:
            periodo_id: ID del periodo

        Returns:
            Datos del periodo o None si no existe
        """
        try:
            url = f"{self.api_url}/api/Periods/{periodo_id}"
            response = self.session.get(url, timeout=self.timeout)
            response.raise_for_status()

            periodo = response.json()
            print(f"[OK] Periodo encontrado: {periodo.get('descripcion', 'N/A')}")
            return periodo

        except requests.exceptions.RequestException as e:
            print(f"[ERROR] Error al obtener periodo {periodo_id}: {e}")
            return None

    def verificar_evaluacion_existe(self, empleado_secuencial: int, periodo_id: int) -> bool:
        """
        Verifica si ya existe una evaluación para un empleado en un periodo

        Args:
            empleado_secuencial: Secuencial del empleado
            periodo_id: ID del periodo

        Returns:
            True si existe, False si no existe
        """
        try:
            url = f"{self.api_url}/api/Evaluacions/evaluacion"
            params = {
                'empleadoid': empleado_secuencial,
                'periodoid': periodo_id
            }
            response = self.session.get(url, params=params, timeout=self.timeout)

            # Si retorna 200, existe
            # Si retorna 404, no existe
            if response.status_code == 200:
                return True
            elif response.status_code == 404:
                return False
            else:
                response.raise_for_status()

        except requests.exceptions.RequestException as e:
            # En caso de 404, consideramos que no existe
            if hasattr(e, 'response') and e.response.status_code == 404:
                return False
            print(f"[WARN] Error al verificar evaluación para empleado {empleado_secuencial}: {e}")
            return False

    def crear_evaluacion_borrador(self, empleado_secuencial: int, periodo_id: int) -> Optional[Dict]:
        """
        Crea una evaluación en estado borrador para un empleado

        Args:
            empleado_secuencial: Secuencial del empleado
            periodo_id: ID del periodo

        Returns:
            Datos de la evaluación creada o None si falla
        """
        # Generar fecha actual en formato ISO 8601
        fecha_actual = datetime.now(timezone.utc).isoformat()

        evaluacion = {
            "id": 0,
            "periodId": periodo_id,
            "empleadoSecuencial": empleado_secuencial,
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
            url = f"{self.api_url}/api/Evaluacions"
            headers = {'Content-Type': 'application/json'}
            response = self.session.post(
                url,
                json=evaluacion,
                headers=headers,
                timeout=self.timeout
            )
            response.raise_for_status()

            evaluacion_creada = response.json()
            return evaluacion_creada

        except requests.exceptions.RequestException as e:
            print(f"[ERROR] Error al crear evaluación para empleado {empleado_secuencial}: {e}")
            if hasattr(e, 'response') and e.response is not None:
                print(f"  Respuesta del servidor: {e.response.text}")
            return None

    def procesar_empleados(
        self,
        periodo_id: int,
        dry_run: bool = False,
        empleado_especifico: Optional[int] = None
    ) -> Dict[str, int]:
        """
        Procesa empleados y crea evaluaciones faltantes

        Args:
            periodo_id: ID del periodo
            dry_run: Si es True, solo simula sin crear
            empleado_especifico: Si se especifica, solo procesa ese empleado

        Returns:
            Diccionario con estadísticas del proceso
        """
        stats = {
            'total_empleados': 0,
            'con_evaluacion': 0,
            'sin_evaluacion': 0,
            'creadas_exitosas': 0,
            'creadas_fallidas': 0
        }

        print("\n" + "="*70)
        print(f"PROCESO DE CREACIÓN MASIVA DE EVALUACIONES")
        print("="*70)

        # Verificar que el periodo existe
        periodo = self.obtener_periodo(periodo_id)
        if not periodo:
            print(f"\n[ERROR] El periodo {periodo_id} no existe")
            return stats

        # Obtener empleados
        empleados = self.obtener_empleados_activos()

        # Filtrar por empleado específico si se solicita
        if empleado_especifico:
            empleados = [emp for emp in empleados if emp.get('secuencial') == empleado_especifico]
            if not empleados:
                print(f"\n[ERROR] No se encontró el empleado con secuencial {empleado_especifico}")
                return stats

        stats['total_empleados'] = len(empleados)

        if dry_run:
            print(f"\n[WARN] MODO SIMULACION (DRY-RUN) - No se crearan evaluaciones reales")

        print(f"\nProcesando {stats['total_empleados']} empleados para periodo {periodo_id}...")
        print("-"*70)

        # Procesar cada empleado
        empleados_sin_evaluacion = []

        for i, empleado in enumerate(empleados, 1):
            secuencial = empleado.get('secuencial')
            nombre = empleado.get('nombreunido', 'N/A')

            # Verificar si tiene evaluación
            tiene_evaluacion = self.verificar_evaluacion_existe(secuencial, periodo_id)

            if tiene_evaluacion:
                stats['con_evaluacion'] += 1
                print(f"[{i}/{stats['total_empleados']}] [OK] {nombre} (ID: {secuencial}) - Ya tiene evaluacion")
            else:
                stats['sin_evaluacion'] += 1
                empleados_sin_evaluacion.append(empleado)
                print(f"[{i}/{stats['total_empleados']}] [PENDING] {nombre} (ID: {secuencial}) - SIN evaluacion")

        # Crear evaluaciones faltantes
        if empleados_sin_evaluacion:
            print(f"\n{'='*70}")
            print(f"CREACIÓN DE EVALUACIONES FALTANTES: {len(empleados_sin_evaluacion)} empleados")
            print("="*70)

            for i, empleado in enumerate(empleados_sin_evaluacion, 1):
                secuencial = empleado.get('secuencial')
                nombre = empleado.get('nombreunido', 'N/A')

                if dry_run:
                    print(f"[{i}/{len(empleados_sin_evaluacion)}] [SIMULATE] SIMULARIA crear evaluacion para {nombre} (ID: {secuencial})")
                    stats['creadas_exitosas'] += 1
                else:
                    print(f"[{i}/{len(empleados_sin_evaluacion)}] [CREATING] Creando evaluacion para {nombre} (ID: {secuencial})...", end=" ")
                    resultado = self.crear_evaluacion_borrador(secuencial, periodo_id)

                    if resultado:
                        stats['creadas_exitosas'] += 1
                        print(f"[OK] Creada (ID: {resultado.get('id')})")
                    else:
                        stats['creadas_fallidas'] += 1
                        print("[ERROR] FALLO")

        return stats

    def imprimir_resumen(self, stats: Dict[str, int], dry_run: bool = False):
        """Imprime resumen de la ejecución"""
        print("\n" + "="*70)
        print("RESUMEN DE EJECUCIÓN")
        print("="*70)
        print(f"Total empleados procesados:    {stats['total_empleados']}")
        print(f"Con evaluación existente:      {stats['con_evaluacion']}")
        print(f"Sin evaluación:                {stats['sin_evaluacion']}")

        if dry_run:
            print(f"\nEvaluaciones a crear (simulación): {stats['creadas_exitosas']}")
        else:
            print(f"\nEvaluaciones creadas exitosamente: {stats['creadas_exitosas']}")
            print(f"Evaluaciones fallidas:             {stats['creadas_fallidas']}")

        print("="*70 + "\n")


def main():
    """Función principal"""
    parser = argparse.ArgumentParser(
        description='Crear evaluaciones masivas para empleados activos sin evaluación',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Ejemplos de uso:
  # Crear evaluaciones para el periodo 7
  python crear_evaluaciones_masivas.py --periodo-id 7

  # Simular sin crear (modo dry-run)
  python crear_evaluaciones_masivas.py --periodo-id 7 --dry-run

  # Crear evaluación solo para un empleado específico
  python crear_evaluaciones_masivas.py --periodo-id 7 --empleado-id 318

  # Usar API personalizada
  python crear_evaluaciones_masivas.py --periodo-id 7 --api-url http://localhost:7070
        """
    )

    parser.add_argument(
        '--periodo-id',
        type=int,
        required=True,
        help='ID del periodo para el cual crear las evaluaciones'
    )

    parser.add_argument(
        '--empleado-id',
        type=int,
        help='Secuencial de empleado específico (opcional, procesa solo ese empleado)'
    )

    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Modo simulación: muestra qué se haría sin ejecutar cambios'
    )

    parser.add_argument(
        '--api-url',
        type=str,
        default='http://192.168.7.222:7070',
        help='URL del API (default: http://192.168.7.222:7070)'
    )

    parser.add_argument(
        '--timeout',
        type=int,
        default=30,
        help='Timeout para peticiones HTTP en segundos (default: 30)'
    )

    args = parser.parse_args()

    # Crear instancia del procesador
    creator = EvaluacionMasivaCreator(
        api_url=args.api_url,
        timeout=args.timeout
    )

    # Procesar empleados
    stats = creator.procesar_empleados(
        periodo_id=args.periodo_id,
        dry_run=args.dry_run,
        empleado_especifico=args.empleado_id
    )

    # Imprimir resumen
    creator.imprimir_resumen(stats, dry_run=args.dry_run)

    # Código de salida
    if stats['creadas_fallidas'] > 0:
        sys.exit(1)
    else:
        sys.exit(0)


if __name__ == '__main__':
    main()
