<script lang="ts">
	import {
		dashboardService,
		type DashboardData
	} from '$lib/services/admin/dashboard.service';
	import PageHeader from '$lib/components/ui/page-header.svelte';
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import * as Table from '$lib/components/ui/table';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { Users, FileText, Library, FileQuestion, CalendarDays, Activity } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import { onMount } from 'svelte';

	let data: DashboardData | null = $state(null);
	let isLoading = $state(true);

	onMount(async () => {
		try {
			const res = await dashboardService.getDashboardData();
			data = res.data.data;
		} catch (error) {
			toast.error('Gagal memuat data dashboard');
		} finally {
			isLoading = false;
		}
	});

	function getStatusColor(status: string) {
		switch (status) {
			case 'PUBLISHED':
				return 'bg-blue-500 hover:bg-blue-600 text-white';
			case 'IN_PROGRESS':
				return 'bg-green-500 hover:bg-green-600 text-white';
			case 'COMPLETED':
				return 'bg-purple-500 hover:bg-purple-600 text-white';
			case 'ARCHIVED':
				return 'bg-zinc-500 hover:bg-zinc-600 text-white';
			case 'DRAFT':
			default:
				return 'bg-secondary hover:bg-secondary/80 text-secondary-foreground';
		}
	}

	function translateStatus(status: string) {
		switch (status) {
			case 'DRAFT':
				return 'Draft';
			case 'PUBLISHED':
				return 'Terjadwal';
			case 'IN_PROGRESS':
				return 'Sedang Berlangsung';
			case 'COMPLETED':
				return 'Selesai';
			case 'ARCHIVED':
				return 'Diarsipkan';
			default:
				return status;
		}
	}

	function formatDate(dateString: string) {
		return new Intl.DateTimeFormat('id-ID', {
			dateStyle: 'medium',
			timeStyle: 'short'
		}).format(new Date(dateString));
	}
</script>

<svelte:head>
	<title>Dashboard Admin - Exstem</title>
</svelte:head>

