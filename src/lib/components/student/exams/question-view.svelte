<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import type { StudentQuestion } from '$lib/services/student/exam.service';
	import { overrideAssetUrls } from '$lib/utils/assets';
	import { ChevronLeft, ChevronRight } from '@lucide/svelte';

	interface Props {
		question: StudentQuestion;
		questionIndex: number;
		totalQuestions: number;
		selectedAnswer: string | undefined;
		tempAnswerKeys: string[];
		isRandomOrder: boolean;
		onAnswer: (questionId: string, answerIndex: number, reset: boolean) => void;
		onTempAnswer: (questionId: string, status: boolean) => void;
		onPrev: () => void;
		onNext: () => void;
		canGoPrev: boolean;
		canGoNext: boolean;
	}

	let {
		question,
		questionIndex,
		totalQuestions,
		selectedAnswer,
		tempAnswerKeys,
		isRandomOrder = false,
		onAnswer,
		onTempAnswer,
		onPrev,
		onNext,
		canGoPrev,
		canGoNext
	}: Props = $props();

	let isTempAnswer = $derived(tempAnswerKeys.includes(question.id));

	/**
	 * Creates a deterministic shuffle map for option indices based on the question ID.
	 * This ensures the same question always shows options in the same shuffled order
	 * for this student, even across page reloads.
	 *
	 * Returns an array where shuffledMap[displayIndex] = originalIndex
	 */
	function buildShuffleMap(questionId: string, optionCount: number): number[] {
		const indices = Array.from({ length: optionCount }, (_, i) => i);
		if (!isRandomOrder || optionCount <= 1) return indices;

		// Simple seeded PRNG from question ID
		let seed = 0;
		for (let i = 0; i < questionId.length; i++) {
			seed = ((seed << 5) - seed + questionId.charCodeAt(i)) | 0;
		}
		const nextRand = () => {
			seed = (seed * 1664525 + 1013904223) | 0;
			return (seed >>> 0) / 4294967296;
		};

		// Fisher-Yates shuffle with seeded RNG
		for (let i = indices.length - 1; i > 0; i--) {
			const j = Math.floor(nextRand() * (i + 1));
			[indices[i], indices[j]] = [indices[j], indices[i]];
		}
		return indices;
	}

	// shuffleMap[displayIndex] = originalIndex
	let shuffleMap = $derived(buildShuffleMap(question.id, question.options.length));

	// reverseMap[originalIndex] = displayIndex (for highlighting selected answer)
	let reverseMap = $derived.by(() => {
		const map: Record<number, number> = {};
		for (let i = 0; i < shuffleMap.length; i++) {
			map[shuffleMap[i]] = i;
		}
		return map;
	});
</script>

<div class="relative flex-1">
	<div class="absolute inset-0 flex flex-col">
		<div class="max-h-full w-full flex-auto overflow-y-auto p-6 md:p-8">
			<div class="mx-auto max-w-3xl space-y-6 pb-12">
				<div class="flex items-center justify-between gap-2">
					<!-- Question Number -->
					<div class="flex items-center gap-3">
						<span
							class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary"
						>
							{questionIndex + 1}
						</span>
						<span class="text-sm text-muted-foreground">dari {totalQuestions} soal</span>
					</div>
					<Button
						onclick={() => onTempAnswer(question.id, !isTempAnswer)}
						class={!isTempAnswer ? 'bg-yellow-500! hover:bg-yellow-600!' : ''}
						variant="outline"
					>
						{isTempAnswer ? 'Hapus Keraguan' : 'Tandai sebagai ragu'}
					</Button>
				</div>

				<!-- Question Text -->
				<div class="prose dark:prose-invert pointer-events-none! max-w-none [&>p]:mb-3">
					{@html overrideAssetUrls(question.question_text)}
				</div>

				<!-- Options -->
				<div class="space-y-3">
					{#each shuffleMap as originalIdx, displayIdx (displayIdx)}
						{@const option = question.options[originalIdx]}
						{@const isSelected = selectedAnswer === String(originalIdx)}
						<a
							href="##"
							onclick={() => {
								onAnswer(question.id, originalIdx, isSelected);
								if (isTempAnswer) {
									onTempAnswer(question.id, false);
								}
							}}
							class="flex w-full items-start gap-3 rounded-xl border-2 p-4 text-left transition-all
						{isSelected
								? 'border-primary bg-primary/5 shadow-sm'
								: 'border-transparent bg-muted/50 hover:border-muted-foreground/20 hover:bg-muted'}"
						>
							<span
								class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold
							{isSelected ? 'bg-primary text-primary-foreground' : 'border bg-background text-muted-foreground'}"
							>
								{String.fromCharCode(65 + displayIdx)}
							</span>
							<div class="prose dark:prose-invert pointer-events-none! max-w-none [&>p]:mb-2">
								{@html overrideAssetUrls(option)}
							</div>
						</a>
					{/each}
				</div>
			</div>
		</div>

		<!-- Bottom Navigation -->
		<div class="flex items-center justify-between border-t bg-background px-6 py-4">
			<button
				onclick={onPrev}
				disabled={!canGoPrev}
				class="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-all hover:bg-muted disabled:cursor-not-allowed disabled:opacity-30 sm:px-4"
			>
				<ChevronLeft class="h-4 w-4" />
				<span class="hidden sm:inline">Sebelumnya</span>
			</button>

			<span class="text-sm font-medium text-muted-foreground">
				{questionIndex + 1} / {totalQuestions}
			</span>

			<button
				onclick={onNext}
				disabled={!canGoNext}
				class="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-all hover:bg-muted disabled:cursor-not-allowed disabled:opacity-30 sm:px-4"
			>
				<span class="hidden sm:inline">Selanjutnya</span>
				<ChevronRight class="h-4 w-4" />
			</button>
		</div>
	</div>
</div>
