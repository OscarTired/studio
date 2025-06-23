"use client";

import { useState, useEffect, useRef } from 'react';
import { useSession } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { MessageCircle, Calendar, Trash2, Eye, Stethoscope, CloudRain, User, Bot, Send, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ChatSession {
  id: string;
  chatType: 'diagnosis' | 'weather';
  messages: ChatMessage[];
  lastUpdated: string;
  title?: string;
}

export default function HistoryPage() {
  const { data: session } = useSession();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [chatInput, setChatInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const sendingRef = useRef(false);

  useEffect(() => {
    // Solo cargar una vez al montar el componente
    if (!isInitialized) {
      loadChatHistory();
      setIsInitialized(true);
    }
  }, [isInitialized]); // Controlar con flag para evitar re-cargas

  const loadChatHistory = async () => {
    if (loading) return; // Evitar múltiples llamadas simultáneas
    
    try {
      setLoading(true);
      console.log('🔍 [DEBUG] Cargando historial de chat...');
      
      // Intentar cargar desde la API primero
      const response = await fetch('/api/chat-history?list=true', {
        cache: 'no-cache' // Evitar cache para obtener datos frescos
      });
      console.log('🔍 [DEBUG] Respuesta de API:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 [DEBUG] Datos recibidos de API:', data);
        console.log('🔍 [DEBUG] Número de sesiones:', data.sessions?.length || 0);
        setSessions(data.sessions || []);
      } else {
        console.error('Error loading chat history from API:', response.statusText);
        // Fallback a localStorage si la API falla
        loadLocalHistory();
        return;
      }
    } catch (error) {
      console.error('Error loading chat history from API:', error);
      // Fallback a localStorage si la API falla
      loadLocalHistory();
      return;
    } finally {
      setLoading(false);
    }
  };

  const loadSessionMessages = async (sessionId: string, chatType: string) => {
    if (loadingMessages) return []; // Evitar múltiples llamadas simultáneas
    
    try {
      setLoadingMessages(true);
      console.log('🔍 [DEBUG] Cargando mensajes para sesión:', sessionId, chatType);
      
      const response = await fetch(`/api/chat-history?type=${chatType}&sessionId=${sessionId}`, {
        cache: 'no-cache' // Evitar cache para obtener datos frescos
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 [DEBUG] Mensajes cargados:', data.messages?.length || 0);
        return data.messages || [];
      } else {
        console.error('Error loading session messages:', response.statusText);
        return [];
      }
    } catch (error) {
      console.error('Error loading session messages:', error);
      return [];
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSessionSelect = async (session: ChatSession) => {
    console.log('🔍 [DEBUG] Seleccionando sesión:', session.id);
    
    // Evitar re-seleccionar la misma sesión
    if (selectedSession?.id === session.id) {
      return;
    }
    
    // Si la sesión ya tiene mensajes cargados, usarlos
    if (session.messages && session.messages.length > 0) {
      setSelectedSession(session);
      return;
    }
    
    // Cargar mensajes de la sesión
    const messages = await loadSessionMessages(session.id, session.chatType);
    const sessionWithMessages = {
      ...session,
      messages
    };
    
    setSelectedSession(sessionWithMessages);
  };

  const loadLocalHistory = () => {
    try {
      setLoading(true);
      const localSessions: ChatSession[] = [];
      
      // Buscar sesiones en localStorage
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('chat-')) {
          try {
            const sessionData = JSON.parse(localStorage.getItem(key) || '{}');
            if (sessionData.messages && sessionData.messages.length > 0) {
              const chatType = key.includes('diagnosis') ? 'diagnosis' : 'weather';
              localSessions.push({
                id: sessionData.id || key,
                chatType,
                messages: sessionData.messages,
                lastUpdated: sessionData.lastUpdated || new Date().toISOString(),
                title: generateSessionTitle(sessionData.messages[0]?.content, chatType)
              });
            }
          } catch (error) {
            console.error('Error parsing session:', error);
          }
        }
      });
      
      setSessions(localSessions.sort((a, b) => 
        new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
      ));
    } catch (error) {
      console.error('Error loading local history:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSessionTitle = (firstMessage: string, chatType: string) => {
    if (!firstMessage) return `Sesión de ${chatType === 'diagnosis' ? 'diagnóstico' : 'clima'}`;
    const truncated = firstMessage.length > 50 ? firstMessage.substring(0, 50) + '...' : firstMessage;
    return truncated;
  };

  const deleteSession = async (sessionId: string) => {
    try {
      if (session?.user) {
        // Para usuarios autenticados, eliminar de la API
        const sessionToDelete = sessions.find(s => s.id === sessionId);
        if (sessionToDelete) {
          await fetch(`/api/chat-history?type=${sessionToDelete.chatType}&sessionId=${sessionId}`, {
            method: 'DELETE'
          });
        }
      } else {
        // Para usuarios invitados, eliminar de localStorage
        const keyToDelete = Object.keys(localStorage).find(key => 
          key.startsWith('chat-') && localStorage.getItem(key)?.includes(sessionId)
        );
        if (keyToDelete) {
          localStorage.removeItem(keyToDelete);
        }
      }
      
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (selectedSession?.id === sessionId) {
        setSelectedSession(null);
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const filteredSessions = sessions.filter(session => {
    if (activeTab === 'all') return true;
    return session.chatType === activeTab;
  });

  const getChatTypeIcon = (chatType: string) => {
    return chatType === 'diagnosis' ? <Stethoscope className="h-4 w-4" /> : <CloudRain className="h-4 w-4" />;
  };

  const handleSendChatMessage = async () => {
    console.log('🔍 [DEBUG] handleSendChatMessage llamado - sendingMessage:', sendingMessage, 'sendingRef:', sendingRef.current);
    
    // Verificación con ref para prevenir múltiples ejecuciones simultáneas
    if (sendingRef.current) {
      console.log('🔍 [DEBUG] Ya hay un mensaje siendo enviado (ref), ignorando...');
      return;
    }
    
    if (!chatInput.trim() || !selectedSession || sendingMessage) {
      console.log('🔍 [DEBUG] Condiciones no cumplidas - chatInput:', !!chatInput.trim(), 'selectedSession:', !!selectedSession, 'sendingMessage:', sendingMessage);
      return;
    }
    
    // Marcar como enviando INMEDIATAMENTE para prevenir duplicados
    console.log('🔍 [DEBUG] Iniciando envío de mensaje...');
    sendingRef.current = true;
    setSendingMessage(true);
    
    const messageContent = chatInput.trim();
    setChatInput(''); // Limpiar input inmediatamente

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageContent,
      timestamp: new Date().toISOString()
    };

    // Agregar mensaje del usuario inmediatamente
    const updatedSession = {
      ...selectedSession,
      messages: [...selectedSession.messages, userMessage]
    };
    setSelectedSession(updatedSession);

    try {
      let response;
      
      if (selectedSession.chatType === 'diagnosis') {
        // Para chat de diagnóstico, usar contexto básico
        response = await fetch('/api/diagnosis-chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: userMessage.content,
            diagnosisContext: {
              cropType: 'Cultivo general',
              diseaseName: 'Consulta general',
              confidence: 0,
              symptoms: [],
              recommendations: [],
              location: 'Ubicación no especificada',
              coordinates: { lat: 0, lon: 0 },
              weatherData: {
                temperature: 20,
                tempHigh: 25,
                tempLow: 15,
                humidity: 60,
                windSpeed: 10,
                condition: 'Despejado'
              },
              date: new Date().toISOString()
            },
            chatHistory: selectedSession.messages.slice(-10).map(msg => ({
              role: msg.role,
              content: msg.content
            }))
          }),
        });
      } else {
        // Para chat de clima, usar contexto básico
        response = await fetch('/api/weather-chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: userMessage.content,
            weatherContext: {
              location: 'Ubicación no especificada',
              coordinates: { lat: 0, lon: 0 },
              date: new Date().toISOString(),
              tempHigh: 25,
              tempLow: 15,
              humidity: 60,
              windSpeed: 10,
              condition: 'Despejado',
              recommendations: []
            },
            chatHistory: selectedSession.messages.slice(-10).map(msg => ({
              role: msg.role,
              content: msg.content
            }))
          }),
        });
      }

      if (!response.ok) {
        throw new Error('Error al enviar mensaje');
      }

      const data = await response.json();
      
      // Crear respuesta del asistente con la respuesta real de la IA
      // Agregar un pequeño delay para asegurar que el timestamp sea posterior al del usuario
      await new Promise(resolve => setTimeout(resolve, 1));
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || 'Lo siento, no pude generar una respuesta.',
        timestamp: new Date().toISOString()
      };

      const finalSession = {
        ...updatedSession,
        messages: [...updatedSession.messages, assistantMessage],
        lastUpdated: new Date().toISOString()
      };
      
      setSelectedSession(finalSession);
      
      // Actualizar la lista de sesiones
      setSessions(prev => prev.map(s => 
        s.id === selectedSession.id ? finalSession : s
      ));

      // Guardar ambos mensajes en una sola llamada para evitar duplicaciones
      try {
        console.log('🔍 [DEBUG] Guardando mensajes en historial...', {
          userMessageId: userMessage.id,
          assistantMessageId: assistantMessage.id,
          sessionId: selectedSession.id
        });
        // Guardar mensajes secuencialmente para mantener el orden
        await fetch('/api/chat-history', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chatType: selectedSession.chatType,
            sessionId: selectedSession.id,
            role: userMessage.role,
            content: userMessage.content
          }),
        });
        
        await fetch('/api/chat-history', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chatType: selectedSession.chatType,
            sessionId: selectedSession.id,
            role: assistantMessage.role,
            content: assistantMessage.content
          }),
        });
        console.log('🔍 [DEBUG] Mensajes guardados exitosamente');
      } catch (saveError) {
        console.error('Error saving to history:', saveError);
        // No interrumpir el flujo si falla el guardado
      }

    } catch (error) {
      console.error('Error sending message:', error);
      // Mostrar mensaje de error
      // Agregar un pequeño delay para asegurar que el timestamp sea posterior al del usuario
      await new Promise(resolve => setTimeout(resolve, 1));
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Lo siento, hubo un error al procesar tu mensaje. Por favor, inténtalo de nuevo.',
        timestamp: new Date().toISOString()
      };
      
      const errorSession = {
        ...updatedSession,
        messages: [...updatedSession.messages, errorMessage]
      };
      setSelectedSession(errorSession);
    } finally {
       setSendingMessage(false);
       sendingRef.current = false;
     }
   };

  const getChatTypeBadge = (chatType: string) => {
    return chatType === 'diagnosis' ? (
      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
        Diagnóstico
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-green-100 text-green-800">
        Clima
      </Badge>
    );
  };

  // Removed authentication check - history now works for both authenticated and guest users

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Historial de Conversaciones</h1>
        <p className="text-muted-foreground">
          Revisa y gestiona tus conversaciones anteriores con AgriVision
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de sesiones */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Conversaciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all">Todas</TabsTrigger>
                  <TabsTrigger value="diagnosis">Diagnóstico</TabsTrigger>
                  <TabsTrigger value="weather">Clima</TabsTrigger>
                </TabsList>
                
                <div className="mt-4">
                  {loading ? (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground">Cargando...</p>
                    </div>
                  ) : filteredSessions.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground">No hay conversaciones</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Debug: {sessions.length} sesiones totales, {filteredSessions.length} filtradas
                      </p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-2">
                        {filteredSessions.map((session) => (
                          <Card 
                            key={session.id} 
                            className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                              selectedSession?.id === session.id ? 'ring-2 ring-primary' : ''
                            }`}
                            onClick={() => handleSessionSelect(session)}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    {getChatTypeIcon(session.chatType)}
                                    {getChatTypeBadge(session.chatType)}
                                  </div>
                                  <p className="text-sm font-medium truncate">
                                    {session.title}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {format(new Date(session.lastUpdated), 'dd MMM yyyy, HH:mm', { locale: es })}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {session.messages.length} mensajes
                                  </p>
                                </div>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>¿Eliminar conversación?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Esta acción no se puede deshacer. La conversación será eliminada permanentemente.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction 
                                        onClick={() => deleteSession(session.id)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Eliminar
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Detalle de la sesión */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                {selectedSession ? 'Detalle de Conversación' : 'Selecciona una conversación'}
              </CardTitle>
              {selectedSession && (
                <CardDescription>
                  {getChatTypeBadge(selectedSession.chatType)} • 
                  {format(new Date(selectedSession.lastUpdated), 'dd MMMM yyyy, HH:mm', { locale: es })}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {loadingMessages ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">
                    Cargando mensajes...
                  </p>
                </div>
              ) : selectedSession ? (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-4">
                    {selectedSession.messages && selectedSession.messages.length > 0 ? (
                      selectedSession.messages.map((message, index) => (
                        <div key={message.id || index} className="flex gap-3">
                          <div className="flex-shrink-0">
                            {message.role === 'user' ? (
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-4 w-4 text-primary" />
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                <Bot className="h-4 w-4 text-green-600" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium">
                                {message.role === 'user' ? 'Tú' : 'AgriVision'}
                              </span>
                              {message.timestamp && (
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(message.timestamp), 'HH:mm', { locale: es })}
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                              {message.content}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">
                          No hay mensajes en esta conversación
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-12">
                  <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Selecciona una conversación de la lista para ver los detalles
                  </p>
                </div>
              )}
              
              {/* Barra de chat completa */}
              {selectedSession && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Escribe tu mensaje..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendChatMessage();
                        }
                      }}
                      disabled={sendingMessage}
                    />
                    <Button 
                      onClick={handleSendChatMessage}
                      disabled={!chatInput.trim() || sendingMessage}
                      size="sm"
                    >
                      {sendingMessage ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}