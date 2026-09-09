# ==========================================
# ETAPA 1: Compilar el Frontend (React/Vite)
# ==========================================
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# ==========================================
# ETAPA 2: Compilar el Backend (Spring Boot con Java 22)
# ==========================================
FROM eclipse-temurin:22-jdk-alpine AS backend-build
WORKDIR /app

# Copiamos todo el contenido de la carpeta backend para evitar problemas de rutas relativas
COPY backend/ ./

# Damos permisos al mvnw y descargamos dependencias
RUN chmod +x mvnw
RUN ./mvnw dependency:go-offline

# Copiamos la build de Vite directamente al directorio estático de Spring Boot
COPY --from=frontend-build /app/frontend/dist/ ./src/main/resources/static/

# Compilamos el proyecto
RUN ./mvnw clean package -DskipTests

# ==========================================
# ETAPA 3: Imagen de Ejecución (Java 22 JRE)
# ==========================================
FROM eclipse-temurin:22-jre-alpine
WORKDIR /app

ENV PORT=8080

# Copiamos el JAR resultante tomando como referencia absoluta la carpeta backend/target
COPY --from=backend-build /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]