<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import PageHeader from '$lib/components/ui/page-header.svelte';
	import PaginationCustom from '$lib/components/ui/pagination-custom.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import { examService, type Exam } from '$lib/services/admin/exam.service';
	import { subjectService, type Subject } from '$lib/services/admin/subject.service';
	import { toast } from 'svelte-sonner';
	import { Plus, Pencil, Trash2, FileText, Loader2, PlayCircle } from '@lucide/svelte';
	import type { Pagination } from '$lib/types/api';

	let exams: Exam[] = $state([]);
	let pagination: Pagination = $state({ page: 1, per_page: 10, total_items: 0, total_pages: 1 });
	let isLoading = $state(false);
	let isSaving = $state(false);

	// Dialog State for Create Mode
	let isCreateDialogOpen = $state(false);
	let formTitle = $state('');
	let formSubjectId: number | null = $state(null);
	let formDuration = $state(90);

	let subjects: Subject[] = $state([]);

	// Delete Alert State
	let isDeleteAlertOpen = $state(false);
	let examToDelete: Exam | null = $state(null);

	async function loadData(page = 1) {
		isLoading = true;
		try {
			const res = await examService.getExams(page, pagination.per_page);
			exams = res.data.exams || [];
			if (res.pagination) {
				pagination = res.pagination;
			}

			const resSubjects = await subjectService.getSubjects();
			subjects = resSubjects.data.data.subjects || [];
		} catch (error) {
			toast.error('Gagal memuat daftar ujian');
		} finally {
			isLoading = false;
		}
	}

	function openCreateDialog() {
		formTitle = '';
		formDuration = 90;
		isCreateDialogOpen = true;
	}

	async function handleCreate() {
		if (!formTitle.trim()) {
			toast.error('Judul ujian wajib diisi');
			return;
		}
		if (formDuration < 1) {
			toast.error('Durasi harus lebih dari 0 menit');
			return;
		}

		isSaving = true;
		try {
			const newExam = await examService.createExam({
				title: formTitle,
				subject_id: formSubjectId === null ? undefined : formSubjectId,
				duration_minutes: formDuration
			});
			toast.success('Ujian berhasil dibuat');
			isCreateDialogOpen = false;
			// Navigate directly to the editor for this new exam
			goto(`/admin/exams/${newExam.id}/edit`);
		} catch (error: any) {
			toast.error(error.response?.data?.error?.message || 'Gagal membuat ujian');
		} finally {
			isSaving = false;
		}
	}

	function confirmDelete(exam: Exam) {
		examToDelete = exam;
		isDeleteAlertOpen = true;
	}

	async function handleDelete() {
		if (!examToDelete) return;

		isSaving = true;
		try {
			await examService.deleteExam(examToDelete.id);
			toast.success('Ujian berhasil dihapus');
			isDeleteAlertOpen = false;
			loadData(pagination.page);
		} catch (error: any) {
			toast.error(error.response?.data?.error?.message || 'Gagal menghapus ujian');
		} finally {
			isSaving = false;
			examToDelete = null;
		}
	}

	function getStatusBadgeClass(status: string) {
		switch (status) {
			case 'PUBLISHED':
				return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
			case 'IN_PROGRESS':
				return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
			case 'COMPLETED':
				return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
			case 'ARCHIVED':
				return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
			default:
				return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'; // DRAFT
		}
	}

	function getStatusLabel(status: string) {
		switch (status) {
			case 'PUBLISHED':
				return 'Diterbitkan';
			case 'IN_PROGRESS':
				return 'Sedang Berjalan';
			case 'COMPLETED':
				return 'Selesai';
			case 'ARCHIVED':
				return 'Diarsipkan';
			default:
				return 'Draft';
		}
	}

	onMount(() => {
		loadData();
	});
</script>

