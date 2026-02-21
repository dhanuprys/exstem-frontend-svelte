<script lang="ts">
    import { Input } from "$lib/components/ui/input/index.js";
    import { Label } from "$lib/components/ui/label/index.js";
    import * as Select from "$lib/components/ui/select/index.js";
    import type { Class } from "$lib/services/admin/class.service";

    export let nis: string = "";
    export let nisn: string = "";
    export let name: string = "";
    export let gender: string = "";
    export let religion: string = "";
    export let password: string = "";
    export let classId: number = 0;
    export let classes: Class[] = [];
    export let isEdit: boolean = false;

    const GENDER_OPTIONS = [
        { value: "Laki-laki", label: "Laki-laki" },
        { value: "Perempuan", label: "Perempuan" }
    ];

    const RELIGION_OPTIONS = [
        { value: "Islam", label: "Islam" },
        { value: "Kristen", label: "Kristen" },
        { value: "Katolik", label: "Katolik" },
        { value: "Hindu", label: "Hindu" },
        { value: "Buddha", label: "Buddha" },
        { value: "Konghucu", label: "Konghucu" }
    ];

    // Derived selected value to keep Select in sync
    $: selectedClass = classes.find(c => c.id === classId) 
        ? { 
            value: classId.toString(), 
            label: `${classes.find(c => c.id === classId)?.grade_level} ${classes.find(c => c.id === classId)?.major_code} ${classes.find(c => c.id === classId)?.group_number}` 
          } 
        : undefined;

    $: selectedGender = GENDER_OPTIONS.find(g => g.value === gender);
    $: selectedReligion = RELIGION_OPTIONS.find(r => r.value === religion);

    function handleClassChange(v: string | undefined) {
        if (v) {
            classId = parseInt(v);
        }
    }
</script>

<div class="grid gap-4 py-4">
    <div class="grid gap-2">
        <Label for="nis">NIS *</Label>
        <Input id="nis" bind:value={nis} placeholder="Nomor Induk Siswa" required />
    </div>

    <div class="grid gap-2">
        <Label for="nisn">NISN *</Label>
        <Input id="nisn" bind:value={nisn} placeholder="Nomor Induk Siswa Nasional" required />
    </div>

    <div class="grid gap-2">
        <Label for="name">Nama Lengkap *</Label>
        <Input id="name" bind:value={name} placeholder="Nama Lengkap Siswa" required />
    </div>

    <div class="grid gap-2">
        <Label for="gender">Jenis Kelamin *</Label>
        <Select.Root type="single" value={selectedGender && selectedGender.value} onValueChange={(v) => { if(v) gender = v; }}>
            <Select.Trigger id="gender">
                {selectedGender ? selectedGender.label : "Pilih Jenis Kelamin"}
            </Select.Trigger>
            <Select.Content>
                {#each GENDER_OPTIONS as opt}
                    <Select.Item value={opt.value} label={opt.label}>
                        {opt.label}
                    </Select.Item>
                {/each}
            </Select.Content>
        </Select.Root>
    </div>

    <div class="grid gap-2">
        <Label for="religion">Agama *</Label>
        <Select.Root type="single" value={selectedReligion && selectedReligion.value} onValueChange={(v) => { if(v) religion = v; }}>
            <Select.Trigger id="religion">
                {selectedReligion ? selectedReligion.label : "Pilih Agama"}
            </Select.Trigger>
            <Select.Content>
                {#each RELIGION_OPTIONS as opt}
                    <Select.Item value={opt.value} label={opt.label}>
                        {opt.label}
                    </Select.Item>
                {/each}
            </Select.Content>
        </Select.Root>
    </div>

    <div class="grid gap-2">
        <Label for="class">Kelas *</Label>
        <Select.Root type="single" value={selectedClass && selectedClass.value} onValueChange={handleClassChange}>
            <Select.Trigger id="class">
                {selectedClass ? selectedClass.label : "Pilih Kelas"}
            </Select.Trigger>
            <Select.Content>
                {#each classes as cls}
                    <Select.Item value={cls.id.toString()} label={`${cls.grade_level} ${cls.major_code} ${cls.group_number}`}>
                        {cls.grade_level} {cls.major_code} {cls.group_number}
                    </Select.Item>
                {/each}
            </Select.Content>
        </Select.Root>
    </div>

    <div class="grid gap-2">
        <Label for="password">Kata Sandi {isEdit ? "" : "*"}</Label>
        <Input 
            id="password" 
            type="password" 
            bind:value={password} 
            placeholder={isEdit ? "Kosongkan jika tidak diubah" : "Pilih kata sandi"} 
        />
    </div>
</div>
