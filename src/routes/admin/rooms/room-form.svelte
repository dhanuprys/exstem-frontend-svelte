<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';

	let {
		name = $bindable(),
		capacity = $bindable()
	}: {
		name: string;
		capacity: number | string;
	} = $props();
</script>

<div class="grid gap-4 py-4">
	<div class="grid gap-2">
		<Label for="name">Nama Ruangan</Label>
		<Input id="name" bind:value={name} placeholder="Contoh: Lab Komputer 1" required />
	</div>
	<div class="grid gap-2">
		<Label for="capacity">Kapasitas Kursi</Label>
		<Input
			id="capacity"
			type="number"
			bind:value={capacity}
			placeholder="Contoh: 36"
			required
			min="1"
		/>
	</div>
</div>
