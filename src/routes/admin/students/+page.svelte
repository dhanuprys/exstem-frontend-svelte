<script lang="ts">
	import { onMount } from 'svelte';
	import PageHeader from '$lib/components/ui/page-header.svelte';
	import PaginationCustom from '$lib/components/ui/pagination-custom.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import { studentService, type Student } from '$lib/services/admin/student.service';
	import { classService, type Class } from '$lib/services/admin/class.service';
	import StudentForm from './student-form.svelte';
	import { toast } from 'svelte-sonner';
	import { Plus, Pencil, Trash2, Loader2, KeyRound } from '@lucide/svelte';
	import type { Pagination } from '$lib/types/api';

	let students: Student[] = $state([]);
	let classes: Class[] = $state([]);
	let pagination: Pagination = $state({ page: 1, per_page: 10, total_items: 0, total_pages: 1 });
	let isLoading = $state(false);
	let isSaving = $state(false);

	// Filter state
	let selectedClassFilter = $state<string | undefined>(undefined);

	// Dialog State
	let isDialogOpen = $state(false);
	let isValues: Student | null = $state(null); // null for create, object for edit

	// Form State
	let formNIS = $state('');
	let formNISN = $state('');
	let formName = $state('');
	let formGender = $state('');
	let formReligion = $state('');
	let formPassword = $state('');
	let formClassId = $state(0);

	// Delete Alert State
	let isDeleteAlertOpen = $state(false);
	let studentToDelete: Student | null = $state(null);

	// Reset Session Alert State
	let isResetAlertOpen = $state(false);
	let studentToReset: Student | null = $state(null);

	async function loadData(page = 1) {
		isLoading = true;
		try {
			const classIdParam =
				selectedClassFilter && selectedClassFilter !== 'all'
					? parseInt(selectedClassFilter)
					: undefined;

			const res = await studentService.getStudents(page, pagination.per_page, classIdParam);
			students = res.data.data.students || [];
			if (res.data.pagination) {
				pagination = res.data.pagination;
			}
		} catch (error) {
			toast.error('Gagal memuat data siswa');
		} finally {
			isLoading = false;
		}
	}

	async function loadClasses() {
		try {
			const res = await classService.getClasses();
			classes = res.data.data.classes || [];
		} catch (error) {
			console.error('Failed to load classes', error);
		}
	}

	function getClassLabel(classId: number): string {
		const cls = classes.find((c) => c.id === classId);
		return cls ? `${cls.grade_level} ${cls.major_code} ${cls.group_number}` : '-';
	}

	function openCreateDialog() {
		isValues = null;
		formNIS = '';
		formNISN = '';
		formName = '';
		formGender = '';
		formReligion = '';
		formPassword = '';
		formClassId = 0;
		isDialogOpen = true;
	}

	function openEditDialog(student: Student) {
		isValues = student;
		formNIS = student.nis;
		formNISN = student.nisn;
		formName = student.name;
		formGender = student.gender;
		formReligion = student.religion;
		formPassword = ''; // reset password field
		formClassId = student.class_id;
		isDialogOpen = true;
	}

	function openDeleteAlert(student: Student) {
		studentToDelete = student;
		isDeleteAlertOpen = true;
	}

	function openResetAlert(student: Student) {
		studentToReset = student;
		isResetAlertOpen = true;
	}

	async function handleSubmit() {
		if (!formNIS || !formNISN || !formName || !formGender || !formReligion || !formClassId) {
			toast.error('Mohon lengkapi semua kolom wajib');
			return;
		}

		const payload = {
			nis: formNIS,
			nisn: formNISN,
			name: formName,
			gender: formGender,
			religion: formReligion,
			password: formPassword || undefined,
			class_id: formClassId
		};

		isSaving = true;
		try {
			if (isValues) {
				// Edit
				await studentService.updateStudent(isValues.id, payload);
				toast.success('Data siswa berhasil diperbarui');
			} else {
				// Create
				if (!formPassword) {
					toast.error('Kata sandi wajib diisi untuk siswa baru');
					isSaving = false;
					return;
				}
				await studentService.createStudent(payload as any);
				toast.success('Pelajar berhasil ditambahkan');
			}
			isDialogOpen = false;
			loadData(pagination.page);
		} catch (error: any) {
			toast.error(error.response?.data?.error?.message || 'Gagal menyimpan data siswa');
		} finally {
			isSaving = false;
		}
	}

	async function handleDelete() {
		if (!studentToDelete) return;

		isSaving = true;
		try {
			await studentService.deleteStudent(studentToDelete.id);
			toast.success('Data pelajar berhasil dihapus');
			isDeleteAlertOpen = false;
			loadData(pagination.page); // Refresh list
		} catch (error: any) {
			toast.error(error.response?.data?.error?.message || 'Gagal menghapus siswa');
		} finally {
			isSaving = false;
			studentToDelete = null;
		}
	}

	async function handleResetSession() {
		if (!studentToReset) return;

		isSaving = true;
		try {
			await studentService.resetSession(studentToReset.id);
			toast.success('Sesi berhasil direset. Pelajar dapat masuk kembali.');
			isResetAlertOpen = false;
		} catch (error: any) {
			toast.error(error.response?.data?.error?.message || 'Gagal mereset sesi');
		} finally {
			isSaving = false;
			studentToReset = null;
		}
	}

	onMount(() => {
		loadClasses();
		loadData();
	});
</script>

<svelte:head>
	<title>Kelola Siswa - Exstem</title>
