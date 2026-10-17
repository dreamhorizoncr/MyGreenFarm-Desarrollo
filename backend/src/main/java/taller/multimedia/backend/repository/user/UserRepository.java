package taller.multimedia.backend.repository.user;

import org.springframework.stereotype.Repository;

import taller.multimedia.backend.model.user.Role;
import taller.multimedia.backend.model.user.User;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);

    Boolean existsByEmail(String email);

    Optional<User> findByResetPasswordToken(String token);

    void deleteById(UUID id);

    @Query("""
                SELECT u FROM User u
                WHERE u.role = taller.multimedia.backend.model.user.Role.TEACHER
                  AND u.birthday IS NOT NULL
                  AND EXTRACT(MONTH FROM u.birthday) = :month
                  AND EXTRACT(DAY FROM u.birthday) = :day
            """)
    List<User> findTeachersWithBirthdayOn(@Param("month") int month, @Param("day") int day);

    List<User> findByRole(Role role);
}
