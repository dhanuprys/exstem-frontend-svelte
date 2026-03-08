import { api } from '$lib/utils/api';
import type { ApiResponse } from '../../types/api';

// ---------------------------------------------------------------------------
// Room CRUD types
// ---------------------------------------------------------------------------

export interface Room {
	id: number;
	name: string;
	capacity: number;
	created_at?: string;
	updated_at?: string;
}

export interface CreateRoomRequest {
	name: string;
	capacity: number;
}

// ---------------------------------------------------------------------------
// Room Assignment types
// ---------------------------------------------------------------------------

export interface RoomSession {
	id: string;
	session_number: number;
	room_id: number;
	start_time: string | null;
	end_time: string | null;
	room_name: string;
	room_capacity: number;
	created_at: string;
}

export interface StudentRoomAssignment {
	id: string;
	room_session_id: string;
	student_id: number;
	seat_number: number;
	student_nis: string;
	student_name: string;
	class_name: string;
	created_at: string;
}

export interface AutoDistributeRequest {
	room_ids: number[];
	class_ids?: number[];
	student_ids?: number[];
}

export interface DistributionResult {
	sessions: RoomSession[];
	assignments: StudentRoomAssignment[];
}

export interface SessionTimePayload {
	session_number: number;
	start_time: string | null;
	end_time: string | null;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

class RoomService {
	// ── Room CRUD ────────────────────────────────────────────────────────

	public async createRoom(data: CreateRoomRequest) {
		return api.post<ApiResponse<{ room: Room }>>('/admin/rooms', data);
	}

	public async updateRoom(id: number, data: CreateRoomRequest) {
		return api.put<ApiResponse<{ room: Room }>>(`/admin/rooms/${id}`, data);
	}

	public async getRooms() {
		return api.get<ApiResponse<{ rooms: Room[] }>>('/admin/rooms');
	}

	public async deleteRoom(id: number) {
		return api.delete<ApiResponse<{ message: string }>>(`/admin/rooms/${id}`);
	}

	// ── Room Assignments ─────────────────────────────────────────────────

	/**
	 * Auto-distribute students into rooms and sessions.
	 */
	public async autoDistribute(data: AutoDistributeRequest) {
		return api.post<ApiResponse<DistributionResult>>('/admin/room-assignments/distribute', data);
	}

	/**
	 * Get the current global distribution.
	 */
	public async getDistribution() {
		return api.get<ApiResponse<DistributionResult>>('/admin/room-assignments');
	}

	/**
	 * Clear all room assignments.
	 */
	public async clearDistribution() {
		return api.delete<ApiResponse<{ message: string }>>('/admin/room-assignments');
	}

	/**
	 * Export the presence sheet as XLSX.
	 * Optional query params: session (int), room (int)
	 */
	public async exportPresenceXLSX(session?: number, room?: number) {
		const params = new URLSearchParams();
		if (session !== undefined) params.set('session', String(session));
		if (room !== undefined) params.set('room', String(room));

		const queryString = params.toString();
		const url = `/admin/room-assignments/export${queryString ? `?${queryString}` : ''}`;

		return api.get<Blob>(url, { responseType: 'blob' });
	}

	/**
	 * Update session start/end times.
	 */
	public async updateSessionTimes(sessions: SessionTimePayload[]) {
		return api.put<ApiResponse<DistributionResult>>('/admin/room-assignments/sessions', {
			sessions
		});
	}
}

export const roomService = new RoomService();
