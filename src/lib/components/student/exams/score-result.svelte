<script lang="ts">
	import { profileStore } from '$lib/stores/student/profile-store.svelte';

	interface Props {
		score: number;
		answeredCount: number;
		totalQuestions: number;
	}

	let { score, answeredCount, totalQuestions }: Props = $props();
</script>

<div class="flex min-h-[calc(100vh-4rem)] items-center justify-center p-6">
	<div class="w-full max-w-md rounded-2xl border bg-card p-10 text-center shadow-xl">
		<div
			class="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full
				{score >= 70 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-yellow-100 dark:bg-yellow-900/30'}"
		>
			<span
				class="text-3xl font-black {score >= 70
					? 'text-green-700 dark:text-green-300'
					: 'text-yellow-700 dark:text-yellow-300'}"
			>
				{score.toFixed(0)}
			</span>
		</div>
		<h2 class="text-2xl font-bold">Ujian Selesai!</h2>
		<p class="mt-2 text-muted-foreground">
			Kamu menjawab <span class="font-semibold">{answeredCount}</span> dari
			<span class="font-semibold">{totalQuestions}</span> soal.
		</p>
		<p class="mt-1 text-sm text-muted-foreground">
			Skor akhir: <span class="font-bold text-foreground">{score.toFixed(1)}</span>
		</p>
		<button
			onclick={() => profileStore.logout()}
			class="mt-8 flex h-11 w-full items-center justify-center rounded-xl bg-primary font-semibold text-primary-foreground transition-all hover:bg-primary/90"
		>
			Logout
		</button>
	</div>
</div>
