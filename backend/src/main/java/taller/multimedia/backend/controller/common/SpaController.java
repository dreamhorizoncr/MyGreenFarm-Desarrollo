package taller.multimedia.backend.controller.common;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Serves the React frontend's {@code index.html} for every browser route that is not an API call,
 * an asset or a file, so reloading a page such as {@code /nosotros} works.
 */
@Controller
public class SpaController {

    /**
     * @return a forward to {@code index.html} for nested routes
     */
    @GetMapping(value = "/{path:^(?!api|assets)[^\\.]*$}/**")
    public String forwardNested() {
        return "forward:/index.html";
    }

    /**
     * @return a forward to {@code index.html} for first-level routes
     */
    @GetMapping(value = "/{path:^(?!api|assets)[^\\.]*$}")
    public String forwardRoot() {
        return "forward:/index.html";
    }
}