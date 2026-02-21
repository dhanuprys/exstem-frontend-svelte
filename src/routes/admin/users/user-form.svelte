<script lang="ts">
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import * as Select from "$lib/components/ui/select/index.js";
    import * as RadioGroup from "$lib/components/ui/radio-group/index.js";
	import type { Role } from "$lib/services/admin/user.service";

    let { 
        name = $bindable(""), 
        email = $bindable(""), 
        password = $bindable(""), 
        roleId = $bindable(0), 
        roles = [],
        isEdit = false 
    } = $props<{
        name: string;
        email: string;
        password?: string;
        roleId: number;
        roles: Role[];
        isEdit?: boolean;
    }>();

    // Helper for Select component (it works with strings usually)
    let selectedRole = $derived(
        roles.find((r: Role) => r.id === roleId) ? { value: roleId.toString(), label: roles.find((r: Role) => r.id === roleId)?.name } : undefined
    );

    function handleRoleChange(v: { value: string; label: string } | undefined) {
        if (v) {
            roleId = parseInt(v.value);
        }
    }
</script>

<div class="grid gap-4 py-4">
    <div class="grid grid-cols-4 items-center gap-4">
        <Label for="name" class="text-right">Nama</Label>
        <Input id="name" bind:value={name} class="col-span-3" placeholder="Nama Lengkap" />
    </div>
    <div class="grid grid-cols-4 items-center gap-4">
        <Label for="email" class="text-right">Email</Label>
        <Input id="email" type="email" bind:value={email} class="col-span-3" placeholder="email@example.com" />
    </div>
    <div class="grid grid-cols-4 items-center gap-4">
        <Label for="password" class="text-right">Kata Sandi</Label>
        <Input 
            id="password" 
            type="password" 
            bind:value={password} 
            class="col-span-3" 
            placeholder={isEdit ? "Kosongkan jika tidak diubah" : "Kata Sandi"} 
        />
    </div>
    <div class="grid grid-cols-4 items-center gap-4">
        <Label for="role" class="text-right">Peran</Label>
        <div class="col-span-3">
             <Select.Root type="single" value={selectedRole && selectedRole.value} onValueChange={(v) => handleRoleChange({ value: v, label: roles.find((r: Role) => r.id.toString() === v)?.name || '' })}>
                <Select.Trigger class="w-full">
                    {selectedRole ? selectedRole.label : "Pilih Peran"}
                </Select.Trigger>
                <Select.Content>
                    {#each roles as role}
                        <Select.Item value={role.id.toString()} label={role.name}>{role.name}</Select.Item>
                    {/each}
                </Select.Content>
            </Select.Root>
        </div>
    </div>
</div>
