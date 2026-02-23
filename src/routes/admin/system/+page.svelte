<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import PageHeader from '$lib/components/ui/page-header.svelte';
	import { toast } from 'svelte-sonner';
	import { Loader2, Radio } from '@lucide/svelte';
	import { systemService } from '$lib/services/admin/system.service';

	let isConnected = $state(false);
	let metrics = $state<any>(null);
	let eventSource: EventSource | null = null;
	let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

	const queues = $derived.by(() => {
		if (!metrics) return [];
		return [
			{ label: 'Answers', value: metrics.queue_answers },
			{ label: 'Cheats', value: metrics.queue_cheats },
			{ label: 'Scores', value: metrics.queue_scores },
			{ label: 'Q. Order', value: metrics.queue_question_order }
		];
	});

	onMount(() => {
		connect();
	});

	onDestroy(() => {
		if (eventSource) eventSource.close();
		if (reconnectTimer) clearTimeout(reconnectTimer);
	});

	function connect() {
		const sseUrl = systemService.getMetricsSseUrl();
		if (!sseUrl) {
			toast.error('Sesi berakhir, silakan login kembali');
			return;
		}

		eventSource = new EventSource(sseUrl);

		eventSource.onmessage = (e) => {
			try {
				metrics = JSON.parse(e.data);
			} catch {
				// ignore malformed
			}
		};

		eventSource.onopen = () => {
			isConnected = true;
		};

		eventSource.onerror = () => {
			isConnected = false;
			if (eventSource) eventSource.close();
			// Auto-reconnect after 3s
			reconnectTimer = setTimeout(connect, 3000);
		};
	}

	function fmtBytes(bytes: number): string {
		if (bytes === 0) return '0 B';
		const units = ['B', 'KB', 'MB', 'GB', 'TB'];
		const i = Math.floor(Math.log(bytes) / Math.log(1024));
		return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + units[i];
	}

	function fmtPercent(val: number): string {
		return val.toFixed(1) + '%';
	}

	function progressColor(percent: number): string {
		if (percent >= 90) return 'bg-red-500';
		if (percent >= 70) return 'bg-amber-500';
		return 'bg-emerald-500';
	}

	function textColor(percent: number): string {
		if (percent >= 90) return 'text-red-600 dark:text-red-400';
		if (percent >= 70) return 'text-amber-600 dark:text-amber-400';
		return 'text-emerald-600 dark:text-emerald-400';
	}
</script>

<svelte:head>
	<title>System Monitor - Exstem</title>
</svelte:head>

