<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { Loader2, Users, Download, Calendar, Maximize2, DoorOpen, Search } from '@lucide/svelte';

	import PageHeader from '$lib/components/ui/page-header.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { Input } from '$lib/components/ui/input/index.js';

	import { examService, type Exam } from '$lib/services/admin/exam.service';
	import { roomService, type Room } from '$lib/services/admin/room.service';
	import { classService, type Class } from '$lib/services/admin/class.service';
	import {
		examScheduleService,
		type ExamSchedule,
		type ExamRoomAssignment,
		type AutoDistributeRequest
	} from '$lib/services/admin/exam-schedule.service';

	const examId = page.params.examId as string;

	// Core State
	let exam: Exam | null = $state(null);
	let allRooms: Room[] = $state([]);
	let allClasses: Class[] = $state([]);
	let allExams: Exam[] = $state([]);

	// Distribution State
	let schedules: ExamSchedule[] = $state([]);
	let assignments: ExamRoomAssignment[] = $state([]);
	let hasDistribution = $state(false);

	// Form State
	let sourceMode = $state('target_rules');
	let selectedRoomIds: number[] = $state([]);
	let selectedClassIds: number[] = $state([]);
	let selectedSourceExamId = $state<string | undefined>(undefined);

	// Loading & Modals
	let isLoading = $state(true);
	let isDistributing = $state(false);
	let isExporting = $state(false);
	let isExportingRoom: Record<number, boolean> = $state({});
	let isClearAlertOpen = $state(false);

	// Filter & Search State
	let searchQuery = $state('');
	let filterSession = $state('all'); // 'all' or session ID like '1', '2'

	// Grouped Data for UI
	let groupedDistribution: Record<
		number,
		Record<number, { schedule: ExamSchedule; students: ExamRoomAssignment[] }>
	> = $state({});

	let sortedSessionNums: number[] = $derived(
		Object.keys(groupedDistribution)
			.map(Number)
			.sort((a, b) => a - b)
	);

	let displaySessionNums: number[] = $derived(
		filterSession === 'all'
			? sortedSessionNums
			: sortedSessionNums.filter((n) => n === Number(filterSession))
	);

	async function loadData() {
		isLoading = true;
		try {
			// Fetch exam and basic dependencies
			const [examRes, roomsRes, distRes, classesRes, examsRes] = await Promise.all([
				examService.getExam(examId),
				roomService.getRooms(),
				examScheduleService.getDistribution(examId),
				classService.getClasses(),
				examService.getExams(1, 100) // Need a big list for 'by_exam' dropdown
			]);

			exam = examRes.data as unknown as Exam;
			allRooms = roomsRes.data.data.rooms || [];
			allClasses = classesRes.data.data.classes || [];
			allExams = (examsRes.data as unknown as { exams: Exam[] }).exams || [];

			const distData = distRes.data.data;
			schedules = distData.schedules || [];
			assignments = distData.assignments || [];
			hasDistribution = schedules.length > 0;

			buildGroupedDistribution();
		} catch (error) {
			toast.error('Gagal memuat data distribusi ujian');
			console.error(error);
		} finally {
			isLoading = false;
		}
	}

	function buildGroupedDistribution() {
		// Group by Session -> RoomID
		const grouped: Record<
			number,
			Record<number, { schedule: ExamSchedule; students: ExamRoomAssignment[] }>
		> = {};

		for (const schedule of schedules) {
			if (!grouped[schedule.session_number]) {
				grouped[schedule.session_number] = {};
			}
			grouped[schedule.session_number][schedule.room_id] = {
				schedule,
				students: assignments
					.filter((a) => a.exam_schedule_id === schedule.id)
					.sort((a, b) => a.seat_number - b.seat_number)
			};
		}

		groupedDistribution = grouped;
	}

	function toggleRoom(roomId: number) {
		if (selectedRoomIds.includes(roomId)) {
			selectedRoomIds = selectedRoomIds.filter((id) => id !== roomId);
		} else {
			selectedRoomIds = [...selectedRoomIds, roomId];
		}
	}

	function toggleClass(classId: number) {
		if (selectedClassIds.includes(classId)) {
			selectedClassIds = selectedClassIds.filter((id) => id !== classId);
		} else {
			selectedClassIds = [...selectedClassIds, classId];
		}
	}

	async function distribute() {
		if (selectedRoomIds.length === 0) {
			toast.error('Silakan pilih minimal 1 ruangan');
			return;
		}

		if (sourceMode === 'manual' && selectedClassIds.length === 0) {
			toast.error('Silakan pilih minimal 1 kelas untuk didistribusikan');
			return;
		}

		if (sourceMode === 'by_exam' && !selectedSourceExamId) {
			toast.error('Silakan pilih ujian sumber (Bank Soal / Aturan Target)');
			return;
		}

		isDistributing = true;
		try {
			const req: AutoDistributeRequest = {
				room_ids: selectedRoomIds,
				source_mode: sourceMode as any
			};

			if (sourceMode === 'manual') req.class_ids = selectedClassIds;
			if (sourceMode === 'by_exam') req.source_exam_id = selectedSourceExamId;

			await examScheduleService.autoDistribute(examId as string, req);
			toast.success('Distribusi peserta selesai!');
			await loadData(); // Reload results
		} catch (error: any) {
			const msg = error.response?.data?.error?.message || 'Gagal memproses distribusi';
			toast.error(`Gagal: ${msg}`);
		} finally {
			isDistributing = false;
		}
	}

	async function clearDistribution() {
		isDistributing = true;
		try {
			await examScheduleService.clearDistribution(examId as string);
			toast.success('Distribusi berhasil di-reset');
			isClearAlertOpen = false;
			await loadData();
		} catch (error) {
			toast.error('Gagal me-reset distribusi');
		} finally {
			isDistributing = false;
		}
	}

	async function updateTime(scheduleId: string, start: string, end: string) {
		try {
			// Convert local HTML5 datetime-local string to ISO 8601
			const startIso = start ? new Date(start).toISOString() : null;
			const endIso = end ? new Date(end).toISOString() : null;

			await examScheduleService.updateScheduleTime(scheduleId, {
				start_time: startIso,
				end_time: endIso
			});
		} catch (error) {
			toast.error('Gagal menyimpan waktu sesi');
		}
	}

	async function exportPresence(session?: number, roomId?: number, roomName?: string) {
		if (roomId) {
			isExportingRoom[roomId] = true;
		} else {
			isExporting = true;
		}

		try {
			const blob = await examScheduleService.exportPresenceXlsx(examId as string, session, roomId);
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;

			if (session && roomName) {
				const safeRoomName = roomName.replace(/[^a-z0-9]/gi, '_');
				a.download = `Presensi_Ujian_${exam?.title}_Sesi_${session}_Ruang_${safeRoomName}.xlsx`;
			} else {
				a.download = `Presensi_Ujian_${exam?.title}.xlsx`;
			}

			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);
			toast.success('Daftar hadir berhasil diunduh');
		} catch (error) {
			toast.error('Gagal mengunduh daftar hadir');
			console.error(error);
		} finally {
			if (roomId) {
				isExportingRoom[roomId] = false;
			} else {
				isExporting = false;
			}
		}
	}

	// Format datetime for datetime-local input
	function formatDateForInput(dateStr?: string) {
		if (!dateStr) return '';
		const date = new Date(dateStr);
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		const hours = String(date.getHours()).padStart(2, '0');
		const minutes = String(date.getMinutes()).padStart(2, '0');
		return `${year}-${month}-${day}T${hours}:${minutes}`;
	}

	onMount(() => {
		loadData();
	});
