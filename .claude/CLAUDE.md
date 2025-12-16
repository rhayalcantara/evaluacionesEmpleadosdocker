# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Sistema de Evaluación de Empleados** - Employee performance evaluation system for COOPERATIVA COOPASPIRE. Angular 16 application using Module Federation to integrate with a separate login application (`loginapp`). The system manages employee evaluations, performance metrics, competencies, strategic goals, and generates comprehensive reports.

**Technology Stack:**
- Angular 16.2.12
- TypeScript 4.9.4
- Module Federation (Micro-frontend architecture)
- Angular Material for UI components
- Chart.js for data visualization
- RxJS for reactive programming

**Key External Dependencies:**
- `@angular-architects/module-federation`: Micro-frontend integration
- `@commons-lib`: Shared library between micro-frontends
- PDF generation: jspdf, pdfmake, html2canvas
- Excel export: xlsx, file-saver, jszip
- Notifications: sweetalert2

## Architecture

### Module Federation Setup
This application is a **shell application** that loads a remote `loginapp` module. The webpack configuration (`webpack.config.js`) defines:
- Remote: `loginapp` at `/loginapp/remoteEntry.js`
- Shared modules with singleton pattern
- Shared mapping for `@commons-lib`
- Public path: `/evaluacionempleado/`

### Core Architecture Pattern: Controller-Model-View

The application follows a **Controller-based architecture** (not standard Angular services):

**Controllers** (`src/app/Controllers/`):
- 40+ controller classes managing business logic and API interactions
- Each controller encapsulates CRUD operations for a specific entity
- Examples: `Evaluacion.ts`, `Empleados.ts`, `Metas.ts`, `Periodos.ts`
- Controllers maintain local state and handle data transformations

**Models** (`src/app/Models/`):
- TypeScript interfaces defining data structures
- Organized by entity in subdirectories
- Pattern: `IEntityName` (e.g., `IEvaluacion`, `IEmpleado`)
- `ModelResponse` wrapper for API responses

