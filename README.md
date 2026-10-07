# My Green Farm

Sistema Web y panel administrativo de My Green Farm, un centro educativo acreditado por el MEP con programas de guardería y preescolar para niños desde los 3 meses hasta los 12 años.

## Descripción

El proyecto combina un sitio público (información institucional, noticias, foro, galería, vacantes, reserva de citas y pago de servicios) con un panel de gestión interno para el personal del centro (padres, niños, expedientes, evaluaciones, clubes, disponibilidad, newsletter, usuarios).

Es un monorepo con dos aplicaciones:

- **`backend/`** — API REST en Java 21 + Spring Boot 4.1. Maneja autenticación (JWT), persistencia en PostgreSQL y la integración con servicios externos: almacenamiento de archivos (S3/Supabase), correo (SMTP + Brevo), pagos (ONVO), calendario (Google Calendar), traducción (Google Cloud Translate) y resúmenes generados por IA (Gemini, vía Spring AI).
- **`frontend/`** — SPA en React 19 + TypeScript + Vite, con Tailwind CSS, React Router y soporte de i18n (es/en/fr) vía i18next. Consume la API y ofrece tanto el sitio público como el panel administrativo.

En producción, ambas se despliegan como un único contenedor: el build de Vite se empaqueta dentro del `.jar` de Spring Boot, que lo sirve como contenido estático.

## Instalación

### Requisitos previos

- Node.js 20 o superior
- Java 21 o superior (el Dockerfile usa JDK 22)
- PostgreSQL (en pruebas el backend puede usar H2 en memoria)
- Credenciales de los servicios externos que quieras probar (S3/Supabase, Brevo, SMTP, Google, ONVO, Gemini); sin ellas, los módulos que dependen de cada integración no van a funcionar

### Clonar el repositorio

```
git clone <repo-url>
cd MyGreenFarm-Desarrollo
```

### Frontend

```
cd frontend
npm install
```

Creá un archivo `.env` con la URL del backend:

```
VITE_API_URL=http://localhost:8080
```

### Backend

El backend lee su configuración desde variables de entorno (ver `backend/.env.example` como referencia). Definilas en tu shell, tu IDE o el panel de tu proveedor antes de levantar la aplicación:

| Variable | Descripción |
| --- | --- |
| `PORT` | Puerto del servidor (por defecto 8080) |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` | Conexión a PostgreSQL |
| `JWT_SECRET`, `JWT_EXPIRATION_MS` | Firma y expiración de los tokens de sesión |
| `FRONTEND_URL`, `FRONTEND_ORIGIN` | URL del frontend (enlaces en correos y CORS) |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM`, `MAIL_SUPPORT` | Envío de correo por SMTP |
| `RESEND_TOKEN` | Token del proveedor de envío de correo |
| `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME` | Envío de boletines (newsletter) |
| `SUPABASE_ENDPOINT`, `SUPABASE_REGION`, `SUPABASE_ACCESS_KEY`, `SUPABASE_SECRET_KEY` | Conexión al storage S3 |
| `SUPABASE_ANNOUNCEMENTS`, `SUPABASE_GALLERY`, `SUPABASE_EXPEDIENTS`, `SUPABASE_SERVICE_PLANS`, `SUPABASE_CURRICULUMS`, `SUPABASE_FORUM`, `SUPABASE_CLUBS` | Buckets usados por cada módulo |
| `GOOGLE_CLOUD_CREDENTIALS_JSON`, `GOOGLE_CLOUD_PROJECT_ID` | Traducción automática de contenido |
| `CALENDAR_CREDENTIALS_PATH`, `CALENDAR_ID`, `GOOGLE_CREDENTIALS_JSON` | Sincronización de citas con Google Calendar |
| `ONVO_API_KEY`, `ONVO_API_URL`, `PAYMENTS_SUCCESS_URL`, `PAYMENTS_CANCEL_URL` | Pasarela de pagos |
| `GEMINI_API_KEY`, `GEMINI_MODEL`, `GEMINI_BASE_URL` | Resúmenes generados por IA |
| `SOCIAL_LINK`, `DAYCARE_MAIL_ADMIN` | Datos de contacto usados en correos |
| `BAC_XML_URL` | Fuente del tipo de cambio (tiene valor por defecto) |

## Uso

### Desarrollo

