# Guía de Limpieza de Console.logs

## Contexto
El proyecto actualmente tiene **461 console.logs** distribuidos en **115 archivos**. Muchos de estos logs exponen información sensible o innecesaria en producción.

## Estado Actual
✅ **LoggerService creado:** `src/app/Services/logger.service.ts`
- Sistema de logging centralizado con niveles (Debug, Info, Warn, Error)
- Sanitización automática de datos sensibles (tokens, passwords)
- Solo activo en desarrollo por defecto

## Objetivos
1. Eliminar todos los console.logs que expongan datos sensibles
2. Reemplazar console.logs informativos con LoggerService
3. Reducir ruido en consola de producción
4. Facilitar debugging en desarrollo

---

## Priorización de Limpieza

### 🔴 PRIORIDAD CRÍTICA (Completar en Fase 1)
Archivos con datos sensibles o lógica crítica de seguridad:

1. **Servicios de Autenticación**
   - ✅ `src/app/Services/token-interceptor.service.ts` (Ya limpiado)
   - ✅ `src/app/Services/datos-service.service.ts` (Ya migrado a logger)
   - [ ] `src/app/Controllers/Usuario.ts`
   - [ ] `src/app/Views/Components/Pages/home/home.component.ts` (login)

2. **Interceptores y Manejo de Errores**
   - ✅ `src/app/Services/error-interceptor.service.ts` (Ya corregido)

3. **Controladores con Datos Sensibles**
   - [ ] `src/app/Controllers/Empleados.ts` (9 console.logs)
   - [ ] `src/app/Controllers/EmpleadoDesempeno.ts`
   - [ ] `src/app/Controllers/Evaluacion.ts` (14 console.logs)

### 🟠 PRIORIDAD ALTA (Completar en Fase 2)
Archivos con múltiples console.logs que generan ruido:

1. **Componentes de Formularios**
   - [ ] `src/app/Views/Components/Forms/FormEvaluationEmploye/FormEvaluationEmploye.component.ts` (16 logs)
   - [ ] `src/app/Views/Components/evaluacioncomponents/criterialitem/criterialitem.component.ts` (19 logs)
   - [ ] `src/app/Views/Components/Forms/form-metas/form-metas.component.ts` (5 logs)

2. **Páginas Principales**
   - [ ] `src/app/Views/Components/Pages/puestos/puestos.component.ts` (9 logs)
   - [ ] `src/app/Views/Components/Pages/evaluation-periods/evaluation-periods.component.ts` (10 logs)
   - [ ] `src/app/Views/Components/Pages/dashboard/dashboard.component.ts` (4 logs)

3. **Controladores con Lógica de Negocio**
   - [ ] `src/app/Controllers/ExcepcionSupervisorInmediato.ts` (10 logs)
   - [ ] `src/app/Controllers/Puestos.ts` (10 logs)
   - [ ] `src/app/Controllers/Estado.ts` (9 logs)

### 🟡 PRIORIDAD MEDIA (Completar en Fase 3)
Archivos con pocos console.logs o menos críticos:

- Todos los demás archivos con 1-5 console.logs
- Componentes de visualización sin datos sensibles
- Helpers y utilidades

---

## Guía de Migración

### Paso 1: Importar LoggerService

**Antes:**
```typescript
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MiServicio {
  constructor() { }
}
```

**Después:**
```typescript
import { Injectable } from '@angular/core';
import { LoggerService } from '../Services/logger.service';  // Ajustar path según ubicación

@Injectable({
  providedIn: 'root'
})
export class MiServicio {
  constructor(private logger: LoggerService) { }
}
```

### Paso 2: Reemplazar console.logs

#### Caso 1: Debugging General
**Antes:**
```typescript
console.log('Usuario cargado:', usuario);
```

**Después:**
```typescript
this.logger.debug('Usuario cargado', { usuario });
```

#### Caso 2: Información Importante
**Antes:**
```typescript
console.log('Evaluación guardada exitosamente');
```

**Después:**
```typescript
this.logger.info('Evaluación guardada exitosamente');
```

#### Caso 3: Advertencias
**Antes:**
```typescript
console.log('ADVERTENCIA: Periodo no encontrado');
```

**Después:**
```typescript
this.logger.warn('Periodo no encontrado', { periodoId });
```

#### Caso 4: Errores
**Antes:**
```typescript
console.log('Error al cargar datos:', error);
console.error(error);
```

**Después:**
```typescript
this.logger.error('Error al cargar datos', error);
```

#### Caso 5: Datos Sensibles (ELIMINAR o SANITIZAR)
**Antes:**
```typescript
console.log('Token recibido:', token);  // ❌ NUNCA HACER ESTO
console.log('Usuario autenticado:', { password: pwd });  // ❌ NUNCA
```

**Después:**
```typescript
this.logger.debug('Token recibido');  // ✅ Sin mostrar el valor
// O simplemente eliminar el log
```

---

