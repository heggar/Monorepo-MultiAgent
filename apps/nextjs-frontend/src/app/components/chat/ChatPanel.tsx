'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useWebSocketStore } from '@/lib/store/useWebSocketStore'; // Ajusta ruta
import { useWebSocketListener } from '@/lib/hooks/useWebSocketListener'; // Ajusta ruta


// Importa los iconos necesarios (ajusta según los iconos exactos que prefieras)
import {
  FaGraduationCap, // O el icono que represente al bot/asistente
} from "react-icons/fa6";

import {
  FiCommand, // Icono /
  FiPaperclip, // Clip alternativo
  FiClock,
  FiEdit,      // Lápiz
  FiMaximize2
} from "react-icons/fi";
import { TfiEraser } from "react-icons/tfi";

interface ChatMessage {
  id: string | number; // Puede ser string (UUID) o number (timestamp temporal)
  user: string;
  text: string;
  timestamp: number;
  status?: 'sending' | 'sent' | 'error'; // Opcional: para indicar estado
}


export const ChatPanel = () => {
  // Seleccionar estado y acciones necesarios del store Zustand
  const isConnected = useWebSocketStore((state) => state.isConnected);
  const sendMessage = useWebSocketStore((state) => state.sendMessage);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  // --- NUEVO: Estado para el contenido del textarea ---
  const [currentMessage, setCurrentMessage] = useState('');
  // --- NUEVO: Ref para posible scroll automático ---
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // --- Scroll automático al final ---
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom(); // Scroll cuando los mensajes cambien
  }, [messages]);

  const handleNewChatMessage = useCallback((payload: any) => {
    // Validación básica del payload recibido
    if (payload && typeof payload === 'object' && payload.text) {
      const incomingMessage = payload as ChatMessage;
      console.log("ChatDisplay (Zustand): Mensaje WS recibido:", incomingMessage);

      setMessages((prevMessages) => {
        return [...prevMessages, { ...incomingMessage, status: 'sent' }]; // Marcar como 'sent'
      });

    } else {
      console.warn("ChatDisplay (Zustand): Payload de chat inválido recibido:", payload);
    }
  }, []); // Dependencias vacías si no usa variables externas que cambien

  // Suscribirse usando el hook personalizado
  useWebSocketListener('send_chat_message', handleNewChatMessage);

  // Suscribirse a otro tipo (igual que antes)
  const handleUserTyping = useCallback((payload: { user: string; isTyping: boolean }) => {
    console.log(`ChatDisplay (Zustand): Usuario ${payload.user} está ${payload.isTyping ? 'escribiendo' : 'dejó de escribir'}`);
  }, []);
  useWebSocketListener('user_typing', handleUserTyping);


  // Mensaje de ejemplo (en una aplicación real, esto vendría de un estado o props)
  const initialMessage = {
    sender: 'bot',
    text: 'Hola, soy Desarrollo de Software para Dummies, Desarrollo de Software para Dummies: Guía para principiantes a través del proceso de desarrollo de software, proporcionando instrucciones paso a paso y mejores prácticas para la recopilación de requisitos, diseño, codificación, pruebas, implementación y mantenimiento. ¡comencemos a chatear!',
    avatar: <FaGraduationCap className="text-purple-600 text-2xl flex-shrink-0" />
  };



  const handleSendMessage = () => {
    const textToSend = currentMessage.trim();
    if (textToSend && isConnected) {

      // --- Paso Optimista: Crear y añadir el mensaje localmente ---
      const optimisticMessage: ChatMessage = {
        // Usar timestamp como ID temporal simple (o crypto.randomUUID() si prefieres strings)
        id: Date.now(),
        // Deberías obtener el nombre de usuario real, usando "Yo" como placeholder
        user: "Yo",
        text: textToSend,
        timestamp: Date.now(),
        status: 'sending' // Marcar como enviando (útil para UI y evitar duplicados)
      };

      // Añadir a la lista local *antes* de enviar
      setMessages(prevMessages => [...prevMessages, optimisticMessage]);

      // Limpiar el textarea inmediatamente
      setCurrentMessage('');

      // --- Paso Real: Enviar al servidor ---
      const messagePayload = {
        text: textToSend,
        // Podrías incluir el ID temporal para que el backend lo devuelva y puedas actualizar el estado 'sending'->'sent'
        // tempClientId: optimisticMessage.id
      };
      sendMessage('send_chat_message', messagePayload);

    } else if (!isConnected) {
      console.log("No se puede enviar, WebSocket no conectado.");
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] bg-white border border-gray-200 rounded-lg shadow-sm"> {/* Ajusta la altura según necesites */}
      <div className="p-4 space-y-4 justify-center">
        <span className="text-sm text-gray-500">
          Optimizador
        </span>
        <h2>(Conexión: {isConnected ? 'Online' : 'Offline'})</h2>
      </div>


      {/* Área de Mensajes */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {/* Mensaje del Bot */}
        <div className="flex items-start space-x-3">
          {initialMessage.avatar}
          <div className="bg-gray-50 p-3 rounded-lg max-w-2xl"> {/* Añadido fondo ligero y padding al texto */}
            <p className="text-sm text-gray-800 leading-relaxed">
              {initialMessage.text}
            </p>
          </div>
        </div>
        <div>
          {messages.map((msg) => (
            <p key={msg.id}><strong>{msg.user || 'Anónimo'}:</strong> {msg.text}</p>
          ))}
        </div>
      </div>

      {/* Área de Entrada */}
      <div className="p-3 border-t border-gray-200 bg-white">
        {/* Barra de herramientas de iconos */}
        <div className="flex items-center text-gray-500 mb-2 space-x-1">

          <button className="p-1.5 rounded hover:bg-gray-100" aria-label="Adjuntar"><FiPaperclip size={18} /></button>

          {/* Añade más iconos aquí si es necesario */}
          <button className="p-1.5 rounded hover:bg-gray-100" aria-label="Editar"><FiEdit size={18} /></button>
          <button className="p-1.5 rounded hover:bg-gray-100" aria-label="Historial"><FiClock size={18} /></button>
          {/* Iconos a la derecha */}
          <div className="ml-auto flex items-center space-x-1">
            <button className="p-1.5 rounded hover:bg-gray-100" aria-label="Deshacer/Rehacer"><TfiEraser size={18} /></button> {/* Placeholder Icon */}
            <button className="p-1.5 rounded hover:bg-gray-100" aria-label="Expandir"><FiMaximize2 size={18} /></button>
          </div>
        </div>

        {/* Campo de Texto y Botones inferiores */}
        <div className="relative border border-gray-300 rounded-lg focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500 p-2 flex flex-col">

          <textarea
            rows={3} // Ajusta el número de filas según necesites
            style={{ flexGrow: 1, resize: 'vertical' }} // Para que ocupe espacio y se pueda redimensionar verticalmente
            placeholder={isConnected ? "Escribe tu mensaje..." : "Esperando conexión..."}
            disabled={!isConnected}
            value={currentMessage} // Controlado por el estado local
            onChange={(e) => setCurrentMessage(e.target.value)} // Actualiza el estado al escribir
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { // Enviar con Cmd/Ctrl + Enter
                handleSendMessage();
              }
            }}
          />

        </div>

        {/* Botón de Enviar (fuera del borde del textarea) */}
        <div className="flex justify-end mt-2">
          <div className="flex items-center rounded-md shadow-sm">
            <button
              onClick={handleSendMessage} // Llama a la función de envío al hacer clic
              disabled={!isConnected || currentMessage.trim().length === 0} // Deshabilitado si no conectado o si no hay texto
              className="bg-gray-900 text-white text-sm font-medium px-5 py-2 rounded-l-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-800 transition-colors duration-150"
            >
              Enviar
            </button>

          </div>
        </div>
      </div>
    </div>
  );
};
