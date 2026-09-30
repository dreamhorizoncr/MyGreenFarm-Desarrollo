package taller.multimedia.backend.service.parent;

import java.util.Optional;

import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import taller.multimedia.backend.dto.parent.ParentRequest;
import taller.multimedia.backend.exception.InvalidFieldException;
import taller.multimedia.backend.repository.parent.ParentRepository;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class ParentServiceTest {

    @Mock
    private ParentRepository parentRepository;

    @InjectMocks
    private ParentService parentService;

    private ParentRequest requestWith(String identification, String phoneNumber, String address, String firstName,
            String lastName) {
        ParentRequest request = new ParentRequest();
        request.setIdentification(identification);
        request.setEmail("ana@gmail.com");
        request.setPhoneNumber(phoneNumber);
        request.setAddress(address);
        request.setFirstName(firstName);
        request.setLastName(lastName);
        request.setLanguage("es");
        return request;
    }

    @ParameterizedTest
    @ValueSource(strings = { "identification", "phoneNumber", "address", "firstName", "lastName" })
    void createParent_rejectsMaliciousFieldsAndNeverSaves(String field) {
        lenient().when(parentRepository.findByEmail(anyString())).thenReturn(Optional.empty());

        String maliciousValue = "<script>alert(1)</script>x";
        ParentRequest request = requestWith("123456789", "+50688887777", "San José", "Ana", "Pérez");

        switch (field) {
            case "identification" -> request.setIdentification(maliciousValue);
            case "phoneNumber" -> request.setPhoneNumber(maliciousValue);
            case "address" -> request.setAddress(maliciousValue);
            case "firstName" -> request.setFirstName(maliciousValue);
            case "lastName" -> request.setLastName(maliciousValue);
            default -> throw new IllegalStateException("Campo no cubierto: " + field);
        }

        assertThrows(InvalidFieldException.class, () -> parentService.createParent(request));

        verify(parentRepository, never()).save(any());
    }
}
