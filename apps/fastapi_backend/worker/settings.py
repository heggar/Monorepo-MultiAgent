# worker/settings.py
from arq.connections import RedisSettings
from app.core.config import settings # Reutiliza config del backend
from .tasks import run_agent_workflow, startup, shutdown

JOB_TIMEOUT_SECONDS = 8 * 60 * 60

class WorkerSettings:
    functions = [run_agent_workflow] # La tarea principal
    print(settings.REDIS_HOST, settings.REDIS_PORT)
    redis_settings = RedisSettings(
        host=settings.REDIS_HOST,
        port=settings.REDIS_PORT,
        max_connections=10,
        ssl=False
        # password=settings.REDIS_PASSWORD # Si tienes contraseña
    )
    job_timeout = JOB_TIMEOUT_SECONDS
    max_tries = 3
    on_startup = startup
    on_shutdown = shutdown
    max_jobs = 5 # Número de tareas concurrentes
    