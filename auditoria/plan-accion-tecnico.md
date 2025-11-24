# PLAN DE ACCIÓN TÉCNICO DETALLADO
## Remediación - Sistema de Evaluación de Empleados

---

**Versión:** 1.0
**Fecha:** 24 de Noviembre, 2025
**Estado:** ⏳ PENDIENTE
**Última Actualización:** 24 de Noviembre, 2025

---

## FASE 1: REMEDIACIÓN CRÍTICA (2 SEMANAS)

### Objetivo
Eliminar vulnerabilidades de seguridad críticas que exponen el sistema a riesgos inmediatos.

---

### TAREA 1.1: Eliminación de Logs de Tokens
**Prioridad:** 🔴 CRÍTICA
**Esfuerzo:** 2 horas
**Estado:** ⏳ PENDIENTE
**Asignado a:** Dev Senior 1

#### Archivos a Modificar:
```
src/app/Services/token-interceptor.service.ts
```

#### Cambios:
```typescript
// ANTES (línea 17):
console.log({token:userToken})  // ❌ ELIMINAR

// DESPUÉS:
// Eliminado completamente o:
if (!environment.production) {
  console.debug('[Auth] Request interceptado');
}
```

#### Validación:
- [ ] Build de producción sin console.log de tokens
- [ ] Verificar que autenticación sigue funcionando
- [ ] Code review aprobado

---

### TAREA 1.2: Implementar Método logout()
**Prioridad:** 🔴 CRÍTICA
**Esfuerzo:** 4 horas
**Estado:** ⏳ PENDIENTE
**Asignado a:** Dev Senior 1

#### Archivos a Modificar:
```
src/app/Services/segurity.service.ts
```

#### Implementación:
```typescript
public logout() {
  // 1. Limpiar localStorage
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');

  // 2. Limpiar estado de usuario
  this._usuario = null!;

  // 3. Notificar a otros componentes
  this.commons.sendData('logout');

  // 4. Llamar al backend para invalidar token (si existe endpoint)
  return this.http.post(`${this.apiUrl}/api/auth/logout`, {})
    .pipe(
      catchError(err => {
        console.error('Error en logout:', err);
        return of(null);
      })
    );
}
```

#### Tareas Relacionadas:
1. Actualizar componente de logout para usar nuevo método
2. Agregar confirmación antes de logout
3. Redirigir a login después de logout exitoso

#### Validación:
- [ ] Token eliminado de localStorage después de logout
- [ ] Usuario redirigido a login
- [ ] No se pueden hacer requests después de logout
- [ ] Tests unitarios creados

---

### TAREA 1.3: Configurar Variables de Ambiente
**Prioridad:** 🔴 CRÍTICA
**Esfuerzo:** 1 día
**Estado:** ⏳ PENDIENTE
**Asignado a:** Dev Senior 2

#### Archivos a Crear:
```
src/environments/environment.ts
src/environments/environment.prod.ts
```

#### Contenido environment.ts:
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:7070',
  apiTimeout: 30000,
  enableDebug: true,
  version: '1.0.0'
};
```

#### Contenido environment.prod.ts:
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.coopaspire.com',
  apiTimeout: 10000,
  enableDebug: false,
  version: '1.0.0'
};
```

#### Archivos a Modificar:
```
src/app/Services/datos-service.service.ts (líneas 16-18)
angular.json (configuración de fileReplacements)
```

#### Cambios en datos-service.service.ts:
```typescript
import { environment } from '../../environments/environment';

export class DatosServiceService {
  public URL: string = environment.apiUrl;
  // ... resto del código
}
```

#### Validación:
- [ ] Build de desarrollo usa environment.ts
- [ ] Build de producción usa environment.prod.ts
- [ ] API URL correcta en cada ambiente
- [ ] No hay URLs hardcodeadas en datos-service

---

### TAREA 1.4: Corregir Manejo de Error 404
**Prioridad:** 🔴 CRÍTICA
**Esfuerzo:** 4 horas
**Estado:** ⏳ PENDIENTE
**Asignado a:** Dev Senior 1

#### Archivos a Modificar:
```
src/app/Services/error-interceptor.service.ts
```

