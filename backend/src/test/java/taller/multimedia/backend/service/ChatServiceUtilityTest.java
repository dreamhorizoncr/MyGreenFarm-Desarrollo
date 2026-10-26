package taller.multimedia.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.Test;

class ChatServiceUtilityTest {
    @Test void normalizesAccentsAndFindsSpecificOffTopicPhrases() {
        assertTrue(ChatService.isOffTopic("¿Hablemos de fútbol?"));
        assertTrue(ChatService.isOffTopic("Política electoral"));
        assertFalse(ChatService.isOffTopic("política de privacidad"));
        assertFalse(ChatService.isOffTopic("mi religión"));
    }
    @Test void keepsOnlyCanonicalUuidConversationIds() {
        String valid = "9e0eaa3c-3396-45d7-a884-7e890c9dd8bf";
        assertEquals(valid, ChatService.validConversationId(valid));
        assertNotEquals("1-1-1-1-1", ChatService.validConversationId("1-1-1-1-1"));
        assertDoesNotThrow(() -> java.util.UUID.fromString(ChatService.validConversationId("invalid")));
    }
}
