import { api } from '../../utils/api';
import type { ApiResponse } from '$lib/types/api';

export interface DashboardUpcomingExam {
	id: string;
	title: string;
	scheduled_start: string;
	duration_minutes: number;
}

export interface DashboardRecentExamResult {
	id: string;
	title: string;
	end_date_time: string;
	participant_count: number;
	average_score: number | null;
}

export interface DashboardData {
	total_students: number;
	total_exams: number;
	total_question_banks: number;
	total_questions: number;
	exam_status_counts: Record<string, number>;
	upcoming_exams: DashboardUpcomingExam[];
	recent_completed_exams: DashboardRecentExamResult[];
}

export const dashboardService = {
	/**
	 * Fetch all admin dashboard metrics
	 */
	getDashboardData: async () => {
		return api.get<ApiResponse<DashboardData>>('/admin/dashboard');
	}
};
