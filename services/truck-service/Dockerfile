# ============================================================================
# Multi-stage Dockerfile — truck-service
# Stage 1: Build truckbites-common (shared module) + the service
# Stage 2: Minimal JRE runtime
# Build context MUST be the repo root (docker compose sets context: .)
# ============================================================================

# Stage 1: Build
FROM maven:3.9-eclipse-temurin-25-alpine AS build
WORKDIR /build

# Build & install the shared truckbites-common module into the local Maven repo
COPY shared/truckbites-common/pom.xml ./shared/truckbites-common/pom.xml
COPY shared/truckbites-common/src ./shared/truckbites-common/src
RUN mvn -f shared/truckbites-common/pom.xml install -DskipTests -B

# Build the service itself
COPY services/truck-service/pom.xml ./services/truck-service/pom.xml
RUN mvn -f services/truck-service/pom.xml dependency:go-offline -B
COPY services/truck-service/src ./services/truck-service/src
RUN mvn -f services/truck-service/pom.xml clean package -DskipTests -B

# Stage 2: Run with JRE
FROM eclipse-temurin:25-jre-alpine AS runtime
WORKDIR /app
COPY --from=build /build/services/truck-service/target/*.jar app.jar
EXPOSE 8083
ENTRYPOINT ["java", "-jar", "app.jar"]
