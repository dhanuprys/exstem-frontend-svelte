<script lang="ts">
	import { onMount } from 'svelte';
	import PageHeader from '$lib/components/ui/page-header.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import {
		roomService,
		type Room,
		type RoomSession,
		type StudentRoomAssignment,
		type DistributionResult,
		type SessionTimePayload
	} from '$lib/services/admin/room.service';
	import { classService, type Class } from '$lib/services/admin/class.service';
	import { toast } from 'svelte-sonner';
	import {
		Loader2,
		Wand2,
		Trash2,
		FileSpreadsheet,
		ChevronDown,
		ChevronRight,
		Users,
		DoorOpen,
		Clock,
		Save
	} from '@lucide/svelte';

	// Data state
	let rooms: Room[] = $state([]);
	let classes: Class[] = $state([]);
	let sessions: RoomSession[] = $state([]);
	let assignments: StudentRoomAssignment[] = $state([]);

	// Loading state
	let isLoading = $state(false);
	let isDistributing = $state(false);
	let isClearing = $state(false);
	let isExporting = $state(false);
	let isSavingTimes = $state(false);

	// Dialog state
	let isDistributeDialogOpen = $state(false);
	let isSessionTimeDialogOpen = $state(false);
	let selectedRoomIds: Set<number> = $state(new Set());
	let selectedClassIds: Set<number> = $state(new Set());
	let distributeAllStudents = $state(true);

	// Clear alert state
	let isClearAlertOpen = $state(false);

	// Collapsible session state
	let expandedSessions: Set<string> = $state(new Set());

	// Session times editing state (keyed by session_number)
	let sessionTimes: Record<number, { start_time: string; end_time: string }> = $state({});

	// Derived: group assignments by session
	let assignmentsBySession = $derived.by(() => {
		const map = new Map<string, StudentRoomAssignment[]>();
		for (const a of assignments) {
			const list = map.get(a.room_session_id) || [];
			list.push(a);
			map.set(a.room_session_id, list);
		}
		// Sort the list by seat_number ascending
		for (const [key, value] of map.entries()) {
			value.sort((x, y) => x.seat_number - y.seat_number);
			map.set(key, value);
		}
		return map;
	});

	// Derived: total assigned students
	let totalAssigned = $derived(assignments.length);

	// Derived: unique sorted session numbers
	let uniqueSessionNums = $derived.by(() => {
		const nums = new Set(sessions.map((s) => s.session_number));
		return Array.from(nums).sort((a, b) => a - b);
	});

	// Derived: sessions grouped by session_number
	let sessionsByNumber = $derived.by(() => {
		const map = new Map<number, RoomSession[]>();
		for (const s of sessions) {
			const list = map.get(s.session_number) || [];
			list.push(s);
			map.set(s.session_number, list);
		}
		return map;
	});

	async function loadData() {
		isLoading = true;
		try {
			const [roomsRes, classesRes, distRes] = await Promise.all([
				roomService.getRooms(),
				classService.getClasses(),
				roomService.getDistribution()
			]);

			rooms = roomsRes.data.data.rooms || [];
			classes = classesRes.data.data.classes || [];

			const dist: DistributionResult = distRes.data.data;
			sessions = dist.sessions || [];
			assignments = dist.assignments || [];

			// Populate session times from fetched data
			const times: Record<number, { start_time: string; end_time: string }> = {};
			for (const s of sessions) {
				if (!times[s.session_number]) {
					times[s.session_number] = {
						start_time: s.start_time || '',
						end_time: s.end_time || ''
					};
				}
			}
			sessionTimes = times;

			// Auto-expand all sessions on first load
			expandedSessions = new Set(sessions.map((s) => s.id));
		} catch {
			toast.error('Gagal memuat data pembagian ruangan');
		} finally {
			isLoading = false;
		}
	}

	function openDistributeDialog() {
		selectedRoomIds = new Set(rooms.map((r) => r.id));
		selectedClassIds = new Set();
		distributeAllStudents = true;
		isDistributeDialogOpen = true;
	}

	function toggleRoomId(id: number) {
		const next = new Set(selectedRoomIds);
		if (next.has(id)) {
			next.delete(id);
		} else {
			next.add(id);
		}
		selectedRoomIds = next;
	}

	function toggleClassId(id: number) {
		const next = new Set(selectedClassIds);
		if (next.has(id)) {
			next.delete(id);
		} else {
			next.add(id);
		}
		selectedClassIds = next;
	}

	function toggleSession(id: string) {
		const next = new Set(expandedSessions);
		if (next.has(id)) {
			next.delete(id);
		} else {
			next.add(id);
		}
		expandedSessions = next;
	}

	function formatClassName(cls: Class) {
		return `${cls.grade_level} ${cls.major_code} ${cls.group_number}`;
	}

	async function handleDistribute() {
		if (selectedRoomIds.size === 0) {
			toast.error('Pilih minimal 1 ruangan');
			return;
		}

		isDistributing = true;
		try {
			const payload = {
				room_ids: Array.from(selectedRoomIds),
				class_ids: distributeAllStudents ? undefined : Array.from(selectedClassIds),
				student_ids: undefined
			};

			const res = await roomService.autoDistribute(payload);
			const dist: DistributionResult = res.data.data;
			sessions = dist.sessions || [];
			assignments = dist.assignments || [];
			expandedSessions = new Set(sessions.map((s) => s.id));

			toast.success(`Berhasil membagi ${assignments.length} siswa ke dalam ruangan`);
			isDistributeDialogOpen = false;
		} catch {
			toast.error('Gagal melakukan pembagian otomatis');
		} finally {
			isDistributing = false;
		}
	}

	async function handleClear() {
		isClearing = true;
		try {
			await roomService.clearDistribution();
			sessions = [];
			assignments = [];
			expandedSessions = new Set();
			isClearAlertOpen = false;
			toast.success('Pembagian ruangan berhasil dihapus');
		} catch {
			toast.error('Gagal menghapus pembagian ruangan');
		} finally {
			isClearing = false;
		}
	}

	async function handleExport() {
		isExporting = true;
		try {
			const res = await roomService.exportPresenceXLSX();
			const blob = new Blob([res.data], {
				type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
			});
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = 'Pembagian_Ruangan.xlsx';
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
			toast.success('File berhasil diunduh');
		} catch {
			toast.error('Gagal mengunduh file');
		} finally {
			isExporting = false;
		}
	}

	async function handleSaveSessionTimes() {
		isSavingTimes = true;
		try {
			const payload: SessionTimePayload[] = uniqueSessionNums.map((num) => {
				const t = sessionTimes[num];
				// Just pass the time strings (e.g. HH:mm or HH:mm:ss) to the backend directly.
				// Null if empty
				return {
					session_number: num,
					start_time: (t?.start_time && t.start_time.trim() !== '') ? t.start_time : null,
					end_time: (t?.end_time && t.end_time.trim() !== '') ? t.end_time : null
				};
			});

			const res = await roomService.updateSessionTimes(payload);
			const dist: DistributionResult = res.data.data;
			sessions = dist.sessions || [];
			assignments = dist.assignments || [];
			isSessionTimeDialogOpen = false;
			toast.success('Jadwal sesi berhasil disimpan');
		} catch {
			toast.error('Gagal menyimpan jadwal sesi');
		} finally {
			isSavingTimes = false;
		}
	}

	onMount(() => {
		loadData();
	});
