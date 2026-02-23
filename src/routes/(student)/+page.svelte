<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { lobbyService, type LobbyExam } from '$lib/services/student/lobby.service';
	import { profileStore } from '$lib/stores/student/profile-store.svelte';
	import {
		ClipboardList,
		Clock,
		ArrowRight,
		BookOpen,
		CheckCircle,
		Play,
		Loader2
	} from '@lucide/svelte';

	let exams: LobbyExam[] = $state([]);
	let isLoading = $state(true);
	let error = $state('');

	onMount(async () => {
		try {
			const res = await lobbyService.getExams();
			exams = res.data.data || [];
		} catch (err) {
			error = 'Gagal memuat daftar ujian. Silakan coba lagi.';
		} finally {
			isLoading = false;
		}
	});

	function getStatusBadge(exam: LobbyExam) {
		switch (exam.lobby_status) {
			case 'COMPLETED':
				return {
					label: `Selesai — ${exam.final_score?.toFixed(1) ?? '0'}`,
					class: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
				};
			case 'CLOSED':
				return {
					label: 'Waktu Habis',
					class: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
				};
			case 'IN_PROGRESS':
				return {
					label: 'Sedang Dikerjakan',
					class: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
				};
			case 'UPCOMING':
				return {
					label: 'Akan Datang',
					class: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300'
				};
			default:
				return {
					label: 'Belum Dikerjakan',
					class: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
				};
		}
	}

	function formatDate(dateStr?: string) {
		if (!dateStr) return '-';
		return new Date(dateStr).toLocaleString('id-ID', {
			weekday: 'short',
			day: 'numeric',
			month: 'short',
			hour: '2-digit',
			minute: '2-digit',
			hour12: false
		});
	}

	function handleExamClick(exam: LobbyExam) {
		if (exam.lobby_status === 'COMPLETED' || exam.lobby_status === 'UPCOMING') return;

		if (exam.lobby_status === 'IN_PROGRESS') {
			goto(`/exams/${exam.id}`);
		} else {
			goto(`/join/${exam.id}`);
		}
	}
</script>

<svelte:head>
	<title>Lobby - Exstem</title>
</svelte:head>

<div class="mx-auto max-w-4xl space-y-6 p-4 sm:p-6 md:space-y-8 md:p-8">
	<!-- Page Header -->
	<div class="space-y-2">
		<h1 class="text-2xl font-bold tracking-tight md:text-3xl">Daftar Ujian</h1>
		<p class="text-muted-foreground">
			Selamat datang, <span class="font-semibold">{profileStore.student?.name ?? ''}</span>. Berikut
			adalah ujian yang tersedia untuk kamu.
		</p>
	</div>

	<!-- Content -->
	{#if isLoading}
		<div class="flex flex-col items-center justify-center py-24">
			<Loader2 class="h-10 w-10 animate-spin text-primary" />
			<p class="mt-3 text-sm text-muted-foreground">Memuat daftar ujian...</p>
		</div>
	{:else if error}
		<div class="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
			<p class="text-destructive">{error}</p>
		</div>
	{:else if exams.length === 0}
		<div class="flex flex-col items-center justify-center rounded-xl border bg-card py-20">
			<BookOpen class="h-16 w-16 text-muted-foreground/30" />
			<h3 class="mt-4 text-lg font-semibold text-muted-foreground">Tidak ada ujian tersedia</h3>
			<p class="mt-1 text-sm text-muted-foreground/70">
				Belum ada ujian yang dijadwalkan untuk kelasmu saat ini.
			</p>
		</div>
	{:else}
		<div class="grid gap-4">
			{#each exams as exam (exam.id)}
				{@const badge = getStatusBadge(exam)}
				{@const isInteractive =
					exam.lobby_status === 'AVAILABLE' || exam.lobby_status === 'IN_PROGRESS'}

				<button
					class="group w-full rounded-xl border bg-card p-6 text-left shadow-sm transition-all
						{!isInteractive
						? 'cursor-default opacity-75'
						: 'cursor-pointer hover:border-primary/30 hover:shadow-md'}"
					onclick={() => handleExamClick(exam)}
					disabled={!isInteractive}
				>
					<div class="flex items-start justify-between gap-4">
						<div class="flex-1 space-y-3">
							<!-- Title + Badge -->
							<div class="flex flex-wrap items-center gap-3">
								<h3 class="text-lg font-semibold">{exam.title}</h3>
								<span class="rounded-full px-3 py-0.5 text-xs font-semibold {badge.class}">
									{badge.label}
								</span>
							</div>

							<!-- Metadata -->
							<div class="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
								{#if exam.subject_name}
									<span class="flex items-center gap-1.5">
										<ClipboardList class="h-4 w-4" />
										{exam.subject_name}
									</span>
								{/if}
								<span class="flex items-center gap-1.5">
									<Clock class="h-4 w-4" />
									{exam.duration_minutes} menit
								</span>
								{#if exam.scheduled_start}
									<span>
										{formatDate(exam.scheduled_start)}
									</span>
								{/if}
							</div>
						</div>

						<!-- Action Icon -->
						{#if isInteractive}
							<div
								class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full
								{exam.lobby_status === 'IN_PROGRESS'
									? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
									: 'bg-primary/10 text-primary'}
								transition-transform group-hover:scale-110"
							>
								{#if exam.lobby_status === 'IN_PROGRESS'}
									<Play class="h-5 w-5" />
								{:else}
									<ArrowRight class="h-5 w-5" />
								{/if}
							</div>
						{:else if exam.lobby_status === 'COMPLETED'}
							<div
								class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
							>
								<CheckCircle class="h-5 w-5" />
							</div>
						{:else if exam.lobby_status === 'UPCOMING'}
							<div
								class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
							>
								<Clock class="h-5 w-5" />
							</div>
						{/if}
					</div>
				</button>
			{/each}
		</div>
	{/if}
</div>
