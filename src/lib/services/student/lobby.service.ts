import { api } from '$lib/utils/api';
import type { ApiResponse } from '$lib/types/api';

// ─── Types ───────────────────────────────────────────────────────────

export type SessionStatus = 'IN_PROGRESS' | 'COMPLETED';

/** Exam as shown in the student lobby, with optional session overlay. */
export interface LobbyExam {
	id: string;
	title: string;
	subject_name?: string;
	scheduled_start?: string;
	scheduled_end?: string;
	duration_minutes: number;
	status: string;
	lobby_status: 'UPCOMING' | 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETED';
	session_status?: SessionStatus;
	final_score?: number;
}

// ─── Service ─────────────────────────────────────────────────────────

class LobbyService {
	/** Fetch all exams available to the authenticated student. */
	public async getExams() {
		return api.get<ApiResponse<{ exams: LobbyExam[] }>>('/student/lobby');
	}
}

export const lobbyService = new LobbyService();
