# app/main.py
from fastapi import FastAPI
from contextlib import asynccontextmanager
import redis.asyncio as redis # Usar la versión async
import asyncio
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from typing import Dict, List
import os


# Configuración de Redis (ajusta según tu entorno)
REDIS_HOST = "localhost"
REDIS_PORT = 6379
REDIS_CHANNEL = "ws_messages"

# Diccionario local para las conexiones manejadas por ESTE worker
local_connections: Dict[str, WebSocket] = {}

# Cliente Redis (idealmente gestionado con lifecycle events de FastAPI)
redis_client = None

async def get_redis_client():
    global redis_client
    if redis_client is None:
        redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT)
    return redis_client


async def redis_subscriber():
    """Escucha mensajes en el canal de Redis."""
    global redis_client
    if not redis_client:
        print("Error: Cliente Redis no inicializado para subscriber.")
        return

    pubsub = redis_client.pubsub()
    await pubsub.subscribe(REDIS_CHANNEL)
    print(f"Suscrito a Redis Pub/Sub channel: {REDIS_CHANNEL}")

    while True:
         try:
             message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0) # Timeout para no bloquear indefinidamente
             if message and message.get("type") == "message":
                 print(f"Mensaje recibido de Redis: {message['data']}")
                 try:
                     data = json.loads(message['data'])
                     target_uuid = data.get("target_uuid")
                     message_content = data.get("message")

                     # Verificar si ESTE worker tiene la conexión
                     websocket = local_connections.get(target_uuid)
                     if websocket:
                         print(f"Enviando mensaje a {target_uuid} via WebSocket local")
                         await websocket.send_text(message_content)
                     # else: El mensaje no era para una conexión en este worker
                 except json.JSONDecodeError:
                     print(f"Error decodificando mensaje de Redis: {message['data']}")
                 except Exception as e:
                     print(f"Error procesando mensaje de Redis PubSub: {e}")
             await asyncio.sleep(0.01) # Pequeña pausa para no consumir 100% CPU
         except asyncio.CancelledError:
             print("Tarea Redis Subscriber cancelada.")
             break
         except redis.ConnectionError:
             print("Error de conexión con Redis en subscriber. Reintentando...")
             await asyncio.sleep(5) # Esperar antes de reintentar
         except Exception as e:
             print(f"Error inesperado en Redis Subscriber: {e}")
             await asyncio.sleep(5)

# Placeholder para funciones de lifespan (ej. conectar DB, Redis)
async def startup_event():
    print("Aplicación iniciada...!")
    global redis_client
    redis_client = await get_redis_client()
    # Aquí puedes inicializar la conexión a la base de datos, etc.
    asyncio.create_task(redis_subscriber()) # Iniciar el subscriber de Redis
    # await connect_db()
    # await connect_redis()

async def shutdown_event():
    print("Aplicación detenida...")
    if redis_client:
        await redis_client.close()
    # await disconnect_db()
    # await disconnect_redis()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Código a ejecutar antes de que la aplicación empiece a aceptar requests
    await startup_event()
    yield
    # Código a ejecutar después de que la aplicación termine de manejar requests
    await shutdown_event()

app = FastAPI(
    title="Multi-Agent Backend API",
    description="API para gestionar sesiones y agentes AutoGen.",
    version="0.1.0",
    lifespan=lifespan # Usar lifespan para startup/shutdown
)

@app.get("/health", tags=["Health"])
async def health_check():
    """Verifica si la API está funcionando."""
    return {"status": "ok"}

