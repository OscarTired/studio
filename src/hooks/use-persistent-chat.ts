import { useState, useEffect, useCallback } from 'react';
import { useSession } from '@/lib/auth-client';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  id?: string;
}

interface ChatSession {
  id: string;
  messages: ChatMessage[];
  contextData?: any;
  lastUpdated: string;
}

export function usePersistentChat(chatType: 'diagnosis' | 'weather', initialSessionId?: string) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(initialSessionId || null);

  // Generar un ID único para la sesión si no se proporciona
  const generateSessionId = useCallback(() => {
    return `${chatType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, [chatType]);

  // Cargar historial desde localStorage para usuarios invitados
  const loadLocalHistory = useCallback(() => {
    if (!currentSessionId) return;
    
    try {
      const localKey = `chat-${chatType}-${currentSessionId}`;
      const stored = localStorage.getItem(localKey);
      if (stored) {
        const session: ChatSession = JSON.parse(stored);
        setMessages(session.messages || []);
      }
    } catch (error) {
      console.error('Error loading local chat history:', error);
    }
  }, [chatType, currentSessionId]);

  // Guardar en localStorage para usuarios invitados
  const saveLocalHistory = useCallback((newMessages: ChatMessage[], contextData?: any) => {
    if (!currentSessionId) return;
    
    try {
      const localKey = `chat-${chatType}-${currentSessionId}`;
      const session: ChatSession = {
        id: currentSessionId,
        messages: newMessages,
        contextData,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(localKey, JSON.stringify(session));
    } catch (error) {
      console.error('Error saving local chat history:', error);
    }
  }, [chatType, currentSessionId]);

  // Cargar historial desde la base de datos para usuarios autenticados
  const loadServerHistory = useCallback(async () => {
    if (!session?.user || !currentSessionId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/chat-history?type=${chatType}&sessionId=${currentSessionId}`);
      if (response.ok) {
        const history = await response.json();
        setMessages(history.messages || []);
      }
    } catch (error) {
      console.error('Error loading server chat history:', error);
    } finally {
      setLoading(false);
    }
  }, [session, chatType, currentSessionId]);

  // Guardar en el servidor para usuarios autenticados
  const saveServerHistory = useCallback(async (message: ChatMessage, contextData?: any, retries = 3) => {
    if (!session?.user || !currentSessionId) {
      console.warn('⚠️ No se puede guardar en servidor: usuario no autenticado o sin sessionId');
      return;
    }
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`🔍 [HOOK DEBUG] Intento ${attempt}/${retries} - Enviando POST a /api/chat-history`);
        
        const response = await fetch('/api/chat-history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatType,
            sessionId: currentSessionId,
            role: message.role,
            content: message.content,
            contextData
          })
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('✅ Mensaje guardado en servidor:', result.messageId);
        return; // Éxito, salir del loop
        
      } catch (error) {
        console.error(`❌ Intento ${attempt}/${retries} falló:`, error);
        if (attempt === retries) {
          console.warn('🔄 Todos los intentos fallaron, guardando en localStorage como fallback');
          // Fallback: guardar en localStorage
          try {
            const localKey = `chat-${chatType}-${currentSessionId}`;
            const stored = localStorage.getItem(localKey);
            const session = stored ? JSON.parse(stored) : { id: currentSessionId, messages: [], lastUpdated: new Date().toISOString() };
            session.messages.push(message);
            session.lastUpdated = new Date().toISOString();
            localStorage.setItem(localKey, JSON.stringify(session));
            console.log('💾 Mensaje guardado en localStorage como fallback');
          } catch (localError) {
            console.error('❌ Error guardando en localStorage:', localError);
          }
        } else {
          // Esperar antes del siguiente intento
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }
  }, [session, chatType, currentSessionId]);

  // Cargar historial de una sesión específica desde el servidor
  const loadServerHistoryForSession = useCallback(async (sessionId: string) => {
    if (!session?.user) {
      console.warn('⚠️ Usuario no autenticado, no se puede cargar desde servidor');
      return;
    }
    
    try {
      console.log('🔍 [HOOK DEBUG] Cargando historial del servidor para sesión:', sessionId);
      
      const response = await fetch(`/api/chat-history?type=${chatType}&sessionId=${sessionId}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Historial cargado del servidor:', data.messages?.length || 0, 'mensajes');
        setMessages(data.messages || []);
      } else {
        console.error('❌ Error cargando historial del servidor:', response.statusText);
        setMessages([]);
      }
    } catch (error) {
      console.error('❌ Error cargando historial del servidor:', error);
      setMessages([]);
    }
  }, [session, chatType]);

  // Inicializar sesión
  const initializeSession = useCallback((newSessionId?: string) => {
    const sessionIdToUse = newSessionId || generateSessionId();
    console.log('🆕 [HOOK DEBUG] Inicializando nueva sesión:', sessionIdToUse);
    setCurrentSessionId(sessionIdToUse);
    setMessages([]);
    return sessionIdToUse;
  }, [generateSessionId]);
  
  // Auto-inicializar sesión si no existe
  useEffect(() => {
    if (!currentSessionId) {
      if (initialSessionId) {
        console.log('🔄 [HOOK DEBUG] Usando sessionId inicial:', initialSessionId);
        setCurrentSessionId(initialSessionId);
        // Cargar historial de esta sesión específica
         loadServerHistoryForSession(initialSessionId);
      } else {
        console.log('🔄 [HOOK DEBUG] Auto-inicializando nueva sesión...');
        initializeSession();
      }
    }
  }, [currentSessionId, initialSessionId, initializeSession, loadServerHistoryForSession]);

  // Cargar historial al montar o cambiar sesión
  useEffect(() => {
    if (currentSessionId) {
      if (session?.user) {
        // Para usuarios autenticados, cargar desde el servidor
        loadServerHistoryForSession(currentSessionId);
      } else {
        loadLocalHistory();
      }
    }
  }, [currentSessionId, session, loadServerHistoryForSession, loadLocalHistory]);

  // Agregar mensaje
  const addMessage = useCallback(async (message: ChatMessage, contextData?: any) => {
    console.log('🔍 [HOOK DEBUG] Agregando mensaje:', {
      role: message.role,
      contentLength: message.content.length,
      sessionId: currentSessionId,
      isAuthenticated: !!session?.user,
      userId: session?.user?.id
    });
    
    // Validaciones
    if (!message.content?.trim()) {
      console.warn('⚠️ Mensaje vacío, no se guardará');
      return;
    }
    
    if (!currentSessionId) {
      console.error('❌ No hay sessionId activo, inicializando...');
      const newSessionId = initializeSession();
      console.log('✅ Nueva sesión creada:', newSessionId);
    }
    
    const messageWithId = {
      ...message,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };
    
    // Agregar mensaje localmente primero
    setMessages(prev => [...prev, messageWithId]);
    
    // Guardar según el tipo de usuario (fuera del setMessages para evitar múltiples ejecuciones)
    if (session?.user) {
      console.log('🔍 [HOOK DEBUG] Enviando a servidor...');
      await saveServerHistory(messageWithId, contextData);
    } else {
      console.log('🔍 [HOOK DEBUG] Guardando localmente...');
      const newMessages = [...messages, messageWithId];
      saveLocalHistory(newMessages, contextData);
    }
  }, [session, saveServerHistory, saveLocalHistory, currentSessionId, initializeSession, messages]);

  // Agregar múltiples mensajes en una sola operación
  const addMessages = useCallback(async (messagesToAdd: ChatMessage[], contextData?: any) => {
    console.log('🔍 [HOOK DEBUG] Agregando múltiples mensajes:', messagesToAdd.length);
    
    if (!messagesToAdd.length) return;
    
    if (!currentSessionId) {
      console.error('❌ No hay sessionId activo, inicializando...');
      const newSessionId = initializeSession();
      console.log('✅ Nueva sesión creada:', newSessionId);
    }
    
    const messagesWithIds = messagesToAdd.map((message, index) => ({
      ...message,
      id: `${Date.now() + index}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(Date.now() + index).toISOString()
    }));
    
    // Agregar mensajes localmente
    setMessages(prev => [...prev, ...messagesWithIds]);
    
    // Guardar según el tipo de usuario
    if (session?.user) {
      console.log('🔍 [HOOK DEBUG] Enviando múltiples mensajes a servidor...');
      // Guardar todos los mensajes secuencialmente para mantener el orden
      for (const message of messagesWithIds) {
        await saveServerHistory(message, contextData);
      }
    } else {
      console.log('🔍 [HOOK DEBUG] Guardando múltiples mensajes localmente...');
      const newMessages = [...messages, ...messagesWithIds];
      saveLocalHistory(newMessages, contextData);
    }
  }, [session, saveServerHistory, saveLocalHistory, currentSessionId, initializeSession, messages]);

  // Limpiar chat
  const clearChat = useCallback(() => {
    setMessages([]);
    if (currentSessionId) {
      if (session?.user) {
        // Para usuarios autenticados, podrías implementar un endpoint para limpiar
        // Por ahora solo limpiamos localmente
      } else {
        const localKey = `chat-${chatType}-${currentSessionId}`;
        localStorage.removeItem(localKey);
      }
    }
  }, [session, chatType, currentSessionId]);

  // Migrar datos locales al servidor cuando el usuario se autentica
  const migrateLocalToServer = useCallback(async () => {
    if (!session?.user || !currentSessionId) return;
    
    try {
      const localKey = `chat-${chatType}-${currentSessionId}`;
      const stored = localStorage.getItem(localKey);
      
      if (stored) {
        const localSession: ChatSession = JSON.parse(stored);
        
        // Enviar mensajes al servidor
        for (const message of localSession.messages) {
          await saveServerHistory(message, localSession.contextData);
        }
        
        // Limpiar localStorage después de migrar
        localStorage.removeItem(localKey);
      }
    } catch (error) {
      console.error('Error migrating local chat to server:', error);
    }
  }, [session, chatType, currentSessionId, saveServerHistory]);

  // Migrar cuando el usuario se autentica
  useEffect(() => {
    if (session?.user && currentSessionId && messages.length > 0) {
      migrateLocalToServer();
    }
  }, [session?.user, migrateLocalToServer]);

  return {
    messages,
    addMessage,
    addMessages,
    clearChat,
    initializeSession,
    loading,
    isAuthenticated: !!session?.user,
    currentSessionId,
    user: session?.user
  };
}