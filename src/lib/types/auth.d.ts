import type { Permission } from './permissions';

export interface StudentLoginResponse {
	token: string;
	student: Student;
}

export interface AdminLoginResponse {
	token: string;
	admin: Admin;
	permissions: Permission[];
}

export interface Student {
	id: number;
	nisn: string;
	name: string;
	class_id: number;
}

export interface Admin {
	id: number;
	email: string;
	name: string;
	role_id: number;
	role_name: string;
}
