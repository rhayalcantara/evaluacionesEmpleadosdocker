# Ejemplos de Configuración MCP

## claude_desktop_config.json

### Ubicación del archivo

| OS | Ruta |
|----|------|
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Linux | `~/.config/Claude/claude_desktop_config.json` |

### Servidor Python (Windows)

```json
{
  "mcpServers": {
    "mysql-local": {
      "command": "C:\\Users\\USERNAME\\AppData\\Local\\Programs\\Python\\Python311\\python.exe",
      "args": ["C:\\tools\\mysql-mcp\\server.py"],
      "cwd": "C:\\tools\\mysql-mcp",
      "env": {
        "PYTHONPATH": "C:\\tools\\mysql-mcp"
      }
    }
  }
}
```

### Servidor Python (macOS/Linux)

```json
{
  "mcpServers": {
    "mysql-local": {
      "command": "/usr/local/bin/python3",
      "args": ["/opt/mcp/mysql-server/server.py"],
      "cwd": "/opt/mcp/mysql-server",
      "env": {
        "PYTHONPATH": "/opt/mcp/mysql-server"
      }
    }
  }
}
```

### Servidor Node.js (NPX)

```json
{
  "mcpServers": {
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    }
  }
}
```

### Múltiples Servidores

```json
{
  "mcpServers": {
    "mysql-local": {
      "command": "C:\\Users\\USERNAME\\AppData\\Local\\Programs\\Python\\Python311\\python.exe",
      "args": ["C:\\tools\\mysql-mcp\\server.py"],
      "cwd": "C:\\tools\\mysql-mcp"
    },
    "sqlserver-local": {
      "command": "C:\\Users\\USERNAME\\AppData\\Local\\Programs\\Python\\Python311\\python.exe",
      "args": ["C:\\tools\\sqlserver-mcp\\server.py"],
      "cwd": "C:\\tools\\sqlserver-mcp"
    },
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    }
  }
}
```

## Encontrar Ruta de Python

### Windows

```powershell
# Ver qué Python está en PATH
where python

# Ver versión y ruta completa
python -c "import sys; print(sys.executable)"

# Python 3.11 típico
C:\Users\USERNAME\AppData\Local\Programs\Python\Python311\python.exe
```

### macOS

```bash
# Ver qué Python está disponible
which python3

# Homebrew Python
/opt/homebrew/bin/python3

# Sistema
/usr/bin/python3
```

### Linux

```bash
which python3
# Típico: /usr/bin/python3
```

## Verificar Dependencias Instaladas

```powershell
# Windows
& "C:\Users\USERNAME\AppData\Local\Programs\Python\Python311\python.exe" -m pip list | findstr mysql
& "C:\Users\USERNAME\AppData\Local\Programs\Python\Python311\python.exe" -m pip list | findstr pyodbc
```

```bash
# macOS/Linux
/usr/local/bin/python3 -m pip list | grep mysql
```

## Logs de Claude Desktop

### Windows

```powershell
# Listar todos los logs
dir "$env:APPDATA\Claude\logs"

# Log específico de un servidor
Get-Content "$env:APPDATA\Claude\logs\mcp-server-mysql-local.log" -Tail 50

# Log general de MCP
Get-Content "$env:APPDATA\Claude\logs\mcp.log" -Tail 50

# Seguir log en tiempo real
Get-Content "$env:APPDATA\Claude\logs\mcp-server-mysql-local.log" -Tail 20 -Wait
```

### macOS

```bash
# Listar logs
ls ~/Library/Logs/Claude/

# Ver log específico
tail -50 ~/Library/Logs/Claude/mcp-server-mysql-local.log

# Seguir en tiempo real
tail -f ~/Library/Logs/Claude/mcp-server-mysql-local.log
```

## Template de Servidor MCP Python

Estructura mínima funcional para un servidor MCP en Python:

```python
#!/usr/bin/env python3
import sys
import json
import logging

# Configurar logging a stderr (NUNCA stdout)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('server.log'),
        logging.StreamHandler(sys.stderr)
    ]
)
logger = logging.getLogger(__name__)

def handle_message(msg):
    method = msg.get("method", "")
    msg_id = msg.get("id")
    
    # Notificaciones - NO responder
    if method.startswith("notifications/"):
        logger.info(f"Notificación recibida: {method}")
        return None
    
    if method == "initialize":
        return {
            "jsonrpc": "2.0",
            "id": msg_id,
            "result": {
                "protocolVersion": "2024-11-05",
                "capabilities": {"tools": {}},
                "serverInfo": {"name": "my-server", "version": "1.0.0"}
            }
        }
    
    if method == "tools/list":
        return {
            "jsonrpc": "2.0",
            "id": msg_id,
            "result": {"tools": []}
        }
    
    if method == "resources/list":
        return {
            "jsonrpc": "2.0",
            "id": msg_id,
            "result": {"resources": []}
        }
    
    if method == "resources/templates/list":
        return {
            "jsonrpc": "2.0",
            "id": msg_id,
            "result": {"resourceTemplates": []}
        }
    
    # Método no soportado
    return {
        "jsonrpc": "2.0",
        "id": msg_id,
        "error": {"code": -32601, "message": f"Method not found: {method}"}
    }

def main():
    logger.info("Servidor MCP iniciado")
    
    for line in sys.stdin:
        try:
            msg = json.loads(line.strip())
            logger.info(f"Recibido: {msg.get('method')}")
            
            response = handle_message(msg)
            
            # Solo enviar si hay respuesta (no para notificaciones)
            if response is not None:
                print(json.dumps(response), flush=True)
                
        except json.JSONDecodeError as e:
            logger.error(f"JSON inválido: {e}")
        except Exception as e:
            logger.error(f"Error: {e}")

if __name__ == "__main__":
    main()
```

## Dependencias Comunes

| Servidor | Módulo pip | Comando de instalación |
|----------|------------|----------------------|
| MySQL | mysql-connector-python | `pip install mysql-connector-python` |
| SQL Server | pyodbc | `pip install pyodbc` |
| PostgreSQL | psycopg2-binary | `pip install psycopg2-binary` |
| MongoDB | pymongo | `pip install pymongo` |
| Redis | redis | `pip install redis` |
| Env files | python-dotenv | `pip install python-dotenv` |