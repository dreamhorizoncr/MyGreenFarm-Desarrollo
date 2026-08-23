package taller.multimedia.backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class RegisterController {
    @GetMapping("/api/health")
    public String hello() {
        return "OK";
    }
}
