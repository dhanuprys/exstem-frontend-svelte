<script lang="ts">
	import type { CheatPayload } from '$lib/types/cheat';
	import { BlocksIcon, ShieldAlertIcon } from '@lucide/svelte';
	import { onMount } from 'svelte';

	let {
		onCheatCapture,
		cheatRules = {}
	}: {
		onCheatCapture: (payload: CheatPayload) => void;
		cheatRules: Record<string, boolean>;
	} = $props();

	function isRuleActive(key: string): boolean {
		// If cheatRules is empty (no rules from backend), default ALL rules to active
		if (Object.keys(cheatRules).length === 0) return true;
		return cheatRules[key] === true;
	}

	const RESIZE_THRESHOLD = 100;
	const DEV_TOOLS_THRESHOLD = 160;
	const CHEAT_BLINK_THRESHOLD = 2;
	const BLINK_BASE_DURATION_MS = 2000;
	const BLINK_EXTRA_PER_TRIGGER_MS = 1500;
	const CONSENT_TRIGGER_COUNT = 4; // Show consent screen after this many blink triggers
	const CONSENT_PHRASE = 'SAYA TIDAK AKAN MENYONTEK LAGI';

	let initialOuterWidth = 0;
	let initialOuterHeight = 0;

	let resizeTimeout: ReturnType<typeof setTimeout>;

	// ─── Blink State ─────────────────────────────────────────────────
	let cheatCounter = $state(0);
	let blinkTriggerCount = $state(0); // Accumulates across the session for scaling
	let isBlinking = $state(false); // True while overlay is shown
	let isStrobing = $state(false); // True during rapid JS-driven flash phase
	let blinkDuration = $state(BLINK_BASE_DURATION_MS);
	let blinkTimeout: ReturnType<typeof setTimeout> | null = null;
	let strobeInterval: ReturnType<typeof setInterval> | null = null;

	// ─── Consent Screen State ─────────────────────────────────────
	let showConsent = $state(false);
	let consentInput = $state('');
	let consentInputEl: HTMLInputElement | undefined = $state();
	let consentValid = $derived(consentInput.trim().toUpperCase() === CONSENT_PHRASE);

	onMount(() => {
		if (typeof window === 'undefined') return;

		initialOuterWidth = window.outerWidth;
		initialOuterHeight = window.outerHeight;

		console.log(
			'%c 🛡️ ANTI CHEAT ACTIVE 🛡️ ',
			'font-size: 1rem; background: #ef4444; color: #fff; font-weight: bold; padding: 4px; border-radius: 4px;'
		);

		// ─── Build Listeners Conditionally ───────────────────────────
		const cleanups: (() => void)[] = [];

		// 1. Tab Switching (visibility_hidden)
		if (isRuleActive('visibility_hidden')) {
			const handleVisibilityChange = () => {
				if (document.hidden) {
					triggerCheat('VISIBILITY_HIDDEN', 'HIGH', { reason: 'Tab hidden' });
				}
			};
			document.addEventListener('visibilitychange', handleVisibilityChange);
			cleanups.push(() => document.removeEventListener('visibilitychange', handleVisibilityChange));
		}

		// 2. Window Blur (window_blur)
		if (isRuleActive('window_blur')) {
			const handleBlur = () => {
				triggerCheat('WINDOW_BLUR', 'MEDIUM', { reason: 'Window lost focus' });
			};
			window.addEventListener('blur', handleBlur);
			cleanups.push(() => window.removeEventListener('blur', handleBlur));
		}

		// 3. Resize & DevTools (window_resize + dev_tools)
		if (isRuleActive('window_resize') || isRuleActive('dev_tools')) {
			const handleResize = () => {
				clearTimeout(resizeTimeout);
				resizeTimeout = setTimeout(() => {
					const currentOuterWidth = window.outerWidth;
					const currentOuterHeight = window.outerHeight;
					const currentInnerWidth = window.innerWidth;
					const currentInnerHeight = window.innerHeight;

					if (isRuleActive('window_resize')) {
						const widthDiff = Math.abs(currentOuterWidth - initialOuterWidth);
						const heightDiff = Math.abs(currentOuterHeight - initialOuterHeight);

						if (widthDiff > RESIZE_THRESHOLD || heightDiff > RESIZE_THRESHOLD) {
							triggerCheat('WINDOW_RESIZE', 'MEDIUM', {
								initial: `${initialOuterWidth}x${initialOuterHeight}`,
								current: `${currentOuterWidth}x${currentOuterHeight}`
							});
							initialOuterWidth = currentOuterWidth;
							initialOuterHeight = currentOuterHeight;
						}
					}

					if (isRuleActive('dev_tools')) {
						const widthGap = currentOuterWidth - currentInnerWidth;
						const heightGap = currentOuterHeight - currentInnerHeight;

						if (widthGap > DEV_TOOLS_THRESHOLD || heightGap > DEV_TOOLS_THRESHOLD) {
							triggerCheat('DEV_TOOLS_HEURISTIC', 'HIGH', {
								reason: 'Viewport shrank unexpectedly',
								gap: `${widthGap}px x ${heightGap}px`
							});
						}
					}
				}, 500);
			};
			window.addEventListener('resize', handleResize);
			cleanups.push(() => {
				window.removeEventListener('resize', handleResize);
				clearTimeout(resizeTimeout);
			});
		}

		// 4. Clipboard (clipboard)
		if (isRuleActive('clipboard')) {
			const preventClipboard = (e: Event) => {
				e.preventDefault();
				e.stopPropagation();
				triggerCheat('CLIPBOARD', 'LOW', { action: e.type });
				return false;
			};
			document.addEventListener('copy', preventClipboard, true);
			document.addEventListener('cut', preventClipboard, true);
			document.addEventListener('paste', preventClipboard, true);
			cleanups.push(() => {
				document.removeEventListener('copy', preventClipboard, true);
				document.removeEventListener('cut', preventClipboard, true);
				document.removeEventListener('paste', preventClipboard, true);
			});
		}

		// 5. Context Menu (context_menu)
		if (isRuleActive('context_menu')) {
			const preventContext = (e: Event) => {
				e.preventDefault();
				e.stopPropagation();
				triggerCheat('CONTEXT_MENU', 'LOW', { action: e.type });
				return false;
			};
			document.addEventListener('contextmenu', preventContext, true);
			cleanups.push(() => document.removeEventListener('contextmenu', preventContext, true));
		}

		// 6. Keyboard Shortcuts (forbidden_key + dev_tools + clipboard)
		{
			const handleKeydown = (e: KeyboardEvent) => {
				const forbiddenKeys = ['F12', 'PrintScreen', 'ContextMenu', 'Meta'];

				// DevTools shortcuts
				if (isRuleActive('dev_tools')) {
					if (
						(e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) ||
						(e.ctrlKey && e.key.toLowerCase() === 'u')
					) {
						e.preventDefault();
						triggerCheat('DEV_TOOLS_HEURISTIC', 'HIGH', { key: 'DevTools Shortcut' });
						return;
					}
				}

				// Clipboard shortcuts
				if (isRuleActive('clipboard')) {
					if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'x'].includes(e.key.toLowerCase())) {
						e.preventDefault();
						triggerCheat('CLIPBOARD', 'LOW', { key: `Ctrl+${e.key.toUpperCase()}` });
						return;
					}
				}

				// Window blur via Alt+Tab
				if (isRuleActive('window_blur')) {
					if (e.altKey && e.key === 'Tab') {
						triggerCheat('WINDOW_BLUR', 'MEDIUM', { key: 'Alt+Tab' });
					}
				}

				// Forbidden keys
				if (isRuleActive('forbidden_key')) {
					if (forbiddenKeys.includes(e.key)) {
						e.preventDefault();
						triggerCheat('FORBIDDEN_KEY', 'MEDIUM', { key: e.key });
					}
				}
			};
			window.addEventListener('keydown', handleKeydown, true);
			cleanups.push(() => window.removeEventListener('keydown', handleKeydown, true));
		}

		return () => {
			for (const cleanup of cleanups) cleanup();
			if (blinkTimeout) clearTimeout(blinkTimeout);
			if (strobeInterval) clearInterval(strobeInterval);
		};
	});

	function triggerCheat(
		type: CheatPayload['type'],
		severity: CheatPayload['severity'],
		extra: any = {}
	) {
		onCheatCapture({ type, severity, extra });

		// ─── Blink Logic ─────────────────────────────────────────────
		// Skip while banner is already showing to keep the app lightweight
		if (isBlinking) return;

		cheatCounter++;

		if (cheatCounter >= CHEAT_BLINK_THRESHOLD) {
			activateBlink();
			cheatCounter = 0; // Reset counter after triggering
		}
	}

	function activateBlink() {
		// Duration grows with each trigger over the session
		blinkTriggerCount++;
		blinkDuration = BLINK_BASE_DURATION_MS + (blinkTriggerCount - 1) * BLINK_EXTRA_PER_TRIGGER_MS;

		// After CONSENT_TRIGGER_COUNT blinks, show the consent screen instead
		if (blinkTriggerCount >= CONSENT_TRIGGER_COUNT) {
			showConsentScreen();
			return;
		}

		isBlinking = true;

		// — Phase 1: JS-driven rapid strobe (first 800ms) ————————————
		isStrobing = true;
		let strobeCount = 0;
		const STROBE_FLASHES = 10;
		const STROBE_INTERVAL_MS = 80;

		if (strobeInterval) clearInterval(strobeInterval);
		strobeInterval = setInterval(() => {
			strobeCount++;
			isStrobing = strobeCount % 2 === 0;
			if (strobeCount >= STROBE_FLASHES * 2) {
				clearInterval(strobeInterval!);
				strobeInterval = null;
				isStrobing = false;
			}
		}, STROBE_INTERVAL_MS);

		// — Dismiss after full duration —————————————————————————
		blinkTimeout = setTimeout(() => {
			isBlinking = false;
			isStrobing = false;
			blinkTimeout = null;
		}, blinkDuration);
	}

	function showConsentScreen() {
		// Cancel any active blink so the consent screen takes over
		if (blinkTimeout) {
			clearTimeout(blinkTimeout);
			blinkTimeout = null;
		}
		if (strobeInterval) {
			clearInterval(strobeInterval);
			strobeInterval = null;
		}
		isBlinking = false;
		isStrobing = false;
		consentInput = '';
		showConsent = true;
		// Auto-focus the input after the DOM renders
		setTimeout(() => consentInputEl?.focus(), 50);
	}

	function confirmConsent() {
		if (!consentValid) return;
		showConsent = false;
		consentInput = '';
		// Reset the trigger count so next blinks restart at base duration
		blinkTriggerCount = 0;
	}