## Patrones de Console.logs a Eliminar Completamente

### 1. Logs de Tokens/Autenticación
```typescript
// ❌ ELIMINAR
console.log({ token: userToken });
console.log('JWT:', jwt);
console.log('Authorization header:', authHeader);
```

### 2. Logs de Passwords
```typescript
// ❌ ELIMINAR
console.log('Password:', password);
console.log('Credenciales:', { usuario, contrasena });
console.log({ passwordHash });
```

### 3. Logs de Datos Personales Sensibles
```typescript
// ❌ ELIMINAR o SANITIZAR
console.log('Empleado completo:', empleado); // Puede contener salario, cédula, etc.
console.log('Usuario con todos los datos:', usuario);
```

### 4. Logs Redundantes
```typescript
// ❌ ELIMINAR (No aportan valor)
console.log('entro aqui');
console.log('paso por aca');
console.log('en el metodo');
```

### 5. Logs de Arrays/Objetos Grandes
```typescript
// ❌ ELIMINAR o LIMITAR
console.log('Todos los empleados:', empleados); // Si son 1000 empleados, satura consola
```

---

## Script Automatizado de Búsqueda

Para encontrar console.logs críticos, usar estos comandos:

```bash
# Buscar console.logs con "token"
grep -r "console.*token" src/app --include="*.ts"

# Buscar console.logs con "password" o "contraseña"
grep -r "console.*(password|contrasena|pwd)" src/app --include="*.ts"

# Buscar console.logs con "usuario" o "user"
grep -r "console.*(usuario|user)" src/app --include="*.ts"

# Contar console.logs por archivo
grep -r "console\.(log|error|warn|info|debug)" src/app --include="*.ts" | cut -d: -f1 | sort | uniq -c | sort -rn
```

---

## Checklist de Migración por Archivo

Al limpiar un archivo, seguir estos pasos:

- [ ] **Importar LoggerService** en el constructor
- [ ] **Identificar console.logs sensibles** (token, password, etc.) y eliminarlos
- [ ] **Reemplazar console.log** con `this.logger.debug()`
- [ ] **Reemplazar console.info** con `this.logger.info()`
- [ ] **Reemplazar console.warn** con `this.logger.warn()`
- [ ] **Reemplazar console.error** con `this.logger.error()`
- [ ] **Eliminar logs redundantes** que no aportan información
- [ ] **Probar** que la funcionalidad sigue trabajando correctamente
- [ ] **Verificar** que no hay logs sensibles en la consola del navegador

---

## Ejemplos de Migración Completa

### Ejemplo 1: Servicio Simple

**Antes:**
```typescript
@Injectable()
export class EmpleadoService {
  constructor(private http: HttpClient) { }

  getEmpleados(): Observable<Empleado[]> {
    console.log('Cargando empleados...');
    return this.http.get<Empleado[]>('/api/empleados').pipe(
      tap(empleados => console.log('Empleados cargados:', empleados.length)),
      catchError(error => {
        console.error('Error al cargar empleados:', error);
        return throwError(error);
      })
    );
  }
}
```

**Después:**
```typescript
@Injectable()
export class EmpleadoService {
  constructor(
    private http: HttpClient,
    private logger: LoggerService
  ) { }

  getEmpleados(): Observable<Empleado[]> {
    this.logger.debug('Cargando empleados');
    return this.http.get<Empleado[]>('/api/empleados').pipe(
      tap(empleados => this.logger.info('Empleados cargados', { count: empleados.length })),
      catchError(error => {
        this.logger.error('Error al cargar empleados', error);
        return throwError(() => error);
      })
    );
  }
}
```

### Ejemplo 2: Componente con Datos Sensibles

**Antes:**
```typescript
export class LoginComponent {
  login(username: string, password: string) {
    console.log('Intentando login con:', { username, password });  // ❌ CRÍTICO
    this.authService.login(username, password).subscribe(
      response => {
        console.log('Login exitoso:', response);  // Puede contener token
        console.log('Token:', response.token);  // ❌ CRÍTICO
        this.router.navigate(['/dashboard']);
      },
      error => {
        console.error('Error en login:', error);
      }
    );
  }
}
```

**Después:**
```typescript
export class LoginComponent {
  constructor(
    private authService: AuthService,
    private router: Router,
    private logger: LoggerService
  ) { }

  login(username: string, password: string) {
    this.logger.debug('Intentando login', { username });  // ✅ Solo username, no password
    this.authService.login(username, password).subscribe(
      response => {
        this.logger.info('Login exitoso');  // ✅ Sin datos sensibles
        this.router.navigate(['/dashboard']);
      },
      error => {
        this.logger.error('Error en login', error);
      }
    );
  }
}
```

---

## Configuración de LoggerService

### Cambiar Nivel de Log Manualmente
```typescript
// En development
this.logger.setLogLevel(LogLevel.Debug);  // Ver todo

// En producción (ya configurado por defecto)
this.logger.setLogLevel(LogLevel.Warn);  // Solo warns y errors
```

