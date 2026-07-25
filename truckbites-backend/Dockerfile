# ---- Build Stage ----
FROM maven:3.9-eclipse-temurin-17 AS build

WORKDIR /app

# Copy pom.xml and download dependencies first (leverages Docker layer caching)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build the application
COPY src ./src
RUN mvn package -DskipTests -B

# ---- Run Stage ----
FROM eclipse-temurin:17-jre-alpine AS runtime

WORKDIR /app

# Create a non-root user for security
RUN addgroup -S truckbites && adduser -S truckbites -G truckbites

# Copy the built jar from the build stage
COPY --from=build /app/target/*.jar app.jar

# Switch to non-root user
USER truckbites

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