**Views** (`src/app/Views/Components/`):
- **Pages/**: Full page components (evaluacion, dashboard, historial-evaluaciones, etc.)
- **Forms/**: Reusable form components (FormEvaluationEmploye, form-periodos, form-metas, etc.)
- **evaluacioncomponents/**: Specialized evaluation components (criterialitem, emojirating)
- Mix of traditional and standalone components

**Services** (`src/app/Services/`):
- `datos-service.service.ts`: Central HTTP service with common operations and SweetAlert2 integration
- `segurity.service.ts`: Authentication and user management
- `logger.service.ts`: Centralized logging with environment-based levels and sensitive data sanitization
- `token-interceptor.service.ts`: Adds Bearer token to requests
- `error-interceptor.service.ts`: Global HTTP error handling (401/403 → logout, 404 → message, 5xx → error)
- `excel.service.ts`: Excel export functionality
- `comunicacion.service.ts`: Component communication via observables

### Environment Configuration

**Two environments with file replacement in production builds:**

```typescript
// environment.ts (development)
{
  production: false,
  apiUrl: 'http://192.168.7.222:7070',
  fotoPadronUrl: 'http://192.168.7.222:8080',
  apiTimeout: 30000,
  enableDebug: true,
  version: '1.0.0'
}

// environment.prod.ts (production)
{
  production: true,
  apiUrl: 'http://192.168.7.222:7070',
  fotoPadronUrl: 'http://192.168.7.222:8080',
  apiTimeout: 10000,
  enableDebug: false,
  version: '1.0.0'
}
```

**Note:** Project runs within corporate VPN. HTTPS planned but currently postponed (see `auditoria/guia-migracion-https.md`).

## Development Commands

### Essential Commands
```bash
# Install dependencies
npm install

# Development server (port 4200)
npm start
# or
ng serve

# Build for production
npm run build

# Build with watch mode
npm run watch

# Run tests
npm test
# or
ng test

# Run all micro-frontends together (requires configuration)
npm run run:all
```

### Build System
- **Builder**: `ngx-build-plus` (Module Federation support)
- **Production build**: Automatically replaces `environment.ts` with `environment.prod.ts`
- **Base href**: `/evaluacionempleado/`
- **Custom webpack**: `webpack.config.js` (development), `webpack.prod.config.js` (production)
- **Proxy**: `proxy.conf.json` for API requests

### Angular CLI
```bash
# Generate component
ng generate component component-name

# Generate service
ng generate service service-name

# Generate other artifacts
ng generate directive|pipe|guard|interface|enum|module
```

## Key Features & Modules

### 1. Employee Evaluations (`Evaluacion`)
- Self-evaluation and supervisor evaluation
- Performance metrics (Desempeño) and competencies (Competencias)
- Weighted scoring system with configurable percentages
- Strategic goal alignment (Metas) with perspectives (Financiera, Cliente, Procesos Internos, Aprendizaje y Crecimiento)
- Evaluation periods with configurable date ranges

### 2. Evaluation History (`historial-evaluaciones`)
**Recently implemented feature** - full implementation with:
- Chronological list of past evaluations per employee
- Filters by period/date
- Comparison modals between evaluations
- Detail modals with tabs (General Info, Scores, Analysis)
- Interactive evolution charts using Chart.js
- Role-based access (Supervisor, Employee, Admin)

Controllers: `HistorialEvaluacion.ts`
Models: `IHistorialEvaluacion.ts`
Components: `src/app/Views/Components/Pages/historial-evaluaciones/`

### 3. Performance Management
- KPIs (Key Performance Indicators)
- KRIs (Key Result Indicators)
- Strategic goals (Objetivos Estratégicos)
- Performance goals (Metas) with perspectives and weights
- Employee performance tracking (EmpleadoDesempeno)

### 4. Organizational Structure
- Departments (Departamento)
- Positions (Puestos)
- Roles (Roles) and categories (CategoriaPuesto)
- Role-category-position mapping (RolCategoriaPuesto)
- Supervisor exceptions (ExcepcionSupervisorInmediato)

### 5. Training & Development
- Training courses (CursoCapacitacion)
- Course evaluations (EvaluacionCursoCapacitacion)
- Employee aspirations (Aspiracion)

### 6. Reporting & Export
- PDF reports (jspdf, pdfmake, html2canvas)
- Excel exports (xlsx) with batch download as ZIP
- Evaluation report component (`evaluacion-reporte`)

## Security Implementations (Phase 1 Complete)

The project recently completed **Phase 1 security remediation**. Key implementations:

### 1. LoggerService
- Centralized logging at `src/app/Services/logger.service.ts`
- Levels: Debug, Info, Warn, Error
- **Automatic sensitive data sanitization** (redacts: token, password, jwt, authorization keys)
- Environment-based: Debug logs only in development
- Ready for integration with Sentry/LogRocket

**Usage:**
```typescript
constructor(private logger: LoggerService) {}

this.logger.debug('Debug message', data);
this.logger.info('Info message', data);
this.logger.warn('Warning message');
this.logger.error('Error occurred', error);
```

### 2. Secure Authentication
- Proper logout implementation in `segurity.service.ts`
- Token interceptor without sensitive logging
- Error interceptor with correct logout triggers (401/403 only, not 404)

### 3. Environment-Based Configuration
- No hardcoded URLs in code
- All API URLs use `environment.apiUrl` and `environment.fotoPadronUrl`
- File replacement in production builds

### Security Documentation
- `auditoria/plan-accion-tecnico.md`: Technical action plan with all Phase 1 tasks
- `auditoria/guia-migracion-https.md`: HTTPS migration guide (postponed for VPN environment)
- `auditoria/guia-limpieza-console-logs.md`: Console.log cleanup guide
- `auditoria/reporte-testing-fase1.md`: Phase 1 testing report

## Important Patterns & Conventions

### Data Flow Pattern
1. **Component** calls **Controller** method
2. **Controller** uses `DatosServiceService` for HTTP
3. **Controller** transforms response using **Model** interfaces
4. **Component** receives typed data and updates view
5. Use `ComunicacionService` for inter-component communication

### API Communication
```typescript
// Use DatosServiceService methods
this.datosService.getdatos<T>(url)           // GET list (returns ModelResponse)
this.datosService.getbyid<T>(url)            // GET single
this.datosService.insertardatos<T>(url, obj) // POST
this.datosService.updatedatos<T>(url, obj)   // PUT
this.datosService.delbyid<T>(url)            // DELETE
```

### Form Handling
```typescript
// Auto-generate FormGroup from object
let formGroup = this.datosService.llenarFormGrup<T>(obj);
```

### User Messages
```typescript
// Use DatosServiceService.showMessage for consistent SweetAlert2 notifications
this.datosService.showMessage(
  'Message text',
  'Title',
  'success' | 'info' | 'warning' | 'error'
);
```

### Component Communication
```typescript
// Publisher
this.comunicacionService.sendData({ mensaje: 'buscar', id: employeeId });

// Subscriber
this.comunicacionService.enviarMensajeObservable.subscribe((data: any) => {
  if (data.mensaje === 'buscar') {
    // Handle message
  }
});
```

## Common Development Tasks

### Adding a New Entity
1. Create interface in `src/app/Models/EntityName/IEntityName.ts`
2. Create controller in `src/app/Controllers/EntityName.ts` (follow pattern from existing controllers)
3. Create page component in `src/app/Views/Components/Pages/entity-name/`
4. Create form component in `src/app/Views/Components/Forms/form-entity-name/`
5. Add routes in routing module
6. Update navigation if needed

### Working with Evaluations
- Main evaluation component: `FormEvaluationEmploye.component.ts`
- Evaluation criteria: `criterialitem.component.ts`
- Controllers: `Evaluacion.ts`, `EvaluacionDesempenoMeta.ts`
- Key calculation: Performance (Desempeño) + Competencies (Competencias) weighted by `PorcientoDesempenoCompetencia`

### Adding New Reports
- Use `excel.service.ts` for Excel exports
- Use jspdf + html2canvas for PDF generation
- See `evaluacion-reporte.component.ts` for patterns

## Testing & Quality

### Current Status
- **Build**: Compiles successfully with warnings (CSS budget exceeded on 4 components)
- **TypeScript**: Some pre-existing errors in non-critical files
- **Tests**: Karma/Jasmine configured but minimal test coverage
- **Phase 1 Security**: ✅ Complete (all critical vulnerabilities remediated)

### Known Issues
- CSS budget warnings on: FormEvaluationEmploye, from-objetivo-extrategico, evaluacion, historial-evaluaciones
- CommonJS dependencies warnings: file-saver, jszip (documented as acceptable)
- Some experimental decorator warnings (normal for Angular 16)

## Important Files & Directories

```
auditoria/                          # Security audit documentation
src/app/
  ├── Controllers/                  # Business logic (40+ controllers)
  ├── Models/                       # TypeScript interfaces
  ├── Services/                     # Singleton services
  │   ├── datos-service.service.ts  # Central HTTP service
  │   ├── logger.service.ts         # Logging with sanitization
  │   ├── segurity.service.ts       # Authentication
  │   └── excel.service.ts          # Excel export
  ├── Views/Components/
  │   ├── Pages/                    # Full page components
  │   ├── Forms/                    # Reusable forms
  │   └── evaluacioncomponents/     # Evaluation-specific
  └── Helpers/                      # Utility interfaces
src/environments/                   # Environment configurations
webpack.config.js                   # Module Federation config
proxy.conf.json                     # Development proxy
```

## Project-Specific Notes

### VPN Environment
This is an **internal corporate application** running within COOPERATIVA COOPASPIRE's VPN. HTTPS is documented but postponed as the VPN provides transport security.

### Module Federation Integration
The application expects `loginapp` to be available at `/loginapp/remoteEntry.js`. Ensure the login micro-frontend is deployed and accessible before running in production.

### Photo Integration
`fotoPadronUrl` API provides employee photos. Used in multiple components for employee identification.

### Strategic Planning Integration
The evaluation system ties directly to strategic planning:
- Strategic plans (PlanExtrategico)
- Strategic objectives by year (ObjetivoExtrategicoAno)
- Perspectives (Perspectiva): Financiera, Cliente, Procesos Internos, Aprendizaje y Crecimiento
- Goals (Metas) aligned to perspectives with inverse calculation support

### Evaluation States
Common states: "Borrador" (Draft), "Enviado" (Submitted), "Completada" (Completed), "Rechazada" (Rejected)

## Deployment

**Base Path**: `/evaluacionempleado/`

The application is configured to run at this base path. Ensure web server routing is configured accordingly.

**Build Output**: `dist/evaluacionempleado/`

**Production Deployment Checklist**:
1. Ensure environment.prod.ts has correct API URLs
2. Verify loginapp remote is accessible
3. Build with production configuration
4. Deploy dist folder to web server
5. Configure base path routing
6. Test Module Federation loading

## Additional Resources

- Angular CLI: https://angular.dev/tools/cli
- Module Federation: https://github.com/angular-architects/module-federation-plugin
- Security audit documentation in `auditoria/` folder