### Agregar Lista de Palabras Sensibles
Si necesitas agregar más palabras sensibles a sanitizar, editar:
`src/app/Services/logger.service.ts:94`

```typescript
const sensitiveKeys = [
  'token',
  'password',
  'contrasena',
  'passwordHash',
  'jwt',
  'authorization',
  'apiKey',        // Agregar
  'secret',        // Agregar
  'cedula',        // Agregar si es sensible
  'salario'        // Agregar si es sensible
];
```

---

## Métricas de Progreso

### Estado Actual (Fase 1)
- **Total console.logs:** 461
- **Archivos afectados:** 115
- **Limpiados (críticos):** 3 archivos
- **Pendientes (críticos):** ~10 archivos

### Objetivo Fase 1
- **Eliminar:** 100% de logs con datos sensibles (token, password)
- **Migrar:** Archivos de servicios críticos
- **Reducir:** A menos de 400 console.logs

### Objetivo Fase 2
- **Migrar:** Todos los componentes principales
- **Reducir:** A menos de 200 console.logs

### Objetivo Fase 3
- **Migrar:** Todos los archivos restantes
- **Reducir:** A menos de 50 console.logs (solo críticos necesarios)

---

## Testing del LoggerService

### Verificar que funciona correctamente

```typescript
// En cualquier componente o servicio
export class TestComponent implements OnInit {
  constructor(private logger: LoggerService) { }

  ngOnInit() {
    // Test de niveles
    this.logger.debug('Mensaje de debug', { data: 'test' });
    this.logger.info('Mensaje informativo');
    this.logger.warn('Mensaje de advertencia');
    this.logger.error('Mensaje de error', new Error('Test error'));

    // Test de sanitización
    const userData = {
      nombre: 'Juan',
      token: 'abc123-secret',  // Debe aparecer como [REDACTED]
      password: 'mi-password'  // Debe aparecer como [REDACTED]
    };
    this.logger.debug('Usuario con datos sensibles', userData);
  }
}
```

### Verificación en Consola del Navegador

**En Desarrollo (`npm start`):**
- Debes ver todos los logs con timestamp y nivel

**En Producción (`npm run build --configuration=production`):**
- Solo debes ver logs de nivel WARN y ERROR
- No debes ver ningún token o password en texto plano

---

## Integración Futura con Sistemas de Monitoreo

El LoggerService está preparado para integrarse con:

### Sentry (Recomendado)
```typescript
// En logger.service.ts, método error()
error(message: string, error?: Error, ...args: any[]): void {
  this.log(LogLevel.Error, message, [error, ...args]);

  if (environment.production && error) {
    Sentry.captureException(error, {
      tags: { component: 'LoggerService' },
      extra: { message, args }
    });
  }
}
```

### LogRocket
```typescript
if (environment.production) {
  LogRocket.log(level, message, args);
}
```

### Application Insights (Azure)
```typescript
if (environment.production) {
  this.appInsights.trackException({ exception: error, properties: { message } });
}
```

---

## Preguntas Frecuentes

### ¿Debo eliminar TODOS los console.logs?
No. Solo los que:
1. Expongan datos sensibles (token, password)
2. No aporten valor en debugging
3. Saturen la consola con información redundante

### ¿Puedo dejar algunos console.logs para testing rápido?
Sí, pero:
- Usa `this.logger.debug()` en lugar de `console.log()`
- Elimínalos antes de hacer commit a producción
- Nunca dejes logs con datos sensibles

### ¿Qué hago si necesito loggear un objeto grande?
Loggea solo las propiedades relevantes:
```typescript
// ❌ Mal
this.logger.debug('Empleado', empleado);  // Todo el objeto

// ✅ Bien
this.logger.debug('Empleado', {
  id: empleado.id,
  nombre: empleado.nombre
});
```

### ¿El LoggerService afecta el performance?
No significativamente:
- En producción, la mayoría de logs no se ejecutan (nivel WARN o superior)
- La sanitización solo ocurre cuando efectivamente se loggea
- El overhead es mínimo (<1ms por log)

---

## Responsables

| Tarea | Responsable | Fecha Límite |
|-------|-------------|--------------|
| **Limpieza Prioridad Crítica** | Dev Senior 1 | Fase 1 (2 semanas) |
| **Limpieza Prioridad Alta** | Dev Mid Level | Fase 2 (3 semanas) |
| **Limpieza Prioridad Media** | Equipo completo | Fase 3 (ongoing) |
| **Code Review** | Tech Lead | Cada PR |

---

## Referencias

- **LoggerService:** `src/app/Services/logger.service.ts`
- **Environment Config:** `src/environments/environment.ts`
- **Audit Report:** `auditoria/reporte-auditoria-seguridad.md`

---

**Última actualización:** 24/11/2025
**Versión:** 1.0
**Estado:** En progreso - Fase 1
