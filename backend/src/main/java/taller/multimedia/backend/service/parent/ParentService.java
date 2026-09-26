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
        if (parentRepository.findByEmail(dto.getEmail()).isPresent()) {
            throw new RuntimeException("Ya existe un padre registrado con este correo.");
        }

        Parent parent = new Parent();
        parent.setIdentification(dto.getIdentification());
        parent.setEmail(dto.getEmail());
        parent.setPhoneNumber(dto.getPhoneNumber());
        parent.setAddress(dto.getAddress());
        parent.setFirstName(dto.getFirstName());
        parent.setLastName(dto.getLastName());
        
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
        if (normalized.startsWith("en")) return "en";
        if (normalized.startsWith("fr")) return "fr";
        return "es";
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