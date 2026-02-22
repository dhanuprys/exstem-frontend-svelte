<script lang="ts">
	import type { StudentQuestion } from '$lib/services/student/exam.service';

	interface Props {
		questions: StudentQuestion[];
		activeIndex: number;
		answeredCount: number;
		answers: Record<string, string>;
		tempAnswerKeys: string[];
		onSelect: (index: number) => void;
	}

	let { questions, activeIndex, answeredCount, answers, tempAnswerKeys, onSelect }: Props =
		$props();
</script>

<aside class="hidden w-64 shrink-0 overflow-y-auto border-r bg-muted/30 p-4 md:block">
	<p class="mb-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
		Navigasi Soal ({answeredCount}/{questions.length})
	</p>
	<div class="grid grid-cols-5 gap-2">
		{#each questions as q, i (q.id)}
			<button
				onclick={() => onSelect(i)}
				class="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold transition-all
					{i === activeIndex
					? 'bg-primary text-primary-foreground shadow-md ring-2 ring-primary/30'
					: tempAnswerKeys.includes(q.id)
						? 'bg-yellow-500! hover:bg-yellow-600!'
						: answers[q.id]
							? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
							: 'border bg-background text-muted-foreground hover:border-primary/50'}"
			>
				{i + 1}
			</button>
		{/each}
	</div>
</aside>
