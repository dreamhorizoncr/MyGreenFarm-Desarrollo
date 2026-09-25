package taller.multimedia.backend.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaController {

    @GetMapping(value = "/{path:^(?!api|assets)[^\\.]*$}/**")
    public String forwardNested() {
        return "forward:/index.html";
    }

    @GetMapping(value = "/{path:^(?!api|assets)[^\\.]*$}")
    public String forwardRoot() {
        return "forward:/index.html";
    }
}