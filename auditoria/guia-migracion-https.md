# Guía de Migración a HTTPS

## Contexto
La aplicación actualmente utiliza HTTP para todas sus comunicaciones. Este documento detalla los pasos necesarios para migrar a HTTPS.

## Estado Actual
- **Frontend Angular:** Servido en HTTP
- **API Backend:** `http://192.168.7.222:7070`
- **API Foto Padrón:** `http://192.168.7.222:8080`

## Objetivos
1. Habilitar HTTPS en todos los servicios
2. Obtener y configurar certificados SSL/TLS válidos
3. Actualizar configuración de la aplicación
4. Implementar redirección automática HTTP → HTTPS

---

## Requisitos Previos

### 1. Decisión de Certificado SSL
Elegir una de las siguientes opciones:

#### Opción A: Certificado de Autoridad Certificadora (Recomendado para Producción)
- **Ventajas:** Confiable, sin advertencias del navegador
- **Opciones:**
  - Let's Encrypt (gratis, renovación automática cada 90 días)
  - Certificado comercial (Sectigo, DigiCert, etc.)
- **Costo:** Gratis (Let's Encrypt) o desde $50/año

#### Opción B: Certificado Autofirmado (Solo para Desarrollo/Interno)
- **Ventajas:** Gratis, rápido de implementar
- **Desventajas:** Advertencias del navegador, no recomendado para producción
- **Uso:** Solo redes internas donde se pueda distribuir el certificado a los usuarios

---

## Pasos de Implementación

### FASE 1: Preparación del Servidor

#### 1.1 Instalar Certificado SSL en el Servidor Backend

**Para servidores IIS (Windows):**
```powershell
# 1. Generar CSR (Certificate Signing Request)
# Abrir IIS Manager → Server Certificates → Create Certificate Request

# 2. Enviar CSR a la CA y obtener el certificado

# 3. Completar la solicitud de certificado
# IIS Manager → Server Certificates → Complete Certificate Request

# 4. Vincular certificado al sitio
# Sites → [Su Sitio] → Bindings → Add
# Type: https
# Port: 443
# SSL Certificate: [Seleccionar el certificado instalado]
```

**Para servidores Linux (Nginx/Apache):**
```bash
# Instalar Certbot para Let's Encrypt
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Obtener certificado SSL
sudo certbot --nginx -d api.sudominio.com

# Certbot configurará automáticamente Nginx para HTTPS
```

#### 1.2 Configurar Puertos
- **Puerto 443:** HTTPS (Backend API principal)
- **Puerto 8443:** HTTPS (API Foto Padrón) - o puerto que desee usar
- **Puerto 80 y 8080:** Mantener para redirección a HTTPS

#### 1.3 Configurar Redirección HTTP → HTTPS

**IIS:**
- Instalar URL Rewrite Module
- Agregar regla de redirección en web.config:
```xml
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="HTTP to HTTPS redirect" stopProcessing="true">
          <match url="(.*)" />
          <conditions>
            <add input="{HTTPS}" pattern="off" ignoreCase="true" />
          </conditions>
          <action type="Redirect" url="https://{HTTP_HOST}/{R:1}" redirectType="Permanent" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
```

**Nginx:**
```nginx
server {
    listen 80;
    server_name api.sudominio.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.sudominio.com;

    ssl_certificate /etc/letsencrypt/live/api.sudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.sudominio.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Resto de la configuración...
}
```

---

### FASE 2: Actualización de la Aplicación Angular

#### 2.1 Actualizar Variables de Ambiente

**Modificar `src/environments/environment.prod.ts`:**
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://192.168.7.222:443',  // Cambiar http → https, puerto 7070 → 443
  fotoPadronUrl: 'https://192.168.7.222:8443',  // Cambiar http → https, puerto 8080 → 8443
  apiTimeout: 10000,
  enableDebug: false,
  version: '1.0.0'
};
```

**IMPORTANTE:** Si está usando nombres de dominio en lugar de IPs, actualizar así:
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.sudominio.com',
  fotoPadronUrl: 'https://fotopadron.sudominio.com',
  apiTimeout: 10000,
  enableDebug: false,
  version: '1.0.0'
};
```

#### 2.2 Actualizar Content Security Policy (si aplica)

Si su aplicación tiene un CSP header, actualizarlo para permitir conexiones HTTPS:
```
Content-Security-Policy: default-src 'self' https:; connect-src 'self' https://192.168.7.222:443 https://192.168.7.222:8443;
```

---

### FASE 3: Testing y Validación

#### 3.1 Checklist de Pruebas

- [ ] **Certificado SSL válido:** Verificar en navegador (candado verde)
- [ ] **Sin errores de certificado:** No debe haber advertencias de seguridad
- [ ] **Redirección HTTP → HTTPS funciona:** Probar `http://` redirige a `https://`
- [ ] **Todas las APIs responden vía HTTPS:**
  - API principal: `https://192.168.7.222:443/api/...`
  - API Foto Padrón: `https://192.168.7.222:8443/api/FotoPadron`
