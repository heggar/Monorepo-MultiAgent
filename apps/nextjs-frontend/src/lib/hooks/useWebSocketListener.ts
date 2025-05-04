// lib/hooks/useWebSocketListener.ts
import { useEffect } from 'react';
import { useWebSocketStore } from '@/lib/store/useWebSocketStore'; // Ajusta la ruta

type MessagePayload = any;
type MessageType = string;
type MessageListener = (payload: MessagePayload) => void;

export const useWebSocketListener = (
  type: MessageType | null, // null si no se quiere suscribir
  listener: MessageListener // La función callback
) => {
  // Obtenemos la función subscribe directamente del store.
  // Podríamos usar .getState().subscribe pero usar el selector asegura
  // que usamos la función correcta si el store se re-inicializara.
  const subscribe = useWebSocketStore((state) => state.subscribe);

  useEffect(() => {
    if (!type) return; // No suscribir si no hay tipo

    // Suscribir al montar o cuando cambien las dependencias
    console.log(`Hook useWebSocketListener: Intentando suscribir a ${type}`);
    const unsubscribe = subscribe(type, listener);

    // Desuscribir al desmontar o antes de re-ejecutar el efecto
    return () => {
      console.log(`Hook useWebSocketListener: Desuscribiendo de ${type}`);
      unsubscribe();
    };
  // La función 'subscribe' de Zustand es estable, no necesita estar en las deps.
  // 'listener' SÍ debe estar si se define inline o puede cambiar.
  }, [type, listener, subscribe]);
};