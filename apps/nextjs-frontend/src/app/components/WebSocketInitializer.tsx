// app/components/WebSocketInitializer.tsx
'use client';

import { useEffect } from 'react';
import { useWebSocketStore } from '@/lib/store/useWebSocketStore'; // Ajusta ruta

interface WebSocketInitializerProps {
  uuid: string | null; // El UUID que viene de la página/layout
}

export function WebSocketInitializer({ uuid }: WebSocketInitializerProps) {
  // Obtenemos las acciones directamente del store (no necesitamos selector aquí)
  const setUuid = useWebSocketStore.getState().setUuid;
  const connect = useWebSocketStore.getState().connect;
  const disconnect = useWebSocketStore.getState().disconnect;
  // Obtenemos el estado para lógica condicional
  const isConnected = useWebSocketStore((state) => state.isConnected);
  const isConnecting = useWebSocketStore((state) => state.isConnecting);
  const currentStoreUuid = useWebSocketStore((state) => state.uuid);


  useEffect(() => {
    // 1. Actualizar el UUID en el store si ha cambiado
    if (uuid !== currentStoreUuid) {
        console.log(`Initializer: Setting UUID in store: ${uuid}`);
        setUuid(uuid); // Esto también desconectará si es necesario (ver store)
    }

    // 2. Intentar conectar si tenemos un UUID y no estamos ya conectados/conectando
    if (uuid && !isConnected && !isConnecting) {
        console.log("Initializer: Triggering connect...");
        connect();
    }

    // 3. Si el UUID se vuelve null (ej. navegamos fuera de la sección), desconectar.
    if (!uuid && (isConnected || isConnecting)) {
         console.log("Initializer: UUID is null, disconnecting...");
         disconnect();
    }

    // Nota: La lógica de desconexión al desmontar el *componente*
    // no es estrictamente necesaria aquí, ya que el store persiste.
    // La desconexión se maneja basada en el cambio de UUID o cierre manual.
    // Podrías añadir una desconexión al desmontar si este componente
    // representa la única sección que debe tener WS activo.
    // return () => {
    //     if (uuid) { // Solo desconectar si este componente era responsable
    //          console.log("Initializer: Unmounting, disconnecting WebSocket for", uuid);
    //          disconnect();
    //     }
    // }

  // Dependencias: el uuid que viene de props y el estado de conexión del store
  }, [uuid, currentStoreUuid, isConnected, isConnecting, setUuid, connect, disconnect]);

  // Este componente no necesita renderizar nada
  return null;
}