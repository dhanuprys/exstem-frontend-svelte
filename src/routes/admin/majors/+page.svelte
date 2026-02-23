<script lang="ts">
	import { onMount } from 'svelte';
	import PageHeader from '$lib/components/ui/page-header.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import { majorService, type Major } from '$lib/services/admin/major.service';
	import MajorForm from './major-form.svelte';
	import { toast } from 'svelte-sonner';
	import { Plus, Pencil, Trash2, Loader2 } from '@lucide/svelte';

	let majorsList: Major[] = $state([]);
	let isLoading = $state(false);
	let isSaving = $state(false);

	// Dialog State
	let isDialogOpen = $state(false);
	let isValues: Major | null = $state(null); // null for create, object for edit

	// Form State
	let formCode = $state('');
	let formLongName = $state('');

	// Delete Alert State
	let isDeleteAlertOpen = $state(false);
	let majorToDelete: Major | null = $state(null);

	async function loadData() {
		isLoading = true;
		try {
			const res = await majorService.getMajors();
			majorsList = res.data.data.majors || [];
		} catch (error: any) {
			toast.error('Gagal memuat daftar jurusan');
		} finally {
			isLoading = false;
		}
	}

	function openCreateDialog() {
		isValues = null;
		formCode = '';
		formLongName = '';
		isDialogOpen = true;
	}

	function openEditDialog(major: Major) {
		isValues = major;
		formCode = major.code;
		formLongName = major.long_name;
		isDialogOpen = true;
	}

	function openDeleteAlert(major: Major) {
		majorToDelete = major;
		isDeleteAlertOpen = true;
	}

	async function handleSubmit() {
		if (!formCode || formCode.trim().length < 2) {
			toast.error('Kode jurusan tidak valid');
			return;
		}
		if (!formLongName || formLongName.trim().length < 3) {
			toast.error('Nama panjang jurusan tidak valid');
			return;
		}

		const payload = {
			code: formCode.trim().toUpperCase(),
			long_name: formLongName.trim()
		};

		isSaving = true;
		try {
			if (isValues) {
				// Edit
				await majorService.updateMajor(isValues.id, payload);
				toast.success('Jurusan berhasil diperbarui');
			} else {
				// Create
				await majorService.createMajor(payload);
				toast.success('Jurusan berhasil ditambahkan');
			}
			isDialogOpen = false;
			loadData();
		} catch (error: any) {
			toast.error(error.response?.data?.error?.message || 'Gagal menyimpan data jurusan');
		} finally {
			isSaving = false;
		}
	}

	async function handleDelete() {
		if (!majorToDelete) return;

		isSaving = true;
		try {
			await majorService.deleteMajor(majorToDelete.id);
			toast.success('Jurusan berhasil dihapus');
			isDeleteAlertOpen = false;
			loadData();
		} catch (error: any) {
			toast.error(error.response?.data?.error?.message || 'Gagal menghapus jurusan');
		} finally {
			isSaving = false;
			majorToDelete = null;
		}
	}

	onMount(() => {
		loadData();
	});
</script>

<svelte:head>
	<title>Kelola Jurusan - Exstem</title>
</svelte:head>

<div class="flex h-full flex-1 flex-col space-y-8 p-8">
	<PageHeader
		title="Jurusan"
		description="Kelola daftar jurusan (program keahlian) yang akan digunakan di aplikasi."
	>
		<Button onclick={openCreateDialog}>
			<Plus class="mr-2 h-4 w-4" /> Tambah Jurusan
		</Button>
	</PageHeader>

	<div class="rounded-md border">
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>Kode</Table.Head>
					<Table.Head>Nama Jurusan</Table.Head>
					<Table.Head class="text-right">Aksi</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#if isLoading}
					<Table.Row>
						<Table.Cell colspan={3} class="h-24 text-center">Memuat...</Table.Cell>
					</Table.Row>
				{:else if majorsList.length === 0}
					<Table.Row>
						<Table.Cell colspan={3} class="h-24 text-center">Tidak ada jurusan.</Table.Cell>
					</Table.Row>
				{:else}
					{#each majorsList as major (major.id)}
						<Table.Row>
							<Table.Cell class="font-medium">{major.code}</Table.Cell>
							<Table.Cell>{major.long_name}</Table.Cell>
							<Table.Cell class="text-right">
								<div class="flex justify-end gap-2">
									<Button variant="ghost" size="icon" onclick={() => openEditDialog(major)}>
										<Pencil class="h-4 w-4" />
									</Button>
									<Button
										variant="ghost"
										size="icon"
										class="text-destructive hover:text-destructive"
										onclick={() => openDeleteAlert(major)}
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
				<Dialog.Title>{isValues ? 'Edit Jurusan' : 'Tambah Jurusan'}</Dialog.Title>
				<Dialog.Description>
					Masukkan kode dan nama lengkap jurusan untuk mendaftarkannya pada sistem konfigurasi
					global.
				</Dialog.Description>
			</Dialog.Header>
			<MajorForm bind:code={formCode} bind:longName={formLongName} />
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
				<AlertDialog.Title>Hapus Jurusan?</AlertDialog.Title>
				<AlertDialog.Description>
					Apakah Anda yakin ingin menghapus jurusan <strong
						>{majorToDelete?.long_name} ({majorToDelete?.code})</strong
					>? Siswa atau Kelas yang sudah menggunakan jurusan ini tidak akan mengalami kerusakan di
					database, namun kode jurusan mereka akan terhapus dari dropdown filter aktif.
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
