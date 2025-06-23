# Guía de Despliegue en Vercel

## Variables de Entorno para Producción

Cuando despliegues en Vercel, necesitarás configurar las siguientes variables de entorno en el dashboard de Vercel:

### 1. Better Auth Configuration
```
BETTER_AUTH_SECRET=tu-clave-secreta-segura
BETTER_AUTH_URL=https://tu-dominio.vercel.app
```

### 2. Google OAuth Configuration
```
GOOGLE_CLIENT_ID=tu-google-client-id
GOOGLE_CLIENT_SECRET=tu-google-client-secret
```

### 3. Google Maps API (ya existente)
```
GOOGLE_API_KEY=tu-google-maps-api-key
```

### 4. Base de Datos (Opcional para Better Auth)
```
DATABASE_URL=tu-url-de-base-de-datos
```

## Configuración de Base de Datos

### ¿Es necesaria una base de datos?

**Para funcionalidad básica: NO es estrictamente necesaria**

Better Auth puede funcionar sin base de datos usando:
- Cookies para sesiones
- JWT tokens
- Almacenamiento en memoria (no persistente)

**Para funcionalidad completa: SÍ es recomendada**

Una base de datos te permite:
- Persistir sesiones de usuario
- Almacenar información de perfil
- Mantener historial de chat entre sesiones
- Funciones avanzadas de autenticación

### Opciones de Base de Datos para Vercel

#### 1. **Vercel Postgres (Recomendado)**
```bash
# Instalar en tu proyecto
npm install @vercel/postgres
```

**Configuración:**
- Ve a tu dashboard de Vercel
- Selecciona tu proyecto
- Ve a "Storage" → "Create Database" → "Postgres"
- Vercel generará automáticamente `DATABASE_URL`

#### 2. **PlanetScale (MySQL)**
```
DATABASE_URL=mysql://usuario:password@host/database?sslaccept=strict
```

#### 3. **Supabase (PostgreSQL)**
```
DATABASE_URL=postgresql://usuario:password@host:5432/database
```

#### 4. **Sin Base de Datos (Modo Simple)**
Si no quieres configurar una base de datos inicialmente, puedes:
- Comentar o eliminar `DATABASE_URL` del `.env`
- Better Auth funcionará con almacenamiento en memoria
- Los usuarios perderán sus sesiones al reiniciar el servidor

## Cómo Obtener Google OAuth Credentials

### Paso 1: Ir a Google Cloud Console
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente

### Paso 2: Habilitar Google+ API
1. Ve a "APIs & Services" → "Library"
2. Busca "Google+ API" y habilítala
3. También habilita "Google OAuth2 API"

### Paso 3: Crear Credenciales OAuth
1. Ve a "APIs & Services" → "Credentials"
2. Haz clic en "Create Credentials" → "OAuth 2.0 Client IDs"
3. Selecciona "Web application"
4. Configura:
   - **Name**: Agrivision Auth
   - **Authorized JavaScript origins**: 
     - `http://localhost:3000` (desarrollo)
     - `https://tu-dominio.vercel.app` (producción)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/auth/callback/google` (desarrollo)
     - `https://tu-dominio.vercel.app/api/auth/callback/google` (producción)

### Paso 4: Obtener las Credenciales
Después de crear, obtendrás:
- **Client ID**: `GOOGLE_CLIENT_ID`
- **Client Secret**: `GOOGLE_CLIENT_SECRET`

## Configuración en Vercel Dashboard

### Paso 1: Ir a Settings
1. Ve a tu proyecto en Vercel
2. Haz clic en "Settings"
3. Ve a "Environment Variables"

### Paso 2: Agregar Variables
Agrega cada variable una por una:

```
BETTER_AUTH_SECRET=genera-una-clave-secreta-de-32-caracteres
BETTER_AUTH_URL=https://tu-dominio.vercel.app
GOOGLE_CLIENT_ID=tu-client-id-de-google
GOOGLE_CLIENT_SECRET=tu-client-secret-de-google
GOOGLE_API_KEY=tu-api-key-existente
DATABASE_URL=tu-url-de-base-de-datos (opcional)
```

### Paso 3: Generar BETTER_AUTH_SECRET
Puedes generar una clave secreta segura con:

```bash
# En terminal
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

O usar un generador online como [randomkeygen.com](https://randomkeygen.com/)

## Notas Importantes

1. **BETTER_AUTH_URL**: Debe ser tu dominio de producción de Vercel
2. **Redirect URIs**: Deben coincidir exactamente con tu configuración de Google
3. **Base de Datos**: Opcional para empezar, pero recomendada para producción
4. **Seguridad**: Nunca expongas las credenciales en el código fuente

## Verificación

Después del despliegue, verifica que:
- [ ] Las variables de entorno están configuradas
- [ ] Google OAuth funciona correctamente
- [ ] Los usuarios pueden autenticarse
- [ ] El chat persistente funciona (si usas base de datos)

## Troubleshooting

### Error: "redirect_uri_mismatch"
- Verifica que las URIs de redirección en Google Cloud Console coincidan exactamente

### Error: "Failed to initialize database adapter"
- Verifica que `DATABASE_URL` esté configurada correctamente
- O comenta la línea para usar modo sin base de datos

### Error: "Invalid client_id"
- Verifica que `GOOGLE_CLIENT_ID` esté configurado correctamente en Vercel