<script lang="ts">
	import { onMount } from 'svelte';
	import PageHeader from '$lib/components/ui/page-header.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Download, Filter, Loader2, IdCard } from '@lucide/svelte';
	import * as Select from '$lib/components/ui/select/index.js';
	import { studentService, type StudentCardInfo } from '$lib/services/admin/student.service';
	import { classService, type Class } from '$lib/services/admin/class.service';
	import { majorService, type Major } from '$lib/services/admin/major.service';
	import { toast } from 'svelte-sonner';

	let cards: StudentCardInfo[] = $state([]);
	let classes: Class[] = $state([]);
	let majors: Major[] = $state([]);
	let isLoading = $state(false);
	let isDownloading = $state(false);

	let filterClassId: number | undefined = $state(undefined);
	let filterGradeLevel: string | undefined = $state(undefined);
	let filterMajorCode: string | undefined = $state(undefined);

	const GRADE_LEVELS = [
		{ value: 'X', label: 'Kelas 10 (X)' },
		{ value: 'XI', label: 'Kelas 11 (XI)' },
		{ value: 'XII', label: 'Kelas 12 (XII)' }
	];

	const selectedGrade = $derived(GRADE_LEVELS.find((g) => g.value === filterGradeLevel));
	const selectedMajor = $derived(majors.find((m) => m.code === filterMajorCode));
	const selectedClass = $derived(classes.find((c) => c.id === filterClassId));

	const filteredClasses = $derived(
		classes.filter(
			(c) =>
				(!filterGradeLevel || c.grade_level === filterGradeLevel) &&
				(!filterMajorCode || c.major_code === filterMajorCode)
		)
	);

	async function loadFilters() {
		try {
			const [classRes, majorRes] = await Promise.all([
				classService.getClasses(),
				majorService.getMajors()
			]);
			classes = classRes.data?.data?.classes || [];
			majors = majorRes.data?.data?.majors || [];
		} catch (error: any) {
			toast.error('Gagal memuat data filter');
		}
	}

	async function loadCards() {
		try {
			isLoading = true;
			const response = await studentService.getStudentCards(
				filterClassId,
				filterGradeLevel,
				filterMajorCode
			);
			cards = response.data?.data?.cards || [];
		} catch (error: any) {
			toast.error(error.response?.data?.error?.message || 'Gagal memuat kartu siswa');
		} finally {
			isLoading = false;
		}
	}

	async function downloadPDF() {
		try {
			isDownloading = true;
			await studentService.downloadStudentCardsPDF(
				filterClassId,
				filterGradeLevel,
				filterMajorCode
			);
			toast.success('PDF berhasil diunduh');
		} catch (error: any) {
			toast.error('Gagal mengunduh PDF kartu siswa');
		} finally {
			isDownloading = false;
		}
	}

	onMount(() => {
		loadFilters();
		loadCards();
	});
</script>

<svelte:head>
	<title>Kartu Siswa - Exstem</title>
</svelte:head>

