package taller.multimedia.backend.config;

import java.util.List;
import java.util.Locale;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.LocaleResolver;
import org.springframework.web.servlet.i18n.AcceptHeaderLocaleResolver;

/**
 * Picks the language of API messages from the {@code Accept-Language} header.
 */
@Configuration
public class LocaleConfig {

    /**
     * @return a resolver that supports Spanish, English and French, with Spanish as the default
     */
    @Bean
    public LocaleResolver localeResolver() {
        AcceptHeaderLocaleResolver resolver = new AcceptHeaderLocaleResolver();
        resolver.setDefaultLocale(Locale.forLanguageTag("es"));
        resolver.setSupportedLocales(List.of(Locale.forLanguageTag("es"), Locale.forLanguageTag("en"), Locale.forLanguageTag("fr")));
        return resolver;
    }
}
