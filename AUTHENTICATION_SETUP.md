# Configuración de Autenticación con Google

Este proyecto utiliza `better-auth` para manejar la autenticación con Google y la persistencia del historial de chat.

## Configuración Inicial

### 1. Variables de Entorno

Copia el archivo `.env.example` a `.env.local` y configura las siguientes variables:

```bash
cp .env.example .env.local
```

Edita `.env.local` con tus valores:

```env
# Better Auth Configuration
BETTER_AUTH_SECRET=tu-clave-secreta-aqui
BETTER_AUTH_URL=http://localhost:3000

# Google OAuth Configuration
GOOGLE_CLIENT_ID=tu-google-client-id
GOOGLE_CLIENT_SECRET=tu-google-client-secret

# Database
DATABASE_URL=./database.sqlite
```

### 2. Configurar Google OAuth

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la API de Google+ o Google Identity
4. Ve a "Credenciales" > "Crear credenciales" > "ID de cliente OAuth 2.0"
5. Configura:
   - **Tipo de aplicación**: Aplicación web
   - **Orígenes autorizados**: `http://localhost:3000`
   - **URIs de redirección autorizados**: `http://localhost:3000/api/auth/callback/google`
6. Copia el Client ID y Client Secret a tu archivo `.env.local`

### 3. Generar SECRET Key

Puedes generar una clave secreta usando:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

O usar cualquier generador de claves seguras online.

## Funcionalidades Implementadas

### Para Usuarios Autenticados
- ✅ Historial de chat persistente en base de datos
- ✅ Sincronización entre dispositivos
- ✅ Migración automática del chat local al autenticarse
- ✅ Separación por tipo de chat (diagnosis, weather)

### Para Usuarios Invitados
- ✅ Chat temporal en localStorage
- ✅ Se pierde al refrescar la página
- ✅ Opción de autenticarse para guardar progreso

## Estructura de la Base de Datos

El sistema crea automáticamente las siguientes tablas:

- `user` - Información de usuarios
- `session` - Sesiones activas
- `account` - Cuentas vinculadas (Google)
- `verification` - Tokens de verificación

## Uso en Desarrollo

1. Instala las dependencias:
```bash
npm install
```

2. Configura las variables de entorno (ver arriba)

3. Ejecuta el servidor de desarrollo:
```bash
npm run dev
```

4. Ve a `http://localhost:3000` y prueba la autenticación

## Componentes Principales

- `src/lib/auth.ts` - Configuración de better-auth
- `src/lib/auth-client.ts` - Cliente de autenticación para React
- `src/hooks/use-persistent-chat.ts` - Hook para chat persistente
- `src/components/auth/UserBar.tsx` - Barra de usuario con estado de auth
- `src/components/auth/AuthModal.tsx` - Modal de autenticación
- `src/app/api/auth/[...all]/route.ts` - Rutas de autenticación
- `src/app/api/chat-history/route.ts` - API para historial de chat

## Solución de Problemas

### Error: "Invalid redirect URI"
- Verifica que la URI de redirección en Google Cloud Console sea exactamente: `http://localhost:3000/api/auth/callback/google`

### Error: "BETTER_AUTH_SECRET is required"
- Asegúrate de que la variable `BETTER_AUTH_SECRET` esté configurada en `.env.local`

### El chat no se guarda
- Verifica que el usuario esté autenticado
- Revisa la consola del navegador para errores de API
- Asegúrate de que la base de datos SQLite se pueda crear en el directorio del proyecto

## Producción

Para producción, actualiza:

1. `BETTER_AUTH_URL` con tu dominio real
2. Agrega tu dominio de producción a Google Cloud Console
3. Usa una base de datos más robusta (PostgreSQL, MySQL)
4. Configura variables de entorno en tu plataforma de hosting