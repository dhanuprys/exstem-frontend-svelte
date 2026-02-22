<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import type { Major } from '$lib/services/admin/major.service';

	export let gradeLevel: string = '';
	export let majorCode: string = '';
	export let groupNumber: string = '';
	export let majors: Major[] = [];

	// Available grade levels
	const gradeLevels = [
		{ value: 'X', label: 'Kelas 10' },
		{ value: 'XI', label: 'Kelas 11' },
		{ value: 'XII', label: 'Kelas 12' }
	];
</script>

<div class="grid gap-4 py-4">
	<div class="grid gap-2">
		<Label for="gradeLevel">Tingkat Kelas *</Label>
		<Select.Root type="single" value={gradeLevel} onValueChange={(v) => (gradeLevel = v)}>
			<Select.Trigger id="gradeLevel">
				{gradeLevel
					? gradeLevels.find((g) => g.value === gradeLevel)?.label
					: 'Pilih tingkat kelas'}
			</Select.Trigger>
			<Select.Content>
				{#each gradeLevels as level}
					<Select.Item value={level.value} label={level.label}>{level.label}</Select.Item>
				{/each}
			</Select.Content>
		</Select.Root>
	</div>

	<div class="grid gap-2">
		<Label for="majorCode">Jurusan *</Label>
		<Select.Root type="single" value={majorCode} onValueChange={(v) => (majorCode = v)}>
			<Select.Trigger id="majorCode">
				{majorCode
					? `${majorCode} - ${majors.find((m) => m.code === majorCode)?.long_name || ''}`
					: 'Pilih jurusan'}
			</Select.Trigger>
			<Select.Content>
				{#if majors.length === 0}
					<Select.Item value="" disabled label="Tidak ada data jurusan"
						>Tidak ada data jurusan</Select.Item
					>
				{:else}
					{#each majors as major}
						<Select.Item value={major.code} label={major.code}
							>{major.code} - {major.long_name}</Select.Item
						>
					{/each}
				{/if}
			</Select.Content>
		</Select.Root>
		<p class="text-xs text-muted-foreground">Pilih jurusan dari dropdown.</p>
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
