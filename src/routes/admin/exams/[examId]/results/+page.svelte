<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { examService, type Exam, type ExamTargetRule } from '$lib/services/admin/exam.service';
	import { classService, type Class } from '$lib/services/admin/class.service';
	import PageHeader from '$lib/components/ui/page-header.svelte';
	import PaginationCustom from '$lib/components/ui/pagination-custom.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import { toast } from 'svelte-sonner';
	import { Loader2, ArrowLeft, Download, RefreshCcw } from '@lucide/svelte';
	import type { Pagination } from '$lib/types/api';

	let examId = $page.params.examId as string;
	let exam: Exam | null = $state(null);
	let records: any[] = $state([]);
	let pagination: Pagination = $state({ page: 1, per_page: 20, total_items: 0, total_pages: 1 });
	let isLoading = $state(true);
	let isRefreshing = $state(false);

	const RELIGION_OPTIONS = ['Islam', 'Kristen Protestan', 'Katolik', 'Hindu', 'Buddha', 'Konghucu'];
	const GRADE_OPTIONS = ['X', 'XI', 'XII'];
	const MAJOR_OPTIONS = ['RPL', 'TKJ', 'DKV', 'DPIB', 'TP', 'TKR', 'TSM'];

	let targetRules: ExamTargetRule[] = $state([]);
	let classes: Class[] = $state([]);

	let filters = $state({
		grade_level: '',
		major_code: '',
		group_number: '',
		religion: ''
	});

	function applyRule(rule: ExamTargetRule | null) {
		if (!rule) {
			filters.grade_level = '';
			filters.major_code = '';
			filters.group_number = '';
			filters.religion = '';
		} else if (rule.class_id) {
			// Find the exact class to populate filters since our backend handles components now
			const cls = classes.find((c) => c.id === rule.class_id);
			if (cls) {
				filters.grade_level = String(cls.grade_level);
				filters.major_code = cls.major_code;
				filters.group_number = String(cls.group_number);
			}
			filters.religion = rule.religion || '';
		} else {
			filters.grade_level = rule.grade_level || '';
			filters.major_code = rule.major_code || '';
			filters.group_number = '';
			filters.religion = rule.religion || '';
		}
		loadResults(1);
	}

	async function loadExamInfo() {
		try {
			exam = await examService.getExam(examId);
		} catch (error) {
			toast.error('Gagal memuat info ujian');
			goto('/admin/exams');
		}
	}

	async function loadResults(pageNum = 1) {
		isLoading = true;
		try {
			const cleanFilters: any = {};
			if (filters.grade_level) cleanFilters.grade_level = filters.grade_level;
			if (filters.major_code) cleanFilters.major_code = filters.major_code;
			if (filters.group_number) cleanFilters.group_number = Number(filters.group_number);
			if (filters.religion) cleanFilters.religion = filters.religion;

			const res = await examService.getExamResults(
				examId,
				pageNum,
				pagination.per_page,
				cleanFilters
			);
			records = res.data.results || [];
			if (res.pagination) {
				pagination = res.pagination;
			}
		} catch (error) {
			toast.error('Gagal memuat hasil ujian');
		} finally {
			isLoading = false;
			isRefreshing = false;
		}
	}

	function refreshData() {
		isRefreshing = true;
		loadResults(pagination.page);
	}

	function exportToCSV() {
		if (records.length === 0) {
			toast.info('Tidak ada data untuk diekspor');
			return;
		}

		const headers = [
			'Nama Siswa',
			'NISN',
			'Kelas',
			'Waktu Mulai',
			'Waktu Selesai',
			'Status',
			'Skor Akhir'
		];
		const csvRows = [headers.join(',')];

		for (const r of records) {
			const row = [
				`"${r.student_name || ''}"`,
				`"${r.student_nisn || ''}"`,
				`"${r.class_name || ''}"`,
				r.started_at ? new Date(r.started_at).toLocaleString('id-ID') : '-',
				r.finished_at ? new Date(r.finished_at).toLocaleString('id-ID') : '-',
				r.status === 'COMPLETED'
					? 'Selesai'
					: r.status === 'IN_PROGRESS'
						? 'Mengerjakan'
						: r.status,
				r.final_score !== null ? r.final_score : '-'
			];
			csvRows.push(row.join(','));
		}

		const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.join('\n');
		const encodedUri = encodeURI(csvContent);
		const link = document.createElement('a');
		link.setAttribute('href', encodedUri);
		link.setAttribute(
			'download',
			`Hasil_Ujian_${exam?.title?.replace(/\s+/g, '_') || 'Rekap'}.csv`
		);
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		toast.success('Mengekspor file CSV...');
	}

	onMount(() => {
		loadExamInfo();
		examService
			.getTargetRules(examId)
			.then((r) => (targetRules = r))
			.catch(() => {});
		classService
			.getClasses()
			.then((r) => (classes = r.data?.data?.classes || (r.data as any).classes || []))
			.catch(() => {});
		loadResults();
	});
