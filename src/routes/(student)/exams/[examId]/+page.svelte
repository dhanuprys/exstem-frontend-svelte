<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import type { PageProps } from './$types';
	import {
		studentExamService,
		type ExamPaper,
		type StudentQuestion
	} from '$lib/services/student/exam.service';
	import {
		examWebSocketService,
		type WebSocketCallbacks
	} from '$lib/services/student/websocket.service';
	import { toast } from 'svelte-sonner';
	import { Loader2 } from '@lucide/svelte';

	// Components
	import ExamTopBar from '$lib/components/student/exams/exam-top-bar.svelte';
	import QuestionGrid from '$lib/components/student/exams/question-grid.svelte';
	import QuestionView from '$lib/components/student/exams/question-view.svelte';
	import SubmitDialog from '$lib/components/student/exams/submit-dialog.svelte';
	import ScoreResult from '$lib/components/student/exams/score-result.svelte';
	import AntiCheat from '$lib/components/student/exams/anti-cheat.svelte';
	import type { CheatPayload } from '$lib/types/cheat';

	let { params }: PageProps = $props();
	const examId = $derived(params.examId);

	// ─── State ───────────────────────────────────────────────────────

	let paper = $state<ExamPaper | null>(null);
	let isLoading = $state(true);
	let isSubmitting = $state(false);
	let showConfirmSubmit = $state(false);
	let wsConnected = $state(false);

	let answers = $state<Record<string, string>>({});
	let tempAnswerKeys = $state<string[]>([]); // For "Ragu-ragu" feature
	let activeIndex = $state(0);

	// Timer State
	let remainingSeconds = $state(0); // High precision float
	let timerInterval: ReturnType<typeof setInterval> | null = null;
	let finalScore = $state<number | null>(null);

	// ─── Derived ─────────────────────────────────────────────────────

	let questions = $derived<StudentQuestion[]>(paper?.questions ?? []);
	let activeQuestion = $derived<StudentQuestion | null>(questions[activeIndex] ?? null);

	// Count answered questions (non-empty strings)
	let answeredCount = $derived(Object.keys(answers).filter((k) => answers[k] !== '').length);

	// Format timer: MM:SS
	let timerDisplay = $derived.by(() => {
		if (remainingSeconds <= 0) return '00:00';

		// Math.floor ensures we show "00:00" only when truly finished
		const totalSeconds = Math.floor(remainingSeconds);
		const m = Math.floor(totalSeconds / 60);
		const s = totalSeconds % 60;

		return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
	});

	// Warning state when less than 1 minute remains
	let isTimerCritical = $derived(remainingSeconds <= 60 && remainingSeconds > 0);

	// ─── Lifecycle ───────────────────────────────────────────────────

	onMount(async () => {
		try {
			// 1. Parallel Fetch: Get Paper + Session State
			const [paperRes, stateRes] = await Promise.allSettled([
				studentExamService.getExamPaper(examId),
				studentExamService.getExamSessionState(examId)
			]);

			// 2. Handle Paper (Strict Requirement)
			if (paperRes.status === 'rejected') {
				throw new Error(paperRes.reason || 'Failed to load exam paper');
			}
			paper = paperRes.value.data.data;

			// 3. Handle Session State (Resume or Start New)
			if (stateRes.status === 'fulfilled') {
				const session = stateRes.value.data.data;

				// RESTORE ANSWERS
				if (session.autosaved_answers) {
					answers = session.autosaved_answers;
				}

				// RESTORE TIME (Use backend precise float)
				remainingSeconds = session.remaining_time; // Ensure backend sends this key!
			} else {
				// New session fallback
				remainingSeconds = (paper.duration_minutes ?? 90) * 60;
			}

			// 4. Start the robust timer
			startTimer();

			// 5. Connect WebSocket
			const callbacks: WebSocketCallbacks = {
				onOpen: () => (wsConnected = true),
				onSaved: () => {}, // Optional: Add "Saved" tick in UI
				onGraded: (data) => {
					finalScore = data.score;
					isSubmitting = false;
					stopTimer();
					toast.success(`Ujian selesai! Skor: ${data.score.toFixed(1)}`);
				},
				onError: (error) => {
					toast.error(error);
					isSubmitting = false;
				},
				onClose: () => (wsConnected = false)
			};
			examWebSocketService.connect(examId, callbacks);
		} catch (err) {
			console.error(err);
			toast.error('Gagal memuat soal ujian.');
			goto('/');
		} finally {
			isLoading = false;
		}

		window.addEventListener('beforeunload', handleBeforeUnload);
	});

	onDestroy(() => {
		examWebSocketService.disconnect();
		stopTimer();
		if (typeof window !== 'undefined') {
			window.removeEventListener('beforeunload', handleBeforeUnload);
		}
	});

	function handleBeforeUnload(e: BeforeUnloadEvent) {
		// Prevent accidental close if exam is active and not submitted
		if (finalScore === null && !isSubmitting) {
			e.preventDefault();
			e.returnValue = ''; // Chrome requires this
		}
	}

	// ─── Timer Logic (Anti-Drift) ────────────────────────────────────

	function startTimer() {
		if (timerInterval) clearInterval(timerInterval);

		// Calculate absolute end time based on current local time
		const endTime = Date.now() + remainingSeconds * 1000;

		timerInterval = setInterval(() => {
			const now = Date.now();
			const diffSeconds = (endTime - now) / 1000;

			if (diffSeconds <= 0) {
				remainingSeconds = 0;
				stopTimer();

				// Only trigger submit if we haven't already
				if (finalScore === null && !isSubmitting) {
					toast.warning('Waktu habis! Ujian dikirim otomatis.');
					executeSubmit();
				}
			} else {
				remainingSeconds = diffSeconds;
			}
		}, 1000);
	}

	function stopTimer() {
		if (timerInterval) {
			clearInterval(timerInterval);
			timerInterval = null;
		}
	}

	// ─── Interactions ────────────────────────────────────────────────

	function handleAnswer(questionId: string, answerIndex: number, reset: boolean) {
		const ansStr = String(answerIndex);

		// Optimistic UI Update
		if (reset) {
			const newAnswers = { ...answers };
			delete newAnswers[questionId];
			answers = newAnswers;
		} else {
			answers = { ...answers, [questionId]: ansStr };
		}

		// Send to Server
		examWebSocketService.sendAutosave(questionId, reset ? null : ansStr);
	}

	function handleTempAnswer(questionId: string, status: boolean) {
		if (status) {
			if (!tempAnswerKeys.includes(questionId)) {
				tempAnswerKeys = [...tempAnswerKeys, questionId];
			}
		} else {
			tempAnswerKeys = tempAnswerKeys.filter((id) => id !== questionId);
		}
	}

	function handleCheat(payload: CheatPayload) {
		examWebSocketService.sendCheatReport(payload);
	}

	function executeSubmit() {
		if (isSubmitting) return;
		isSubmitting = true;
		examWebSocketService.sendSubmit();
	}
