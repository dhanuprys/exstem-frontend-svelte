<script lang="ts">
	import { onMount } from 'svelte';
	import PageHeader from '$lib/components/ui/page-header.svelte';
	import PaginationCustom from '$lib/components/ui/pagination-custom.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import { userService, type AdminUser, type Role } from '$lib/services/admin/user.service';
	import UserForm from './user-form.svelte';
	import { toast } from 'svelte-sonner';
	import { Plus, Pencil, Trash2, Loader2 } from '@lucide/svelte';
	import type { Pagination } from '$lib/types/api';

	let users: AdminUser[] = $state([]);
	let roles: Role[] = $state([]);
	let pagination: Pagination = $state({ page: 1, per_page: 10, total_items: 0, total_pages: 1 });
	let isLoading = $state(false);
	let isSaving = $state(false);

	// Dialog State
	let isDialogOpen = $state(false);
	let isValues: AdminUser | null = $state(null); // null for create, object for edit

	// Form State
	let formName = $state('');
	let formEmail = $state('');
	let formPassword = $state('');
	let formRoleId = $state(0);

	// Delete Alert State
	let isDeleteAlertOpen = $state(false);
	let userToDelete: AdminUser | null = $state(null);

	async function loadData(page = 1) {
		isLoading = true;
		try {
			const res = await userService.getUsers(page, pagination.per_page);
			users = res.data.data;
			if (res.data.pagination) {
				pagination = res.data.pagination;
			}
		} catch (error) {
			toast.error('Gagal memuat data pengguna');
		} finally {
			isLoading = false;
		}
	}

	async function loadRoles() {
		try {
			const res = await userService.getRoles();
			roles = res.data.data;
		} catch (error) {
			console.error('Failed to load roles', error);
		}
	}

	function openCreateDialog() {
		isValues = null;
		formName = '';
		formEmail = '';
		formPassword = '';
		formRoleId = 0;
		isDialogOpen = true;
	}

	function openEditDialog(user: AdminUser) {
		isValues = user;
		formName = user.name;
		formEmail = user.email;
		formPassword = ''; // reset password field
		formRoleId = user.role_id;
		isDialogOpen = true;
	}

	function openDeleteAlert(user: AdminUser) {
		userToDelete = user;
		isDeleteAlertOpen = true;
	}

	async function handleSubmit() {
		if (!formName || !formEmail || !formRoleId) {
			toast.error('Mohon lengkapi semua kolom wajib');
			return;
		}

		isSaving = true;
		try {
			if (isValues) {
				// Edit
				await userService.updateUser(isValues.id, {
					name: formName,
					email: formEmail,
					password: formPassword || undefined,
					role_id: formRoleId
				});
				toast.success('Pengguna berhasil diperbarui');
			} else {
				// Create
				if (!formPassword) {
					toast.error('Kata sandi wajib diisi untuk pengguna baru');
					return;
				}
				await userService.createUser({
					name: formName,
					email: formEmail,
					password: formPassword,
					role_id: formRoleId
				});
				toast.success('Pengguna berhasil dibuat');
			}
			isDialogOpen = false;
			loadData(pagination.page);
		} catch (error: any) {
			toast.error(error.response?.data?.error?.message || 'Gagal menyimpan data');
		} finally {
			isSaving = false;
		}
	}

	async function handleDelete() {
		if (!userToDelete) return;

		isSaving = true;
		try {
			await userService.deleteUser(userToDelete.id);
			toast.success('Pengguna berhasil dihapus');
			isDeleteAlertOpen = false;
			loadData(pagination.page); // Refresh list
		} catch (error: any) {
			toast.error(error.response?.data?.error?.message || 'Gagal menghapus pengguna');
		} finally {
			isSaving = false;
			userToDelete = null;
		}
	}

	onMount(() => {
		loadRoles();
		loadData();
	});
</script>

<div class="flex h-full flex-1 flex-col space-y-8 p-8">
	<PageHeader title="Manajemen Pengguna" description="Kelola akun dan hak akses pengguna admin.">
		<Button onclick={openCreateDialog}>
			<Plus class="mr-2 h-4 w-4" /> Tambah Pengguna
		</Button>
	</PageHeader>

	<div class="rounded-md border">
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>Nama</Table.Head>
					<Table.Head>Email</Table.Head>
					<Table.Head>Peran</Table.Head>
					<Table.Head class="text-right">Aksi</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#if isLoading}
					<Table.Row>
						<Table.Cell colspan={4} class="h-24 text-center">Memuat...</Table.Cell>
					</Table.Row>
				{:else if users.length === 0}
					<Table.Row>
						<Table.Cell colspan={4} class="h-24 text-center">Tidak ada data.</Table.Cell>
					</Table.Row>
				{:else}
					{#each users as user (user.id)}
						<Table.Row>
							<Table.Cell>{user.name}</Table.Cell>
							<Table.Cell>{user.email}</Table.Cell>
							<Table.Cell>{user.role_name || '-'}</Table.Cell>
							<Table.Cell class="text-right">
								<div class="flex justify-end gap-2">
									<Button variant="ghost" size="icon" onclick={() => openEditDialog(user)}>
										<Pencil class="h-4 w-4" />
									</Button>
									<Button
										variant="ghost"
										size="icon"
										class="text-destructive hover:text-destructive"
										onclick={() => openDeleteAlert(user)}
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
				<Dialog.Title>{isValues ? 'Edit Pengguna' : 'Buat Pengguna Baru'}</Dialog.Title>
				<Dialog.Description>
					Isi detail pengguna di bawah ini. Klik simpan setelah selesai.
				</Dialog.Description>
			</Dialog.Header>
			<UserForm
				bind:name={formName}
				bind:email={formEmail}
				bind:password={formPassword}
				bind:roleId={formRoleId}
				{roles}
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
				<AlertDialog.Title>Apakah Anda yakin?</AlertDialog.Title>
				<AlertDialog.Description>
					Tindakan ini tidak dapat dibatalkan. Pengguna <strong>{userToDelete?.name}</strong> akan dihapus
					permanen dari sistem.
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
