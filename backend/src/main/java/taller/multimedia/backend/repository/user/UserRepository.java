package taller.multimedia.backend.repository.user;

import java.util.Collection;
import taller.multimedia.backend.model.user.Role;
import taller.multimedia.backend.model.user.User;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Storage of staff users.
 */
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    Optional<User> findByResetPasswordToken(String token);

    /**
     * @param month month of the birthday, 1 to 12
     * @param day day of the month
     * @return teachers whose birthday falls on that day, any year
     */
    @Query("""
                SELECT u FROM User u
                WHERE u.role = taller.multimedia.backend.model.user.Role.TEACHER
                  AND u.birthday IS NOT NULL
                  AND EXTRACT(MONTH FROM u.birthday) = :month
                  AND EXTRACT(DAY FROM u.birthday) = :day
            """)
    List<User> findTeachersWithBirthdayOn(@Param("month") int month, @Param("day") int day);

    List<User> findByRole(Role role);

    Page<User> findByRole(Role role, Pageable pageable);

    /**
     * @param roles roles to include
     * @param pattern search pattern from {@link taller.multimedia.backend.util.SearchPattern}
     * @param rolesByName roles whose code contains the text, so typing "teacher" finds teachers
     * @param pageable page to return
     * @return users with one of the roles whose name or email contain the text, or whose role matches
     */
    @Query("""
            SELECT u FROM User u WHERE u.role IN :roles AND (
                LOWER(CONCAT(u.firstName, ' ', u.lastName)) LIKE :pattern ESCAPE '\\'
                OR LOWER(u.email) LIKE :pattern ESCAPE '\\'
                OR u.role IN :rolesByName)""")
    Page<User> search(@Param("roles") Collection<Role> roles, @Param("pattern") String pattern,
            @Param("rolesByName") Collection<Role> rolesByName, Pageable pageable);
}
