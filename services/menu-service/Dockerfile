# ============================================================================
# Multi-stage Dockerfile — menu-service
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
COPY services/menu-service/pom.xml ./services/menu-service/pom.xml
RUN mvn -f services/menu-service/pom.xml dependency:go-offline -B
COPY services/menu-service/src ./services/menu-service/src
RUN mvn -f services/menu-service/pom.xml clean package -DskipTests -B

# Stage 2: Run with JRE
FROM eclipse-temurin:25-jre-alpine AS runtime
WORKDIR /app
COPY --from=build /build/services/menu-service/target/*.jar app.jar
EXPOSE 8084
ENTRYPOINT ["java", "-jar", "app.jar"]
