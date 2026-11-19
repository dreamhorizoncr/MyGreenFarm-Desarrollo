package taller.multimedia.backend.security.service;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.fasterxml.jackson.annotation.JsonIgnore;

import taller.multimedia.backend.model.user.User;


/**
 * Authenticated staff user as Spring Security sees it: email as username, the hashed password
 * (never serialized) and a single {@code ROLE_*} authority. Two instances are equal when they
 * belong to the same user ID.
 */
public class UserDetailsImpl implements UserDetails {

    private static final long serialVersionUID = 1L;

    private UUID id;
    private String email;

    @JsonIgnore
    private String password;

    private String firstName;
    private String lastName;
    private String role;
    private boolean isActive;
    private String photoUrl;

    private Collection<? extends GrantedAuthority> authorities;
    private LocalDate birthday;

    /**
     * @param id user ID
     * @param email email, used as username
     * @param password hashed password
     * @param firstName first name
     * @param lastName last name
     * @param role role name, for example {@code TEACHER}
     * @param isActive whether the user may sign in
     * @param photoUrl profile photo, may be {@code null}
     * @param birthday birthday, may be {@code null}
     * @param authorities granted authorities
     */
    public UserDetailsImpl(UUID id, String email, String password, String firstName, String lastName,
            String role, boolean isActive, String photoUrl, LocalDate birthday,
            Collection<? extends GrantedAuthority> authorities) {
        this.id = id;
        this.email = email;
        this.password = password;
        this.firstName = firstName;
        this.lastName = lastName;
        this.role = role;
        this.isActive = isActive;
        this.photoUrl = photoUrl;
        this.birthday = birthday;
        this.authorities = authorities;
    }

    /**
     * @param user stored user
     * @return the security details of the user, with the authority {@code ROLE_<role>}
     */
    public static UserDetailsImpl build(User user) {
        List<GrantedAuthority> authorities = List.of(
                new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));

        return new UserDetailsImpl(
                user.getId(),
                user.getEmail(),
                user.getPassword(),
                user.getFirstName(),
                user.getLastName(),
                user.getRole().name(),
                user.getIsActive(),
                user.getPhotoUrl(),
                user.getBirthday(),
                authorities);
    }

    public UUID getId() {
        return id;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public String getPassword() {
        return password;
    }

    
    public String getFirstName() {
        return firstName;
    }

    
    public String getLastName() {
        return lastName;
    }

    
    public String getRole() {
        return role;
    }

    /**
     * @return whether the user may sign in
     */
    public boolean isActive() {
        return isActive;
    }

    public String getPhotoUrl() {
        return photoUrl;
    }

    public LocalDate getBirthday() {
        return birthday;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return isActive;
    }

    @Override
    public boolean equals(Object other) {
        if (this == other)
            return true;
        if (other == null || getClass() != other.getClass())
            return false;
        UserDetailsImpl user = (UserDetailsImpl) other;
        return Objects.equals(id, user.id);
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(id);
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

}