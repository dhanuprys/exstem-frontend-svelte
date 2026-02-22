import { api } from '$lib/utils/api';
import type { Pagination, ApiResponse } from '$lib/types/api';

export type ExamStatus = 'DRAFT' | 'PUBLISHED' | 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED';

export interface ExamTargetRule {
	id?: number;
	exam_id?: string;
	class_id?: number | null;
	grade_level?: string | null;
	major_code?: string | null;
	religion?: string | null;
}

export type QuestionType = 'MULTIPLE_CHOICE' | 'ESSAY';

export interface Question {
	id?: string;
	exam_id?: string;
	question_text: string;
	question_type: QuestionType;
	options: any;
	correct_option: string;
	order_num: number;
	score_value: number;
}

export interface Exam {
	id: string;
	title: string;
	author_id: number;
	subject_id?: number | null;
	subject_name?: string;
	scheduled_start?: string | null;
	scheduled_end?: string | null;
	duration_minutes: number;
	entry_token?: string | null;
	status: ExamStatus;
	created_at: string;
	updated_at: string;
	target_rules?: ExamTargetRule[];
	questions?: Question[];
}

export interface ExamResultsResponse {
	student_id: number;
	name: string;
	nisn: string;
	class_name: string;
	score: number;
	status: string;
	started_at: string;
	finished_at: string;
}

class ExamService {
	public async getExams(page = 1, perPage = 10) {
		const res = await api.get<{ data: { exams: Exam[] }; pagination: Pagination }>('/admin/exams', {
			params: { page, per_page: perPage }
		});
		return res.data;
	}

	public async getExam(id: string) {
		const res = await api.get<ApiResponse<Exam>>(`/admin/exams/${id}`);
		return res.data;
	}

	public async createExam(data: Partial<Exam>) {
		const res = await api.post<ApiResponse<Exam>>('/admin/exams', data);
		return res.data;
	}

	public async updateExam(id: string, data: Partial<Exam>) {
		const res = await api.put<ApiResponse<Exam>>(`/admin/exams/${id}`, data);
		return res.data;
	}

	public async deleteExam(id: string) {
		const res = await api.delete(`/admin/exams/${id}`);
		return res.data;
	}

	public async publishExam(id: string) {
		const res = await api.post(`/admin/exams/${id}/publish`);
		return res.data;
	}

	public async refreshCache(id: string) {
		const res = await api.post(`/admin/exams/${id}/refresh-cache`);
		return res.data;
	}

	public async addTargetRule(examId: string, rule: Partial<ExamTargetRule>) {
		const res = await api.post<ApiResponse<ExamTargetRule>>(
			`/admin/exams/${examId}/target-rules`,
			rule
		);
		return res.data;
	}

	public async getTargetRules(examId: string) {
		const res = await api.get<ApiResponse<ExamTargetRule[]>>(`/admin/exams/${examId}/target-rules`);
		return res.data?.data || [];
	}

	public async getQuestions(examId: string) {
		const res = await api.get<ApiResponse<Question[]>>(`/admin/exams/${examId}/questions`);
		return res.data?.data || [];
	}

	public async replaceQuestions(examId: string, questions: Partial<Question>[]) {
		const res = await api.put<ApiResponse<Question[]>>(`/admin/exams/${examId}/questions`, {
			questions
		});
		return res.data?.data || [];
	}

	public async createQuestion(examId: string, question: Partial<Question>) {
		const res = await api.post<ApiResponse<Question>>(`/admin/exams/${examId}/questions`, question);
		return res.data?.data;
	}

	public async updateQuestion() {}
	public async deleteQuestion() {}

	public async getExamResults(
		id: string,
		page: number = 1,
		perPage: number = 10,
		filters?: {
			class_id?: number;
			grade_level?: string;
			major_code?: string;
			group_number?: number;
			religion?: string;
		}
	) {
		const res = await api.get<ApiResponse<ExamResultsResponse[]>>(`/admin/exams/${id}/results`, {
			params: { page, per_page: perPage, ...filters }
		});
		return res.data;
	}
}

export const examService = new ExamService();
