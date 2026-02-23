<script lang="ts">
	import { onMount } from 'svelte';
	import PageHeader from '$lib/components/ui/page-header.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import { subjectService, type Subject } from '$lib/services/admin/subject.service';
	import SubjectForm from './subject-form.svelte';
	import { toast } from 'svelte-sonner';
	import { Plus, Pencil, Trash2, Loader2, BookOpen } from '@lucide/svelte';

	let subjectsList: Subject[] = $state([]);
	let isLoading = $state(false);
	let isSaving = $state(false);

	// Dialog State
	let isDialogOpen = $state(false);
	let isValues: Subject | null = $state(null); // null for create, object for edit

	// Form State
	let formName = $state('');

	// Delete Alert State
	let isDeleteAlertOpen = $state(false);
	let subjectToDelete: Subject | null = $state(null);

	async function loadData() {
		isLoading = true;
		try {
			const res = await subjectService.getSubjects();
			subjectsList = res.data.data || [];
		} catch (error: any) {
			toast.error('Gagal memuat daftar mata pelajaran');
		} finally {
			isLoading = false;
		}
	}

	function openCreateDialog() {
		isValues = null;
		formName = '';
		isDialogOpen = true;
	}

	function openEditDialog(subject: Subject) {
		isValues = subject;
		formName = subject.name;
		isDialogOpen = true;
	}

	function openDeleteAlert(subject: Subject) {
		subjectToDelete = subject;
		isDeleteAlertOpen = true;
	}

	async function handleSubmit() {
		if (!formName || formName.trim().length < 2) {
			toast.error('Nama mata pelajaran tidak valid (min 2 karakter)');
			return;
		}

		const payload = {
			name: formName.trim()
		};

		isSaving = true;
		try {
			if (isValues) {
				// Edit
				await subjectService.updateSubject(isValues.id, payload);
				toast.success('Mata pelajaran berhasil diperbarui');
			} else {
				// Create
				await subjectService.createSubject(payload);
				toast.success('Mata pelajaran berhasil ditambahkan');
			}
			isDialogOpen = false;
			loadData();
		} catch (error: any) {
			toast.error(error.response?.data?.error?.message || 'Gagal menyimpan data mata pelajaran');
		} finally {
			isSaving = false;
		}
	}

	async function handleDelete() {
		if (!subjectToDelete) return;

		isSaving = true;
		try {
			await subjectService.deleteSubject(subjectToDelete.id);
			toast.success('Mata pelajaran berhasil dihapus');
			isDeleteAlertOpen = false;
			loadData();
		} catch (error: any) {
			toast.error(error.response?.data?.error?.message || 'Gagal menghapus mata pelajaran');
		} finally {
			isSaving = false;
			subjectToDelete = null;
		}
	}

	onMount(() => {
		loadData();
	});
</script>

<svelte:head>
	<title>Kelola Mapel - Exstem</title>
</svelte:head>

<div class="flex h-full flex-1 flex-col space-y-8 p-8">
	<PageHeader title="Mata Pelajaran" description="Kelola daftar mata pelajaran yang akan diujikan.">
		<Button onclick={openCreateDialog}>
			<Plus class="mr-2 h-4 w-4" /> Tambah Mata Pelajaran
		</Button>
	</PageHeader>

	<div class="rounded-md border">
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>ID</Table.Head>
					<Table.Head>Nama Mata Pelajaran</Table.Head>
					<Table.Head class="text-right">Aksi</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#if isLoading}
					<Table.Row>
						<Table.Cell colspan={3} class="h-24 text-center">Memuat...</Table.Cell>
					</Table.Row>
				{:else if subjectsList.length === 0}
					<Table.Row>
						<Table.Cell colspan={3} class="h-24 text-center">Tidak ada mata pelajaran.</Table.Cell>
					</Table.Row>
				{:else}
					{#each subjectsList as subject (subject.id)}
						<Table.Row>
							<Table.Cell>{subject.id}</Table.Cell>
							<Table.Cell class="font-medium">{subject.name}</Table.Cell>
							<Table.Cell class="text-right">
								<div class="flex justify-end gap-2">
									<Button variant="ghost" size="icon" onclick={() => openEditDialog(subject)}>
										<Pencil class="h-4 w-4" />
									</Button>
									<Button
										variant="ghost"
										size="icon"
										class="text-destructive hover:text-destructive"
										onclick={() => openDeleteAlert(subject)}
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

	<!-- Create/Edit Dialog -->
	<Dialog.Root bind:open={isDialogOpen}>
		<Dialog.Content class="sm:max-w-[425px]">
			<Dialog.Header>
				<Dialog.Title>{isValues ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran'}</Dialog.Title>
				<Dialog.Description>
					Masukkan nama mata pelajaran. Nama ini akan muncul saat membuat ujian baru.
				</Dialog.Description>
			</Dialog.Header>
			<SubjectForm bind:name={formName} />
			<Dialog.Footer>
				<Button type="submit" onclick={handleSubmit} disabled={isSaving}>
					{#if isSaving}
						<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					{/if}
					Simpan
				</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>

	<!-- Delete Alert -->
	<AlertDialog.Root bind:open={isDeleteAlertOpen}>
		<AlertDialog.Content>
			<AlertDialog.Header>
				<AlertDialog.Title>Hapus Mata Pelajaran?</AlertDialog.Title>
				<AlertDialog.Description>
					Apakah Anda yakin ingin menghapus mata pelajaran <strong>{subjectToDelete?.name}</strong>?
					Ujian yang sudah terhubung dengan mata pelajaran ini akan kehilangan relasinya (Mata
					pelajaran menjadi kosong pada ujian tersebut).
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
					Hapus Permanen
				</AlertDialog.Action>
			</AlertDialog.Footer>
		</AlertDialog.Content>
	</AlertDialog.Root>
</div>
