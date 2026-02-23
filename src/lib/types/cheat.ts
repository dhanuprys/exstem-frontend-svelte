/**
 * Cheat rule keys — these must match the keys sent by the backend in `cheat_rules`.
 * The backend sends a `Record<string, boolean>` where each key toggles a specific rule.
 */
export const CHEAT_RULE_KEYS = {
	visibility_hidden: 'visibility_hidden',
	window_blur: 'window_blur',
	window_resize: 'window_resize',
	dev_tools: 'dev_tools',
	clipboard: 'clipboard',
	context_menu: 'context_menu',
	forbidden_key: 'forbidden_key'
} as const;

export type CheatRuleKey = keyof typeof CHEAT_RULE_KEYS;

/** Labels for cheat types (used in UI or logs). */
export const cheatLabels: Record<string, string> = {
	visibility_hidden: 'Pindah tab',
	window_blur: 'Jendela hilang fokus',
	window_resize: 'Resize jendela',
	dev_tools: 'Membuka DevTools',
	clipboard: 'Menyalin/menempel teks',
	context_menu: 'Klik kanan',
	forbidden_key: 'Tombol terlarang'
};

export interface CheatPayload {
	type: string;
	severity: 'LOW' | 'MEDIUM' | 'HIGH' | string;
	extra?: any;
}
