package taller.multimedia.backend.service;

import java.util.List;
import java.util.regex.Pattern;

import org.springframework.stereotype.Component;

/**
 * Detects when a chat question is asking where a section or piece of public
 * information is located. The result is returned as a structured action so the
 * frontend can navigate without exposing internal routes to the model.
 */
@Component
public class ChatNavigationResolver {

    public enum Target {
        NEWS("news", "chat.navigate.news", "NAVIGATE"),
        GALLERY("gallery", "chat.navigate.gallery", "NAVIGATE"),
        FORUM("forum", "chat.navigate.forum", "NAVIGATE"),
        SERVICES("services", "chat.navigate.services", "NAVIGATE"),
        CLUBS("clubs", "chat.navigate.clubs", "NAVIGATE"),
        VACANCIES("vacancies", "chat.navigate.vacancies", "NAVIGATE"),
        ABOUT("about", "chat.navigate.about", "NAVIGATE"),
        GREEN_HEARTS("green-hearts", "chat.navigate.green-hearts", "NAVIGATE"),
        SOCIAL("social", "chat.navigate.social", "SCROLL_FOOTER"),
        CONTACT("contact", "chat.navigate.contact", "SCROLL_FOOTER"),
        TERMS("terms", "chat.navigate.terms", "OPEN_TERMS"),
        FOOTER("footer", "chat.navigate.footer", "SCROLL_FOOTER");

        private final String key;
        private final String messageKey;
        private final String action;

        Target(String key, String messageKey, String action) {
            this.key = key;
            this.messageKey = messageKey;
            this.action = action;
        }

        public String getKey() {
            return key;
        }

        public String getMessageKey() {
            return messageKey;
        }

        public String getAction() {
            return action;
        }
    }

    private record Rule(Target target, int weight, Pattern pattern) {
    }

    private static final List<Rule> RULES = List.of(
            new Rule(Target.TERMS, 12, Pattern.compile(
                    "\\b(?:terminos?|privacidad|politica de privacidad|aviso legal|aviso de privacidad"
                            + "|condiciones|legal|terms?|privacy|conditions|confidentialite|mentions legales)\\b")),
            new Rule(Target.GREEN_HEARTS, 12, Pattern.compile(
                    "\\b(?:green\\s*hearts?|accion social|programa social|voluntariado|volunteer(?:ing)?"
                            + "|social action|action sociale|volontariat)\\b")),
            new Rule(Target.FOOTER, 12, Pattern.compile(
                    "\\b(?:pie de pagina|footer|page footer|pied de page)\\b")),
            new Rule(Target.ABOUT, 10, Pattern.compile(
                    "\\b(?:sobre nosotros|nosotros|quienes son|quienes somos|duenos?|duenas?|propietarios?"
                            + "|propietarias?|fundadores?|historia|origen|fundacion|empresa|about us|about"
                            + "|owners?|founders?|history|origin|company|a propos|proprietaires?|fondateurs?"
                            + "|histoire|origine)\\b")),
            new Rule(Target.VACANCIES, 10, Pattern.compile(
                    "\\b(?:vacantes?|empleos?|trabajos?|puestos?|postulacion(?:es)?|curriculums?"
                            + "|vacanc(?:y|ies)|jobs?|careers?|hiring|emplois?|recrutement|postes?"
                            + "|candidatures?)\\b")),
            new Rule(Target.CLUBS, 10, Pattern.compile(
                    "\\b(?:clubes?|clubs?|extracurricular(?:es)?|actividades? extras?)\\b")),
            new Rule(Target.GALLERY, 10, Pattern.compile(
                    "\\b(?:galerias?|fotos?|fotografias?|imagen(?:es)?|album(?:es)?|gallery|galleries"
                            + "|photos?|pictures?|images?|albums?|galerie|photographies?)\\b")),
            new Rule(Target.FORUM, 10, Pattern.compile(
                    "\\b(?:foros?|forums?|opinion(?:es)?|opinar|comentarios?|publicacion(?:es)?"
                            + "|investigacion(?:es)?|documentos? informativos?|research|posts?|comments?"
                            + "|avis|temoignages?|publications?|recherches?)\\b")),
            new Rule(Target.NEWS, 10, Pattern.compile(
                    "\\b(?:noticias?|avisos?|anuncios?|comunicados?|novedades?|boletin(?:es)?|news"
                            + "|announcements?|updates?|actualites?|annonces?|communiques?|nouvelles?"
                            + "|evenements?|eventos?|events?)\\b")),
            new Rule(Target.SERVICES, 10, Pattern.compile(
                    "\\b(?:servicios?|services?|precios?|tarifas?|costos?|costes?|cuanto cuesta(?:n)?"
                            + "|planes? de servicio|prices?|pricing|fees?|rates?|prix|tarifs?|couts?)\\b")),
            new Rule(Target.SOCIAL, 10, Pattern.compile(
                    "\\b(?:redes sociales|redes|instagram|facebook|youtube|whatsapp|tiktok|social media"
                            + "|social networks|socials?|reseaux sociaux|reseaux)\\b")),
            new Rule(Target.CONTACT, 9, Pattern.compile(
                    "\\b(?:contacto|contact|telefonos?|correos?|emails?|e-mail|direccion(?:es)?"
                            + "|ubicacion(?:es)?|mapa|phone|address|location|map|coordonnees|telephones?"
                            + "|adresses?|emplacement|carte)\\b")),
            new Rule(Target.NEWS, 6, Pattern.compile("\\b(?:transporte|transport)\\b")));

    /**
     * Returns the most specific navigation target for the message, or
     * {@code null} when the message does not ask for a section.
     */
    public Target resolve(String message) {
        if (message == null || message.isBlank()) return null;
        String normalized = ChatService.normalize(message);
        Target best = null;
        int bestWeight = 0;
        for (Rule rule : RULES) {
            if (rule.weight() <= bestWeight) continue;
            if (rule.pattern().matcher(normalized).find()) {
                best = rule.target();
                bestWeight = rule.weight();
            }
        }
        return best;
    }
}