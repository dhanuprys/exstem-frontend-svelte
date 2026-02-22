import { api } from '$lib/utils/api';
import type { ApiResponse } from '$lib/types/api';

// ─── Types ───────────────────────────────────────────────────────────

/** A question as delivered to the student (no correct answer). */
export interface StudentQuestion {
	id: string;
	question_text: string;
	options: string[];
	order_num: number;
}

/** The exam payload fetched from Redis cache. */
export interface ExamPaper {
	exam_id: string;
	title: string;
	duration_minutes: number;
	questions: StudentQuestion[];
}

/** The exam session returned after joining. */
export interface ExamSession {
	id: string;
	exam_id: string;
	student_id: number;
	started_at: string;
	finished_at?: string;
	status: 'IN_PROGRESS' | 'COMPLETED';
	final_score?: number;
}

export interface ExamSessionState {
	session_id: string;
	exam_id: string;
	student_id: number;
	autosaved_answers: Record<string, string>;
	remaining_time: number; // in seconds
}

// ─── Service ─────────────────────────────────────────────────────────

class StudentExamService {
	/** Get the current state of the exam session. */
	public async getExamSessionState(examId: string) {
		return api.get<ApiResponse<ExamSessionState>>(`/student/exams/${examId}/state`);
	}

	/** Join an exam by submitting the entry token. Creates or returns an existing session. */
	public async joinExam(examId: string, entryToken: string) {
		return api.post<ApiResponse<{ session: ExamSession }>>(`/student/exams/${examId}/join`, {
			entry_token: entryToken
		});
	}

	/** Fetch the exam paper (questions without answers) from Redis cache. */
	public async getExamPaper(examId: string) {
		return api.get<ApiResponse<ExamPaper>>(`/student/exams/${examId}/paper`);
	}
}

export const studentExamService = new StudentExamService();