<div class="flex h-full flex-1 flex-col space-y-8 p-8">
	<PageHeader
		title="System Monitor"
		description="Monitoring CPU, memori, dan resources server secara real-time"
	>
		<div class="flex items-center gap-3">
			{#if isConnected}
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

	{#if !metrics}
		<div class="flex items-center justify-center py-20">
			<Loader2 class="h-8 w-8 animate-spin text-muted-foreground" />
		</div>
	{:else}
		<!-- Main Gauges -->
		<div class="grid gap-4 md:grid-cols-4">
			<!-- CPU -->
			<div class="rounded-xl border bg-card p-5 text-card-foreground shadow-sm">
				<div class="text-xs font-medium tracking-wide text-muted-foreground uppercase">CPU</div>
				<div class="mt-2 text-3xl font-bold tabular-nums {textColor(metrics.cpu_percent)}">
					{fmtPercent(metrics.cpu_percent)}
				</div>
				<div class="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
					<div
						class="h-full rounded-full transition-all duration-500 {progressColor(
							metrics.cpu_percent
						)}"
						style="width: {Math.min(metrics.cpu_percent, 100)}%"
					></div>
				</div>
				<div class="mt-2 text-[10px] text-muted-foreground">
					{metrics.num_cpu} cores &bull; {metrics.cpu_model}
				</div>
			</div>

			<!-- Memory -->
			<div class="rounded-xl border bg-card p-5 text-card-foreground shadow-sm">
				<div class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Memori</div>
				<div class="mt-2 text-3xl font-bold tabular-nums {textColor(metrics.mem_percent)}">
					{fmtPercent(metrics.mem_percent)}
				</div>
				<div class="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
					<div
						class="h-full rounded-full transition-all duration-500 {progressColor(
							metrics.mem_percent
						)}"
						style="width: {Math.min(metrics.mem_percent, 100)}%"
					></div>
				</div>
				<div class="mt-2 text-[10px] text-muted-foreground">
					{fmtBytes(metrics.mem_used_bytes)} / {fmtBytes(metrics.mem_total_bytes)}
				</div>
			</div>

			<!-- Disk -->
			<div class="rounded-xl border bg-card p-5 text-card-foreground shadow-sm">
				<div class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Disk</div>
				<div class="mt-2 text-3xl font-bold tabular-nums {textColor(metrics.disk_percent)}">
					{fmtPercent(metrics.disk_percent)}
				</div>
				<div class="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
					<div
						class="h-full rounded-full transition-all duration-500 {progressColor(
							metrics.disk_percent
						)}"
						style="width: {Math.min(metrics.disk_percent, 100)}%"
					></div>
				</div>
				<div class="mt-2 text-[10px] text-muted-foreground">
					{fmtBytes(metrics.disk_used_bytes)} / {fmtBytes(metrics.disk_total_bytes)}
				</div>
			</div>

			<!-- Uptime -->
			<div class="rounded-xl border bg-card p-5 text-card-foreground shadow-sm">
				<div class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Uptime</div>
				<div class="mt-2 text-2xl font-bold tabular-nums">{metrics.uptime}</div>
				<div class="mt-5 text-[10px] text-muted-foreground">{metrics.go_version}</div>
			</div>
		</div>

		<!-- Details Grid -->
		<div class="grid gap-6 md:grid-cols-2">
			<!-- Load Average -->
			<div class="rounded-xl border bg-card p-5 text-card-foreground shadow-sm">
				<h3 class="text-sm font-semibold">Load Average</h3>
				<div class="mt-4 grid grid-cols-3 gap-4">
					<div>
						<div class="text-[10px] font-medium text-muted-foreground uppercase">1 min</div>
						<div class="mt-1 text-2xl font-bold tabular-nums">{metrics.load_avg_1.toFixed(2)}</div>
					</div>
					<div>
						<div class="text-[10px] font-medium text-muted-foreground uppercase">5 min</div>
						<div class="mt-1 text-2xl font-bold tabular-nums">{metrics.load_avg_5.toFixed(2)}</div>
					</div>
					<div>
						<div class="text-[10px] font-medium text-muted-foreground uppercase">15 min</div>
						<div class="mt-1 text-2xl font-bold tabular-nums">{metrics.load_avg_15.toFixed(2)}</div>
					</div>
				</div>
			</div>

			<!-- Go Application -->
			<div class="rounded-xl border bg-card p-5 text-card-foreground shadow-sm">
				<h3 class="text-sm font-semibold">Aplikasi (Go Runtime)</h3>
				<div class="mt-4 grid grid-cols-2 gap-x-6 gap-y-3">
					<div class="flex items-center justify-between">
						<span class="text-xs text-muted-foreground">Goroutines</span>
						<span class="text-sm font-bold tabular-nums">{metrics.goroutines.toLocaleString()}</span
						>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-xs text-muted-foreground">Heap Alloc</span>
						<span class="text-sm font-bold tabular-nums">{fmtBytes(metrics.heap_alloc)}</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-xs text-muted-foreground">Heap Sys</span>
						<span class="text-sm font-bold tabular-nums">{fmtBytes(metrics.heap_sys)}</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-xs text-muted-foreground">Stack</span>
						<span class="text-sm font-bold tabular-nums">{fmtBytes(metrics.stack_inuse)}</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-xs text-muted-foreground">App RSS</span>
						<span class="text-sm font-bold tabular-nums">{fmtBytes(metrics.app_rss_bytes)}</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-xs text-muted-foreground">GC Cycles</span>
						<span class="text-sm font-bold tabular-nums">{metrics.num_gc.toLocaleString()}</span>
					</div>
				</div>
			</div>
		</div>

		<!-- Worker Queues -->
		<div class="rounded-xl border bg-card p-5 text-card-foreground shadow-sm">
			<h3 class="text-sm font-semibold">Worker Queues (Pending Jobs)</h3>
			<div class="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
				{#each queues as q}
					<div class="rounded-lg bg-muted/50 p-3 text-center">
						<div class="text-[10px] font-medium text-muted-foreground uppercase">{q.label}</div>
						<div
							class="mt-1 text-2xl font-bold tabular-nums {q.value > 100
								? 'text-red-600 dark:text-red-400'
								: q.value > 0
									? 'text-amber-600 dark:text-amber-400'
									: 'text-emerald-600 dark:text-emerald-400'}"
						>
							{(q.value ?? 0).toLocaleString()}
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