</script>

<div class="flex h-full flex-1 flex-col space-y-8 p-8">
	<PageHeader
		title="Hasil Ujian"
		description={exam ? `Menampilkan nilai ujian: ${exam.title}` : 'Memuat data ujian...'}
		backUrl="/admin/exams"
	>
		<div class="hidden"></div>
	</PageHeader>

	<div class="flex items-center justify-between rounded-md border bg-card p-4">
		<div class="flex items-center gap-4">
			<div class="rounded-md border bg-muted/30 px-4 py-2 text-sm">
				<span class="mr-2 text-muted-foreground">Total Partisipan:</span>
				<span class="font-bold">{pagination.total_items}</span>
			</div>
		</div>
		<div class="flex items-center gap-2">
			<Button variant="outline" onclick={refreshData} disabled={isRefreshing || isLoading}>
				<RefreshCcw class="mr-2 h-4 w-4 {isRefreshing ? 'animate-spin' : ''}" /> Refresh Live
			</Button>
			<Button variant="default" onclick={exportToCSV} disabled={isLoading || records.length === 0}>
				<Download class="mr-2 h-4 w-4" /> Export CSV
			</Button>
		</div>
	</div>

	{#if targetRules.length > 0}
		<div class="rounded-md border bg-card p-4">
			<h4 class="mb-3 text-sm font-semibold text-muted-foreground">
				Filter Cepat (Berdasarkan Aturan Target)
			</h4>
			<div class="flex flex-wrap gap-2">
				<Button variant="secondary" size="sm" onclick={() => applyRule(null)}>Semua Peserta</Button>
				{#each targetRules as rule}
					<Button variant="outline" size="sm" onclick={() => applyRule(rule)}>
						{#if rule.class_id}
							{#if classes.find((c) => c.id === rule.class_id)}
								Kelas {classes.find((c) => c.id === rule.class_id)?.grade_level}
								{classes.find((c) => c.id === rule.class_id)?.major_code}
								{classes.find((c) => c.id === rule.class_id)?.group_number}
							{:else}
								Kelas Spesifik
							{/if}
						{:else}
							{rule.grade_level || 'Semua Tingkat'}
							{rule.major_code || ''}
							{rule.religion ? `(${rule.religion})` : ''}
						{/if}
					</Button>
				{/each}
			</div>
		</div>
	{/if}

	<div class="grid grid-cols-1 gap-4 rounded-md border bg-card p-4 md:grid-cols-5">
		<select
			bind:value={filters.grade_level}
			class="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none"
		>
			<option value="">— Tingkatan —</option>
			{#each GRADE_OPTIONS as gr}
				<option value={gr}>{gr}</option>
			{/each}
		</select>
		<select
			bind:value={filters.major_code}
			class="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none"
		>
			<option value="">— Jurusan —</option>
			{#each MAJOR_OPTIONS as maj}
				<option value={maj}>{maj}</option>
			{/each}
		</select>
		<input
			type="number"
			placeholder="Grup (Contoh: 1)"
			bind:value={filters.group_number}
			class="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none"
		/>
		<select
			bind:value={filters.religion}
			class="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none"
		>
			<option value="">— Agama —</option>
			{#each RELIGION_OPTIONS as rel}
				<option value={rel}>{rel}</option>
			{/each}
		</select>
		<Button variant="secondary" onclick={() => loadResults(1)} disabled={isLoading} class="w-full">
			Terapkan Filter
		</Button>
	</div>

	<div class="rounded-md border bg-card">
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>Siswa</Table.Head>
					<Table.Head>Kelas & NISN</Table.Head>
					<Table.Head>Mulai</Table.Head>
					<Table.Head>Selesai</Table.Head>
					<Table.Head>Status</Table.Head>
					<Table.Head class="text-right text-lg">Skor</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#if isLoading && !isRefreshing}
					<Table.Row>
						<Table.Cell colspan={6} class="h-48 text-center">
							<Loader2 class="mx-auto h-8 w-8 animate-spin text-primary" />
							<p class="mt-2 text-sm text-muted-foreground">Memuat hasil...</p>
						</Table.Cell>
					</Table.Row>
				{:else if records.length === 0}
					<Table.Row>
						<Table.Cell colspan={6} class="h-48 text-center text-muted-foreground">
							Belum ada satupun siswa yang mengerjakan ujian ini.
						</Table.Cell>
					</Table.Row>
				{:else}
					{#each records as row (row.session_id || row.student_id)}
						<Table.Row>
							<Table.Cell class="font-medium">{row.student_name}</Table.Cell>
							<Table.Cell>
								<div class="text-sm font-medium">{row.class_name || '-'}</div>
								<div class="text-xs text-muted-foreground">{row.student_nisn}</div>
							</Table.Cell>
							<Table.Cell>
								{#if row.started_at}
									{new Date(row.started_at).toLocaleString('id-ID', {
										hour12: false,
										month: 'short',
										day: 'numeric',
										hour: '2-digit',
										minute: '2-digit'
									})}
								{:else}
									<span class="text-muted-foreground">-</span>
								{/if}
							</Table.Cell>
							<Table.Cell>
								{#if row.finished_at}
									{new Date(row.finished_at).toLocaleString('id-ID', {
										hour12: false,
										month: 'short',
										day: 'numeric',
										hour: '2-digit',
										minute: '2-digit'
									})}
								{:else}
									<span class="text-muted-foreground">-</span>
								{/if}
							</Table.Cell>
							<Table.Cell>
								{#if row.status === 'COMPLETED'}
									<span
										class="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800 dark:bg-green-900 dark:text-green-300"
										>Selesai</span
									>
								{:else if row.status === 'IN_PROGRESS'}
									<span
										class="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-900 dark:text-blue-300"
										>Mengerjakan</span
									>
								{:else}
									<span
										class="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-800 dark:bg-gray-800 dark:text-gray-300"
										>{row.status}</span
									>
								{/if}
							</Table.Cell>
							<Table.Cell class="text-right">
								{#if row.final_score !== null}
									<span
										class="text-xl font-bold {row.final_score >= 80
											? 'text-green-600'
											: row.final_score < 50
												? 'text-destructive'
												: ''}"
									>
										<span class="tracking-tighter">{row.final_score}</span><span
											class="ml-1 text-xs text-muted-foreground">/{row.max_score || 100}</span
										>
									</span>
								{:else}
									<span class="text-muted-foreground">-</span>
								{/if}
							</Table.Cell>
						</Table.Row>
					{/each}
				{/if}
			</Table.Body>
		</Table.Root>
	</div>

	<PaginationCustom {pagination} onPageChange={(p) => loadResults(p)} />
</div>
