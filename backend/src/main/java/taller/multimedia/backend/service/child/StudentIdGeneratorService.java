package taller.multimedia.backend.service.child;

import java.time.LocalDate;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import taller.multimedia.backend.repository.child.ChildRepository;

@Service
public class StudentIdGeneratorService {

    private final ChildRepository childRepository;

    public StudentIdGeneratorService(ChildRepository childRepository) {
        this.childRepository = childRepository;
    }

    @Transactional
    public String generateNextStudentId() {
        int currentYear = LocalDate.now().getYear(); 
        
        char decadePrefix = getDecadePrefix(currentYear); 
        int yearDigit = currentYear % 10;                 
        
        String prefix = String.format("%c%d", decadePrefix, yearDigit); // "A6"

        String lastStudentId = childRepository.findLastStudentIdByPrefix(prefix + "%");

        int nextSequence = 1;
        if (lastStudentId != null && lastStudentId.length() >= 5) {
            String sequencePart = lastStudentId.substring(2); 
            try {
                nextSequence = Integer.parseInt(sequencePart) + 1;
            } catch (NumberFormatException e) {
                nextSequence = 1;
            }
        }

        return String.format("%s%03d", prefix, nextSequence);
    }

    private char getDecadePrefix(int year) {
        if (year >= 2020 && year < 2030) return 'A';
        if (year >= 2030 && year < 2040) return 'B';
        if (year >= 2040 && year < 2050) return 'C';
        return 'X';
    }
}