**Frontend** (desde `frontend/`):
```
npm run dev
```
Queda disponible en `http://localhost:5173`.

**Backend** (desde `backend/`, con el Maven Wrapper incluido):
```
./mvnw spring-boot:run
```
Queda disponible en `http://localhost:8080`.

### Scripts disponibles

**Frontend** (`frontend/package.json`)
```
npm run dev       # inicia el servidor de desarrollo
npm run build     # valida tipos (tsc) y compila para producción
npm run lint      # ejecuta ESLint
npm run preview   # sirve el build localmente
```

**Backend** (desde `backend/`)
```
./mvnw spring-boot:run   # levanta la API en modo desarrollo
./mvnw clean package     # compila y genera el .jar
./mvnw test              # ejecuta las pruebas
```

### Estructura del proyecto

```
MyGreenFarm-Desarrollo/
├── Dockerfile                  # build multi-stage: frontend + backend en un solo contenedor
├── backend/
│   └── src/main/java/taller/multimedia/backend/
│       ├── config/             # S3, Brevo, Google Translate, async, etc.
│       ├── controller/         # endpoints REST por módulo
│       ├── dto/                # objetos de petición/respuesta
│       ├── model/               # entidades JPA
│       ├── repository/          # repositorios Spring Data
│       ├── security/             # configuración de JWT y seguridad
│       ├── service/              # lógica de negocio
│       ├── scheduler/            # tareas programadas (tipo de cambio, etc.)
│       └── exception/            # manejo de errores
└── frontend/
    └── src/
        ├── assets/              # imágenes y recursos estáticos
        ├── components/          # UI, tarjetas, modales, layout
        ├── contexts/            # providers de React Context
        ├── hooks/                # hooks reutilizables
        ├── i18n/                 # traducciones es/en/fr
        ├── layout/               # layouts del panel y del sitio público
        ├── pages/                # vistas organizadas por módulo
        ├── routes/               # guards de rutas protegidas por rol
        ├── schemas/               # validaciones con Zod
        ├── services/              # llamadas a la API (axios)
        ├── tokens/                 # tokens de diseño (colores, espaciados, etc.)
        ├── types/                  # tipos compartidos
        └── utils/                  # utilidades (notificaciones, validadores, etc.)
```

### Rutas principales

La app usa React Router con rutas públicas y rutas protegidas por sesión/rol (`ADMIN`, `OWNER`, `TEACHER`).

**Públicas**
- `/` — landing page
- `/booking` — reserva de cita
- `/login`, `/signup`, `/forgot-password`, `/reset-password`
- `/news` — noticias
- `/forum`, `/forum/blog/:id`, `/forum/community/:id` — foro
- `/multimedia`, `/albumes/:id` — galería
- `/services` — planes de servicio
- `/vacantes` — vacantes de empleo
- `/clubs` — clubes
- `/payment-success`, `/payment-failed`

**Panel (requieren sesión)**
- `/profile` — perfil del usuario
- `/admin/dashboard` — resumen general
- `/admin/forum` — moderación del foro
- `/admin/citas`, `/admin/users`, `/admin/announcements`, `/admin/gallery`, `/admin/curriculums`, `/admin/clubs`, `/admin/parents`, `/admin/children`, `/admin/evaluations` — módulos de `ADMIN`
- `/admin/service-plans`, `/admin/disponibilidad`, `/admin/newsletter` — módulos de `OWNER`
- `/admin/expedients` — expedientes (docentes y administración)

### Despliegue

El proyecto se despliega como un único contenedor Docker (actualmente en Railway):

1. Se compila el frontend con Vite.
2. El build (`frontend/dist`) se copia dentro de `backend/src/main/resources/static`, para que Spring Boot lo sirva como contenido estático.
3. Se compila el backend con Maven y se empaqueta todo en un solo `.jar`.

Para construir la imagen localmente:
```
docker build -t mygreenfarm .
docker run -p 8080:8080 --env-file backend/.env mygreenfarm
```

## Estado del proyecto

En desarrollo activo. El proyecto ya cuenta con:

- Sitio público completo (noticias, foro, galería, servicios, vacantes, clubes, reserva de citas)
- Autenticación, roles y protección de rutas
- Panel administrativo con todos los módulos de gestión del centro
- Integraciones con storage, correo, pagos, calendario, traducción e IA
- Despliegue como contenedor único (frontend + backend)
