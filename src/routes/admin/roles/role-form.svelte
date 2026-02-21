<script lang="ts">
    import { Input } from "$lib/components/ui/input/index.js";
    import { Label } from "$lib/components/ui/label/index.js";
    import { Checkbox } from "$lib/components/ui/checkbox/index.js";
    import * as Accordion from "$lib/components/ui/accordion/index.js";

    export let name: string = '';
    export let permissions: string[] = []; // Current selected permissions
    export let allPermissions: string[] = []; // List of all system permission codes
    export let isEdit: boolean = false;

    // Helper to group permissions by their prefix (e.g., 'users:read' -> 'users')
    $: groupedPermissions = allPermissions.reduce((acc, perm) => {
        const [group] = perm.split(':');
        if (!acc[group]) acc[group] = [];
        acc[group].push(perm);
        return acc;
    }, {} as Record<string, string[]>);

    function togglePermission(perm: string, checked: boolean) {
        if (checked) {
            if (!permissions.includes(perm)) permissions = [...permissions, perm];
        } else {
            permissions = permissions.filter(p => p !== perm);
        }
    }

    function toggleGroup(group: string, perms: string[], checked: boolean) {
        if (checked) {
            // Add all permissions in this group
            const toAdd = perms.filter(p => !permissions.includes(p));
            permissions = [...permissions, ...toAdd];
        } else {
            // Remove all
            permissions = permissions.filter(p => !perms.includes(p));
        }
    }

    // Determine if all perms in a group are selected
    function isGroupFullySelected(groupPerms: string[], selectedPerms: string[]) {
        if (groupPerms.length === 0) return false;
        return groupPerms.every(p => selectedPerms.includes(p));
    }
</script>

<div class="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
    <div class="grid gap-2">
        <Label for="name">Nama Peran *</Label>
        <Input 
            id="name" 
            bind:value={name} 
            placeholder="Misal: Editor" 
            required
            disabled={isEdit && name === 'Superadmin'}
        />
        {#if isEdit && name === 'Superadmin'}
            <p class="text-xs text-muted-foreground mt-1">Peran sistem Superadmin tidak dapat diubah namanya.</p>
        {/if}
    </div>

    <div class="grid gap-2 mt-2">
        <Label>Izin (Permissions)</Label>
        {#if allPermissions.length === 0}
            <p class="text-sm text-muted-foreground italic">Gagal memuat daftar izin.</p>
        {:else}
            <Accordion.Root type="multiple" class="w-full">
                {#each Object.entries(groupedPermissions) as [group, perms]}
                    <Accordion.Item value={group}>
                        <Accordion.Trigger class="py-3 hover:no-underline">
                            <div class="flex items-center space-x-2">
                                <div class="font-medium mr-2">{group.toUpperCase()}</div>
                            </div>
                        </Accordion.Trigger>
                        <Accordion.Content>
                            <div class="rounded-md border p-4 bg-muted/30">
                                <div class="mb-4 flex items-center space-x-2 pb-4 border-b">
                                    <Checkbox 
                                        id={`group-all-${group}`} 
                                        checked={isGroupFullySelected(perms, permissions)}
                                        onCheckedChange={(v) => toggleGroup(group, perms, v === true)}
                                    />
                                    <Label for={`group-all-${group}`} class="font-semibold cursor-pointer">
                                        Pilih Semua ({perms.length})
                                    </Label>
                                </div>
                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {#each perms as perm}
                                        <div class="flex items-start space-x-2">
                                            <Checkbox 
                                                id={`perm-${perm}`} 
                                                checked={permissions.includes(perm)}
                                                onCheckedChange={(v) => togglePermission(perm, v === true)}
                                            />
                                            <div class="grid gap-1.5 leading-none">
                                                <Label for={`perm-${perm}`} class="text-sm font-normal cursor-pointer leading-snug">
                                                    {perm}
                                                </Label>
                                            </div>
                                        </div>
                                    {/each}
                                </div>
                            </div>
                        </Accordion.Content>
                    </Accordion.Item>
                {/each}
            </Accordion.Root>
        {/if}
    </div>
</div>
