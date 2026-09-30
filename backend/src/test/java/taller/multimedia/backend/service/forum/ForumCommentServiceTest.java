package taller.multimedia.backend.service.forum;

import java.util.UUID;

import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import taller.multimedia.backend.dto.forum.ForumCommentRequest;
import taller.multimedia.backend.dto.forum.ForumMapper;
import taller.multimedia.backend.exception.InvalidFieldException;
import taller.multimedia.backend.model.forum.ForumArticle;
import taller.multimedia.backend.repository.forum.ForumArticleRepository;
import taller.multimedia.backend.repository.forum.ForumCommentRepository;
import taller.multimedia.backend.repository.user.UserRepository;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ForumCommentServiceTest {

    @Mock
    private ForumCommentRepository commentRepository;

    @Mock
    private ForumArticleRepository articleRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ForumMapper forumMapper;

    @InjectMocks
    private ForumCommentService forumCommentService;

    @ParameterizedTest
    @ValueSource(strings = { "alias", "content" })
    void create_rejectsMaliciousFieldsAndNeverSaves(String field) {
        UUID articleId = UUID.randomUUID();
        when(articleRepository.findById(articleId)).thenReturn(java.util.Optional.of(new ForumArticle()));

        String maliciousValue = "<script>alert(1)</script>x";
        ForumCommentRequest request = new ForumCommentRequest();
        request.setAlias("Ana");
        request.setContent("Muy buen artículo");

        switch (field) {
            case "alias" -> request.setAlias(maliciousValue);
            case "content" -> request.setContent(maliciousValue);
            default -> throw new IllegalStateException("Campo no cubierto: " + field);
        }

        assertThrows(InvalidFieldException.class, () -> forumCommentService.create(articleId, request));

        verify(commentRepository, never()).save(any());
    }
}
