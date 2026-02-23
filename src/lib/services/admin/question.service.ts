import { api } from '$lib/utils/api';
import type { ApiResponse, Pagination } from '$lib/types/api';

export type QuestionType = 'MULTIPLE_CHOICE' | 'ESSAY';

export interface Question {
	id?: string;
	qbank_id?: string;
	question_text: string;
	question_type: QuestionType;
	options: any;
	correct_option: string;
	order_num: number;
	score_value: number;
}

export interface QBank {
	id: string;
	name: string;
	description: string;
	subject_id?: number | null;
	subject_name?: string;
}

class QuestionService {
	public async getQBanks(page = 1, perPage = 10, search = '') {
		const res = await api.get<ApiResponse<{ qbanks: QBank[]; pagination: Pagination }>>(
			'/admin/qbanks',
			{
				params: { page, per_page: perPage, search }
			}
		);
		return res;
	}

	public async getQBank(id: string) {
		const res = await api.get<ApiResponse<QBank>>(`/admin/qbanks/${id}`);
		return res.data;
	}

	public async createQBank(data: Partial<QBank>) {
		const res = await api.post<ApiResponse<QBank>>('/admin/qbanks', data);
		return res.data;
	}

	public async updateQBank(id: string, data: Partial<QBank>) {
		const res = await api.put<ApiResponse<QBank>>(`/admin/qbanks/${id}`, data);
		return res.data;
	}

	public async deleteQBank(id: string) {
		const res = await api.delete(`/admin/qbanks/${id}`);
		return res.data;
	}

	public async getQuestions(qbankId: string) {
		const res = await api.get<ApiResponse<Question[]>>(`/admin/qbanks/${qbankId}/questions`);
		return res.data?.data || [];
	}

	public async replaceQuestions(qbankId: string, questions: Partial<Question>[]) {
		const res = await api.put<ApiResponse<Question[]>>(`/admin/qbanks/${qbankId}/questions`, {
			questions
		});
		return res.data?.data || [];
	}

	public async createQuestion(qbankId: string, question: Partial<Question>) {
		const res = await api.post<ApiResponse<Question>>(
			`/admin/qbanks/${qbankId}/questions`,
			question
		);
		return res.data?.data;
	}
}

export const questionService = new QuestionService();