</script>

<svelte:head>
	<title>Pembagian Ruangan - Exstem</title>
</svelte:head>

<div class="flex h-full flex-1 flex-col space-y-8 p-8">
	<PageHeader
		title="Pembagian Ruangan"
		description="Distribusikan siswa ke dalam ruangan ujian secara otomatis. Pembagian ini berlaku untuk semua ujian."
	>
		<div class="flex gap-2">
			{#if sessions.length > 0}
				<Button variant="outline" onclick={() => (isSessionTimeDialogOpen = true)}>
					<Clock class="mr-2 h-4 w-4" /> Atur Waktu Sesi
				</Button>
				<Button variant="outline" onclick={handleExport} disabled={isExporting}>
					{#if isExporting}
						<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					{:else}
						<FileSpreadsheet class="mr-2 h-4 w-4" />
					{/if}
					Export XLSX
				</Button>
				<Button
					variant="outline"
					class="text-destructive hover:text-destructive"
					onclick={() => (isClearAlertOpen = true)}
				>
					<Trash2 class="mr-2 h-4 w-4" /> Hapus Distribusi
				</Button>
			{/if}
			<Button onclick={openDistributeDialog} disabled={rooms.length === 0}>
				<Wand2 class="mr-2 h-4 w-4" /> Bagi Otomatis
			</Button>
		</div>
	</PageHeader>

	{#if isLoading}
		<div class="flex h-32 items-center justify-center">
			<Loader2 class="h-8 w-8 animate-spin text-primary" />
		</div>
	{:else if sessions.length === 0}
		<div class="rounded-lg border-2 border-dashed p-12 text-center">
			<DoorOpen class="mx-auto mb-4 h-12 w-12 opacity-20" />
			<h3 class="text-lg font-semibold text-muted-foreground">Belum Ada Pembagian Ruangan</h3>
			<p class="mt-1 text-sm text-muted-foreground">
				Klik tombol "Bagi Otomatis" untuk mendistribusikan siswa ke ruangan ujian.
			</p>
		</div>
	{:else}
		<!-- Summary -->
		<div class="flex items-center gap-4 rounded-lg border bg-muted/30 px-4 py-3">
			<Users class="h-5 w-5 text-primary" />
			<span class="text-sm font-medium">
				<strong>{totalAssigned}</strong> siswa terdistribusi ke
				<strong>{sessions.length}</strong> sesi/ruangan
			</span>
		</div>

		<!-- Sessions accordion grouped by session number -->
		<div class="space-y-6">
			{#each uniqueSessionNums as sessionNum}
				{@const sessionRooms = sessionsByNumber.get(sessionNum) || []}

				<div class="space-y-3">
					<!-- Session number header -->
					<div class="flex flex-wrap items-center gap-4 rounded-lg bg-primary/5 px-4 py-3">
						<span class="rounded-md bg-primary px-3 py-1 text-sm font-bold tracking-wider text-primary-foreground">
							SESI {sessionNum}
						</span>
					</div>

					<!-- Room cards for this session -->
					{#each sessionRooms as session (session.id)}
						{@const sessionAssignments = assignmentsBySession.get(session.id) || []}
						{@const isExpanded = expandedSessions.has(session.id)}

						<div class="rounded-lg border">
							<!-- Room header -->
							<button
								class="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-muted/50"
								onclick={() => toggleSession(session.id)}
							>
								<div class="flex items-center gap-3">
									{#if isExpanded}
										<ChevronDown class="h-4 w-4 text-muted-foreground" />
									{:else}
										<ChevronRight class="h-4 w-4 text-muted-foreground" />
									{/if}
									<div>
										<DoorOpen class="mr-1 inline h-4 w-4 text-muted-foreground" />
										<span class="font-medium">{session.room_name}</span>
									</div>
								</div>
								<span class="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
									{sessionAssignments.length} / {session.room_capacity} siswa
								</span>
							</button>

							<!-- Students table -->
							{#if isExpanded && sessionAssignments.length > 0}
								<div class="border-t">
									<Table.Root>
										<Table.Header>
											<Table.Row>
												<Table.Head class="w-16 text-center font-bold text-foreground">No</Table.Head>
												<Table.Head class="font-bold text-foreground">NIS</Table.Head>
												<Table.Head class="font-bold text-foreground">Nama Siswa</Table.Head>
												<Table.Head class="font-bold text-foreground">Kelas</Table.Head>
												<Table.Head class="w-20 text-center font-bold text-foreground">Kursi</Table.Head>
											</Table.Row>
										</Table.Header>
										<Table.Body>
											{#each sessionAssignments as a, idx (a.id)}
												<Table.Row>
													<Table.Cell class="text-center">{idx + 1}</Table.Cell>
													<Table.Cell>{a.student_nis}</Table.Cell>
													<Table.Cell class="font-medium">{a.student_name}</Table.Cell>
													<Table.Cell>{a.class_name}</Table.Cell>
													<Table.Cell class="text-center">{a.seat_number}</Table.Cell>
												</Table.Row>
											{/each}
										</Table.Body>
									</Table.Root>
								</div>
							{/if}
						</div>
					{/each}
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Distribute Dialog -->
<Dialog.Root bind:open={isDistributeDialogOpen}>
	<Dialog.Content class="sm:max-w-[500px]">
		<Dialog.Header>
			<Dialog.Title>Bagi Ruangan Otomatis</Dialog.Title>
			<Dialog.Description>
				Pilih ruangan yang akan digunakan dan sumber siswa. Pembagian sebelumnya akan otomatis
				dihapus.
			</Dialog.Description>
		</Dialog.Header>

		<!-- Room selection -->
		<div class="space-y-3">
			<Label class="text-sm font-semibold">Ruangan</Label>
			<div class="grid max-h-40 grid-cols-2 gap-2 overflow-y-auto rounded-md border p-3">
				{#each rooms as room (room.id)}
					<label class="flex cursor-pointer items-center gap-2 text-sm">
						<Checkbox
							checked={selectedRoomIds.has(room.id)}
							onCheckedChange={() => toggleRoomId(room.id)}
						/>
						{room.name}
						<span class="text-xs text-muted-foreground">({room.capacity})</span>
					</label>
				{/each}
			</div>
		</div>

		<!-- Student source -->
		<div class="space-y-3">
			<Label class="text-sm font-semibold">Sumber Siswa</Label>
			<label class="flex cursor-pointer items-center gap-2 text-sm">
				<Checkbox
					checked={distributeAllStudents}
					onCheckedChange={() => (distributeAllStudents = !distributeAllStudents)}
				/>
				Semua siswa
			</label>

			{#if !distributeAllStudents}
				<div class="grid max-h-40 grid-cols-2 gap-2 overflow-y-auto rounded-md border p-3">
					{#each classes as cls (cls.id)}
						<label class="flex cursor-pointer items-center gap-2 text-sm">
							<Checkbox
								checked={selectedClassIds.has(cls.id)}
								onCheckedChange={() => toggleClassId(cls.id)}
							/>
							{formatClassName(cls)}
						</label>
					{/each}
				</div>
			{/if}
		</div>

		<Dialog.Footer>
			<Button onclick={handleDistribute} disabled={isDistributing || selectedRoomIds.size === 0}>
				{#if isDistributing}
					<Loader2 class="mr-2 h-4 w-4 animate-spin" />
				{/if}
				Mulai Pembagian
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<!-- Session Time Configuration Dialog -->
<Dialog.Root bind:open={isSessionTimeDialogOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Atur Waktu Sesi</Dialog.Title>
			<Dialog.Description>
				Tentukan rentang spesifik (mulai dan selesai) untuk semua ruangan yang tergabung dalam jadwal sesi ini.
			</Dialog.Description>
		</Dialog.Header>
		
		<div class="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-1">
			{#each uniqueSessionNums as sessionNum}
				<div class="space-y-2 rounded-md border p-3">
					<div class="flex items-center gap-2 font-semibold">
						<div class="h-2 w-2 rounded-full bg-primary"></div>
						Sesi {sessionNum}
					</div>
					<div class="grid grid-cols-2 gap-4">
						<div class="grid space-y-1">
							<Label class="text-xs">Waktu Mulai</Label>
							<input
								type="time"
								class="h-8 rounded-md border bg-background px-2 text-sm"
								bind:value={sessionTimes[sessionNum].start_time}
							/>
						</div>
						<div class="grid space-y-1">
							<Label class="text-xs">Waktu Selesai</Label>
							<input
								type="time"
								class="h-8 rounded-md border bg-background px-2 text-sm"
								bind:value={sessionTimes[sessionNum].end_time}
							/>
						</div>
					</div>
				</div>
			{/each}
		</div>

		<Dialog.Footer>
			<Button variant="outline" onclick={() => (isSessionTimeDialogOpen = false)}>Batal</Button>
			<Button onclick={handleSaveSessionTimes} disabled={isSavingTimes}>
				{#if isSavingTimes}
					<Loader2 class="mr-2 h-4 w-4 animate-spin" />
				{:else}
					<Save class="mr-2 h-4 w-4" />
				{/if}
				Simpan Jadwal
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<!-- Clear Alert -->
<AlertDialog.Root bind:open={isClearAlertOpen}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Hapus Semua Pembagian Ruangan?</AlertDialog.Title>
			<AlertDialog.Description>
				Semua distribusi siswa ke ruangan akan dihapus. Anda perlu melakukan pembagian ulang setelah
				ini.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel onclick={() => (isClearAlertOpen = false)}>Batal</AlertDialog.Cancel>
			<AlertDialog.Action
				onclick={handleClear}
				class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
				disabled={isClearing}
			>
				{#if isClearing}
					<Loader2 class="mr-2 h-4 w-4 animate-spin" />
				{/if}
				Hapus Semua
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