</script>

<!-- Full-screen Red Blink Overlay -->
{#if isBlinking}
	<!--
		isStrobing toggles rapidly (JS interval) to produce a real flash effect.
		Once strobing ends, .cheat-blink-overlay's CSS animation takes over as a slow pulse.
	-->
	<div class="cheat-blink-overlay" class:strobing={isStrobing} aria-hidden="true">
		<div class="cheat-blink-content">
			<span class="cheat-blink-icon">⚠️</span>
			<p class="cheat-blink-text">Aktivitas Mencurigakan Terdeteksi</p>
			<p class="cheat-blink-subtext">Segala bentuk kecurangan akan dilaporkan</p>
		</div>
	</div>
{/if}

<!-- Consent Screen: shown after CONSENT_TRIGGER_COUNT blink triggers -->
{#if showConsent}
	<div class="consent-overlay" role="dialog" aria-modal="true" aria-labelledby="consent-title">
		<div class="consent-card">
			<div class="consent-header">
				<span class="consent-icon"><ShieldAlertIcon class="text-red-500" size={48} /></span>
				<h2 id="consent-title" class="consent-title">Peringatan Keras</h2>
				<p class="consent-desc">
					Kamu terdeteksi melakukan kecurangan berulang kali. Untuk melanjutkan ujian, ketik kalimat
					berikut dengan tepat:
				</p>
			</div>

			<div class="consent-phrase-box">
				<span class="consent-phrase">{CONSENT_PHRASE}</span>
			</div>

			<div class="consent-input-wrap">
				<input
					bind:this={consentInputEl}
					bind:value={consentInput}
					type="text"
					autocomplete="off"
					autocorrect="off"
					spellcheck={false}
					placeholder="Ketik kalimat di atas..."
					class="consent-input"
					class:match={consentValid}
					onkeydown={(e) => e.key === 'Enter' && confirmConsent()}
				/>
				<p class="consent-hint" class:valid={consentValid}>
					{#if consentInput.length === 0}
						Ketik kalimat pernyataan di atas
					{:else if consentValid}
						✓ Tepat! Tekan tombol untuk melanjutkan.
					{:else}
						{consentInput.length} / {CONSENT_PHRASE.length} karakter
					{/if}
				</p>
			</div>

			<button type="button" class="consent-btn" disabled={!consentValid} onclick={confirmConsent}>
				Saya Berjanji — Lanjutkan Ujian
			</button>
		</div>
	</div>
{/if}

<style>
	/* Global Lockdown */
	:global(body) {
		user-select: none;
		-webkit-user-select: none;
		-moz-user-select: none;
		-ms-user-select: none;
	}

	/* Input Exception */
	:global(input),
	:global(textarea) {
		user-select: text;
		-webkit-user-select: text;
	}

	/* ─── Red Blink Overlay ──────────────────────────────────────── */
	.cheat-blink-overlay {
		position: fixed;
		inset: 0;
		z-index: 9999;
		display: flex;
		align-items: center;
		justify-content: center;
		/* Default: slow ominous pulse (Phase 2) */
		background: rgba(220, 38, 38, 0.88);
		animation: cheat-pulse 0.6s ease-in-out infinite alternate;
		pointer-events: all;
		transition: background 0.05s;
	}

	/* Phase 1: JS toggles this class every 80ms for a real strobe flash */
	.cheat-blink-overlay.strobing {
		background: rgba(0, 0, 0, 0.15) !important;
		animation: none;
	}

	@keyframes cheat-pulse {
		from {
			background: rgba(185, 28, 28, 0.88);
		}
		to {
			background: rgba(239, 68, 68, 0.96);
		}
	}

	.cheat-blink-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		text-align: center;
		animation: cheat-shake 0.3s ease-in-out 0s 2;
	}

	.cheat-blink-icon {
		font-size: 4rem;
		filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.5));
	}

	.cheat-blink-text {
		font-size: 1.5rem;
		font-weight: 800;
		color: white;
		letter-spacing: 0.05em;
		text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
	}

	.cheat-blink-subtext {
		font-size: 0.875rem;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.8);
	}

	@keyframes cheat-shake {
		0%,
		100% {
			transform: translateX(0);
		}
		25% {
			transform: translateX(-6px);
		}
		75% {
			transform: translateX(6px);
		}
	}

	/* ─── Consent Screen ─────────────────────────────────────────── */
	.consent-overlay {
		position: fixed;
		inset: 0;
		z-index: 10000; /* Above blink overlay */
		display: flex;
		align-items: center;
		justify-content: center;
		background: #dc2626; /* Deep solid red */
		padding: 1rem;
	}

	.consent-card {
		background: #1a0000;
		border: 2px solid rgba(220, 38, 38, 0.6);
		border-radius: 1.25rem;
		padding: 2.5rem 2rem;
		max-width: 520px;
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		box-shadow:
			0 0 60px rgba(220, 38, 38, 0.3),
			0 20px 40px rgba(0, 0, 0, 0.6);
		animation: cheat-shake 0.4s ease-in-out;
	}

	.consent-header {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		text-align: center;
	}

	.consent-icon {
		font-size: 3rem;
	}

	.consent-title {
		font-size: 1.5rem;
		font-weight: 900;
		color: #ef4444;
		letter-spacing: 0.04em;
		margin: 0;
	}

	.consent-desc {
		font-size: 0.875rem;
		color: rgba(255, 200, 200, 0.85);
		line-height: 1.6;
		margin: 0;
	}

	.consent-phrase-box {
		background: rgba(220, 38, 38, 0.15);
		border: 1.5px dashed rgba(220, 38, 38, 0.5);
		border-radius: 0.75rem;
		padding: 1rem 1.25rem;
		text-align: center;
	}

	.consent-phrase {
		font-size: 1rem;
		font-weight: 800;
		color: #fca5a5;
		letter-spacing: 0.06em;
		font-family: monospace;
		word-break: break-word;
	}

	.consent-input-wrap {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.consent-input {
		width: 100%;
		padding: 0.75rem 1rem;
		border-radius: 0.625rem;
		border: 2px solid rgba(220, 38, 38, 0.4);
		background: rgba(255, 255, 255, 0.05);
		color: white;
		font-size: 0.9rem;
		font-weight: 600;
		outline: none;
		transition:
			border-color 0.2s,
			box-shadow 0.2s;
		user-select: text !important;
		-webkit-user-select: text !important;
	}

	.consent-input::placeholder {
		color: rgba(255, 255, 255, 0.3);
		font-weight: 400;
	}

	.consent-input:focus {
		border-color: rgba(220, 38, 38, 0.8);
		box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.2);
	}

	.consent-input.match {
		border-color: #22c55e;
		box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.2);
	}

	.consent-hint {
		font-size: 0.75rem;
		color: rgba(255, 200, 200, 0.6);
		margin: 0;
		padding-left: 0.25rem;
		transition: color 0.2s;
	}

	.consent-hint.valid {
		color: #4ade80;
		font-weight: 600;
	}

	.consent-btn {
		width: 100%;
		padding: 0.875rem 1.5rem;
		border-radius: 0.75rem;
		border: none;
		background: linear-gradient(135deg, #dc2626, #b91c1c);
		color: white;
		font-size: 0.9rem;
		font-weight: 800;
		letter-spacing: 0.04em;
		cursor: pointer;
		transition:
			opacity 0.2s,
			transform 0.1s;
	}

	.consent-btn:disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}

	.consent-btn:not(:disabled):hover {
		opacity: 0.9;
		transform: translateY(-1px);
	}

	.consent-btn:not(:disabled):active {
		transform: translateY(0);
	}
</style>