@app.websocket("/ws/{client_uuid}")
async def websocket_endpoint(websocket: WebSocket, client_uuid: str):
    # Validar UUID si es necesario
    # ...
    await websocket.accept()
    print(f"Cliente conectado: {client_uuid} (Worker PID: {os.getpid()})") # PID ayuda a depurar
    local_connections[client_uuid] = websocket
    # Opcional: Registrar en Redis que este cliente está activo (e.g., en un SET)
    # await redis_client.sadd("active_ws_clients", client_uuid)
    try:
        while True:
            data = await websocket.receive_text()
            #Parsear (decodificar) el string JSON a un objeto Python (diccionario)
            received_object = json.loads(data)
            # Asegurarnos que sea un diccionario (o el tipo que esperes)
            if not isinstance(received_object, dict):
                # Si no es un diccionario, quizás enviar un error o loggear
                print(f"Error: Mensaje de {client_uuid} no es un objeto JSON (dict): {type(received_object)}")
                await websocket.send_json({
                    "type": "error",
                    "payload": {
                        "message": "El mensaje debe ser un objeto JSON.",
                        "received": data # Devolver lo recibido ayuda a depurar
                    }
                })
                continue # Saltar al siguiente mensaje
            # 3. Modificar el diccionario Python
            #    Es buena práctica trabajar sobre una copia si necesitas el original
            processed_object = received_object.copy()
            # Asegurarse que 'payload' y 'text' existen antes de modificar
            if 'payload' in processed_object and isinstance(processed_object['payload'], dict) and 'text' in processed_object['payload']:
                processed_object['payload']['text'] = 'Echooo ' + str(processed_object['payload']['text']) # Añadir str() por si acaso
            else:
                    print(f"Advertencia: Estructura 'payload' o 'text' no encontrada en mensaje de {client_uuid}")
                    # Podrías añadir campos por defecto o manejarlo diferente
                    processed_object['warning'] = "Payload original no tenía la estructura esperada."

            print(f"Mensaje de {client_uuid} (parsed): {received_object} (Worker PID: {os.getpid()})") # Muestra el original
            print(f"Enviando a {client_uuid}: {processed_object} (Worker PID: {os.getpid()})") # Muestra el modificado

            # Procesar mensajes si es necesario...
            await websocket.send_json(processed_object)  # Responder al cliente
    except WebSocketDisconnect:
        print(f"Cliente desconectado: {client_uuid} (Worker PID: {os.getpid()})")
    except Exception as e:
         print(f"Error en WebSocket {client_uuid} (Worker PID: {os.getpid()}): {e}")
    finally:
        # Limpiar siempre
        if client_uuid in local_connections:
            del local_connections[client_uuid]
        # Opcional: Eliminar de Redis SET
        # if redis_client:
        #     await redis_client.srem("active_ws_clients", client_uuid)


# Endpoint para enviar mensajes (publica en Redis)
@app.post("/send/{client_uuid}")
async def send_message_via_redis(client_uuid: str, message: str):
    global redis_client
    if not redis_client:
        return {"status": "error", "detail": "Redis no conectado"}

    # Opcional: Verificar si el cliente está teóricamente activo (consultando el SET en Redis)
    # is_active = await redis_client.sismember("active_ws_clients", client_uuid)
    # if not is_active:
    #     return {"status": "error", "detail": "Cliente no parece estar activo"}

    message_data = json.dumps({
        "target_uuid": client_uuid,
        "message": message
    })
    try:
        await redis_client.publish(REDIS_CHANNEL, message_data)
        return {"status": "mensaje publicado en Redis"}
    except redis.ConnectionError:
         return {"status": "error", "detail": "Error de conexión con Redis al publicar"}
    except Exception as e:
        print(f"Error publicando en Redis: {e}")
        return {"status": "error", "detail": f"Error inesperado al publicar: {e}"}

# Dentro de tu app FastAPI
@app.get("/api/session-data/{client_uuid}")
async def get_session_data(client_uuid: str):
    # Buscar datos en tu DB (PostgreSQL según el diagrama) asociados a este UUID
    # db_data = await query_database_for_uuid(client_uuid)
    db_data = {"example": "data associated with", "uuid": client_uuid} # Placeholder
    if db_data:
        return {"success": True, "data": db_data}
    else:
        # Quizás quieras devolver un 404 si el UUID no es válido/no existe
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Session data not found for this UUID")


if __name__ == "__main__":
    import uvicorn
    # Esto es solo para ejecución directa (no recomendado para producción)
    # Necesitarás ejecutarlo con 'poetry run python app/main.py' o
    # 'poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000'
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True) # El reload funciona bien con Poetry