import { api } from '$lib/utils/api';

/**
 * Handles the lobby process for the student
 */
class LobbyService {
 /**
     * Get the active exam for the student, if student
     * is reconnecting so the system can return the active exam
     */
    public async getActiveExam() {

    }

    /**
     * Get all the exams for the student
     */
    public async getExams() {

    }
}

export const lobbyService = new LobbyService();