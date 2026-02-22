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
		onAnswer,
		onTempAnswer,
		onPrev,
		onNext,
		canGoPrev,
		canGoNext
	}: Props = $props();

	let isTempAnswer = $derived(tempAnswerKeys.includes(question.id));
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
					{#each question.options as option, optIdx (optIdx)}
						{@const isSelected = selectedAnswer === String(optIdx)}
						<a
							href="##"
							onclick={() => {
								onAnswer(question.id, optIdx, isSelected);
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
								{String.fromCharCode(65 + optIdx)}
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
				class="flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition-all hover:bg-muted disabled:cursor-not-allowed disabled:opacity-30"
			>
				<ChevronLeft class="h-4 w-4" />
				Sebelumnya
			</button>

			<span class="text-sm font-medium text-muted-foreground md:hidden">
				{questionIndex + 1} / {totalQuestions}
			</span>

			<button
				onclick={onNext}
				disabled={!canGoNext}
				class="flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition-all hover:bg-muted disabled:cursor-not-allowed disabled:opacity-30"
			>
				Selanjutnya
				<ChevronRight class="h-4 w-4" />
			</button>
		</div>
	</div>
</div>