</script>

<svelte:head>
	<title>Distribusi Ujian - Exstem</title>
</svelte:head>

<div class="flex h-full flex-1 flex-col space-y-8 p-8">
	<!-- Header -->
	<PageHeader
		title="Distribusi Ruangan & Sesi Ujian"
		description={exam?.title || 'Memuat...'}
		backUrl="/admin/exams"
	>
		{#if hasDistribution}
			<div class="flex gap-3">
				<Button variant="outline" onclick={() => (isClearAlertOpen = true)}>
					Reset Distribusi
				</Button>
				<Button onclick={() => exportPresence()} disabled={isExporting}>
					{#if isExporting}
						<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					{:else}
						<Download class="mr-2 h-4 w-4" />
					{/if}
					Export Semua Presensi
				</Button>
			</div>
		{/if}
	</PageHeader>

	{#if isLoading}
		<div class="flex h-48 items-center justify-center">
			<Loader2 class="h-8 w-8 animate-spin text-primary" />
		</div>
	{:else if !hasDistribution}
		<!-- SETUP DISTRIBUTION PANEL -->
		<div class="grid gap-6 md:grid-cols-2">
			<Card.Root>
				<Card.Header>
					<Card.Title>1. Sumber Peserta Ujian</Card.Title>
					<Card.Description>Pilih darimana daftar peserta ujian diambil</Card.Description>
				</Card.Header>
				<Card.Content class="space-y-6">
					<div class="space-y-3">
						<Select.Root type="single" bind:value={sourceMode}>
							<Select.Trigger class="w-full">
								{sourceMode === 'target_rules'
									? 'Gunakan Aturan Target Ujian Ini'
									: sourceMode === 'manual'
										? 'Pilih Kelas Manual'
										: 'Gunakan Peserta Dari Ujian Lain'}
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="target_rules">Gunakan Aturan Target Ujian Ini</Select.Item>
								<Select.Item value="manual">Pilih Kelas Manual</Select.Item>
								<Select.Item value="by_exam">Gunakan Peserta Dari Ujian Lain</Select.Item>
							</Select.Content>
						</Select.Root>
					</div>

					{#if sourceMode === 'target_rules'}
						<div class="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
							Sistem akan otomatis mengambil siswa yang sesuai dengan aturan filter (Kelas, Jurusan,
							Agama, dll) yang sudah diatur pada tab <strong>Akses & Target</strong> di pengaturan ujian
							ini.
						</div>
					{:else if sourceMode === 'manual'}
						<div class="max-h-[300px] space-y-3 overflow-y-auto rounded-lg border p-4">
							<Label class="text-sm font-semibold">Pilih Kelas yang Diinginkan:</Label>
							{#each allClasses as c (c.id)}
								<div class="flex items-center space-x-2 py-1">
									<Checkbox
										id={`class_${c.id}`}
										checked={selectedClassIds.includes(c.id)}
										onCheckedChange={() => toggleClass(c.id)}
									/>
									<Label for={`class_${c.id}`} class="cursor-pointer">
										{c.grade_level}
										{c.major_code}
										{c.group_number}
									</Label>
								</div>
							{/each}
						</div>
					{:else if sourceMode === 'by_exam'}
						<div class="space-y-3">
							<Label>Pilih Ujian Sumber:</Label>
							<Select.Root type="single" bind:value={selectedSourceExamId}>
								<Select.Trigger class="w-full">
									{#if selectedSourceExamId}
										{allExams.find((e) => e.id === selectedSourceExamId)?.title || 'Pilih ujian...'}
									{:else}
										Pilih ujian...
									{/if}
								</Select.Trigger>
								<Select.Content>
									{#each allExams as e (e.id)}
										{#if e.id !== examId}
											<Select.Item value={e.id}>{e.title}</Select.Item>
										{/if}
									{/each}
								</Select.Content>
							</Select.Root>
							<p class="text-xs text-muted-foreground">
								Sistem akan mengambil daftar peserta yang persis sama dengan yang ditargetkan oleh
								ujian tersebut.
							</p>
						</div>
					{/if}
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Header>
					<Card.Title>2. Pilih Ruangan Ujian</Card.Title>
					<Card.Description
						>Sistem akan membagi peserta berdasarkan kapasitas ruangan yang dipilih</Card.Description
					>
				</Card.Header>
				<Card.Content>
					<div class="max-h-[300px] space-y-3 overflow-y-auto rounded-lg border p-4">
						{#each allRooms as room (room.id)}
							<div class="flex items-center justify-between border-b py-2 last:border-0">
								<div class="flex items-center space-x-3">
									<Checkbox
										id={`room_${room.id}`}
										checked={selectedRoomIds.includes(room.id)}
										onCheckedChange={() => toggleRoom(room.id)}
									/>
									<div class="flex flex-col">
										<Label for={`room_${room.id}`} class="cursor-pointer font-bold">
											{room.name}
										</Label>
									</div>
								</div>
								<div
									class="flex items-center rounded-md bg-muted px-2 py-1 text-sm text-muted-foreground"
								>
									<Users class="mr-2 h-4 w-4" />
									{room.capacity} Kursi
								</div>
							</div>
						{/each}
					</div>
				</Card.Content>
				<Card.Footer>
					<Button class="w-full font-bold" onclick={distribute} disabled={isDistributing}>
						{#if isDistributing}
							<Loader2 class="mr-2 h-4 w-4 animate-spin" />
							Memproses Distribusi...
						{:else}
							<Maximize2 class="mr-2 h-4 w-4" />
							Mulai Distribusi Peserta
						{/if}
					</Button>
				</Card.Footer>
			</Card.Root>
		</div>
	{:else}
		<!-- FILTERS -->
		<div class="flex flex-col gap-4 md:flex-row md:items-center">
			<div class="relative max-w-sm flex-1">
				<Search class="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
				<Input
					type="text"
					placeholder="Cari nama atau NIS siswa..."
					class="pl-9"
					bind:value={searchQuery}
				/>
			</div>

			<Select.Root type="single" bind:value={filterSession}>
				<Select.Trigger class="w-[200px]">
					{filterSession === 'all' ? 'Semua Sesi Ujian' : `Sesi Ujian ${filterSession}`}
				</Select.Trigger>
				<Select.Content>
					<Select.Item value="all">Semua Sesi Ujian</Select.Item>
					{#each sortedSessionNums as sessionNum}
						<Select.Item value={sessionNum.toString()}>Sesi Ujian {sessionNum}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
		</div>

		<!-- DISTRIBUTION RESULTS: Single Unified Table -->
		<div class="rounded-md border">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head class="w-16 text-center">No</Table.Head>
						<Table.Head>Nama Siswa</Table.Head>
						<Table.Head>NIS</Table.Head>
						<Table.Head class="text-right">Kelas</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each displaySessionNums as sessionNum}
						<!-- SESSION HEADER ROW -->
						<Table.Row class="bg-primary/10 hover:bg-primary/10">
							<Table.Cell colspan={4} class="py-3">
								<div class="flex flex-wrap items-center justify-between gap-4">
									<div class="flex items-center gap-3">
										<span
											class="rounded-md bg-primary px-3 py-1 text-sm font-bold tracking-wider text-primary-foreground"
										>
											SESI {sessionNum}
										</span>
									</div>
									<div class="flex items-center gap-2">
										<Calendar class="h-4 w-4 text-muted-foreground" />
										<Input
											type="datetime-local"
											class="h-8 w-auto text-xs"
											value={formatDateForInput(
												Object.values(groupedDistribution[sessionNum])[0]?.schedule.start_time
											)}
											onchange={(e) => {
												const firstSchedule = Object.values(groupedDistribution[sessionNum])[0]
													?.schedule;
												if (firstSchedule)
													updateTime(
														firstSchedule.id,
														e.currentTarget.value,
														formatDateForInput(firstSchedule.end_time)
													);
											}}
										/>
										<span class="text-xs text-muted-foreground">s/d</span>
										<Input
											type="datetime-local"
											class="h-8 w-auto text-xs"
											value={formatDateForInput(
												Object.values(groupedDistribution[sessionNum])[0]?.schedule.end_time
											)}
											onchange={(e) => {
												const firstSchedule = Object.values(groupedDistribution[sessionNum])[0]
													?.schedule;
												if (firstSchedule)
													updateTime(
														firstSchedule.id,
														formatDateForInput(firstSchedule.start_time),
														e.currentTarget.value
													);
											}}
										/>
									</div>
								</div>
							</Table.Cell>
						</Table.Row>

						{#each Object.values(groupedDistribution[sessionNum]) as { schedule, students }}
							{@const filteredStudents = students.filter(
								(s) =>
									searchQuery === '' ||
									(s.student_name &&
										s.student_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
									(s.student_nis && s.student_nis.includes(searchQuery))
							)}

							{#if filteredStudents.length > 0}
								<!-- ROOM SUB-HEADER ROW -->
								<Table.Row class="bg-muted/50 hover:bg-muted/50">
									<Table.Cell colspan={4} class="py-2">
										<div class="flex items-center justify-between">
											<div class="flex items-center gap-3">
												<DoorOpen class="h-4 w-4 text-muted-foreground" />
												<span class="font-semibold text-foreground">{schedule.room_name}</span>
												<span
													class="rounded-full bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground"
												>
													<Users class="mr-1 inline h-3 w-3" />
													{students.length} / {schedule.room_capacity} Kursi
												</span>
											</div>
											<Button
												variant="outline"
												size="sm"
												class="h-7 bg-background text-xs"
												disabled={isExportingRoom[schedule.room_id]}
												onclick={() =>
													exportPresence(sessionNum, schedule.room_id, schedule.room_name)}
											>
												{#if isExportingRoom[schedule.room_id]}
													<Loader2 class="mr-2 h-3 w-3 animate-spin" />
												{:else}
													<Download class="mr-2 h-3 w-3" />
												{/if}
												Cetak Presensi Ruangan
											</Button>
										</div>
									</Table.Cell>
								</Table.Row>

								<!-- STUDENT ROWS -->
								{#each filteredStudents as student}
									<Table.Row>
										<Table.Cell class="text-center text-muted-foreground">
											{student.seat_number}
										</Table.Cell>
										<Table.Cell class="font-medium">{student.student_name}</Table.Cell>
										<Table.Cell class="text-muted-foreground">{student.student_nis}</Table.Cell>
										<Table.Cell class="text-right text-xs whitespace-nowrap">
											{student.class_name}
										</Table.Cell>
									</Table.Row>
								{/each}
							{/if}
						{/each}
					{/each}
				</Table.Body>
			</Table.Root>
		</div>
	{/if}
</div>

<!-- Clear Alert -->
<AlertDialog.Root bind:open={isClearAlertOpen}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Reset Distribusi?</AlertDialog.Title>
			<AlertDialog.Description>
				Tindakan ini akan menghapus semua jadwal dan pembagian ruangan untuk ujian ini. Anda harus
				mendistribusikannya kembali. Apakah Anda yakin?
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel onclick={() => (isClearAlertOpen = false)}>Batal</AlertDialog.Cancel>
			<AlertDialog.Action
				onclick={clearDistribution}
				class="text-destructive-foreground bg-destructive hover:bg-destructive/90"
			>
				{#if isDistributing}
					<Loader2 class="mr-2 h-4 w-4 animate-spin" />
				{/if}
				Reset
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
