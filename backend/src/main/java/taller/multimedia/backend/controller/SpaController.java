package taller.multimedia.backend.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class SpaController {

    @RequestMapping (value = "/{path:^(?!api)[^\\.]*$}/**")
    public String forwardNested() {
        return "forward:/index.html";
    }

    @RequestMapping(value = "/{path:^(?!api)[^\\.]*$}")
    public String forwardRoot() {
        return "forward:/index.html";
    }
}