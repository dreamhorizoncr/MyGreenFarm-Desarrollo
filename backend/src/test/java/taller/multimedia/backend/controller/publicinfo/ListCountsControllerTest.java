package taller.multimedia.backend.controller.publicinfo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;

import taller.multimedia.backend.dto.PublicTeacherResponse;
import taller.multimedia.backend.dto.vacancy.VacancyResponse;
import taller.multimedia.backend.model.gallery.Gallery;
import taller.multimedia.backend.model.service_plans.ServicePlan;
import taller.multimedia.backend.repository.gallery.GalleryRepository;
import taller.multimedia.backend.service.announcement.AnnouncementService;
import taller.multimedia.backend.service.club.ClubService;
import taller.multimedia.backend.service.forum.ForumArticleService;
import taller.multimedia.backend.service.forum.ForumCommunityPostService;
import taller.multimedia.backend.service.service_plan.ServicePlanService;
import taller.multimedia.backend.service.user.UserService;
import taller.multimedia.backend.service.vacancy.VacancyService;

@ExtendWith(MockitoExtension.class)
class ListCountsControllerTest {

    @Mock private AnnouncementService announcementService;
    @Mock private GalleryRepository galleryRepository;
    @Mock private ServicePlanService servicePlanService;
    @Mock private VacancyService vacancyService;
    @Mock private ClubService clubService;
    @Mock private ForumArticleService forumArticleService;
    @Mock private ForumCommunityPostService forumCommunityPostService;
    @Mock private UserService userService;

    @InjectMocks
    private ListCountsController controller;

    @BeforeEach
    void setUp() {
        lenient().when(announcementService.getAll(anyString(), isNull(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(), PageRequest.of(0, 1), 14));
        lenient().when(galleryRepository.findAllByOrderByCreatedAtDesc(any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(gallery(true), gallery(false), gallery(true))));
        lenient().when(servicePlanService.getActivePlans()).thenReturn(List.of(new ServicePlan()));
        lenient().when(vacancyService.getAllVacancies())
                .thenReturn(List.of(vacancy(true), vacancy(false), vacancy(true)));
        lenient().when(clubService.getAll(anyString(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(), PageRequest.of(0, 1), 0));
        lenient().when(forumArticleService.getAll(isNull(), any(Pageable.class), isNull()))
                .thenReturn(new PageImpl<>(List.of(), PageRequest.of(0, 1), 4));
        lenient().when(forumCommunityPostService.getAll(any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(), PageRequest.of(0, 1), 2));
        lenient().when(userService.getAboutUsTeachers()).thenReturn(List.of(teacher(), teacher()));
    }

    @AfterEach
    void tearDown() {
        controller.shutdown();
    }

    @Test
    void returnsWhatEachListShowsOnItsFirstPage() {
        Map<String, Integer> counts = controller.getCounts().getBody();

        assertThat(counts).containsExactlyInAnyOrderEntriesOf(Map.of(
                "news", 10, // 14 in total, but the first page holds 10
                "gallery", 3,
                "home-multimedia", 2,
                "services", 1,
                "vacancies", 2,
                "clubs", 0,
                "forum-blog", 4,
                "forum-community", 2,
                "about-teachers", 2));
    }

    @Test
    void servesRepeatedCallsFromMemoryWithoutQueryingTheDatabaseAgain() {
        for (int i = 0; i < 50; i++) controller.getCounts();

        verify(galleryRepository, times(1)).findAllByOrderByCreatedAtDesc(any(Pageable.class));
        verify(userService, times(1)).getAboutUsTeachers();
    }

    @Test
    void manySimultaneousCallsQueryTheDatabaseOnlyOnce() throws Exception {
        ExecutorService callers = Executors.newFixedThreadPool(20);
        CountDownLatch start = new CountDownLatch(1);
        List<Future<ResponseEntity<Map<String, Integer>>>> responses = new ArrayList<>();
        for (int i = 0; i < 20; i++) {
            responses.add(callers.submit(() -> {
                start.await();
                return controller.getCounts();
            }));
        }
        start.countDown();
        for (Future<ResponseEntity<Map<String, Integer>>> response : responses) {
            assertThat(response.get(10, TimeUnit.SECONDS).getBody()).containsEntry("gallery", 3);
        }
        callers.shutdownNow();

        verify(galleryRepository, times(1)).findAllByOrderByCreatedAtDesc(any(Pageable.class));
    }

    @Test
    void leavesOutAListThatFailsWithoutExposingTheError() {
        when(announcementService.getAll(anyString(), isNull(), any(Pageable.class)))
                .thenThrow(new IllegalStateException("internal database detail"));

        ResponseEntity<Map<String, Integer>> response = controller.getCounts();

        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(response.getBody()).doesNotContainKey("news").containsEntry("gallery", 3);
        assertThat(response.getBody().toString()).doesNotContain("internal database detail");
    }

    private static Gallery gallery(boolean featured) {
        Gallery gallery = new Gallery();
        gallery.setFeatured(featured);
        return gallery;
    }

    private static VacancyResponse vacancy(boolean open) {
        return VacancyResponse.builder().id(UUID.randomUUID()).title("Vacante").open(open).build();
    }

    private static PublicTeacherResponse teacher() {
        return new PublicTeacherResponse(UUID.randomUUID(), "Ana", "Pérez", "TEACHER", null);
    }
}
