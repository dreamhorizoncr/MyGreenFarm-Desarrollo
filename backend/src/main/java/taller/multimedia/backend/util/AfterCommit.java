package taller.multimedia.backend.util;

import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/**
 * Runs work that must only happen once the database changes are saved, such as deleting files
 * from storage or syncing with Google Calendar: if the transaction is rolled back, the work is
 * never done.
 */
public final class AfterCommit {

    private AfterCommit() {
    }

    /**
     * Runs a task after the current transaction commits. When there is no active transaction (for
     * example in a unit test), the task runs right away.
     *
     * @param task work to run after the commit
     */
    public static void run(Runnable task) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            task.run();
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                task.run();
            }
        });
    }
}
