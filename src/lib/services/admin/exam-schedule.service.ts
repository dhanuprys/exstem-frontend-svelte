import { api } from '$lib/utils/api';
import type { ApiResponse } from '../../types/api';

export interface ExamSchedule {
	id: string;
	exam_id: string;
	session_number: number;
	room_id: number;
	start_time?: string;
	end_time?: string;
	created_at: string;
	room_name?: string;
	room_capacity?: number;
}

export interface ExamRoomAssignment {
	id: string;
	exam_schedule_id: string;
	student_id: number;
	seat_number: number;
	created_at: string;
	student_nis?: string;
	student_name?: string;
	class_name?: string;
}

export interface DistributionResult {
	schedules: ExamSchedule[];
	assignments: ExamRoomAssignment[];
}

export interface AutoDistributeRequest {
	room_ids: number[];
	source_mode: 'target_rules' | 'manual' | 'by_exam';
	class_ids?: number[];
	student_ids?: number[];
	source_exam_id?: string;
}

export interface UpdateScheduleTimeRequest {
	start_time: string | null;
	end_time: string | null;
}

class ExamScheduleService {
	/**
	 * Automatically distribute students into rooms and sessions for an exam based on the chosen source mode.
	 */
	public async autoDistribute(examId: string, data: AutoDistributeRequest) {
		return api.post<ApiResponse<{ message: string }>>(`/admin/exams/${examId}/distribute`, data);
	}

	/**
	 * Get the current distribution (schedules and assignments) for an exam.
	 */
	public async getDistribution(examId: string) {
		return api.get<ApiResponse<DistributionResult>>(`/admin/exams/${examId}/distribution`);
	}

	/**
	 * Clear the distribution for an exam to allow redistribution.
	 */
	public async clearDistribution(examId: string) {
		return api.delete<ApiResponse<{ message: string }>>(`/admin/exams/${examId}/distribution`);
	}

	/**
	 * Update the start and end times for a specific schedule session.
	 */
	public async updateScheduleTime(scheduleId: string, data: UpdateScheduleTimeRequest) {
		return api.put<ApiResponse<{ message: string }>>(
			`/admin/exam-schedules/${scheduleId}/time`,
			data
		);
	}

	/**
	 * Download the XLSX presence list for an exam's distribution.
	 */
	public async exportPresenceXlsx(
		examId: string,
		session?: number,
		roomId?: number
	): Promise<Blob> {
		const params = new URLSearchParams();
		if (session) params.append('session', session.toString());
		if (roomId) params.append('room', roomId.toString());

		const queryString = params.toString();
		const url = `/admin/exams/${examId}/distribution/export${queryString ? `?${queryString}` : ''}`;

		const response = await api.get<Blob>(url, {
			responseType: 'blob'
		});
		return response.data;
	}
}

export const examScheduleService = new ExamScheduleService();
