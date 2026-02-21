<script lang="ts">
    import { onMount } from "svelte";
    import PageHeader from "$lib/components/ui/page-header.svelte";
    import { Button } from "$lib/components/ui/button/index.js";
    import * as Table from "$lib/components/ui/table/index.js";
    import * as Dialog from "$lib/components/ui/dialog/index.js";
    import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js";
    import { classService, type Class } from "$lib/services/admin/class.service";
    import ClassForm from "./class-form.svelte";
    import { toast } from "svelte-sonner";
    import { Plus, Pencil, Trash2, Loader2, Users } from "@lucide/svelte";

    let classesList: Class[] = $state([]);
    let isLoading = $state(false);
    let isSaving = $state(false);

    // Dialog State
    let isDialogOpen = $state(false);
    let isValues: Class | null = $state(null); // null for create, object for edit
    
    // Form State (Bind to string to handle empty inputs easily)
    let formGradeLevel = $state("");
    let formMajorCode = $state("");
    let formGroupNumber = $state("");

    // Delete Alert State
    let isDeleteAlertOpen = $state(false);
    let classToDelete: Class | null = $state(null);

    async function loadData() {
        isLoading = true;
        try {
            const res = await classService.getClasses();
            classesList = res.data.data.classes || [];
        } catch (error) {
            toast.error("Gagal memuat data kelas");
        } finally {
            isLoading = false;
        }
    }

    function openCreateDialog() {
        isValues = null;
        formGradeLevel = "";
        formMajorCode = "";
        formGroupNumber = "";
        isDialogOpen = true;
    }

    function openEditDialog(classItem: Class) {
        isValues = classItem;
        formGradeLevel = classItem.grade_level.toString();
        formMajorCode = classItem.major_code;
        formGroupNumber = classItem.group_number.toString();
        isDialogOpen = true;
    }

    function openDeleteAlert(classItem: Class) {
        classToDelete = classItem;
        isDeleteAlertOpen = true;
    }

    async function handleSubmit() {
        if (!formGradeLevel || !formMajorCode || !formGroupNumber) {
            toast.error("Mohon lengkapi semua kolom wajib");
            return;
        }

        const payload = {
            grade_level: parseInt(formGradeLevel),
            major_code: formMajorCode.toUpperCase(),
            group_number: parseInt(formGroupNumber)
        };

        isSaving = true;
        try {
            if (isValues) {
                // Edit
                await classService.updateClass(isValues.id, payload);
                toast.success("Kelas berhasil diperbarui");
            } else {
                // Create
                await classService.createClass(payload);
                toast.success("Kelas berhasil dibuat");
            }
            isDialogOpen = false;
            loadData();
        } catch (error: any) {
            toast.error(error.response?.data?.error?.message || "Gagal menyimpan data kelas");
        } finally {
            isSaving = false;
        }
    }

    async function handleDelete() {
        if (!classToDelete) return;
        
        isSaving = true;
        try {
            await classService.deleteClass(classToDelete.id);
            toast.success("Kelas berhasil dihapus");
            isDeleteAlertOpen = false;
            loadData(); // Refresh list
        } catch (error: any) {
            toast.error(error.response?.data?.error?.message || "Gagal menghapus kelas");
        } finally {
            isSaving = false;
            classToDelete = null;
        }
    }

    onMount(() => {
        loadData();
    });
</script>

<div class="h-full flex-1 flex-col space-y-8 p-8 flex">
    <PageHeader title="Manajemen Kelas" description="Kelola daftar tingkat, jurusan, dan rombongan belajar (rombel) siswa.">
        <Button onclick={openCreateDialog}>
            <Plus class="mr-2 h-4 w-4" /> Tambah Kelas
        </Button>
    </PageHeader>

    <div class="rounded-md border">
        <Table.Root>
            <Table.Header>
                <Table.Row>
                    <Table.Head>Tingkat</Table.Head>
                    <Table.Head>Jurusan</Table.Head>
                    <Table.Head>Rombel</Table.Head>
                    <Table.Head>Nama Kelas</Table.Head>
                    <Table.Head class="text-right">Aksi</Table.Head>
                </Table.Row>
            </Table.Header>
            <Table.Body>
                {#if isLoading}
                    <Table.Row>
                        <Table.Cell colspan={5} class="h-24 text-center">Memuat...</Table.Cell>
                    </Table.Row>
                {:else if classesList.length === 0}
                    <Table.Row>
                        <Table.Cell colspan={5} class="h-24 text-center">Tidak ada data kelas.</Table.Cell>
                    </Table.Row>
                {:else}
                    {#each classesList as classItem (classItem.id)}
                        <Table.Row>
                            <Table.Cell>{classItem.grade_level}</Table.Cell>
                            <Table.Cell>{classItem.major_code}</Table.Cell>
                            <Table.Cell>{classItem.group_number}</Table.Cell>
                            <Table.Cell class="font-medium">{classItem.grade_level} {classItem.major_code} {classItem.group_number}</Table.Cell>
                            <Table.Cell class="text-right">
                                <div class="flex justify-end gap-2">
                                    <Button variant="ghost" size="icon" onclick={() => openEditDialog(classItem)}>
                                        <Pencil class="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" class="text-destructive hover:text-destructive" onclick={() => openDeleteAlert(classItem)}>
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
                <Dialog.Title>{isValues ? "Edit Kelas" : "Tambah Kelas Baru"}</Dialog.Title>
                <Dialog.Description>
                    Isi detail tingkat, jurusan, dan rombongan belajar. Klik simpan setelah selesai.
                </Dialog.Description>
            </Dialog.Header>
            <ClassForm 
                bind:gradeLevel={formGradeLevel} 
                bind:majorCode={formMajorCode} 
                bind:groupNumber={formGroupNumber} 
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
                    Tindakan ini tidak dapat dibatalkan. Kelas <strong>{classToDelete?.grade_level} {classToDelete?.major_code} {classToDelete?.group_number}</strong> akan dihapus permanen dari sistem.
                    Data tidak dapat dihapus jika masih ada siswa yang terdaftar di kelas ini.
                </AlertDialog.Description>
            </AlertDialog.Header>
            <AlertDialog.Footer>
                <AlertDialog.Cancel>Batal</AlertDialog.Cancel>
                <AlertDialog.Action class="bg-destructive text-destructive-foreground hover:bg-destructive/90" onclick={handleDelete} disabled={isSaving}>
                    {#if isSaving}
                         <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                    {/if}
                    Ya, Hapus
                </AlertDialog.Action>
            </AlertDialog.Footer>
        </AlertDialog.Content>
    </AlertDialog.Root>
</div>
