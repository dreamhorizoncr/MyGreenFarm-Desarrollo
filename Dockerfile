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
# ETAPA 2: Compilar el Backend (Spring Boot)
# ==========================================
FROM eclipse-temurin:21-jdk-alpine AS backend-build
WORKDIR /app

COPY backend/mvnw ./
COPY backend/.mvn .mvn
COPY backend/pom.xml ./

RUN chmod +x mvnw
RUN ./mvnw dependency:go-offline

COPY backend/src ./src

# Copia la build de Vite a src/main/resources/static
# para que Spring sirva la SPA cuando el usuario accede a la raíz
COPY --from=frontend-build /app/frontend/dist/ ./src/main/resources/static/

RUN ./mvnw clean package -DskipTests

# ==========================================
# ETAPA 3: Imagen de Ejecución
# ==========================================
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

ENV PORT=8080

COPY --from=backend-build /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]