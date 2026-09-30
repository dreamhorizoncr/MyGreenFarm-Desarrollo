package taller.multimedia.backend.service.forum;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import taller.multimedia.backend.dto.forum.ForumArticleRequest;
import taller.multimedia.backend.dto.forum.ForumMapper;
import taller.multimedia.backend.exception.InvalidFieldException;
import taller.multimedia.backend.model.user.Role;
import taller.multimedia.backend.model.user.User;
import taller.multimedia.backend.repository.forum.ForumArticleLikeRepository;
import taller.multimedia.backend.repository.forum.ForumArticleRepository;
import taller.multimedia.backend.repository.forum.ForumCommentRepository;
import taller.multimedia.backend.repository.user.UserRepository;
import taller.multimedia.backend.service.StorageService;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ForumArticleServiceTest {

    @Mock
    private ForumArticleRepository articleRepository;

    @Mock
    private ForumArticleLikeRepository likeRepository;

    @Mock
    private ForumCommentRepository commentRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ForumMapper forumMapper;

    @Mock
    private StorageService storageService;

    @InjectMocks
    private ForumArticleService forumArticleService;

    private ForumArticleRequest requestWith(String title, String topic, String content) {
        ForumArticleRequest request = new ForumArticleRequest();
        request.setTitle(title);
        request.setTopic(topic);
        request.setContent(content);
        return request;
    }

    @ParameterizedTest
    @ValueSource(strings = { "title", "topic", "content" })
    void create_rejectsMaliciousFieldsAndNeverSaves(String field) {
        User author = new User("owner@ejemplo.com", "hashed", "Owner", "Test", Role.OWNER, true);
        when(userRepository.findByEmail("owner@ejemplo.com")).thenReturn(Optional.of(author));

        String maliciousValue = "<script>alert(1)</script>x";
        ForumArticleRequest request = requestWith("Título válido", "Crianza", "Contenido válido del artículo");

        switch (field) {
            case "title" -> request.setTitle(maliciousValue);
            case "topic" -> request.setTopic(maliciousValue);
            case "content" -> request.setContent(maliciousValue);
            default -> throw new IllegalStateException("Campo no cubierto: " + field);
        }

        assertThrows(InvalidFieldException.class,
                () -> forumArticleService.create(request, null, "owner@ejemplo.com", "anon-1"));

        verify(articleRepository, never()).save(any());
    }

    @Test
    void create_savesALegitimateArticleWithoutAnImage() {
        User author = new User("owner@ejemplo.com", "hashed", "Owner", "Test", Role.OWNER, true);
        when(userRepository.findByEmail("owner@ejemplo.com")).thenReturn(Optional.of(author));
        when(articleRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        ForumArticleRequest request = requestWith("Título válido", "Crianza", "Contenido válido del artículo");

        forumArticleService.create(request, null, "owner@ejemplo.com", "anon-1");

        verify(articleRepository).save(any());
    }
}