<div class="flex h-full flex-1 flex-col space-y-8 p-8">
	<div>
		<PageHeader
			title="Kartu Siswa"
			description="Cetak kartu identitas dan kata sandi siswa untuk keperluan ujian."
		>
			<Button onclick={downloadPDF} disabled={cards.length === 0 || isDownloading}>
				{#if isDownloading}
					<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					Mengunduh...
				{:else}
					<Download class="mr-2 h-4 w-4" /> Unduh PDF ({cards.length})
				{/if}
			</Button>
		</PageHeader>
	</div>

	<div class="rounded-md border bg-background p-4">
		<div class="mb-4 flex items-center gap-4">
			<Filter class="h-4 w-4 text-muted-foreground" />
			<span class="text-sm font-medium">Filter Data</span>
		</div>
		<div class="grid grid-cols-1 gap-4 md:grid-cols-4">
			<div class="grid gap-2">
				<Label>Tingkat</Label>
				<Select.Root
					type="single"
					value={selectedGrade && selectedGrade.value}
					onValueChange={(v) => {
						filterGradeLevel = v;
						filterClassId = undefined; // reset class when grade changes
					}}
				>
					<Select.Trigger>{selectedGrade ? selectedGrade.label : 'Semua Tingkat'}</Select.Trigger>
					<Select.Content>
						<Select.Item value={undefined as any} label="Semua Tingkat">Semua Tingkat</Select.Item>
						{#each GRADE_LEVELS as gl}
							<Select.Item value={gl.value} label={gl.label}>{gl.label}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>

			<div class="grid gap-2">
				<Label>Jurusan</Label>
				<Select.Root
					type="single"
					value={selectedMajor && selectedMajor.code}
					onValueChange={(v) => {
						filterMajorCode = v || undefined;
						filterClassId = undefined; // reset class when major changes
					}}
				>
					<Select.Trigger>{selectedMajor ? selectedMajor.long_name : 'Semua Jurusan'}</Select.Trigger>
					<Select.Content>
						<Select.Item value={undefined as any} label="Semua Jurusan">Semua Jurusan</Select.Item>
						{#each majors as m}
							<Select.Item value={m.code} label={m.long_name}>{m.long_name}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>

			<div class="grid gap-2">
				<Label>Pilih Spesifik Kelas</Label>
				<Select.Root
					type="single"
					value={selectedClass && selectedClass.id.toString()}
					onValueChange={(v) => {
						filterClassId = v ? parseInt(v) : undefined;
					}}
				>
					<Select.Trigger>
						{selectedClass
							? `${selectedClass.grade_level} ${selectedClass.major_code} ${selectedClass.group_number}`
							: 'Semua Kelas'}
					</Select.Trigger>
					<Select.Content>
						<Select.Item value={undefined as any} label="Semua Kelas">Semua Kelas</Select.Item>
					{#each filteredClasses as cls}
							<Select.Item
								value={cls.id.toString()}
								label={`${cls.grade_level} ${cls.major_code} ${cls.group_number}`}
							>
								{cls.grade_level}
								{cls.major_code}
								{cls.group_number}
							</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>

			<div class="flex items-end">
				<Button variant="secondary" onclick={loadCards} class="w-full">
					<Filter class="mr-2 h-4 w-4" /> Terapkan Filter
				</Button>
			</div>
		</div>
	</div>

	<!-- Cards Grid -->
	{#if isLoading}
		<div class="flex h-32 items-center justify-center">
			<Loader2 class="h-8 w-8 animate-spin text-muted-foreground" />
		</div>
	{:else if cards.length === 0}
		<div class="rounded-md border border-dashed p-8 text-center">
			<IdCard class="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
			<p class="text-sm text-muted-foreground">Tidak ada siswa ditemukan.</p>
		</div>
	{:else}
		<div
			class="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4"
		>
			{#each cards as student (student.id)}
				<div
					class="relative break-inside-avoid overflow-hidden rounded-xl border-2 border-border bg-card text-card-foreground shadow-sm"
				>
					<!-- Card Header -->
					<div
						class="border-b-2 border-border bg-primary/10 px-6 py-4"
					>
						<div class="flex items-center justify-between">
							<div class="font-extrabold tracking-tight text-primary">
								KARTU PESERTA
							</div>
							<div class="text-xs font-bold text-muted-foreground">
								{student.class_name}
							</div>
						</div>
					</div>

					<!-- Card Body -->
					<div class="space-y-4 p-6">
						<div>
							<div class="card-label">
								Nama Lengkap
							</div>
							<div class="truncate font-semibold">{student.name}</div>
						</div>

						<div class="grid grid-cols-2 gap-4">
							<div>
								<div
									class="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase"
								>
									NIS
								</div>
								<div class="text-sm font-medium">
									{student.nis}
								</div>
							</div>
							<div>
								<div
									class="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase"
								>
									NISN
								</div>
								<div class="text-sm font-medium">
									{student.nisn}
								</div>
							</div>
						</div>

						<div
							class="border-t-2 border-dashed border-border pt-4"
						>
							<div
								class="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase print:text-gray-600"
							>
								Kata Sandi Ujian
							</div>
							<div
								class="font-mono text-lg font-bold tracking-widest text-primary"
							>
								{student.password || '-'}
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.card-label {
		font-size: 10px;
		font-weight: 600;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: var(--color-muted-foreground);
	}
</style>
