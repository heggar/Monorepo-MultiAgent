// lib/store/useWebSocketStore.ts
import { create } from 'zustand';
import { shallow } from 'zustand/shallow'; // Para selectores si es necesario

// Tipos (igual que antes)
type MessagePayload = any;
type MessageType = string;
type MessageListener = (payload: MessagePayload) => void;
type ListenersRegistry = Record<MessageType, Set<MessageListener>>;

interface WebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  uuid: string | null;
  // No almacenamos el WS ni los listeners en el estado principal
  // para evitar re-renders innecesarios al cambiar referencias internas.
}

interface WebSocketActions {
  setUuid: (uuid: string | null) => void;
  connect: () => void;
  disconnect: () => void;
  sendMessage: (type: MessageType, payload: MessagePayload) => void;
  subscribe: (type: MessageType, listener: MessageListener) => () => void; // Devuelve fn de desuscripción
}

// Variables internas del store (fuera del estado que se devuelve a los componentes)
let websocketInstance: WebSocket | null = null;
const listeners: ListenersRegistry = {}; // Registro de listeners simple

// URL del WebSocket (debería venir de variables de entorno)
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws'; // Ajusta tu URL

export const useWebSocketStore = create<WebSocketState & WebSocketActions>((set, get) => ({
  // --- Estado Inicial ---
  isConnected: false,
  isConnecting: false,
  uuid: null,

  // --- Acciones ---
  setUuid: (uuid) => {
    const currentUuid = get().uuid;
    // Si el UUID cambia, desconectar la conexión anterior antes de establecer el nuevo
    if (uuid !== currentUuid && websocketInstance) {
      console.log(`WebSocket Store: UUID cambiado de ${currentUuid} a ${uuid}. Desconectando.`);
      get().disconnect(); // Llama a la acción de desconectar
    }
    set({ uuid });
  },

  connect: () => {
    const { uuid, isConnecting, isConnected } = get();

    // Evitar múltiples conexiones o conectar sin UUID
    if (websocketInstance || isConnecting || isConnected || !uuid) {
       if (!uuid) console.warn("Zustand WS: No se puede conectar sin UUID.");
       else console.log("Zustand WS: Conexión ya existente o en progreso.");
      return;
    }

    set({ isConnecting: true });
    console.log(`Zustand WS: Intentando conectar a ${WS_URL}/${uuid}...`);
    const socket = new WebSocket(`${WS_URL}/${uuid}`);
    websocketInstance = socket;

    socket.onopen = () => {
      console.log('Zustand WS: Conectado');
      set({ isConnected: true, isConnecting: false });
    };

    socket.onclose = (event) => {
      console.log('Zustand WS: Desconectado', event.code, event.reason);
      websocketInstance = null; // Limpiar instancia
      // Limpiar estado *solo si* no estamos ya intentando conectar de nuevo
      if (!get().isConnecting) {
          set({ isConnected: false, isConnecting: false });
      }
      // Aquí podrías añadir lógica de reconexión si la necesitas,
      // llamando a get().connect() tras un timeout, pero cuidado con bucles.
    };

    socket.onerror = (error) => {
      console.error('Zustand WS: Error:', error);
      // onclose se llamará después, así que el estado se limpiará allí
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('Zustand WS: Mensaje recibido:', message);
        const messageType = message.type as MessageType;
        const messagePayload = message.payload;

        if (messageType && listeners[messageType]) {
           console.log(`Zustand WS: Despachando mensaje tipo "${messageType}" a ${listeners[messageType].size} listener(s)`);
          listeners[messageType].forEach((listener) => {
             try {
                listener(messagePayload);
             } catch(err) {
                console.error(`Error en listener (Zustand) de tipo ${messageType}:`, err);
             }
          });
        } else if (messageType) {
             console.log(`Zustand WS: Mensaje tipo "${messageType}" recibido, sin listeners.`);
        } else {
              console.warn("Zustand WS: Mensaje recibido sin 'type':", message);
        }
      } catch (e) {
        console.error('Zustand WS: Error parseando mensaje:', event.data, e);
      }
    };
  },

  disconnect: () => {
    if (websocketInstance) {
      console.log('Zustand WS: Desconectando intencionalmente...');
      websocketInstance.close(); // Esto disparará el evento onclose
      websocketInstance = null; // Limpiar referencia localmente
    }
    // Actualizar estado inmediatamente para reflejar la intención
    set({ isConnected: false, isConnecting: false });
  },

  sendMessage: (type, payload) => {
    if (websocketInstance && websocketInstance.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({ type, payload });
      console.log('Zustand WS: Enviando mensaje:', message);
      websocketInstance.send(message);
    } else {
      console.error('Zustand WS: No conectado. No se puede enviar mensaje.');
    }
  },

  subscribe: (type, listener) => {
    if (!listeners[type]) {
      listeners[type] = new Set();
    }
    listeners[type].add(listener);
    console.log(`Zustand WS: Listener suscrito al tipo: ${type}`);

    // Devolver función de desuscripción
    return () => {
      if (listeners[type]) {
        listeners[type].delete(listener);
        console.log(`Zustand WS: Listener desuscrito del tipo: ${type}`);
        if (listeners[type].size === 0) {
          delete listeners[type]; // Limpiar el Set si está vacío
        }
      }
    };
  },
}));

// Selector opcional para estado de conexión (usa shallow para comparar objeto)
// export const useConnectionStatus = () => useWebSocketStore(
//   (state) => ({ isConnected: state.isConnected, isConnecting: state.isConnecting }),
//   shallow
// );