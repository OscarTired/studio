# Configuración de Supabase para Agrivision

## Información de tu Proyecto Supabase

**URL del Proyecto:** `https://hwqalezzflcoermngazv.supabase.co`
**Anon Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3cWFsZXp6Zmxjb2VybW5nYXp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1Njk0MTQsImV4cCI6MjA2NjE0NTQxNH0.w6MEl-pEFGgco9sAFdWc60mKo0zijq2oRHTqjBu85A8`

## Pasos para Completar la Configuración

### 1. Obtener la Contraseña de la Base de Datos

1. Ve a tu [Dashboard de Supabase](https://supabase.com/dashboard/project/hwqalezzflcoermngazv)
2. Navega a **Settings** → **Database**
3. En la sección "Connection string", encontrarás tu contraseña de base de datos
4. O puedes cambiar la contraseña desde esta misma página si lo prefieres

### 2. Obtener la URL de Conexión Correcta

1. En tu Dashboard de Supabase, haz clic en **"Connect"**
2. Ve a la pestaña **"ORMs"**
3. Selecciona cualquier ORM (como Drizzle)
4. Copia la **Transaction pooler** connection string que se ve así:
   ```
   postgresql://postgres.hwqalezzflcoermngazv:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```

### 3. Actualizar tu archivo .env

Reemplaza `[TU-PASSWORD-DE-DB]` en tu archivo `.env` con la contraseña real:

```env
# Antes
DATABASE_URL=postgresql://postgres.hwqalezzflcoermngazv:[TU-PASSWORD-DE-DB]@aws-0-us-east-1.pooler.supabase.com:6543/postgres

# Después (ejemplo)
DATABASE_URL=postgresql://postgres.hwqalezzflcoermngazv:tu_password_real@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

**Importante:** También verifica que la región sea correcta. Puede ser `us-east-1`, `eu-west-1`, etc.

### 4. Crear las Tablas de Better Auth

Better Auth necesita crear sus propias tablas en tu base de datos. Ejecuta:

```bash
npx @better-auth/cli generate
```

Este comando creará las tablas necesarias para la autenticación.

### 5. Variables de Entorno Completas

Tu archivo `.env` debería verse así:

```env
# Google Maps API Key (existente)
GOOGLE_API_KEY="AIzaSyBs1PO0Fuw1EBb0UETSz_WOpek1z94z8-I"

# Better Auth Configuration
BETTER_AUTH_SECRET=U1JRyCKD9mkLCFrKvMpkJeW1DpNfLHfJ
BETTER_AUTH_URL=http://localhost:3000

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres.hwqalezzflcoermngazv:[TU-PASSWORD-REAL]@aws-0-[REGION-CORRECTA].pooler.supabase.com:6543/postgres

# Supabase Configuration
SUPABASE_URL=https://hwqalezzflcoermngazv.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3cWFsZXp6Zmxjb2VybW5nYXp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1Njk0MTQsImV4cCI6MjA2NjE0NTQxNH0.w6MEl-pEFGgco9sAFdWc60mKo0zijq2oRHTqjBu85A8
```

## Para Despliegue en Vercel

### Variables de Entorno en Vercel

En tu Dashboard de Vercel, agrega estas variables:

```
BETTER_AUTH_SECRET=U1JRyCKD9mkLCFrKvMpkJeW1DpNfLHfJ
BETTER_AUTH_URL=https://tu-dominio.vercel.app
GOOGLE_CLIENT_ID=tu-google-client-id
GOOGLE_CLIENT_SECRET=tu-google-client-secret
GOOGLE_API_KEY=AIzaSyBs1PO0Fuw1EBb0UETSz_WOpek1z94z8-I
DATABASE_URL=postgresql://postgres.hwqalezzflcoermngazv:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
SUPABASE_URL=https://hwqalezzflcoermngazv.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3cWFsZXp6Zmxjb2VybW5nYXp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1Njk0MTQsImV4cCI6MjA2NjE0NTQxNH0.w6MEl-pEFGgco9sAFdWc60mKo0zijq2oRHTqjBu85A8
```

## Verificación

### 1. Probar la Conexión

Puedes probar la conexión ejecutando:

```bash
npm run dev
```

Si no hay errores de "Failed to initialize database adapter", la conexión está funcionando.

### 2. Verificar las Tablas

En tu Dashboard de Supabase:
1. Ve a **Table Editor**
2. Deberías ver tablas como `user`, `session`, `account`, etc. creadas por Better Auth

## Troubleshooting

### Error: "Failed to initialize database adapter"
- Verifica que la contraseña en `DATABASE_URL` sea correcta
- Verifica que la región en la URL sea correcta
- Asegúrate de que el puerto sea `6543` (transaction pooler)

### Error: "Connection refused"
- Verifica que tu proyecto de Supabase esté activo
- Verifica que la URL del proyecto sea correcta

### Error: "Invalid credentials"
- Ve a Supabase Dashboard → Settings → Database
- Verifica o cambia tu contraseña de base de datos

## Beneficios de Usar Supabase

✅ **Base de datos PostgreSQL gratuita** hasta 500MB
✅ **Conexión pooling automática** para mejor rendimiento
✅ **Backups automáticos**
✅ **Dashboard visual** para administrar datos
✅ **APIs REST y GraphQL automáticas**
✅ **Row Level Security (RLS)** para seguridad avanzada

## Próximos Pasos

1. Obtén tu contraseña de base de datos real
2. Actualiza el archivo `.env` con la información correcta
3. Ejecuta `npx @better-auth/cli generate` para crear las tablas
4. Configura Google OAuth (ver `VERCEL_DEPLOYMENT.md`)
5. Prueba la autenticación localmente
6. Despliega en Vercel con las variables de entorno configuradas