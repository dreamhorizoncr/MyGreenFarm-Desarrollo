# ==========================================
# ETAPA 1: Compilar el Frontend (React)
# ==========================================
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend

# Copiar dependencias e instalar
COPY frontend/package*.json ./
RUN npm ci

# Copiar código fuente y construir estáticos
COPY frontend/ ./
RUN npm run build

# ==========================================
# ETAPA 2: Compilar el Backend (Spring Boot)
# ==========================================
FROM eclipse-temurin:21-jdk-alpine AS backend-build
WORKDIR /app

# Copiar wrapper y pom.xml para aprovechar la caché de Docker
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .
RUN ./mvnw dependency:go-offline

# Copiar el código fuente del backend
COPY src src

# COPIAR los archivos estáticos de React al directorio de recursos de Spring Boot
COPY --from=frontend-build /app/frontend/dist src/main/resources/static/

# Dar permisos y empaquetar el JAR
RUN chmod +x mvnw
RUN ./mvnw clean package -DskipTests

# ==========================================
# ETAPA 3: Imagen de Ejecución (Ligera)
# ==========================================
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copiar el JAR desde la etapa de construcción
COPY --from=backend-build /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]