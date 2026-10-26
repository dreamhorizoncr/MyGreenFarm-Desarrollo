package taller.multimedia.backend.controller.electronic_billing;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import taller.multimedia.backend.dto.electronic_billing.InvoiceRequest;
import taller.multimedia.backend.service.electronic_billing.ElectronicBillingService;

@RestController 
@RequestMapping ("/api/billing")
@CrossOrigin (origins = "*")
public class ElectronicBillingController {
    private final ElectronicBillingService electronicBillingService;

    public ElectronicBillingController(ElectronicBillingService electronicBillingService) {
        this.electronicBillingService = electronicBillingService;
    }

    @GetMapping("/cabys/search")
    public ResponseEntity<Map> searchCabys(@RequestParam String query) {
        try {
            Map result = electronicBillingService.searchCabysCatalog(query);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Failed to fetch CABYS catalog",
                "message", e.getMessage()
            ));
        }
    }

    @PostMapping("/emit-invoice")
    public ResponseEntity<Map> emitInvoice(@RequestBody InvoiceRequest request) {
        try {
            Map response = electronicBillingService.emitInvoiceForSuccessfulPayment(
                    request.getClientName(),
                    request.getClientEmail(),
                    request.getIdentificationType(),
                    request.getClientIdentification(),
                    request.getTotalAmount(),
                    request.getServiceDescription(),
                    request.getCabysCode(),
                    request.getTaxRate()
            );
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Failed to emit electronic invoice",
                "message", e.getMessage()
            ));
        }
    }
}
