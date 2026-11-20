# My Green Farm

Sistema Web y panel administrativo de My Green Farm, un centro educativo acreditado por el MEP con programas de guardería y preescolar para niños desde los 3 meses hasta los 12 años.

## Descripción

El proyecto combina un sitio público (información institucional, noticias, foro, galería, servicios, clubes, vacantes, Nosotros, Green Hearts y reserva de citas, con un asistente virtual) con un panel de gestión interno para el personal del centro (citas, usuarios, noticias, galería, currículums, clubes, padres, niños, grupos, expedientes, evaluaciones, disponibilidad, newsletter y planes de servicio). El dashboard del panel muestra un resumen distinto según el rol de quien inicia sesión.

Es un monorepo con dos aplicaciones:

- **`backend/`** — API REST en Java 21 + Spring Boot 4.1. Maneja autenticación (JWT), persistencia en PostgreSQL y la integración con servicios externos: almacenamiento de archivos (S3/Supabase), correo (SMTP + Brevo), calendario (Google Calendar), traducción (Google Cloud Translate), tipo de cambio (BAC) e IA con Gemini vía Spring AI (resúmenes y chatbot).
- **`frontend/`** — SPA en React 19 + TypeScript + Vite, con Tailwind CSS 4, React Router y soporte de i18n (es/en/fr) vía i18next. Consume la API y ofrece tanto el sitio público como el panel administrativo.

En producción, ambas se despliegan como un único contenedor: el build de Vite se empaqueta dentro del `.jar` de Spring Boot, que lo sirve como contenido estático.

## Instalación

### Requisitos previos

- Node.js 20 o superior
- Java 21 o superior (el Dockerfile usa JDK 22)
- PostgreSQL (en pruebas el backend puede usar H2 en memoria)
- Credenciales de los servicios externos que quieras probar (S3/Supabase, Brevo, SMTP, Google, Gemini); sin ellas, los módulos que dependen de cada integración no van a funcionar

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

El backend lee su configuración desde variables de entorno. Definilas en tu shell, tu IDE, un archivo `.env` propio o el panel de tu proveedor antes de levantar la aplicación (no subas ese archivo al repositorio):


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
│   └── src/main/
│       ├── java/taller/multimedia/backend/
│       │   ├── config/         # S3, Brevo, Google Translate, async, etc.
│       │   ├── controller/     # endpoints REST por módulo
│       │   ├── dto/            # objetos de petición/respuesta
│       │   ├── exception/      # manejo de errores
│       │   ├── i18n/           # traducción de mensajes del backend
│       │   ├── model/          # entidades JPA
│       │   ├── repository/     # repositorios Spring Data
│       │   ├── scheduler/      # tareas programadas (resumen semestral de evaluaciones)
│       │   ├── security/       # configuración de JWT y seguridad
│       │   ├── service/        # lógica de negocio (incluye el chatbot)
│       │   └── util/, utils/   # utilidades compartidas
│       └── resources/
│           ├── application.properties
│           ├── messages*.properties   # textos del backend en es/en/fr
│           └── templates/email/       # plantillas HTML de los correos
└── frontend/
    └── src/
        ├── assets/             # imágenes (WebP) y recursos estáticos
        ├── components/         # UI, tarjetas, modales, chatbot
        ├── contexts/           # providers de React Context
        ├── hooks/              # hooks reutilizables
        ├── i18n/               # traducciones es/en/fr
        ├── layout/             # layouts del panel y del sitio público
        ├── pages/              # vistas organizadas por módulo
        ├── routes/             # guards de rutas protegidas por rol
        ├── services/           # llamadas a la API (axios)
        ├── styles/             # estilos base globales
        ├── tokens/             # tokens de diseño (colores, espaciados, etc.)
        ├── types/              # tipos compartidos
        └── utils/              # utilidades (notificaciones, validadores, etc.)
```

### Imágenes

Las fotos y el logo del sitio se guardan en WebP comprimido y, cuando se muestran a distintos tamaños, en varias resoluciones (por ejemplo `logo-48.webp`, `logo-96.webp` y `logo-144.webp`). El `srcSet` de cada `<img>` hace que el navegador descargue solo la versión que necesita su pantalla; el tamaño en pantalla lo sigue definiendo el CSS. El favicon (`public/favicon-32.png`) y el icono para iPhone (`public/apple-touch-icon.png`) se quedan en PNG.

### Despliegue

El proyecto se despliega como un único contenedor Docker (actualmente en Railway):

1. Se compila el frontend con Vite.
2. El build (`frontend/dist`) se copia dentro de `backend/src/main/resources/static`, para que Spring Boot lo sirva como contenido estático.
3. Se compila el backend con Maven y se empaqueta todo en un solo `.jar`.

Para construir la imagen localmente (con las variables de entorno en un archivo `.env` propio):
```
docker build -t mygreenfarm .
docker run -p 8080:8080 --env-file .env mygreenfarm
```

## Estado del proyecto

En desarrollo activo. El proyecto ya cuenta con:

- Sitio público completo (noticias, foro, galería, servicios, clubes, vacantes, Nosotros, Green Hearts y reserva de citas)
- Asistente virtual (chatbot) que orienta a las familias y ayuda a reservar citas
- Autenticación, roles y protección de rutas
- Panel administrativo con todos los módulos de gestión del centro y un dashboard por rol
- Integraciones con storage, correo, calendario, traducción, tipo de cambio e IA
- Despliegue como contenedor único (frontend + backend)

Los pagos en línea (ONVO) y la facturación electrónica están deshabilitados por ahora: su código sigue en el repositorio, pero comentado.