#### Implementación:
```typescript
intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
  return next.handle(request).pipe(
    catchError((err) => {
      // Manejar 401 - No autorizado
      if (err.status === 401) {
        this.datos.showMessage(
          'Su sesión ha expirado. Por favor, inicie sesión nuevamente.',
          'Sesión Expirada',
          'warning'
        );
        this.authenticationService.logout();
        this.router.navigate(['/login']);
      }

      // Manejar 403 - Prohibido
      else if (err.status === 403) {
        this.datos.showMessage(
          'No tiene permisos para realizar esta acción.',
          'Acceso Denegado',
          'error'
        );
      }

      // Manejar 404 - No encontrado
      else if (err.status === 404) {
        this.datos.showMessage(
          'El recurso solicitado no fue encontrado.',
          'No Encontrado',
          'warning'
        );
      }

      // Manejar errores del servidor (5xx)
      else if (err.status >= 500) {
        this.datos.showMessage(
          'Error del servidor. Por favor, intente nuevamente más tarde.',
          'Error del Servidor',
          'error'
        );
      }

      return throwError(() => err);
    })
  );
}
```

#### Validación:
- [ ] Error 404 no causa logout
- [ ] Error 401 causa logout correcto
- [ ] Mensajes apropiados para cada tipo de error
- [ ] Tests de integración pasando

---

### TAREA 1.5: Preparar Migración HTTPS
**Prioridad:** 🔴 CRÍTICA
**Esfuerzo:** 3 días
**Estado:** ⏳ PENDIENTE
**Asignado a:** DevOps + Dev Senior 2

#### Sub-tareas:

**1.5.1 Infraestructura (DevOps)**
- [ ] Adquirir certificado SSL/TLS
- [ ] Configurar servidor para HTTPS
- [ ] Configurar redirección HTTP → HTTPS
- [ ] Configurar HSTS headers
- [ ] Actualizar firewall rules

**1.5.2 Código (Dev Senior 2)**
- [ ] Actualizar todas las URLs a HTTPS en environment.prod.ts
- [ ] Configurar proxy para desarrollo con HTTPS
- [ ] Actualizar webpack config para HTTPS
- [ ] Verificar que Module Federation funcione con HTTPS

**1.5.3 Testing**
- [ ] Probar todas las funcionalidades en HTTPS
- [ ] Verificar certificados válidos
- [ ] Verificar que no hay mixed content warnings
- [ ] Probar en múltiples navegadores

#### Archivos a Modificar:
```
src/environments/environment.prod.ts
src/proxy.conf.json
webpack.config.js
```

#### Validación:
- [ ] Toda comunicación en HTTPS
- [ ] Sin errores de certificado
- [ ] Sin mixed content warnings
- [ ] Score A+ en SSL Labs

---

### TAREA 1.6: Limpieza de Console.logs Críticos
**Prioridad:** 🟠 ALTA
**Esfuerzo:** 1 día
**Estado:** ⏳ PENDIENTE
**Asignado a:** Dev Mid Level

#### Estrategia:
1. Identificar y remover console.logs en código de producción sensible
2. Crear servicio de logging centralizado
3. Reemplazar console.logs críticos con logger service

#### Archivos a Crear:
```
src/app/Services/logger.service.ts
```

