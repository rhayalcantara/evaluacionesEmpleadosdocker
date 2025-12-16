---
name: mcp-troubleshooting
description: Diagnóstico y solución de problemas de MCP servers en Claude Desktop. Usar cuando los servidores MCP muestran "Server disconnected", fallan al conectar, o tienen problemas de handshake. Cubre servidores Python (MySQL, SQL Server, PostgreSQL) y Node.js en Windows/macOS/Linux.
---

# MCP Server Troubleshooting

Guía para diagnosticar y solucionar problemas de conexión de servidores MCP en Claude Desktop.

## Flujo de Diagnóstico Rápido

```
Server disconnected → Revisar logs de Claude Desktop → Identificar causa → Aplicar solución
```

## Paso 1: Obtener Logs

### Windows (PowerShell)

```powershell
# Log del servidor específico
Get-Content "$env:APPDATA\Claude\logs\mcp-server-<nombre>.log" -Tail 50

# Log general de MCP
Get-Content "$env:APPDATA\Claude\logs\mcp.log" -Tail 50

# Log del servidor (si tiene logging propio)
Get-Content "C:\path\to\server\server.log" -Tail 20
```

### macOS/Linux

```bash
# Logs de Claude Desktop
tail -50 ~/Library/Logs/Claude/mcp-server-<nombre>.log  # macOS
tail -50 ~/.config/Claude/logs/mcp-server-<nombre>.log  # Linux
```

## Paso 2: Identificar el Problema

### Árbol de Decisión

| Log muestra | Causa | Solución |
|-------------|-------|----------|
| `ModuleNotFoundError: No module named 'X'` | Dependencia faltante | Ver [Problema 1](#problema-1-módulo-no-encontrado) |
| Solo "Conexión inicial exitosa", sin `initialize` | Claude no envía handshake | Ver [Problema 2](#problema-2-handshake-incompleto) |
| Handshake completo → EOF inmediato | Respuesta inválida a notificaciones | Ver [Problema 3](#problema-3-eof-inmediato) |
| `Server transport closed unexpectedly` | Proceso termina prematuramente | Ver [Problema 4](#problema-4-proceso-termina) |

## Problemas y Soluciones

### Problema 1: Módulo No Encontrado

**Síntoma:** `ModuleNotFoundError: No module named 'mysql'`

**Causa:** Claude Desktop usa un Python diferente al de tu terminal.

**Solución A - Ruta absoluta en config:**

```json
{
  "mcpServers": {
    "mi-servidor": {
      "command": "C:\\Users\\USER\\AppData\\Local\\Programs\\Python\\Python311\\python.exe",
      "args": ["C:\\path\\to\\server.py"],
      "cwd": "C:\\path\\to"
    }
  }
}
```

**Solución B - Instalar en el Python correcto:**

```powershell
# Windows
& "C:\Users\USER\AppData\Local\Programs\Python\Python311\python.exe" -m pip install <modulo>

# macOS/Linux
/usr/local/bin/python3 -m pip install <modulo>
```

**Módulos comunes:**
- MySQL: `mysql-connector-python`
- SQL Server: `pyodbc`
- PostgreSQL: `psycopg2-binary`
- General: `python-dotenv`

### Problema 2: Handshake Incompleto

**Síntoma:** Log muestra "Conexión exitosa" pero nunca recibe `initialize`.

**Causa:** Output no-JSON en stdout antes del handshake.

**Verificar:** Buscar `print()` statements que escriban a stdout:

```python
# ❌ MALO - rompe el protocolo MCP
print("Servidor iniciado")

# ✅ CORRECTO - usar stderr
import sys
print("Servidor iniciado", file=sys.stderr)
```

**Solución:** Todo logging debe ir a stderr o archivo, nunca stdout.

### Problema 3: EOF Inmediato Después del Handshake

**Síntoma:** Log muestra secuencia completa (initialize → tools/list) pero termina con EOF inmediato.

**Causa:** El servidor envía `null` para notificaciones (que no requieren respuesta).

**Verificar en el código del servidor:**

```python
# ❌ MALO - envía "null" a stdout
response_str = json.dumps(response)
print(response_str)

# ✅ CORRECTO - no responder a notificaciones
if response is not None:
    response_str = json.dumps(response)
    print(response_str)
    sys.stdout.flush()
```

**Métodos que NO deben enviar respuesta:**
- `notifications/initialized`
- `notifications/cancelled`
- Cualquier método que empiece con `notifications/`

### Problema 4: Proceso Termina Prematuramente

**Síntoma:** `Server transport closed unexpectedly`

**Causas comunes:**
1. Exception no manejada
2. Falta handler para método requerido
3. Conexión a base de datos falla

**Métodos MCP requeridos:**

```python
# Handlers mínimos que el servidor debe implementar:
"initialize"              # Requerido
"notifications/initialized"  # Requerido (no responder)
"tools/list"              # Requerido
"resources/list"          # Recomendado (responder con lista vacía)
"resources/templates/list"  # Recomendado (responder con lista vacía)
```

**Respuesta para recursos no implementados:**

```python
if method == "resources/list":
    return {"jsonrpc": "2.0", "id": msg_id, "result": {"resources": []}}

if method == "resources/templates/list":
    return {"jsonrpc": "2.0", "id": msg_id, "result": {"resourceTemplates": []}}
```

## Paso 3: Verificar Solución

Después de aplicar cambios:

1. **Cerrar Claude Desktop completamente** (desde system tray)
2. **Reiniciar Claude Desktop**
3. **Verificar logs** - buscar secuencia exitosa:

```
✅ Server started and connected successfully
✅ Manejando solicitud: initialize
✅ Manejando solicitud: notifications/initialized
✅ Manejando solicitud: tools/list
✅ (servidor permanece corriendo, sin EOF)
```

## Prueba Manual de Servidor

Para verificar que el servidor funciona independientemente de Claude Desktop:

```powershell
cd C:\path\to\server
python server.py
```

Luego enviar manualmente:

```json
{"jsonrpc":"2.0","id":0,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}
```

Si responde con JSON válido, el servidor funciona correctamente.

## Configuración de Referencia

Ver [references/config-examples.md](references/config-examples.md) para ejemplos completos de configuración.

## Checklist de Verificación

- [ ] Python correcto especificado con ruta absoluta
- [ ] Todas las dependencias instaladas en ese Python
- [ ] Sin `print()` a stdout (solo stderr o archivo)
- [ ] Handler para `notifications/initialized` (sin respuesta)
- [ ] Handler para `resources/list` (lista vacía OK)
- [ ] Handler para `resources/templates/list` (lista vacía OK)
- [ ] `if response is not None` antes de enviar respuestas