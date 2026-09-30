package taller.multimedia.backend.service.forum;

import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import taller.multimedia.backend.dto.forum.ForumCommunityPostRequest;
import taller.multimedia.backend.exception.InvalidFieldException;
import taller.multimedia.backend.repository.forum.ForumCommunityPostRepository;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class ForumCommunityPostServiceTest {

    @Mock
    private ForumCommunityPostRepository communityPostRepository;

    @InjectMocks
    private ForumCommunityPostService forumCommunityPostService;

    @ParameterizedTest
    @ValueSource(strings = { "name", "content" })
    void create_rejectsMaliciousFieldsAndNeverSaves(String field) {
        String maliciousValue = "<script>alert(1)</script>x";
        ForumCommunityPostRequest request = new ForumCommunityPostRequest();
        request.setName("Ana");
        request.setContent("Compartiendo una experiencia");

        switch (field) {
            case "name" -> request.setName(maliciousValue);
            case "content" -> request.setContent(maliciousValue);
            default -> throw new IllegalStateException("Campo no cubierto: " + field);
        }

        assertThrows(InvalidFieldException.class, () -> forumCommunityPostService.create(request));

        verify(communityPostRepository, never()).save(any());
    }
}
