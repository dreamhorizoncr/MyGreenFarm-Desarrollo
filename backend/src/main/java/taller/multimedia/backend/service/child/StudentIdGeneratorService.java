package taller.multimedia.backend.service.child;

import java.time.LocalDate;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import taller.multimedia.backend.repository.child.ChildRepository;

/**
 * Generates sequential student IDs for newly enrolled children.
 */
@Service
public class StudentIdGeneratorService {

    private final ChildRepository childRepository;

    public StudentIdGeneratorService(ChildRepository childRepository) {
        this.childRepository = childRepository;
    }

    /**
     * Builds the next student ID for the current year.
     *
     * <p>The format is a decade letter (A for the 2020s, B for the 2030s, C for the 2040s, X
     * otherwise), the last digit of the year and a three-digit sequence, for example {@code A6001}
     * for the first student of 2026. The sequence continues from the highest ID already stored with
     * the same prefix and restarts at 1 if that ID cannot be parsed.
     *
     * @return the next free student ID
     */
    @Transactional
    public String generateNextStudentId() {
        int currentYear = LocalDate.now().getYear(); 
        
        char decadePrefix = getDecadePrefix(currentYear); 
        int yearDigit = currentYear % 10;                 
        
        String prefix = String.format("%c%d", decadePrefix, yearDigit);

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

    /**
     * @param year calendar year
     * @return the letter that identifies the decade of {@code year}
     */
    private char getDecadePrefix(int year) {
        if (year >= 2020 && year < 2030) return 'A';
        if (year >= 2030 && year < 2040) return 'B';
        if (year >= 2040 && year < 2050) return 'C';
        return 'X';
    }
}
