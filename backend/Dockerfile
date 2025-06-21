FROM eclipse-temurin:24-jre
WORKDIR /app
COPY target/HealApp-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar", "--spring.profiles.active=cloud"]