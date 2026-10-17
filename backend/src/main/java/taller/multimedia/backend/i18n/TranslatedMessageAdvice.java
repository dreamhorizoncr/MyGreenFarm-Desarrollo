package taller.multimedia.backend.i18n;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyAdvice;

import lombok.RequiredArgsConstructor;
import taller.multimedia.backend.dto.MessageResponse;

@RestControllerAdvice
@RequiredArgsConstructor
public class TranslatedMessageAdvice implements ResponseBodyAdvice<Object> {

    private final BackendMessageTranslator translator;

    @Override
    public boolean supports(MethodParameter returnType, Class<? extends HttpMessageConverter<?>> converterType) {
        return true;
    }

    @Override
    public Object beforeBodyWrite(Object body, MethodParameter returnType, MediaType selectedContentType,
            Class<? extends HttpMessageConverter<?>> selectedConverterType, ServerHttpRequest request,
            ServerHttpResponse response) {
        Locale locale = LocaleContextHolder.getLocale();
        if (body instanceof MessageResponse messageResponse) {
            messageResponse.setMessage(translator.translate(messageResponse.getMessage(), locale));
            return body;
        }
        if (body instanceof String text) {
            return translator.translate(text, locale);
        }
        if (body instanceof Map<?, ?> map && (map.get("message") instanceof String || map.get("error") instanceof String)) {
            Map<Object, Object> translated = new LinkedHashMap<>(map);
            for (String key : List.of("message", "error")) {
                if (translated.get(key) instanceof String value) translated.put(key, translator.translate(value, locale));
            }
            return translated;
        }
        return body;
    }
}