</svelte:head>

<div class="flex h-full flex-1 flex-col space-y-8 p-8">
	<PageHeader
		title="Manajemen Siswa"
		description="Kelola data siswa, pengaturan kelas, dan akses ujian."
	>
		<Button onclick={openCreateDialog}>
			<Plus class="mr-2 h-4 w-4" /> Tambah Siswa
		</Button>
	</PageHeader>

	<div class="rounded-md border">
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>NIS</Table.Head>
					<Table.Head>NISN</Table.Head>
					<Table.Head>Nama Siswa</Table.Head>
					<Table.Head>L/P</Table.Head>
					<Table.Head>Agama</Table.Head>
					<Table.Head>Kelas</Table.Head>
					<Table.Head class="text-right">Aksi</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#if isLoading}
					<Table.Row>
						<Table.Cell colspan={7} class="h-24 text-center">Memuat...</Table.Cell>
					</Table.Row>
				{:else if students.length === 0}
					<Table.Row>
						<Table.Cell colspan={7} class="h-24 text-center">Tidak ada data siswa.</Table.Cell>
					</Table.Row>
				{:else}
					{#each students as student (student.id)}
						<Table.Row>
							<Table.Cell class="font-medium">{student.nis}</Table.Cell>
							<Table.Cell>{student.nisn}</Table.Cell>
							<Table.Cell>{student.name}</Table.Cell>
							<Table.Cell>{student.gender === 'Laki-laki' ? 'L' : 'P'}</Table.Cell>
							<Table.Cell>{student.religion}</Table.Cell>
							<Table.Cell>{getClassLabel(student.class_id)}</Table.Cell>
							<Table.Cell class="text-right">
								<div class="flex justify-end gap-2">
									<Button
										variant="ghost"
										size="icon"
										title="Reset Sesi Login"
										onclick={() => openResetAlert(student)}
									>
										<KeyRound class="h-4 w-4" />
									</Button>
									<Button variant="ghost" size="icon" onclick={() => openEditDialog(student)}>
										<Pencil class="h-4 w-4" />
									</Button>
									<Button
										variant="ghost"
										size="icon"
										class="text-destructive hover:text-destructive"
										onclick={() => openDeleteAlert(student)}
									>
										<Trash2 class="h-4 w-4" />
									</Button>
								</div>
							</Table.Cell>
						</Table.Row>
					{/each}
				{/if}
			</Table.Body>
		</Table.Root>
	</div>

	<PaginationCustom {pagination} onPageChange={(p) => loadData(p)} />

	<!-- Create/Edit Dialog -->
	<Dialog.Root bind:open={isDialogOpen}>
		<Dialog.Content class="sm:max-w-[425px]">
			<Dialog.Header>
				<Dialog.Title>{isValues ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}</Dialog.Title>
				<Dialog.Description>Isi informasi pelajar pada form di bawah ini.</Dialog.Description>
			</Dialog.Header>
			<StudentForm
				bind:nis={formNIS}
				bind:nisn={formNISN}
				bind:name={formName}
				bind:gender={formGender}
				bind:religion={formReligion}
				bind:password={formPassword}
				bind:classId={formClassId}
				{classes}
				isEdit={!!isValues}
			/>
			<Dialog.Footer>
				<Button type="submit" onclick={handleSubmit} disabled={isSaving}>
					{#if isSaving}
						<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					{/if}
					Simpan Perubahan
				</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>

	<!-- Delete Alert -->
	<AlertDialog.Root bind:open={isDeleteAlertOpen}>
		<AlertDialog.Content>
			<AlertDialog.Header>
				<AlertDialog.Title>Konfirmasi Penghapusan</AlertDialog.Title>
				<AlertDialog.Description>
					Tindakan ini tidak dapat dibatalkan. Data siswa <strong
						>{studentToDelete?.name} ({studentToDelete?.nisn})</strong
					> akan dihapus permanen dari sistem.
				</AlertDialog.Description>
			</AlertDialog.Header>
			<AlertDialog.Footer>
				<AlertDialog.Cancel>Batal</AlertDialog.Cancel>
				<AlertDialog.Action
					class="text-destructive-foreground bg-destructive hover:bg-destructive/90"
					onclick={handleDelete}
					disabled={isSaving}
				>
					{#if isSaving}
						<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					{/if}
					Ya, Hapus
				</AlertDialog.Action>
			</AlertDialog.Footer>
		</AlertDialog.Content>
	</AlertDialog.Root>

	<!-- Reset Session Alert -->
	<AlertDialog.Root bind:open={isResetAlertOpen}>
		<AlertDialog.Content>
			<AlertDialog.Header>
				<AlertDialog.Title>Reset Sesi Pelajar</AlertDialog.Title>
				<AlertDialog.Description>
					Apakah Anda yakin ingin mereset sesi untuk siswa <strong
						>{studentToReset?.name} ({studentToReset?.nisn})</strong
					>? Tindakan ini akan memaksa keluar akun mereka dari perangkat aktif saat ini.
				</AlertDialog.Description>
			</AlertDialog.Header>
			<AlertDialog.Footer>
				<AlertDialog.Cancel>Batal</AlertDialog.Cancel>
				<AlertDialog.Action onclick={handleResetSession} disabled={isSaving}>
					{#if isSaving}
						<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					{/if}
					Ya, Reset Sesi
				</AlertDialog.Action>
			</AlertDialog.Footer>
		</AlertDialog.Content>
	</AlertDialog.Root>
</div>
