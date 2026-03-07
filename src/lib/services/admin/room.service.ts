import { api } from '$lib/utils/api';
import type { ApiResponse } from '../../types/api';

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

class RoomService {
	/**
	 * Create a new room
	 */
	public async createRoom(data: CreateRoomRequest) {
		return api.post<ApiResponse<{ room: Room }>>('/admin/rooms', data);
	}

	/**
	 * Update an existing room
	 */
	public async updateRoom(id: number, data: CreateRoomRequest) {
		return api.put<ApiResponse<{ room: Room }>>(`/admin/rooms/${id}`, data);
	}

	/**
	 * Get all the rooms for the admin
	 */
	public async getRooms() {
		return api.get<ApiResponse<{ rooms: Room[] }>>('/admin/rooms');
	}

	/**
	 * Delete a room
	 */
	public async deleteRoom(id: number) {
		return api.delete<ApiResponse<{ message: string }>>(`/admin/rooms/${id}`);
	}
}

export const roomService = new RoomService();
