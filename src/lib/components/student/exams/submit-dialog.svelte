<script lang="ts">
	import { AlertTriangle } from '@lucide/svelte';

	interface Props {
		answeredCount: number;
		totalQuestions: number;
		onConfirm: () => void;
		onCancel: () => void;
	}

	let { answeredCount, totalQuestions, onConfirm, onCancel }: Props = $props();

	let unanswered = $derived(totalQuestions - answeredCount);
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
	<div class="w-full max-w-sm rounded-2xl bg-card p-8 shadow-2xl">
		<div class="flex flex-col items-center gap-4 text-center">
			<div
				class="flex h-14 w-14 items-center justify-center rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
			>
				<AlertTriangle class="h-7 w-7" />
			</div>
			<h3 class="text-lg font-bold">Kirim Ujian?</h3>
			<p class="text-sm text-muted-foreground">
				Kamu telah menjawab <span class="font-semibold">{answeredCount}</span> dari
				<span class="font-semibold">{totalQuestions}</span> soal.
				{#if unanswered > 0}
					<span class="mt-1 block text-destructive">
						Masih ada {unanswered} soal belum dijawab!
					</span>
				{/if}
			</p>
			<div class="mt-2 flex w-full gap-3">
				<button
					onclick={onCancel}
					class="flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all hover:bg-muted"
				>
					Batal
				</button>
				<button
					onclick={onConfirm}
					class="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90"
				>
					Kirim Sekarang
				</button>
			</div>
		</div>
	</div>
</div>
