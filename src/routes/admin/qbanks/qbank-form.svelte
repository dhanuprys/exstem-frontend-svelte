<script lang="ts">
	import { onMount } from 'svelte';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { subjectService, type Subject } from '$lib/services/admin/subject.service';
	import { Loader2 } from '@lucide/svelte';

	let {
		name = $bindable(),
		description = $bindable(),
		subjectId = $bindable(undefined)
	}: { name: string; description: string; subjectId?: number | null | undefined } = $props();

	let subjects: Subject[] = $state([]);
	let loadingSubjects = $state(true);

	onMount(async () => {
		try {
			const res = await subjectService.getSubjects();
			subjects = res.data.data || [];
		} catch (error) {
			console.error('Failed to fetch subjects', error);
		} finally {
			loadingSubjects = false;
		}
	});
</script>

<div class="grid gap-4 py-4">
	<div class="grid gap-2">
		<Label for="name">Nama Bank Soal *</Label>
		<Input
			id="name"
			bind:value={name}
			placeholder="Misal: Bank Soal Matematika Kelas 10"
			required
			minlength={2}
			maxlength={50}
		/>
	</div>
	<div class="grid gap-2">
		<Label for="description">Deskripsi *</Label>
		<Input
			id="description"
			bind:value={description}
			placeholder="Misal: Bank Soal Matematika Kelas 10"
			required
			minlength={3}
			maxlength={255}
		/>
	</div>
	<div class="grid gap-2">
		<Label for="subject">Mata Pelajaran (Opsional)</Label>
		<div class="relative">
			<select
				id="subject"
				class="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
				bind:value={subjectId}
				disabled={loadingSubjects}
			>
				<option value={undefined}>-- Pilih Mata Pelajaran --</option>
				{#each subjects as subject}
					<option value={subject.id}>{subject.name}</option>
				{/each}
			</select>
			{#if loadingSubjects}
				<Loader2
					class="pointer-events-none absolute top-1/2 right-8 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground"
				/>
			{/if}
		</div>
	</div>
</div>
