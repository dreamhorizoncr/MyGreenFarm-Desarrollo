# ==========================================
# ETAPA 1: Compilar el Frontend (React)
# ==========================================
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend

# Copiar dependencias del frontend
COPY frontend/package*.json ./
RUN npm ci

# Copiar el código fuente y construir los archivos estáticos
COPY frontend/ ./
RUN npm run build

# ==========================================
# ETAPA 2: Compilar el Backend (Spring Boot)
# ==========================================
FROM eclipse-temurin:21-jdk-alpine AS backend-build
WORKDIR /app

# Copiar archivos de Maven desde la carpeta backend/
COPY backend/mvnw .
COPY backend/.mvn .mvn
COPY backend/pom.xml .

# Dar permisos al wrapper
RUN chmod +x mvnw

# Descargar dependencias para aprovechar la caché de Docker
RUN ./mvnw dependency:go-offline

# Copiar el código fuente del backend
COPY backend/src src

# COPIAR los estáticos de React dentro del directorio estático de Spring Boot
# NOTA: Si usas Create React App en lugar de Vite, cambia 'dist' por 'build'
COPY --from=frontend-build /app/frontend/dist src/main/resources/static/

# Compilar el JAR final con los archivos de React ya incluidos
RUN ./mvnw clean package -DskipTests

# ==========================================
# ETAPA 3: Imagen de Ejecución
# ==========================================
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copiar el JAR generado desde la etapa de construcción del backend
COPY --from=backend-build /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]