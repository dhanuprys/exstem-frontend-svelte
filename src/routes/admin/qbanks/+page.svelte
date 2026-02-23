<script lang="ts">
	import { onMount } from 'svelte';
	import PageHeader from '$lib/components/ui/page-header.svelte';
	import PaginationCustom from '$lib/components/ui/pagination-custom.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import { questionService, type QBank } from '$lib/services/admin/question.service';
	import QBankForm from './qbank-form.svelte';
	import { toast } from 'svelte-sonner';
	import { Plus, Pencil, Trash2, Loader2, FileTextIcon, Search } from '@lucide/svelte';
	import { goto } from '$app/navigation';
	import type { Pagination } from '$lib/types/api';

	let qbanksList: QBank[] = $state([]);
	let pagination: Pagination = $state({ page: 1, per_page: 10, total_items: 0, total_pages: 1 });
	let searchQuery = $state('');
	let searchTimeout: ReturnType<typeof setTimeout>;

	let isLoading = $state(false);
	let isSaving = $state(false);

	// Dialog State
	let isDialogOpen = $state(false);
	let isValues: QBank | null = $state(null); // null for create, object for edit

	// Form State
	let formName = $state('');
	let formDescription = $state('');
	let formSubjectId = $state<number | null | undefined>(undefined);

	let isDeleteAlertOpen = $state(false);
	let qbankToDelete: QBank | null = $state(null);

	async function loadData(page = 1) {
		isLoading = true;
		try {
			const res = await questionService.getQBanks(page, pagination.per_page, searchQuery);
			qbanksList = (res.data as any)?.qbanks || res.data?.data || [];
			if (res.data?.pagination) {
				pagination = res.data.pagination;
			}
		} catch (error: any) {
			toast.error('Gagal memuat daftar bank soal');
		} finally {
			isLoading = false;
		}
	}

	function handleSearch(val: string) {
		searchQuery = val;
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => {
			pagination.page = 1;
			loadData(1);
		}, 500);
	}

	function openCreateDialog() {
		isValues = null;
		formName = '';
		formDescription = '';
		formSubjectId = undefined;
		isDialogOpen = true;
	}

	function openEditDialog(qbank: QBank) {
		isValues = qbank;
		formName = qbank.name;
		formDescription = qbank.description;
		formSubjectId = qbank.subject_id;
		isDialogOpen = true;
	}

	function openDeleteAlert(qbank: QBank) {
		qbankToDelete = qbank;
		isDeleteAlertOpen = true;
	}

	async function handleSubmit() {
		if (!formName || formName.trim().length < 2) {
			toast.error('Nama bank soal tidak valid');
			return;
		}
		if (!formDescription || formDescription.trim().length < 3) {
			toast.error('Deskripsi tidak valid');
			return;
		}

		const payload = {
			name: formName.trim(),
			description: formDescription.trim(),
			subject_id: formSubjectId || undefined
		};

		isSaving = true;
		try {
			if (isValues) {
				// Edit
				await questionService.updateQBank(isValues.id, payload);
				toast.success('Bank soal berhasil diperbarui');
			} else {
				// Create
				await questionService.createQBank(payload);
				toast.success('Bank soal berhasil ditambahkan');
			}
			isDialogOpen = false;
			loadData();
		} catch (error: any) {
			toast.error(error.response?.data?.error?.message || 'Gagal menyimpan data bank soal');
		} finally {
			isSaving = false;
		}
	}

	async function handleDelete() {
		if (!qbankToDelete) return;

		isSaving = true;
		try {
			await questionService.deleteQBank(qbankToDelete.id);
			toast.success('Bank soal berhasil dihapus');
			isDeleteAlertOpen = false;
			loadData();
		} catch (error: any) {
			toast.error(error.response?.data?.error?.message || 'Gagal menghapus bank soal');
		} finally {
			isSaving = false;
			qbankToDelete = null;
		}
	}

	onMount(() => {
		loadData();
	});
</script>

<svelte:head>
	<title>Bank Soal - Exstem</title>
</svelte:head>

<div class="flex h-full flex-1 flex-col space-y-8 p-8">
	<PageHeader
		title="Bank Soal"
		description="Kelola daftar bank soal yang akan digunakan di aplikasi."
	>
		<Button onclick={openCreateDialog}>
			<Plus class="mr-2 h-4 w-4" /> Tambah Bank Soal
		</Button>
	</PageHeader>
	<div class="flex items-center justify-between">
		<div class="relative w-full sm:w-[350px]">
			<Search class="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
			<input
				type="search"
				placeholder="Cari nama atau deskripsi bank soal..."
				class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 pl-8 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
				bind:value={searchQuery}
				oninput={(e) => handleSearch(e.currentTarget.value)}
			/>
		</div>
	</div>

	<div class="rounded-md border">
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>Mata Pelajaran</Table.Head>
					<Table.Head>Nama</Table.Head>
					<Table.Head>Deskripsi</Table.Head>
					<Table.Head class="text-right">Aksi</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#if isLoading}
					<Table.Row>
						<Table.Cell colspan={3} class="h-24 text-center">Memuat...</Table.Cell>
					</Table.Row>
				{:else if qbanksList.length === 0}
					<Table.Row>
						<Table.Cell colspan={3} class="h-24 text-center">Tidak ada bank soal.</Table.Cell>
					</Table.Row>
				{:else}
					{#each qbanksList as qbank (qbank.id)}
						<Table.Row>
							<Table.Cell>
								{#if qbank.subject_name}
									<span
										class="inline-flex items-center rounded-sm bg-secondary px-2 py-0.5 text-xs font-semibold text-secondary-foreground"
									>
										{qbank.subject_name}
									</span>
								{:else}
									<span class="text-muted-foreground">-</span>
								{/if}
							</Table.Cell>
							<Table.Cell class="font-medium">{qbank.name}</Table.Cell>
							<Table.Cell>{qbank.description}</Table.Cell>
							<Table.Cell class="text-right">
								<div class="flex justify-end gap-2">
									<Button variant="ghost" size="icon" onclick={() => openEditDialog(qbank)}>
										<Pencil class="h-4 w-4" />
									</Button>
									<Button
										variant="ghost"
										size="icon"
										onclick={() => goto(`/admin/qbanks/${qbank.id}`)}
									>
										<FileTextIcon class="h-4 w-4" />
									</Button>
									<Button
										variant="ghost"
										size="icon"
										class="text-destructive hover:text-destructive"
										onclick={() => openDeleteAlert(qbank)}
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
				<Dialog.Title>{isValues ? 'Edit Bank Soal' : 'Tambah Bank Soal'}</Dialog.Title>
				<Dialog.Description>
					Masukkan nama dan deskripsi bank soal untuk mendaftarkannya pada sistem konfigurasi
					global.
				</Dialog.Description>
			</Dialog.Header>
			<QBankForm
				bind:name={formName}
				bind:description={formDescription}
				bind:subjectId={formSubjectId}
			/>
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
				<AlertDialog.Title>Hapus Bank Soal?</AlertDialog.Title>
				<AlertDialog.Description>
					Apakah Anda yakin ingin menghapus bank soal <strong
						>{qbankToDelete?.name} ({qbankToDelete?.description})</strong
					>? Siswa atau Kelas yang sudah menggunakan bank soal ini tidak akan mengalami kerusakan di
					database, namun kode bank soal mereka akan terhapus dari dropdown filter aktif.
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
