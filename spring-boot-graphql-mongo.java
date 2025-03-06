// The complete project structure will be:
// - pom.xml (dependencies)
// - application.properties (configuration)
// - User.java (model)
// - UserRepository.java (repository interface)
// - GraphQLProvider.java (for schema setup)
// - UserService.java (business logic)
// - UserResolver.java (GraphQL resolver)
// - schema.graphqls (GraphQL schema)

// pom.xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>2.7.8</version>
        <relativePath/>
    </parent>
    <groupId>com.example</groupId>
    <artifactId>graphql-mongo</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>graphql-mongo</name>
    <description>Spring Boot MongoDB GraphQL API</description>

    <properties>
        <java.version>11</java.version>
        <graphql.version>11.0.0</graphql.version>
    </properties>

    <dependencies>
        <!-- Spring Boot Starters -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-mongodb</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>

        <!-- GraphQL Dependencies -->
        <dependency>
            <groupId>com.graphql-java</groupId>
            <artifactId>graphql-spring-boot-starter</artifactId>
            <version>5.0.2</version>
        </dependency>
        <dependency>
            <groupId>com.graphql-java</groupId>
            <artifactId>graphql-java-tools</artifactId>
            <version>5.2.4</version>
        </dependency>
        <dependency>
            <groupId>com.graphql-java</groupId>
            <artifactId>graphiql-spring-boot-starter</artifactId>
            <version>5.0.2</version>
        </dependency>

        <!-- Lombok for reducing boilerplate code -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>

        <!-- Testing -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>

// src/main/resources/application.properties
spring.data.mongodb.uri=${MONGODB_URI:mongodb://localhost:27017/graphql-mongo}
spring.data.mongodb.database=graphql-mongo

graphql.servlet.mapping=/graphql
graphql.servlet.enabled=true
graphql.servlet.corsEnabled=true
graphiql.enabled=true
graphiql.mapping=/graphiql

// src/main/resources/schema.graphqls
type User {
    id: ID!
    name: String!
    age: Int
}

type Query {
    users: [User]
    user(id: ID!): User
}

type Mutation {
    createUser(name: String!, age: Int): User
    updateUser(id: ID!, name: String, age: Int): User
    deleteUser(id: ID!): Boolean
}

// src/main/java/com/example/graphqlmongo/model/User.java
package com.example.graphqlmongo.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "users")
public class User {
    @Id
    private String id;
    private String name;
    private Integer age;
}

// src/main/java/com/example/graphqlmongo/repository/UserRepository.java
package com.example.graphqlmongo.repository;

import com.example.graphqlmongo.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends MongoRepository<User, String> {
    // Custom queries can be added here if needed
}

// src/main/java/com/example/graphqlmongo/service/UserService.java
package com.example.graphqlmongo.service;

import com.example.graphqlmongo.model.User;
import com.example.graphqlmongo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public Optional<User> getUserById(String id) {
        return userRepository.findById(id);
    }

    public User createUser(String name, Integer age) {
        User newUser = new User();
        newUser.setName(name);
        newUser.setAge(age);
        return userRepository.save(newUser);
    }

    public Optional<User> updateUser(String id, String name, Integer age) {
        return userRepository.findById(id)
                .map(user -> {
                    if (name != null) {
                        user.setName(name);
                    }
                    if (age != null) {
                        user.setAge(age);
                    }
                    return userRepository.save(user);
                });
    }

    public boolean deleteUser(String id) {
        if (userRepository.existsById(id)) {
            userRepository.deleteById(id);
            return true;
        }
        return false;
    }
}

// src/main/java/com/example/graphqlmongo/resolver/UserResolver.java
package com.example.graphqlmongo.resolver;

import com.example.graphqlmongo.model.User;
import com.example.graphqlmongo.service.UserService;
import graphql.kickstart.tools.GraphQLMutationResolver;
import graphql.kickstart.tools.GraphQLQueryResolver;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class UserResolver implements GraphQLQueryResolver, GraphQLMutationResolver {
    private final UserService userService;

    // Query resolvers
    public List<User> users() {
        return userService.getAllUsers();
    }

    public Optional<User> user(String id) {
        return userService.getUserById(id);
    }

    // Mutation resolvers
    public User createUser(String name, Integer age) {
        return userService.createUser(name, age);
    }

    public Optional<User> updateUser(String id, String name, Integer age) {
        return userService.updateUser(id, name, age);
    }

    public boolean deleteUser(String id) {
        return userService.deleteUser(id);
    }
}

// src/main/java/com/example/graphqlmongo/GraphqlMongoApplication.java
package com.example.graphqlmongo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class GraphqlMongoApplication {
    public static void main(String[] args) {
        SpringApplication.run(GraphqlMongoApplication.class, args);
    }
}

// OPTIONAL - Example for database seeding if needed
// src/main/java/com/example/graphqlmongo/config/DatabaseSeeder.java
package com.example.graphqlmongo.config;

import com.example.graphqlmongo.model.User;
import com.example.graphqlmongo.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DatabaseSeeder {
    @Bean
    CommandLineRunner initDatabase(UserRepository userRepository) {
        return args -> {
            // Only seed if database is empty
            if (userRepository.count() == 0) {
                userRepository.save(new User(null, "John Doe", 28));
                userRepository.save(new User(null, "Jane Smith", 32));
                userRepository.save(new User(null, "Mike Johnson", 45));
                System.out.println("Database seeded with sample users");
            }
        };
    }
}
