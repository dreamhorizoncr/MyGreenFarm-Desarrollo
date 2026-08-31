package taller.multimedia.backend.repository;

import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

import taller.multimedia.backend.model.User;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email); // Method to find a user by email
    
    Boolean existsByEmail(String email); // Method to check if a user with the given email already exists

    Optional<User> findByResetPasswordToken(String token);

    void deleteById(UUID id); // Method to delete a user by ID
}
