package taller.multimedia.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    // Este método es porque por la dependencia de Spring Security me muestra un login obligatorio
    // Entonces esto lo quita
    @Bean // Lo que sea de seguridad se usa con el endpoint Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception { 
        http
            .authorizeHttpRequests(auth -> auth.anyRequest().permitAll()) 
            .csrf(csrf -> csrf.disable()) // desactiva CSRF para pruebas
            .formLogin(form -> form.disable()); // quita el formulario por defecto
        return http.build();
    }
}