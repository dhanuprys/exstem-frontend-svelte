export const PERMISSIONS = {
	MEDIA_UPLOAD: 'media:upload',
	STUDENTS_READ: 'students:read',
	STUDENTS_WRITE: 'students:write',
	STUDENTS_RESET_SESSION: 'students:reset_session',
	EXAMS_READ: 'exams:read',
	EXAMS_WRITE_OWN: 'exams:write_own',
	EXAMS_PUBLISH: 'exams:publish',
	ADMINS_READ: 'admins:read',
	ADMINS_WRITE: 'admins:write',
	ROLES_READ: 'roles:read',
	ROLES_WRITE: 'roles:write'
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
