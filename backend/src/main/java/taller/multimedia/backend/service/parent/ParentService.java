package taller.multimedia.backend.service.parent;

import org.springframework.stereotype.Service;
import taller.multimedia.backend.dto.parent.ParentRequest;
import taller.multimedia.backend.model.parent.Parent;
import taller.multimedia.backend.repository.parent.ParentRepository;

import java.util.List;

@Service
public class ParentService {

    private final ParentRepository parentRepository;

    public ParentService(ParentRepository parentRepository) {
        this.parentRepository = parentRepository;
    }

    public Parent createParent(ParentRequest dto) {
        String cleanEmail = sanitizeEmail(dto.getEmail());

        if (parentRepository.findByEmail(cleanEmail).isPresent()) {
            throw new RuntimeException("Ya existe un padre registrado con este correo.");
        }

        Parent parent = new Parent();
        parent.setIdentification(dto.getIdentification().trim());
        parent.setEmail(cleanEmail);
        parent.setPhoneNumber(dto.getPhoneNumber().trim());
        parent.setAddress(dto.getAddress().trim());
        parent.setFirstName(dto.getFirstName().trim());
        parent.setLastName(dto.getLastName().trim());
        parent.setLanguage(resolverLangCode(dto.getLanguage()));

        return parentRepository.save(parent);
    }

    public List<Parent> getAllParents() {
        return parentRepository.findAll();
    }

    private String resolverLangCode(String lang) {
        if (lang == null || lang.isBlank()) {
            return "es";
        }
        String normalized = lang.toLowerCase().trim();
        if (normalized.startsWith("en"))
            return "en";
        if (normalized.startsWith("fr"))
            return "fr";
        return "es";
    }

    private String sanitizeEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new RuntimeException("El correo electrónico es obligatorio.");
        }

        String cleanEmail = email.toLowerCase().trim();

        // Valida estructura básica con arroba y punto
        if (!cleanEmail.contains("@") || !cleanEmail.contains(".")) {
            throw new RuntimeException("El formato del correo electrónico no es válido.");
        }

        // Extrae lo que está después del @ (el dominio)
        String domain = cleanEmail.substring(cleanEmail.lastIndexOf("@") + 1);

        // Valida que el dominio no esté vacío y tenga al menos un punto (ej: gmail.com)
        if (domain.isBlank() || !domain.contains(".")) {
            throw new RuntimeException("El dominio del correo no es válido.");
        }

        // Lista blanca
        List<String> allowedDomains = List.of(
                "gmail.com",
                "hotmail.com",
                "outlook.com",
                "ucr.ac.cr");

        if (!allowedDomains.contains(domain)) {
            throw new RuntimeException(
                    "Solo se permiten correos de proveedores comunes (Gmail, Hotmail, Outlook, etc.).");
        }

        List<String> blockedDomains = List.of(
                "mailinator.com",
                "yopmail.com",
                "tempmail.com",
                "test.com",
                "example.com");

        if (blockedDomains.contains(domain)) {
            throw new RuntimeException("No se permiten correos temporales o de prueba.");
        }

        return cleanEmail;
    }

    public Parent getParentById(Integer id) {
        return parentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("No se encontró ningún padre con el ID proporcionado."));
    }

    public Parent updateParent(Integer id, ParentRequest dto) {
        Parent existingParent = getParentById(id);

        parentRepository.findByEmail(dto.getEmail()).ifPresent(parent -> {
            if (!parent.getId().equals(id)) {
                throw new RuntimeException("Ya existe otro padre registrado con este correo.");
            }
        });

        this.sanitizeEmail(existingParent.getEmail());

        existingParent.setIdentification(dto.getIdentification());
        existingParent.setEmail(dto.getEmail());
        existingParent.setPhoneNumber(dto.getPhoneNumber());
        existingParent.setAddress(dto.getAddress());
        existingParent.setFirstName(dto.getFirstName());
        existingParent.setLastName(dto.getLastName());

        // Actualizamos y normalizamos el idioma por si cambió
        existingParent.setLanguage(resolverLangCode(dto.getLanguage()));

        return parentRepository.save(existingParent);
    }

    public void deleteParent(Integer id) {
        Parent parent = getParentById(id);
        parentRepository.delete(parent);
    }
}