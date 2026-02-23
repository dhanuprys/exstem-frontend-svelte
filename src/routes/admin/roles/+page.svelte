<script lang="ts">
	import { onMount } from 'svelte';
	import PageHeader from '$lib/components/ui/page-header.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { roleService, type RoleWithPermissions } from '$lib/services/admin/role.service';
	import RoleForm from './role-form.svelte';
	import { toast } from 'svelte-sonner';
	import { Plus, Pencil, Trash2, Loader2, Shield } from '@lucide/svelte';

	let roles: RoleWithPermissions[] = [];
	let allPermissions: string[] = [];
	let isLoading = false;
	let isSaving = false;

	// Dialog State
	let isDialogOpen = false;
	let isValues: RoleWithPermissions | null = null; // null for create, object for edit

	// Form State
	let formName = '';
	let formPermissions: string[] = [];

	// Delete Alert State
	let isDeleteAlertOpen = false;
	let roleToDelete: RoleWithPermissions | null = null;

	async function loadData() {
		isLoading = true;
		try {
			const res = await roleService.getRolesWithPermissions();
			roles = res.data.data;
		} catch (error) {
			toast.error('Gagal memuat data peran');
		} finally {
			isLoading = false;
		}
	}

	async function loadPermissions() {
		try {
			const res = await roleService.getPermissions();
			allPermissions = res.data.data;
		} catch (error) {
			console.error('Failed to load permissions list');
		}
	}

	function openCreateDialog() {
		isValues = null;
		formName = '';
		formPermissions = [];
		isDialogOpen = true;
	}

	function openEditDialog(role: RoleWithPermissions) {
		isValues = role;
		formName = role.name;
		// make sure we copy the array to avoid mutating the original until saved
		formPermissions = [...(role.permissions || [])];
		isDialogOpen = true;
	}

	function openDeleteAlert(role: RoleWithPermissions) {
		if (role.name === 'Superadmin' || role.id === 1) {
			toast.error('Tidak dapat menghapus peran sistem default');
			return;
		}
		roleToDelete = role;
		isDeleteAlertOpen = true;
	}

	async function handleSubmit() {
		if (!formName) {
			toast.error('Nama peran wajib diisi');
			return;
		}

		isSaving = true;
		try {
			if (isValues) {
				// Prevent altering superadmin name, though form checks this, be safe.
				if (isValues.id === 1 && formName !== 'Superadmin') {
					toast.error('Tidak dapat mengubah nama peran sistem Superadmin');
					isSaving = false;
					return;
				}

				await roleService.updateRole(isValues.id, {
					name: formName,
					permissions: formPermissions
				});
				toast.success('Peran berhasil diperbarui');
			} else {
				await roleService.createRole({
					name: formName,
					permissions: formPermissions
				});
				toast.success('Peran berhasil dibuat');
			}
			isDialogOpen = false;
			loadData();
		} catch (error: any) {
			toast.error(error.response?.data?.error?.message || 'Gagal menyimpan data');
		} finally {
			isSaving = false;
		}
	}

	async function handleDelete() {
		if (!roleToDelete) return;

		isSaving = true;
		try {
			await roleService.deleteRole(roleToDelete.id);
			toast.success('Peran berhasil dihapus');
			isDeleteAlertOpen = false;
			loadData(); // Refresh list
		} catch (error: any) {
			toast.error(error.response?.data?.error?.message || 'Gagal menghapus peran');
		} finally {
			isSaving = false;
			roleToDelete = null;
		}
	}

	onMount(() => {
		loadPermissions();
		loadData();
	});
</script>

<svelte:head>
	<title>Kelola Peran - Exstem</title>
</svelte:head>

<div class="flex h-full flex-1 flex-col space-y-8 p-8">
	<PageHeader
		title="Manajemen Peran & Izin"
		description="Kelola peran administrator dan akses sistem mereka."
	>
		<Button onclick={openCreateDialog}>
			<Plus class="mr-2 h-4 w-4" /> Buat Peran
		</Button>
	</PageHeader>

	<div class="rounded-md border">
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head class="w-[200px]">Nama Peran</Table.Head>
					<Table.Head>Izin (Permissions)</Table.Head>
					<Table.Head class="w-[100px] text-right">Aksi</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#if isLoading}
					<Table.Row>
						<Table.Cell colspan={3} class="h-24 text-center">Memuat...</Table.Cell>
					</Table.Row>
				{:else if roles.length === 0}
					<Table.Row>
						<Table.Cell colspan={3} class="h-24 text-center">Tidak ada data peran.</Table.Cell>
					</Table.Row>
				{:else}
					{#each roles as role (role.id)}
						<Table.Row>
							<Table.Cell class="font-medium">
								<div class="flex items-center space-x-2">
									{#if role.id === 1}
										<Shield class="h-4 w-4 text-primary" />
									{/if}
									<span>{role.name}</span>
								</div>
							</Table.Cell>
							<Table.Cell>
								<div class="flex flex-wrap gap-1">
									{#if role.permissions && role.permissions.length > 0}
										{#if role.id === 1}
											<Badge variant="default" class="mr-1 mb-1">ALL ACCESS</Badge>
										{:else}
											{#each role.permissions.slice(0, 5) as perm}
												<Badge variant="secondary" class="mr-1 mb-1">{perm}</Badge>
											{/each}
											{#if role.permissions.length > 5}
												<Badge variant="outline" class="mr-1 mb-1"
													>+{role.permissions.length - 5} lainnya</Badge
												>
											{/if}
										{/if}
									{:else}
										<span class="text-xs text-muted-foreground italic">Tidak ada izin spesifik</span
										>
									{/if}
								</div>
							</Table.Cell>
							<Table.Cell class="text-right">
								<div class="flex justify-end gap-2">
									<Button variant="ghost" size="icon" onclick={() => openEditDialog(role)}>
										<Pencil class="h-4 w-4" />
									</Button>
									<Button
										variant="ghost"
										size="icon"
										class="text-destructive hover:text-destructive"
										onclick={() => openDeleteAlert(role)}
										disabled={role.id === 1}
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
		<Dialog.Content class="sm:max-h-[90vh] sm:max-w-[700px]">
			<Dialog.Header>
				<Dialog.Title>{isValues ? 'Edit Peran' : 'Buat Peran Baru'}</Dialog.Title>
				<Dialog.Description>
					Konfigurasi nama peran dan akses (izin) yang diberikan.
				</Dialog.Description>
			</Dialog.Header>
			<RoleForm
				bind:name={formName}
				bind:permissions={formPermissions}
				{allPermissions}
				isEdit={!!isValues}
			/>
			<Dialog.Footer class="mt-4 border-t pt-4">
				<Button type="submit" onclick={handleSubmit} disabled={isSaving}>
					{#if isSaving}
						<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					{/if}
					Simpan Peran
				</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>

	<!-- Delete Alert -->
	<AlertDialog.Root bind:open={isDeleteAlertOpen}>
		<AlertDialog.Content>
			<AlertDialog.Header>
				<AlertDialog.Title>Hapus Peran?</AlertDialog.Title>
				<AlertDialog.Description>
					Tindakan ini tidak dapat dibatalkan. Peran <strong>{roleToDelete?.name}</strong> akan dihapus
					permanen. Penghapusan akan gagal jika peran ini masih digunakan oleh pengguna aktif.
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
