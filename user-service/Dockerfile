# ============================================================================
# Multi-stage Dockerfile — user-service
# Stage 1: Build truckbites-common (shared module) + the service
# Stage 2: Minimal JRE runtime
# Build context MUST be the repo root (docker compose sets context: .)
# ============================================================================

# Stage 1: Build
FROM maven:3.9-eclipse-temurin-25-alpine AS build
WORKDIR /build

# Build & install the shared truckbites-common module into the local Maven repo
COPY truckbites-common/pom.xml ./truckbites-common/pom.xml
COPY truckbites-common/src ./truckbites-common/src
RUN mvn -f truckbites-common/pom.xml install -DskipTests -B

# Build the service itself
COPY user-service/pom.xml ./user-service/pom.xml
RUN mvn -f user-service/pom.xml dependency:go-offline -B
COPY user-service/src ./user-service/src
RUN mvn -f user-service/pom.xml clean package -DskipTests -B

# Stage 2: Run with JRE
FROM eclipse-temurin:25-jre-alpine AS runtime
WORKDIR /app
COPY --from=build /build/user-service/target/*.jar app.jar
EXPOSE 8082
ENTRYPOINT ["java", "-jar", "app.jar"]
