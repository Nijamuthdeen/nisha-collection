FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app

# copy only backend
COPY backend ./backend

WORKDIR /app/backend
RUN mvn clean package -DskipTests

FROM eclipse-temurin:17-jdk-jammy
WORKDIR /app

COPY --from=build /app/backend/target/*.jar app.jar

ENTRYPOINT ["java","-jar","app.jar"]