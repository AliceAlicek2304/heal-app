# Simple Dockerfile for Spring Boot backend
FROM eclipse-temurin:24-jdk-alpine

WORKDIR /app

# Install Maven
RUN apk add --no-cache maven curl

# Copy backend source
COPY backend/ .

# Build the application
RUN mvn clean package -DskipTests

# Create upload directories
RUN mkdir -p /app/uploads/avatar && \
    mkdir -p /app/uploads/blog && \
    mkdir -p /app/uploads/config && \
    chmod -R 755 /app/uploads

# Create non-root user
RUN addgroup -g 1001 -S healapp && \
    adduser -S -D -H -u 1001 -h /app -s /sbin/nologin -G healapp healapp && \
    chown -R healapp:healapp /app

USER healapp

# Expose port
EXPOSE 10000

# Run application on dynamic port provided by Render via $PORT
ENTRYPOINT ["sh", "-c", "java -Dspring.profiles.active=prod -Dserver.port=$PORT -jar /app/target/HealApp-0.0.1-SNAPSHOT.jar"]
