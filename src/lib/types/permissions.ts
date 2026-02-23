export const PERMISSIONS = {
	MEDIA_UPLOAD: 'media:upload',
	STUDENTS_READ: 'students:read',
	STUDENTS_WRITE: 'students:write',
	STUDENTS_RESET_SESSION: 'students:reset_session',
	EXAMS_READ: 'exams:read',
	EXAMS_WRITE: 'exams:write', // new
	EXAMS_WRITE_OWN: 'exams:write_own', // deprecated
	EXAMS_PUBLISH: 'exams:publish',
	QBANKS_READ: 'qbanks:read',
	QBANKS_WRITE_OWN: 'qbanks:write_own',
	QBANKS_WRITE_ALL: 'qbanks:write_all', // new
	ADMINS_READ: 'admins:read',
	ADMINS_WRITE: 'admins:write',
	ROLES_READ: 'roles:read',
	ROLES_WRITE: 'roles:write',
	SETTINGS_READ: 'settings:read',
	SETTINGS_WRITE: 'settings:write',
	SUBJECTS_READ: 'subjects:read',
	SUBJECTS_WRITE: 'subjects:write',
	MAJOR_READ: 'major:read',
	MAJOR_WRITE: 'major:write',
	MAJOR_DELETE: 'major:delete'
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
