export interface CheatPayload {
	type:
		| 'VISIBILITY_HIDDEN'
		| 'WINDOW_BLUR'
		| 'WINDOW_RESIZE'
		| 'CLIPBOARD'
		| 'FORBIDDEN_KEY'
		| 'DEV_TOOLS_HEURISTIC'
		| 'CONTEXT_MENU';
	severity: 'LOW' | 'MEDIUM' | 'HIGH';
	extra?: Record<string, any>;
}