#### Implementación Logger Service:
```typescript
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

export enum LogLevel {
  Debug = 0,
  Info = 1,
  Warn = 2,
  Error = 3
}

@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private logLevel: LogLevel = environment.production ? LogLevel.Warn : LogLevel.Debug;

  debug(message: string, ...args: any[]): void {
    this.log(LogLevel.Debug, message, args);
  }

  info(message: string, ...args: any[]): void {
    this.log(LogLevel.Info, message, args);
  }

  warn(message: string, ...args: any[]): void {
    this.log(LogLevel.Warn, message, args);
  }

  error(message: string, error?: Error, ...args: any[]): void {
    this.log(LogLevel.Error, message, [error, ...args]);
    // Aquí se puede integrar con Sentry, LogRocket, etc.
  }

  private log(level: LogLevel, message: string, args: any[]): void {
    if (level < this.logLevel) return;

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${LogLevel[level]}]`;

    switch (level) {
      case LogLevel.Debug:
        console.debug(prefix, message, ...args);
        break;
      case LogLevel.Info:
        console.info(prefix, message, ...args);
        break;
      case LogLevel.Warn:
        console.warn(prefix, message, ...args);
        break;
      case LogLevel.Error:
        console.error(prefix, message, ...args);
        break;
    }
  }
}
```

#### Archivos a Modificar (Prioridad):
```
src/app/Services/token-interceptor.service.ts
src/app/Controllers/Usuario.ts
src/app/Services/datos-service.service.ts
```

#### Validación:
- [ ] Build de producción sin console.log de datos sensibles
- [ ] Logger service implementado
- [ ] Console.logs críticos reemplazados
- [ ] Tests unitarios para logger service

---

## CHECKLIST FASE 1

### Pre-requisitos
- [ ] Aprobación de gerencia
- [ ] Recursos asignados (2 Sr Devs)
- [ ] Ambiente de staging disponible
- [ ] Backup de base de datos
- [ ] Plan de rollback definido

### Día 1-2
- [ ] Tarea 1.1 completada (Logs de tokens)
- [ ] Tarea 1.2 completada (logout)
- [ ] Tarea 1.3 completada (environments)

### Día 3-5
- [ ] Tarea 1.4 completada (error 404)
- [ ] Tarea 1.5 iniciada (HTTPS)
- [ ] Tarea 1.6 completada (console.logs)

### Día 6-10
- [ ] Tarea 1.5 completada (HTTPS)
- [ ] Testing en staging
- [ ] Code review completado

### Día 11-12
- [ ] Deploy a producción
- [ ] Monitoreo post-deploy (24h)
- [ ] Documentación actualizada

### Post-Fase 1
- [ ] Retrospectiva del equipo
- [ ] Actualizar métricas
- [ ] Planificar Fase 2

---

## MÉTRICAS DE ÉXITO FASE 1

| Métrica | Antes | Objetivo |
|---------|-------|----------|
| Vulnerabilidades Críticas | 5 | 0 |
| Console.logs Sensibles | 410 | <100 |
| Cobertura HTTPS | 0% | 100% |
| Método logout funcional | No | Sí |
| Configuración por ambiente | No | Sí |

---

## RIESGOS Y MITIGACIÓN

### Riesgo 1: Interrupción del Servicio
**Probabilidad:** Media
**Impacto:** Alto
**Mitigación:**
- Deploy fuera de horario laboral
- Comunicación previa a usuarios
- Plan de rollback inmediato

### Riesgo 2: Incompatibilidad con Module Federation
**Probabilidad:** Baja
**Impacto:** Alto
**Mitigación:**
- Testing exhaustivo en staging
- Validar remotes en HTTPS
- Tener versión anterior disponible

### Riesgo 3: Certificado SSL No Válido
**Probabilidad:** Baja
**Impacto:** Alto
**Mitigación:**
- Usar Let's Encrypt o certificado corporativo
- Validar en múltiples navegadores
- Configurar renovación automática

---

## PLAN DE ROLLBACK

### Situación: Fallo Crítico en Producción

**Tiempo de Rollback:** <15 minutos

#### Pasos:
1. Revertir deployment usando git tag anterior
2. Restaurar configuración de servidor anterior
3. Verificar que aplicación anterior funciona
4. Notificar a usuarios
5. Investigar causa raíz
6. Re-planificar deployment

#### Comandos:
```bash
# Rollback de código
git checkout tags/v1.0-stable
npm run build
# Deploy versión anterior

# Rollback de configuración
cp config/nginx.conf.backup /etc/nginx/nginx.conf
systemctl reload nginx
```

---

## COMUNICACIÓN

### Stakeholders a Notificar:

**Antes del Deploy:**
- Gerencia TI
- Usuarios RRHH (principales)
- Soporte técnico

**Durante el Deploy:**
- Equipo de desarrollo
- DevOps
- On-call engineer

**Después del Deploy:**
- Todos los stakeholders
- Reporte de éxito/issues

### Template de Comunicación:
```
Asunto: Mantenimiento Programado - Sistema de Evaluación

Estimados usuarios,

El [FECHA] de [HORA_INICIO] a [HORA_FIN] realizaremos mantenimiento
programado en el Sistema de Evaluación de Empleados.

Durante este tiempo:
- El sistema no estará disponible
- Se implementarán mejoras de seguridad
- No se perderá ningún dato

Por favor, guarden su trabajo antes de la hora indicada.

Gracias por su comprensión.

Equipo de TI
```

---

## APROBACIONES

| Rol          | Nombre     | Fecha  | Firma  |
|--------------|------------|--------|--------|
| Tech Lead    | __________ | ______ | ______ |
| Dev Senior 1 | __________ | ______ | ______ |
| Dev Senior 2 | __________ | ______ | ______ |
| DevOps       | __________ | ______ | ______ |
| QA Lead      | __________ | ______ | ______ |

---

**Próximo Documento:** Plan de Acción Fase 2 (a crear después de completar Fase 1)

---

*Documento de trabajo interno - Actualizar conforme avance el proyecto*
