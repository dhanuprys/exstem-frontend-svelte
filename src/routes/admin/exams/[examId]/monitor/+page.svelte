<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { examService, type Exam } from '$lib/services/admin/exam.service';
	import PageHeader from '$lib/components/ui/page-header.svelte';
	import * as Table from '$lib/components/ui/table/index.js';
	import { toast } from 'svelte-sonner';
	import { Loader2, Activity, Radio } from '@lucide/svelte';
	import { STORAGE_KEYS } from '$lib/utils/constants';

	let examId = $page.params.examId as string;
	let exam: Exam | null = $state(null);
	let isLoading = $state(true);
	let sseConnected = $state(false);

	let stats = $state({
		total_joined: 0,
		total_in_progress: 0,
		total_completed: 0,
		total_cheats: 0
	});

	let students: any[] = $state([]);
	let events: any[] = $state([]);
	let totalQuestions = $state(0);

	let eventSource: EventSource | null = null;
	let eventIdCounter = 0;

	// ── Batching: buffer incoming events and flush to DOM at interval ──
	const FLUSH_INTERVAL_MS = 400;
	const MAX_FEED_ITEMS = 30;
	let pendingEvents: any[] = [];
	let pendingStudentUpdates: Map<number, any> = new Map();
	let pendingStatsDelta = { joined: 0, in_progress: 0, completed: 0, cheats: 0 };
	let flushTimer: ReturnType<typeof setInterval> | null = null;

	onMount(() => {
		loadExamInfo();
		flushTimer = setInterval(flushBatch, FLUSH_INTERVAL_MS);
	});

	onDestroy(() => {
		if (eventSource) eventSource.close();
		if (flushTimer) clearInterval(flushTimer);
	});

	async function loadExamInfo() {
		try {
			const res = await examService.getExam(examId);
			exam = res.data;
			connectToSSE();
		} catch (error) {
			toast.error('Gagal memuat info ujian');
			goto('/admin/exams');
		} finally {
			isLoading = false;
		}
	}

	function connectToSSE() {
		const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
		if (!token) {
			toast.error('Sesi berakhir, silakan login kembali');
			return;
		}

		const sseUrl = examService.getMonitorSseUrl(examId, token);
		eventSource = new EventSource(sseUrl);

		eventSource.onmessage = (e) => {
			try {
				const payload = JSON.parse(e.data);
				bufferSSEEvent(payload);
			} catch (err) {
				console.error('Failed to parse SSE message', err);
			}
		};

		eventSource.onopen = () => {
			sseConnected = true;
		};

		eventSource.onerror = () => {
			sseConnected = false;
		};
	}

	/** Buffer incoming event instead of updating DOM immediately */
	function bufferSSEEvent(payload: any) {
		// Snapshot is applied immediately (only happens once on connect)
		if (payload.type === 'snapshot') {
			stats = { ...stats, ...payload.data.stats };
			students = payload.data.students || [];
			if (payload.data.exam?.total_questions) {
				totalQuestions = payload.data.exam.total_questions;
			}
			return;
		}

		if (payload.type === 'ping') return;

		// Refresh: periodic answered-count update from the server
		if (payload.type === 'refresh') {
			if (payload.total_questions) totalQuestions = payload.total_questions;
			if (payload.total_cheats !== undefined) stats.total_cheats = payload.total_cheats;
			const updates: any[] = payload.students || [];
			let updated = [...students];
			for (const upd of updates) {
				const idx = updated.findIndex((s) => s.student_id === upd.student_id);
				if (idx !== -1) {
					updated[idx] = {
						...updated[idx],
						answered_count: upd.answered_count,
						cheat_count: upd.cheat_count
					};
				}
			}
			students = updated;
			return;
		}

		if (!['join', 'autosave', 'cheat', 'submit'].includes(payload.type)) return;

		// Buffer the feed entry
		pendingEvents.push({ ...payload, _id: eventIdCounter++, _time: new Date() });

		// Buffer stats deltas
		if (payload.type === 'join') {
			const exists =
				students.some((s) => s.student_id === payload.student_id) ||
				[...pendingStudentUpdates.values()].some(
					(u) => u.student_id === payload.student_id && u._action === 'join'
				);
			if (!exists) {
				pendingStatsDelta.joined++;
				pendingStatsDelta.in_progress++;
				pendingStudentUpdates.set(payload.student_id, {
					_action: 'join',
					student_id: payload.student_id,
					name: payload.student_name,
					class_name: payload.class_name || '-',
					status: 'IN_PROGRESS',
					score: 0
				});
			}
		} else if (payload.type === 'submit') {
			pendingStatsDelta.in_progress--;
			pendingStatsDelta.completed++;
			pendingStudentUpdates.set(payload.student_id, {
				_action: 'submit',
				student_id: payload.student_id,
				status: 'COMPLETED',
				score: payload.score
			});
		} else if (payload.type === 'cheat') {
			pendingStatsDelta.cheats++;
			const idx = students.findIndex((s) => s.student_id === payload.student_id);
			if (idx !== -1) {
				pendingStudentUpdates.set(payload.student_id, {
					_action: 'update_cheat',
					student_id: payload.student_id
				});
			}
		}
		// autosave: no student table mutation needed
	}

	/** Flush buffered data to DOM in one batch */
	function flushBatch() {
		let dirty = false;

		// 1. Flush feed events
		if (pendingEvents.length > 0) {
			events = [...pendingEvents.reverse(), ...events].slice(0, MAX_FEED_ITEMS);
			pendingEvents = [];
			dirty = true;
		}

		// 2. Flush stats
		if (
			pendingStatsDelta.joined ||
			pendingStatsDelta.in_progress ||
			pendingStatsDelta.completed ||
			pendingStatsDelta.cheats
		) {
			stats.total_joined += pendingStatsDelta.joined;
			stats.total_in_progress += pendingStatsDelta.in_progress;
			stats.total_completed += pendingStatsDelta.completed;
			stats.total_cheats += pendingStatsDelta.cheats;
			// Clamp
			if (stats.total_in_progress < 0) stats.total_in_progress = 0;
			pendingStatsDelta = { joined: 0, in_progress: 0, completed: 0, cheats: 0 };
			dirty = true;
		}

		// 3. Flush student table updates
		if (pendingStudentUpdates.size > 0) {
			let updated = [...students];
			for (const [sid, upd] of pendingStudentUpdates) {
				const idx = updated.findIndex((s) => s.student_id === sid);
				if (upd._action === 'join' && idx === -1) {
					updated.push(upd);
				} else if (upd._action === 'submit' && idx !== -1) {
					updated[idx] = { ...updated[idx], status: 'COMPLETED', score: upd.score };
				} else if (upd._action === 'update_cheat' && idx !== -1) {
					updated[idx] = { ...updated[idx], cheat_count: (updated[idx].cheat_count || 0) + 1 };
				}
			}
			students = updated;
			pendingStudentUpdates.clear();
			dirty = true;
		}
	}

	function formatTime(date: Date): string {
		return date.toLocaleTimeString('id-ID', {
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit'
		});
	}

	const eventConfig: Record<string, { icon: string; color: string; bg: string }> = {
		join: { icon: '↗', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10' },
		autosave: {
			icon: '●',
			color: 'text-emerald-600 dark:text-emerald-400',
			bg: 'bg-emerald-500/10'
		},
		cheat: { icon: '⚠', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10' },
		submit: { icon: '✓', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' }
	};
</script>

<svelte:head>
	<title>Live Monitor Ujian - Exstem</title>
</svelte:head>

<div class="flex h-full flex-1 flex-col space-y-8 p-8">
	<!-- Header -->
	<PageHeader
		title="Live Monitor Ujian"
		description={exam ? exam.title + ' (Data hanya akan diperbaharui ketika ada aktivitas)' : 'Memuat...'}
		backUrl="/admin/exams"
	>
		<div class="flex items-center gap-3">
			{#if sseConnected}
				<div class="flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1">
					<Radio class="h-3.5 w-3.5 animate-pulse text-green-500" />
					<span class="text-xs font-semibold text-green-600 dark:text-green-400">LIVE</span>
				</div>
			{:else}
				<div class="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1">
					<Radio class="h-3.5 w-3.5 text-muted-foreground" />
					<span class="text-xs font-semibold text-muted-foreground">OFFLINE</span>
				</div>
			{/if}
		</div>
	</PageHeader>

	<!-- Content -->
	{#if isLoading}
		<div class="flex items-center justify-center py-20">
			<Loader2 class="h-8 w-8 animate-spin text-muted-foreground" />
		</div>
	{:else if exam}
		<!-- Stats Cards -->
		<div class="grid gap-4 md:grid-cols-4">
			<div class="rounded-xl border bg-card p-5 text-card-foreground shadow-sm">
				<div class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
					Bergabung
				</div>
				<div class="mt-2 text-3xl font-bold tabular-nums">{stats.total_joined}</div>
			</div>
			<div class="rounded-xl border bg-card p-5 text-card-foreground shadow-sm">
				<div class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
					Mengerjakan
				</div>
				<div class="mt-2 text-3xl font-bold text-blue-600 tabular-nums dark:text-blue-400">
					{stats.total_in_progress}
				</div>
			</div>
			<div class="rounded-xl border bg-card p-5 text-card-foreground shadow-sm">
				<div class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Selesai</div>
				<div class="mt-2 text-3xl font-bold text-green-600 tabular-nums dark:text-green-400">
					{stats.total_completed}
				</div>
			</div>
			<div class="rounded-xl border bg-card p-5 text-card-foreground shadow-sm">
				<div class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
					Kecurangan
				</div>
				<div class="mt-2 text-3xl font-bold text-red-600 tabular-nums dark:text-red-400">
					{stats.total_cheats}
				</div>
			</div>
		</div>

		<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
			<!-- Student Table (2/3 width) -->
			<div class="flex max-h-[600px] flex-col rounded-xl border bg-card shadow-sm lg:col-span-2">
				<div class="flex items-center justify-between border-b px-5 py-3">
					<h3 class="text-sm font-semibold">Peserta ({students.length})</h3>
				</div>
				<div class="flex-1 overflow-auto">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head class="pl-5">Nama</Table.Head>
								<Table.Head>Kelas</Table.Head>
								<Table.Head>Jawaban</Table.Head>
								<Table.Head>Curang</Table.Head>
								<Table.Head>Status</Table.Head>
								<Table.Head class="pr-5 text-right">Skor</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each students as student (student.student_id)}
								<Table.Row>
									<Table.Cell class="pl-5 font-medium">{student.name}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{student.class_name || '-'}</Table.Cell>
									<Table.Cell class="tabular-nums">
										<span
											class={student.answered_count >= totalQuestions && totalQuestions > 0
												? 'font-semibold text-green-600'
												: ''}
										>
											{student.answered_count ?? 0}/{totalQuestions}
										</span>
									</Table.Cell>
									<Table.Cell class="tabular-nums">
										<span
											class={student.cheat_count > 0
												? 'font-semibold text-red-600'
												: 'text-muted-foreground'}
										>
											{student.cheat_count ?? 0}
										</span>
									</Table.Cell>
									<Table.Cell>
										{#if student.status === 'COMPLETED'}
											<span
												class="inline-flex items-center gap-1 rounded-md bg-green-500/10 px-2 py-0.5 text-xs font-semibold text-green-700 dark:text-green-400"
											>
												✓ Selesai
											</span>
										{:else}
											<span
												class="inline-flex items-center gap-1 rounded-md bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-400"
											>
												● Mengerjakan
											</span>
										{/if}
									</Table.Cell>
									<Table.Cell class="pr-5 text-right tabular-nums">
										{student.status === 'COMPLETED' ? (student.score ?? 0).toFixed(1) : '-'}
									</Table.Cell>
								</Table.Row>
							{:else}
								<Table.Row>
									<Table.Cell colspan={6} class="h-24 text-center text-muted-foreground">
										Belum ada peserta
									</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</div>
			</div>

			<!-- Live Activity Feed (1/3 width) -->
			<div class="flex max-h-[600px] flex-col rounded-xl border bg-card shadow-sm">
				<div class="flex items-center justify-between border-b px-5 py-3">
					<h3 class="text-sm font-semibold">Log Aktivitas</h3>
					<span
						class="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground tabular-nums"
					>
						{events.length} event
					</span>
				</div>
				<div class="flex-1 overflow-auto">
					{#each events as ev (ev._id)}
						{@const cfg = eventConfig[ev.type] || eventConfig.autosave}
						<div class="flex items-start gap-3 border-b border-border/50 px-4 py-2.5 last:border-0">
							<div
								class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold {cfg.bg} {cfg.color}"
							>
								{cfg.icon}
							</div>
							<div class="min-w-0 flex-1">
								<p class="truncate text-xs leading-snug text-foreground">{ev.message}</p>
								<p class="mt-0.5 text-[10px] text-muted-foreground">{formatTime(ev._time)}</p>
							</div>
						</div>
					{:else}
						<div class="flex h-full items-center justify-center p-10 text-sm text-muted-foreground">
							Menunggu aktivitas…
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/if}
</div>