<div class="flex h-full flex-1 flex-col space-y-8 p-8">
	<PageHeader
		title="Dashboard Admin"
		description="Ringkasan aktivitas dan metrik utama Exstem CBT."
	/>

	{#if isLoading}
		<div class="space-y-6">
			<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				{#each Array(4) as _}
					<Skeleton class="h-32 w-full rounded-xl" />
				{/each}
			</div>
			<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
				<Skeleton class="h-96 w-full rounded-xl lg:col-span-3" />
				<Skeleton class="h-96 w-full rounded-xl lg:col-span-4" />
			</div>
			<Skeleton class="h-64 w-full rounded-xl" />
		</div>
	{:else if data}
		<!-- Row 1: Summary Cards -->
		<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			<Card.Root>
				<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
					<Card.Title class="text-sm font-medium">Total Siswa</Card.Title>
					<Users class="size-4 text-muted-foreground" />
				</Card.Header>
				<Card.Content>
					<div class="text-2xl font-bold">{data.total_students}</div>
					<p class="text-xs text-muted-foreground">Siswa Terdaftar</p>
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
					<Card.Title class="text-sm font-medium">Total Ujian</Card.Title>
					<FileText class="size-4 text-muted-foreground" />
				</Card.Header>
				<Card.Content>
					<div class="text-2xl font-bold">{data.total_exams}</div>
					<p class="text-xs text-muted-foreground">Semua Status</p>
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
					<Card.Title class="text-sm font-medium">Bank Soal</Card.Title>
					<Library class="size-4 text-muted-foreground" />
				</Card.Header>
				<Card.Content>
					<div class="text-2xl font-bold">{data.total_question_banks}</div>
					<p class="text-xs text-muted-foreground">Kategori Tersimpan</p>
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
					<Card.Title class="text-sm font-medium">Total Soal</Card.Title>
					<FileQuestion class="size-4 text-muted-foreground" />
				</Card.Header>
				<Card.Content>
					<div class="text-2xl font-bold">{data.total_questions}</div>
					<p class="text-xs text-muted-foreground">Dalam Sistem</p>
				</Card.Content>
			</Card.Root>
		</div>

		<!-- Row 2: Charts / Status overview -->
		<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
			<Card.Root class="lg:col-span-3">
				<Card.Header>
					<Card.Title>Status Ujian</Card.Title>
					<Card.Description>Distribusi ujian berdasarkan status</Card.Description>
				</Card.Header>
				<Card.Content>
					<div class="space-y-4">
						{#each Object.entries(data.exam_status_counts).sort((a, b) => b[1] - a[1]) as [status, count]}
							<div class="flex items-center">
								<div class="ml-4 space-y-1">
									<p class="text-sm leading-none font-medium">{translateStatus(status)}</p>
								</div>
								<div class="ml-auto flex items-center gap-4">
									<div class="font-medium">{count}</div>
									<Badge class={getStatusColor(status)} variant="outline">{status}</Badge>
								</div>
							</div>
						{/each}

						{#if Object.keys(data.exam_status_counts).length === 0}
							<div class="py-4 text-center text-sm text-muted-foreground">Belum ada ujian</div>
						{/if}
					</div>
				</Card.Content>
			</Card.Root>

			<Card.Root class="lg:col-span-4">
				<Card.Header>
					<Card.Title>Ujian Mendatang</Card.Title>
					<Card.Description>Jadwal selanjutnnya</Card.Description>
				</Card.Header>
				<Card.Content>
					<div class="space-y-4">
						{#each data.upcoming_exams as exam}
							<div class="flex items-center justify-between rounded-lg border p-4">
								<div class="flex flex-col gap-1">
									<p class="text-sm font-medium">{exam.title}</p>
									<div class="flex items-center gap-2 text-xs text-muted-foreground">
										<CalendarDays class="size-3" />
										{exam.scheduled_start
											? formatDate(exam.scheduled_start)
											: 'Waktu tidak ditentukan'}
										<span class="mx-1">•</span>
										{exam.duration_minutes} Menit
									</div>
								</div>
								<Badge>Mendatang</Badge>
							</div>
						{/each}

						{#if data.upcoming_exams.length === 0}
							<div class="flex h-32 flex-col items-center justify-center text-center">
								<CalendarDays class="mb-2 size-8 text-muted-foreground/50" />
								<p class="text-sm text-muted-foreground">Tidak ada jadwal mendatang</p>
							</div>
						{/if}
					</div>
				</Card.Content>
			</Card.Root>
		</div>

		<!-- Row 3: Recent Activity -->
		<Card.Root>
			<Card.Header>
				<Card.Title>Riwayat Ujian Terakhir</Card.Title>
				<Card.Description>Hasil rata-rata dari ujian yang telah diselesaikan</Card.Description>
			</Card.Header>
			<Card.Content>
				{#if data.recent_completed_exams.length === 0}
					<div class="flex h-32 flex-col items-center justify-center text-center">
						<Activity class="mb-2 size-8 text-muted-foreground/50" />
						<p class="text-sm text-muted-foreground">Belum ada riwayat ujian yang selesai</p>
					</div>
				{:else}
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Judul Ujian</Table.Head>
								<Table.Head>Waktu Selesai</Table.Head>
								<Table.Head class="text-center">Peserta</Table.Head>
								<Table.Head class="text-right">Rata-rata Nilai</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each data.recent_completed_exams as exam}
								<Table.Row>
									<Table.Cell class="font-medium">{exam.title}</Table.Cell>
									<Table.Cell
										>{exam.end_date_time ? formatDate(exam.end_date_time) : '-'}</Table.Cell
									>
									<Table.Cell class="text-center">{exam.participant_count}</Table.Cell>
									<Table.Cell class="text-right">
										{#if exam.average_score !== null}
											<Badge variant="outline" class="font-mono"
												>{exam.average_score.toFixed(1)}</Badge
											>
										{:else}
											<span class="text-muted-foreground">-</span>
										{/if}
									</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				{/if}
			</Card.Content>
		</Card.Root>
	{/if}
</div>
