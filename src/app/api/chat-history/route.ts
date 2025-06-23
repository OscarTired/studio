import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { Pool } from 'pg';

interface ChatMessage {
  id: string;
  userId: string;
  chatType: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  contextData?: any;
  createdAt: string;
}

// Configuración de la base de datos
const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
});

// Función para inicializar la tabla de chat_messages si no existe
async function initializeChatTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        chat_type VARCHAR(50) NOT NULL,
        session_id VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL,
        content TEXT NOT NULL,
        context_data JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    
    // Crear índices para mejorar el rendimiento
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
      CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
      CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_type ON chat_messages(chat_type);
    `);
  } catch (error) {
    console.error('Error initializing chat table:', error);
  }
}

// Inicializar la tabla al cargar el módulo
initializeChatTable();

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const userId = session?.user?.id || 'guest';
    
    // Debug logs
    console.log('🔍 [API DEBUG] Session data:', session);
    console.log('🔍 [API DEBUG] User ID:', userId);
    console.log('🔍 [API DEBUG] User authenticated:', !!session?.user);

    const { searchParams } = new URL(request.url);
    const chatType = searchParams.get('type');
    const sessionId = searchParams.get('sessionId');
    const listSessions = searchParams.get('list') === 'true';

    if (listSessions) {
      // Devolver lista de sesiones del usuario desde la base de datos
      try {
        console.log('🔍 [API DEBUG] Consultando sesiones para userId:', userId);
        
        const result = await pool.query(`
          SELECT 
            session_id,
            chat_type,
            MAX(created_at) as last_updated,
            COUNT(*) as message_count,
            (
              SELECT content 
              FROM chat_messages cm2 
              WHERE cm2.session_id = cm.session_id 
                AND cm2.user_id = cm.user_id 
              ORDER BY created_at ASC 
              LIMIT 1
            ) as first_message
          FROM chat_messages cm
          WHERE user_id = $1
          GROUP BY session_id, chat_type, user_id
          ORDER BY last_updated DESC
        `, [userId]);
        
        console.log('🔍 [API DEBUG] Resultados de la consulta:', result.rows.length, 'sesiones');
        console.log('🔍 [API DEBUG] Datos:', result.rows);
        
        const sessions = result.rows.map(row => ({
          id: row.session_id,
          chatType: row.chat_type,
          lastUpdated: row.last_updated,
          title: row.first_message?.substring(0, 50) + '...' || `Sesión de ${row.chat_type}`,
          messages: [] // Se cargarán cuando se seleccione la sesión específica
        }));
        
        return NextResponse.json({ sessions });
      } catch (error) {
        console.error('Error fetching sessions from database:', error);
        return NextResponse.json({ sessions: [] });
      }
    }

    if (!chatType || !sessionId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Obtener mensajes de la sesión específica desde la base de datos
    try {
      const result = await pool.query(`
        SELECT id, role, content, created_at, context_data
        FROM chat_messages
        WHERE user_id = $1 AND chat_type = $2 AND session_id = $3
        ORDER BY created_at ASC
      `, [userId, chatType, sessionId]);

      const messages = result.rows.map(row => ({
        id: row.id,
        role: row.role,
        content: row.content,
        timestamp: row.created_at,
        contextData: row.context_data
      }));

      return NextResponse.json({
        sessionId,
        chatType,
        messages,
        total: messages.length
      });
    } catch (error) {
      console.error('Error fetching messages from database:', error);
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const { chatType, sessionId, role, content, contextData } = await request.json();
    
    // Debug logs
    console.log('🔍 [POST API DEBUG] Recibiendo mensaje para guardar:');
    console.log('🔍 [POST API DEBUG] Session:', session?.user ? 'Autenticado' : 'No autenticado');
    console.log('🔍 [POST API DEBUG] chatType:', chatType);
    console.log('🔍 [POST API DEBUG] sessionId:', sessionId);
    console.log('🔍 [POST API DEBUG] role:', role);
    console.log('🔍 [POST API DEBUG] content length:', content?.length);
    
    if (!chatType || !sessionId || !role || !content) {
      console.log('🔍 [POST API DEBUG] Campos faltantes:', { chatType, sessionId, role, content: !!content });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Usar el ID del usuario autenticado o 'guest' para usuarios no autenticados
    const userId = session?.user?.id || 'guest';
    console.log('🔍 [POST API DEBUG] userId para guardar:', userId);
    
    // Crear nuevo mensaje y guardarlo en la base de datos
    const messageId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log('🔍 [POST API DEBUG] messageId generado:', messageId);
    
    try {
      console.log('🔍 [POST API DEBUG] Ejecutando INSERT con parámetros:', {
        messageId, userId, chatType, sessionId, role, contentLength: content.length
      });
      
      await pool.query(`
        INSERT INTO chat_messages (id, user_id, chat_type, session_id, role, content, context_data)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [messageId, userId, chatType, sessionId, role, content, contextData]);
      
      console.log('🔍 [POST API DEBUG] Mensaje guardado exitosamente');
      return NextResponse.json({ success: true, messageId });
    } catch (error) {
      console.error('Error saving message to database:', error);
      return NextResponse.json({ error: 'Failed to save message' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error saving chat message:', error);
    return NextResponse.json(
      { error: 'Failed to save chat message' },
      { status: 500 }
    );
  }
}

// Endpoint para limpiar historial de una sesión específica
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const userId = session?.user?.id || 'guest';

    const { searchParams } = new URL(request.url);
    const chatType = searchParams.get('type');
    const sessionId = searchParams.get('sessionId');

    if (!chatType || !sessionId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Eliminar mensajes de la sesión específica desde la base de datos
    try {
      await pool.query(`
        DELETE FROM chat_messages
        WHERE user_id = $1 AND chat_type = $2 AND session_id = $3
      `, [userId, chatType, sessionId]);
      
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error deleting messages from database:', error);
      return NextResponse.json({ error: 'Failed to delete messages' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error deleting chat history:', error);
    return NextResponse.json(
      { error: 'Failed to delete chat history' },
      { status: 500 }
    );
  }
}