<div class="flex h-full flex-1 flex-col space-y-8 p-8">
	<PageHeader
		title="Manajemen Ujian"
		description="Susun soal, atur jadwal, dan kelola target peserta ujian."
	>
		<Button onclick={openCreateDialog}>
			<Plus class="mr-2 h-4 w-4" /> Buat Ujian
		</Button>
	</PageHeader>

	<div class="rounded-md border">
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>Judul Ujian</Table.Head>
					<Table.Head>Durasi</Table.Head>
					<Table.Head>Jadwal</Table.Head>
					<Table.Head>Status</Table.Head>
					<Table.Head class="text-right">Aksi</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#if isLoading}
					<Table.Row>
						<Table.Cell colspan={5} class="h-24 text-center">Memuat...</Table.Cell>
					</Table.Row>
				{:else if exams.length === 0}
					<Table.Row>
						<Table.Cell colspan={5} class="h-24 text-center"
							>Belum ada ujian yang dibuat.</Table.Cell
						>
					</Table.Row>
				{:else}
					{#each exams as exam (exam.id)}
						<Table.Row>
							<Table.Cell class="font-medium">{exam.title}</Table.Cell>
							<Table.Cell>{exam.duration_minutes} Menit</Table.Cell>
							<Table.Cell>
								{#if exam.scheduled_start}
									{new Date(exam.scheduled_start).toLocaleString('id-ID')}
								{:else}
									<span class="text-muted-foreground italic">Belum diatur</span>
								{/if}
							</Table.Cell>
							<Table.Cell>
								<span
									class="rounded-full px-2 py-1 text-xs font-semibold {getStatusBadgeClass(
										exam.status
									)}"
								>
									{getStatusLabel(exam.status)}
								</span>
							</Table.Cell>
							<Table.Cell class="text-right">
								<div class="flex justify-end gap-2">
									<Button
										variant="ghost"
										size="icon"
										title="Hasil Ujian"
										onclick={() => goto(`/admin/exams/${exam.id}/results`)}
									>
										<FileText class="h-4 w-4" />
									</Button>
									<Button
										variant="ghost"
										size="icon"
										title="Edit Ujian"
										onclick={() => goto(`/admin/exams/${exam.id}/edit`)}
									>
										<Pencil class="h-4 w-4" />
									</Button>
									{#if exam.status === 'DRAFT'}
										<Button
											variant="ghost"
											size="icon"
											class="text-destructive hover:text-destructive"
											title="Hapus Ujian"
											onclick={() => confirmDelete(exam)}
										>
											<Trash2 class="h-4 w-4" />
										</Button>
									{/if}
								</div>
							</Table.Cell>
						</Table.Row>
					{/each}
				{/if}
			</Table.Body>
		</Table.Root>
	</div>

	<PaginationCustom {pagination} onPageChange={(p) => loadData(p)} />

	<!-- Create Initial Exam Dialog -->
	<Dialog.Root bind:open={isCreateDialogOpen}>
		<Dialog.Content class="sm:max-w-[425px]">
			<Dialog.Header>
				<Dialog.Title>Buat Ujian Baru</Dialog.Title>
				<Dialog.Description>
					Masukkan informasi awal ujian. Anda dapat mengedit detail lebih lanjut nanti.
				</Dialog.Description>
			</Dialog.Header>

			<div class="grid gap-4 py-4">
				<div class="grid gap-2">
					<label for="title" class="text-sm font-medium"
						>Judul Ujian <span class="text-destructive">*</span></label
					>
					<input
						id="title"
						bind:value={formTitle}
						placeholder="Misal: Ujian Akhir Semester Ganjil"
						class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
					/>
				</div>
				<div class="grid gap-2">
					<label for="subject" class="text-sm font-medium">Mata Pelajaran</label>
					<select
						id="subject"
						bind:value={formSubjectId}
						class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
					>
						<option value={null}>-- Tanpa Mata Pelajaran --</option>
						{#each subjects as subject}
							<option value={subject.id}>{subject.name}</option>
						{/each}
					</select>
				</div>
				<div class="grid gap-2">
					<label for="duration" class="text-sm font-medium"
						>Durasi (Menit) <span class="text-destructive">*</span></label
					>
					<input
						id="duration"
						type="number"
						bind:value={formDuration}
						min="1"
						class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
					/>
				</div>
			</div>

			<Dialog.Footer>
				<Button type="button" variant="outline" onclick={() => (isCreateDialogOpen = false)}
					>Batal</Button
				>
				<Button type="submit" onclick={handleCreate} disabled={isSaving}>
					{#if isSaving}
						<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					{/if}
					Lanjutkan ke Editor
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
					Tindakan ini tidak dapat dibatalkan. Ujian <strong>{examToDelete?.title}</strong> akan dihapus
					permanen.
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
</div>
