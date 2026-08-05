# ============================================================================
# Multi-stage Dockerfile — config-server (no truckbites-common dep)
# Build context is the repo root: context: .  dockerfile: services/config-server/Dockerfile
# ============================================================================

# Stage 1: Build with Maven
FROM maven:3.9-eclipse-temurin-25-alpine AS build
WORKDIR /app
COPY services/config-server/pom.xml ./pom.xml
RUN mvn dependency:go-offline -B
COPY services/config-server/src ./src
RUN mvn clean package -DskipTests -B

# Stage 2: Run with JRE + bundled config-repo
FROM eclipse-temurin:25-jre-alpine AS runtime
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
RUN mkdir -p /app/config-repo
COPY config-repo ./config-repo
EXPOSE 8888
ENTRYPOINT ["java", "-jar", "app.jar"]
