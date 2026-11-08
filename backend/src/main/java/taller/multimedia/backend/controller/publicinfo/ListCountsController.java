package taller.multimedia.backend.controller.publicinfo;

import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import taller.multimedia.backend.model.gallery.Gallery;
import taller.multimedia.backend.repository.gallery.GalleryRepository;
import taller.multimedia.backend.service.announcement.AnnouncementService;
import taller.multimedia.backend.service.club.ClubService;
import taller.multimedia.backend.service.forum.ForumArticleService;
import taller.multimedia.backend.service.forum.ForumCommunityPostService;
import taller.multimedia.backend.service.service_plan.ServicePlanService;
import taller.multimedia.backend.service.user.UserService;
import taller.multimedia.backend.service.vacancy.VacancyService;

import java.time.Duration;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.locks.ReentrantLock;
import java.util.function.Supplier;

/**
 * Item count of each public list's first page, so the frontend can render the exact number of
 * skeletons on the first visit. Keys match the ones used by useSkeletonCount.
 *
 * Public route: it only returns totals of already public lists and takes no parameters. Results
 * are cached for {@link #CACHE_TTL}, recalculated by one caller at a time, with at most
 * {@link #MAX_PARALLEL_QUERIES} database connections and a {@link #TIMEOUT} deadline. Errors are
 * only logged.
 */
@Slf4j
@RestController
@RequestMapping("/api/public/list-counts")
@RequiredArgsConstructor
public class ListCountsController {

    private static final int FIRST_PAGE = 10;
    private static final String SOURCE_LANG = "es";
    private static final Duration TIMEOUT = Duration.ofSeconds(4);
    private static final Duration CACHE_TTL = Duration.ofSeconds(30);

    private final AnnouncementService announcementService;
    private final GalleryRepository galleryRepository;
    private final ServicePlanService servicePlanService;
    private final VacancyService vacancyService;
    private final ClubService clubService;
    private final ForumArticleService forumArticleService;
    private final ForumCommunityPostService forumCommunityPostService;
    private final UserService userService;

    private static final int MAX_PARALLEL_QUERIES = 3;

    private final ExecutorService executor = Executors.newFixedThreadPool(MAX_PARALLEL_QUERIES, new CountThreadFactory());
    private final ReentrantLock refreshing = new ReentrantLock();
    private volatile Snapshot snapshot;

    private record Snapshot(Map<String, Integer> counts, long createdAtNanos) {
        boolean isFresh() {
            return System.nanoTime() - createdAtNanos < CACHE_TTL.toNanos();
        }
    }

    @PreDestroy
    void shutdown() {
        executor.shutdownNow();
    }

    @GetMapping
    public ResponseEntity<Map<String, Integer>> getCounts() {
        return respond(currentSnapshot());
    }

    private Snapshot currentSnapshot() {
        Snapshot current = snapshot;
        if (current != null && current.isFresh()) return current;

        if (refreshing.tryLock()) {
            try {
                current = snapshot;
                if (current == null || !current.isFresh()) {
                    current = new Snapshot(computeCounts(), System.nanoTime());
                    snapshot = current;
                }
                return current;
            } finally {
                refreshing.unlock();
            }
        }

        if (current != null) return current;

        refreshing.lock();
        try {
            return snapshot != null ? snapshot : new Snapshot(Map.of(), System.nanoTime());
        } finally {
            refreshing.unlock();
        }
    }

    private Map<String, Integer> computeCounts() {
        // Gallery returns the 10 latest albums; home shows the featured ones among them
        CompletableFuture<List<Gallery>> firstGalleries = CompletableFuture.supplyAsync(
                () -> galleryRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, FIRST_PAGE)).getContent(), executor);

        Map<String, CompletableFuture<Integer>> tasks = new LinkedHashMap<>();
        tasks.put("news", async(() -> firstPage(announcementService
                .getAll(SOURCE_LANG, null, PageRequest.of(0, 1, Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id"))))
                .getTotalElements())));
        tasks.put("gallery", firstGalleries.thenApply(List::size));
        tasks.put("home-multimedia", firstGalleries.thenApply(list ->
                (int) list.stream().filter(g -> Boolean.TRUE.equals(g.getFeatured())).count()));
        tasks.put("services", async(() -> servicePlanService.getActivePlans().size()));
        tasks.put("vacancies", async(() -> (int) vacancyService.getAllVacancies().stream().filter(v -> v.isOpen()).count()));
        tasks.put("clubs", async(() -> firstPage(clubService.getAll(SOURCE_LANG, PageRequest.of(0, 1, Sort.by("name"))).getTotalElements())));
        tasks.put("forum-blog", async(() -> firstPage(forumArticleService.getAll(null, PageRequest.of(0, 1), null).getTotalElements())));
        tasks.put("forum-community", async(() -> firstPage(forumCommunityPostService.getAll(PageRequest.of(0, 1)).getTotalElements())));
        tasks.put("about-teachers", async(() -> (int) userService.getTeachers().stream().filter(u -> "TEACHER".equals(u.getRole())).count()));

        long deadline = System.nanoTime() + TIMEOUT.toNanos();
        Map<String, Integer> counts = new LinkedHashMap<>();
        for (Map.Entry<String, CompletableFuture<Integer>> task : tasks.entrySet()) {
            try {
                long remaining = Math.max(0, deadline - System.nanoTime());
                counts.put(task.getKey(), task.getValue().get(remaining, TimeUnit.NANOSECONDS));
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            } catch (Exception e) {
                task.getValue().cancel(true);
                log.warn("Could not count {}: {}", task.getKey(), e.toString());
            }
        }
        return Collections.unmodifiableMap(counts);
    }

    private static ResponseEntity<Map<String, Integer>> respond(Snapshot current) {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(CACHE_TTL).cachePublic())
                .body(current.counts());
    }

    private CompletableFuture<Integer> async(Supplier<Integer> count) {
        return CompletableFuture.supplyAsync(count, executor);
    }

    private static int firstPage(long total) {
        return (int) Math.min(FIRST_PAGE, total);
    }

    private static final class CountThreadFactory implements java.util.concurrent.ThreadFactory {
        private final AtomicInteger next = new AtomicInteger(1);

        @Override
        public Thread newThread(Runnable runnable) {
            Thread thread = new Thread(runnable, "list-counts-" + next.getAndIncrement());
            thread.setDaemon(true);
            return thread;
        }
    }
}
