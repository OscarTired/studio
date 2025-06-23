const { Pool } = require('pg');

async function checkUsers() {
  console.log('🔗 DATABASE_URL:', process.env.DATABASE_URL ? 'Configurado' : 'No configurado');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  try {
    console.log('🔍 Verificando usuarios en la base de datos...');
    
    // Verificar usuarios únicos
    const usersResult = await pool.query('SELECT DISTINCT user_id, COUNT(*) as message_count FROM chat_messages GROUP BY user_id ORDER BY message_count DESC');
    
    console.log('\n👥 Usuarios encontrados:');
    if (usersResult.rows.length === 0) {
      console.log('❌ No se encontraron usuarios en la base de datos');
    } else {
      usersResult.rows.forEach((row, index) => {
        console.log(`${index + 1}. User ID: ${row.user_id} (${row.message_count} mensajes)`);
      });
    }
    
    // Verificar sesiones
    const sessionsResult = await pool.query('SELECT DISTINCT session_id, user_id, chat_type FROM chat_messages ORDER BY user_id, session_id');
    
    console.log('\n💬 Sesiones encontradas:');
    if (sessionsResult.rows.length === 0) {
      console.log('❌ No se encontraron sesiones en la base de datos');
    } else {
      sessionsResult.rows.forEach((row, index) => {
        console.log(`${index + 1}. Session: ${row.session_id}, User: ${row.user_id}, Type: ${row.chat_type}`);
      });
    }
    
    // Verificar total de mensajes
    const totalResult = await pool.query('SELECT COUNT(*) as total FROM chat_messages');
    console.log(`\n📊 Total de mensajes en la base de datos: ${totalResult.rows[0].total}`);
    
  } catch (error) {
    console.error('❌ Error completo:', error);
    console.error('❌ Mensaje:', error.message);
    console.error('❌ Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

checkUsers();