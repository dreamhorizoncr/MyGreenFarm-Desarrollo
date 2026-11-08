package taller.multimedia.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import org.junit.jupiter.api.Test;

import taller.multimedia.backend.service.ChatNavigationResolver.Target;

class ChatNavigationResolverTest {

    private final ChatNavigationResolver resolver = new ChatNavigationResolver();

    @Test void resolvesTheSectionsRequestedInSpanish() {
        assertEquals(Target.NEWS, resolver.resolve("¿Dónde encuentro la sección de noticias?"));
        assertEquals(Target.NEWS, resolver.resolve("¿Dónde puedo encontrar información de avisos de transporte?"));
        assertEquals(Target.GALLERY, resolver.resolve("¿Dónde puedo encontrar fotografías e imágenes?"));
        assertEquals(Target.FORUM, resolver.resolve("¿Dónde puedo dejar mi opinión o leer documentos informativos?"));
        assertEquals(Target.SERVICES, resolver.resolve("Quiero consultar los precios de los servicios"));
        assertEquals(Target.CLUBS, resolver.resolve("Quiero saber sobre los clubes"));
        assertEquals(Target.VACANCIES, resolver.resolve("¿Dónde veo las vacantes disponibles?"));
        assertEquals(Target.ABOUT, resolver.resolve("Quiero conocer a los dueños y el origen de la empresa"));
        assertEquals(Target.GREEN_HEARTS, resolver.resolve("¿Dónde está el programa de acción social?"));
        assertEquals(Target.SOCIAL, resolver.resolve("¿Dónde están las redes sociales?"));
        assertEquals(Target.TERMS, resolver.resolve("Quiero leer los términos y la privacidad"));
        assertEquals(Target.CONTACT, resolver.resolve("Quiero información de contacto"));
    }

    @Test void resolvesTheSectionsInEnglish() {
        assertEquals(Target.NEWS, resolver.resolve("Where can I find the news?"));
        assertEquals(Target.GALLERY, resolver.resolve("Where are the photos and albums?"));
        assertEquals(Target.FORUM, resolver.resolve("Where can I share my opinion?"));
        assertEquals(Target.SERVICES, resolver.resolve("How much do the services cost?"));
        assertEquals(Target.CLUBS, resolver.resolve("Where can I find the clubs?"));
        assertEquals(Target.VACANCIES, resolver.resolve("Where are the job vacancies?"));
        assertEquals(Target.ABOUT, resolver.resolve("Where can I learn about the owners and history?"));
        assertEquals(Target.GREEN_HEARTS, resolver.resolve("Where is the social action program?"));
        assertEquals(Target.SOCIAL, resolver.resolve("Where are your social media links?"));
        assertEquals(Target.TERMS, resolver.resolve("Where can I read the terms and privacy?"));
        assertEquals(Target.CONTACT, resolver.resolve("Where can I find contact information?"));
    }

    @Test void resolvesTheSectionsInFrench() {
        assertEquals(Target.NEWS, resolver.resolve("Où sont les actualités ?"));
        assertEquals(Target.GALLERY, resolver.resolve("Où sont les photos et les albums ?"));
        assertEquals(Target.FORUM, resolver.resolve("Où puis-je donner mon avis ?"));
        assertEquals(Target.SERVICES, resolver.resolve("Quels sont les tarifs des services ?"));
        assertEquals(Target.CLUBS, resolver.resolve("Où sont les clubs ?"));
        assertEquals(Target.VACANCIES, resolver.resolve("Où sont les postes vacants ?"));
        assertEquals(Target.ABOUT, resolver.resolve("Où puis-je en savoir plus sur les propriétaires et l'histoire ?"));
        assertEquals(Target.GREEN_HEARTS, resolver.resolve("Où est le programme d'action sociale ?"));
        assertEquals(Target.SOCIAL, resolver.resolve("Où sont vos réseaux sociaux ?"));
        assertEquals(Target.TERMS, resolver.resolve("Où puis-je lire les conditions et la confidentialité ?"));
        assertEquals(Target.CONTACT, resolver.resolve("Où sont les coordonnées ?"));
    }

    @Test void returnsNullForQuestionsThatAreNotAboutFindingASection() {
        assertNull(resolver.resolve("¿Cómo agendo una cita?"));
        assertNull(resolver.resolve("Hola, ¿cómo estás?"));
        assertNull(resolver.resolve("Mi religión"));
        assertNull(resolver.resolve("¿Qué es el MEP?"));
        assertNull(resolver.resolve(""));
        assertNull(resolver.resolve(null));
    }
}