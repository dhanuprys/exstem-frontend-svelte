<script lang="ts">
	import { onMount } from 'svelte';
	import PageHeader from '$lib/components/ui/page-header.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import { roomService, type Room } from '$lib/services/admin/room.service';
	import RoomForm from './room-form.svelte';
	import { toast } from 'svelte-sonner';
	import { Plus, Pencil, Trash2, Loader2, Home } from '@lucide/svelte';

	let roomsList: Room[] = $state([]);
	let isLoading = $state(false);
	let isSaving = $state(false);

	// Dialog State
	let isDialogOpen = $state(false);
	let isValues: Room | null = $state(null); // null for create, object for edit

	// Form State
	let formName = $state('');
	let formCapacity: number | string = $state('');

	// Delete Alert State
	let isDeleteAlertOpen = $state(false);
	let roomToDelete: Room | null = $state(null);

	async function loadData() {
		isLoading = true;
		try {
			const res = await roomService.getRooms();
			roomsList = res.data.data.rooms || [];
		} catch (error) {
			toast.error('Gagal memuat data ruangan');
		} finally {
			isLoading = false;
		}
	}

	function openCreateDialog() {
		isValues = null;
		formName = '';
		formCapacity = '';
		isDialogOpen = true;
	}

	function openEditDialog(room: Room) {
		isValues = room;
		formName = room.name;
		formCapacity = room.capacity;
		isDialogOpen = true;
	}

	async function handleSubmit() {
		if (!formName || !formCapacity || Number(formCapacity) < 1) {
			toast.error('Mohon lengkapi semua field dengan benar');
			return;
		}

		isSaving = true;
		const payload = {
			name: formName,
			capacity: Number(formCapacity)
		};

		try {
			if (isValues?.id) {
				await roomService.updateRoom(isValues.id, payload);
				toast.success('Ruangan berhasil diupdate');
			} else {
				await roomService.createRoom(payload);
				toast.success('Ruangan berhasil ditambahkan');
			}
			isDialogOpen = false;
			loadData();
		} catch (error: any) {
			if (error.response?.status === 409) {
				toast.error('Nama ruangan sudah digunakan');
			} else {
				toast.error(error.response?.data?.error?.message || 'Gagal menyimpan data ruangan');
			}
		} finally {
			isSaving = false;
		}
	}

	function confirmDelete(room: Room) {
		roomToDelete = room;
		isDeleteAlertOpen = true;
	}

	async function handleDelete() {
		if (!roomToDelete?.id) return;

		isSaving = true;
		try {
			await roomService.deleteRoom(roomToDelete.id);
			toast.success('Ruangan berhasil dihapus');
			isDeleteAlertOpen = false;
			loadData();
		} catch (error: any) {
			if (error.response?.status === 409) {
				toast.error('Ruangan tidak dapat dihapus karena masih terkait dengan data ujian/jadwal');
			} else {
				toast.error(error.response?.data?.error?.message || 'Gagal menghapus ruangan');
			}
		} finally {
			isSaving = false;
			roomToDelete = null;
		}
	}

	onMount(() => {
		loadData();
	});
</script>

<svelte:head>
	<title>Kelola Ruangan - Exstem</title>
</svelte:head>

<div class="flex h-full flex-1 flex-col space-y-8 p-8">
	<PageHeader
		title="Manajemen Ruangan"
		description="Kelola data ruangan untuk distribusi jadwal ujian otomatis."
	>
		<Button onclick={openCreateDialog}>
			<Plus class="mr-2 h-4 w-4" /> Tambah Ruangan
		</Button>
	</PageHeader>

	{#if isLoading}
		<div class="flex h-32 items-center justify-center">
			<Loader2 class="h-8 w-8 animate-spin text-primary" />
		</div>
	{:else}
		<div class="rounded-md border">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head class="w-16 text-center font-bold text-foreground">No</Table.Head>
						<Table.Head class="font-bold text-foreground">Nama Ruangan</Table.Head>
						<Table.Head class="text-center font-bold text-foreground">Kapasitas Kursi</Table.Head>
						<Table.Head class="w-24 text-center font-bold text-foreground">Aksi</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#if roomsList.length === 0}
						<Table.Row>
							<Table.Cell colspan={4} class="h-24 bg-muted/20 text-center">
								<div class="flex flex-col items-center justify-center text-muted-foreground">
									<Home class="mb-2 h-8 w-8 opacity-20" />
									<p>Belum ada data ruangan.</p>
								</div>
							</Table.Cell>
						</Table.Row>
					{:else}
						{#each roomsList as item, idx (item.id)}
							<Table.Row>
								<Table.Cell class="text-center">{idx + 1}</Table.Cell>
								<Table.Cell class="font-medium">{item.name}</Table.Cell>
								<Table.Cell class="text-center">{item.capacity} Kursi</Table.Cell>
								<Table.Cell class="text-right">
									<div class="flex justify-end gap-2">
										<Button variant="ghost" size="icon" onclick={() => openEditDialog(item)}>
											<Pencil class="h-4 w-4" />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											class="text-destructive hover:text-destructive"
											onclick={() => confirmDelete(item)}
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
	{/if}
</div>

<!-- Create/Edit Dialog -->
<Dialog.Root bind:open={isDialogOpen}>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>{isValues ? 'Edit Ruangan' : 'Tambah Ruangan Baru'}</Dialog.Title>
			<Dialog.Description>Silakan isi nama dan kapasitas kursi ruangan.</Dialog.Description>
		</Dialog.Header>

		<RoomForm bind:name={formName} bind:capacity={formCapacity} />

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
			<AlertDialog.Title>Apakah anda yakin?</AlertDialog.Title>
			<AlertDialog.Description>
				Tindakan ini tidak dapat dibatalkan. Data ruangan <strong>{roomToDelete?.name}</strong> akan dihapus
				secara permanen dari sistem. Pastikan tidak ada jadwal ujian yang bergantung pada ruangan ini.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel onclick={() => (isDeleteAlertOpen = false)}>Batal</AlertDialog.Cancel>
			<AlertDialog.Action
				onclick={handleDelete}
				class="text-destructive-foreground bg-destructive hover:bg-destructive/90"
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
