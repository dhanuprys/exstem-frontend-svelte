<script lang="ts">
    import { Input } from "$lib/components/ui/input/index.js";
    import { Label } from "$lib/components/ui/label/index.js";
    import * as Select from "$lib/components/ui/select/index.js";

    export let gradeLevel: string = "";
    export let majorCode: string = "";
    export let groupNumber: string = "";

    // Available grade levels
    const gradeLevels = [
        { value: "10", label: "Kelas 10" },
        { value: "11", label: "Kelas 11" },
        { value: "12", label: "Kelas 12" }
    ];
</script>

<div class="grid gap-4 py-4">
    <div class="grid gap-2">
        <Label for="gradeLevel">Tingkat Kelas *</Label>
        <Select.Root type="single" value={gradeLevel} onValueChange={(v) => gradeLevel = v}>
            <Select.Trigger id="gradeLevel">
                {gradeLevel ? gradeLevels.find(g => g.value === gradeLevel)?.label : "Pilih tingkat kelas"}
            </Select.Trigger>
            <Select.Content>
                {#each gradeLevels as level}
                    <Select.Item value={level.value} label={level.label}>{level.label}</Select.Item>
                {/each}
            </Select.Content>
        </Select.Root>
    </div>

    <div class="grid gap-2">
        <Label for="majorCode">Kode Jurusan *</Label>
        <Input 
            id="majorCode" 
            bind:value={majorCode} 
            placeholder="Misal: RPL, TKJ, AKL" 
            required 
        />
        <p class="text-xs text-muted-foreground">Isi dengan singkatan jurusan (maks 10 karakter).</p>
    </div>

    <div class="grid gap-2">
        <Label for="groupNumber">Nomor Rombel (Grup) *</Label>
        <Input 
            id="groupNumber" 
            bind:value={groupNumber} 
            type="number" 
            placeholder="Misal: 1, 2, 3" 
            min="1"
            required 
        />
    </div>
</div>
