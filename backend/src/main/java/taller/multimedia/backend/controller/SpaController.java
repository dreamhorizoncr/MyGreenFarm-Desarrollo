package taller.multimedia.backend.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaController {

    @GetMapping({ "/login", "/signup", "/forgot-password", "/reset-password" })
    public String forwardToFrontend() {
        return "forward:/index.html";
    }
}