</script>

{#if isLoading}
	<div class="flex min-h-[calc(100vh-4rem)] items-center justify-center">
		<div class="flex flex-col items-center gap-3">
			<Loader2 class="h-10 w-10 animate-spin text-primary" />
			<p class="text-sm text-muted-foreground">Memuat soal ujian...</p>
		</div>
	</div>
{:else if finalScore !== null}
	<ScoreResult score={finalScore} {answeredCount} totalQuestions={questions.length} />
{:else if paper}
	<div class="flex h-[calc(100vh-4rem)] flex-col">
		<AntiCheat onCheatCapture={handleCheat} />
		<ExamTopBar
			title={paper.title}
			{timerDisplay}
			{isTimerCritical}
			{wsConnected}
			{isSubmitting}
			onSubmit={() => (showConfirmSubmit = true)}
		/>

		<div class="flex flex-1 overflow-hidden">
			<QuestionGrid
				{questions}
				{activeIndex}
				{answeredCount}
				{answers}
				{tempAnswerKeys}
				onSelect={(index) => (activeIndex = index)}
			/>

			{#if activeQuestion}
				<QuestionView
					question={activeQuestion}
					questionIndex={activeIndex}
					totalQuestions={questions.length}
					selectedAnswer={answers[activeQuestion.id]}
					{tempAnswerKeys}
					onAnswer={handleAnswer}
					onTempAnswer={handleTempAnswer}
					onPrev={() => activeIndex > 0 && activeIndex--}
					onNext={() => activeIndex < questions.length - 1 && activeIndex++}
					canGoPrev={activeIndex > 0}
					canGoNext={activeIndex < questions.length - 1}
				/>
			{/if}
		</div>
	</div>

	{#if showConfirmSubmit}
		<SubmitDialog
			{answeredCount}
			totalQuestions={questions.length}
			onCancel={() => (showConfirmSubmit = false)}
			onConfirm={() => {
				showConfirmSubmit = false;
				executeSubmit();
			}}
		/>
	{/if}
{/if}

<style>
	:global(body) {
		overflow: hidden; /* Prevent scrolling the whole page during exam */
	}
</style>