- [ ] **Login funciona:** Autenticación completa sin errores
- [ ] **Tokens se transmiten correctamente:** Verificar en DevTools → Network
- [ ] **Mixed Content resuelto:** No hay recursos HTTP cargados desde páginas HTTPS
- [ ] **CORS configurado:** Si backend y frontend están en dominios diferentes

#### 3.2 Pruebas de Seguridad

Usar herramientas online para validar la configuración SSL:
- **SSL Labs:** https://www.ssllabs.com/ssltest/
  - Objetivo: Calificación A o superior
- **Security Headers:** https://securityheaders.com/
  - Verificar headers de seguridad

---

### FASE 4: Despliegue en Producción

#### 4.1 Plan de Rollback
Tener preparado un plan para volver a HTTP si algo falla:
1. Cambiar bindings de IIS/Nginx de vuelta a HTTP
2. Revertir cambios en `environment.prod.ts`
3. Redesplegar build anterior

#### 4.2 Comunicación
- **Notificar a usuarios:** Si hay cambio de URL, informar con anticipación
- **Actualizar documentación:** Actualizar todas las referencias de URL
- **Actualizar marcadores:** Si los usuarios tienen bookmarks, pueden necesitar actualizarlos

#### 4.3 Monitoreo Post-Despliegue
Durante las primeras 48 horas después del despliegue:
- Monitorear logs de errores SSL
- Verificar que no hay picos de errores 500/503
- Revisar quejas de usuarios sobre acceso
- Monitorear performance (HTTPS tiene overhead mínimo, pero verificar)

---

## Configuraciones de Seguridad Adicionales (Recomendado)

### 1. HTTP Strict Transport Security (HSTS)
Forzar a los navegadores a usar siempre HTTPS:

**IIS web.config:**
```xml
<system.webServer>
  <httpProtocol>
    <customHeaders>
      <add name="Strict-Transport-Security" value="max-age=31536000; includeSubDomains" />
    </customHeaders>
  </httpProtocol>
</system.webServer>
```

**Nginx:**
```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

### 2. Configurar TLS Moderno
Solo permitir versiones seguras de TLS:
- **TLS 1.2** (mínimo)
- **TLS 1.3** (recomendado)
- **Deshabilitar:** SSL 2.0, SSL 3.0, TLS 1.0, TLS 1.1

### 3. Certificado de Renovación Automática (Let's Encrypt)
Si usa Let's Encrypt, configurar renovación automática:
```bash
# Agregar a crontab
0 0 1 * * certbot renew --quiet
```

---

## Costos Estimados

| Item | Costo | Frecuencia |
|------|-------|------------|
| **Let's Encrypt** | $0 | Gratis |
| **Certificado Básico (DigiCert/Sectigo)** | $50-150 | Anual |
| **Certificado Wildcard** | $200-400 | Anual |
| **Certificado EV (Extended Validation)** | $300-1000 | Anual |
| **Horas de DevOps/IT** | Variable | Una vez |

**Recomendación:** Comenzar con Let's Encrypt (gratis) para validar el proceso, luego considerar certificado comercial si se requiere soporte empresarial.

---

## Tiempo Estimado de Implementación

| Fase | Tiempo Estimado |
|------|-----------------|
| Obtener certificado SSL | 1-2 horas (Let's Encrypt) o 1-3 días (Comercial) |
| Configurar servidor backend | 2-4 horas |
| Actualizar código Angular | 30 minutos |
| Testing completo | 2-4 horas |
| Despliegue a producción | 1-2 horas |
| **TOTAL** | **1-2 días laborales** |

---

## Contacto y Soporte

**Responsable de Implementación:**
- [ ] Asignar responsable DevOps/IT

**Fecha Objetivo:**
- [ ] Definir fecha de implementación

**Ambiente de Pruebas:**
- [ ] Configurar ambiente de staging con HTTPS primero

---

## Checklist Final Pre-Producción

- [ ] Certificado SSL obtenido e instalado
- [ ] Servidor backend responde en HTTPS (puertos 443 y 8443)
- [ ] Redirección HTTP → HTTPS configurada
- [ ] Variables de ambiente actualizadas (`environment.prod.ts`)
- [ ] Build de producción generado con nuevas URLs
- [ ] Pruebas completas en ambiente staging
- [ ] Plan de rollback documentado
- [ ] Usuarios/stakeholders notificados
- [ ] Monitoreo configurado
- [ ] Renovación automática de certificado configurada (si aplica)

---

**Última actualización:** 24/11/2025
**Versión:** 1.0
**Estado:** Pendiente de implementación por DevOps
