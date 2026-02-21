<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';

	export let name: string = '';
</script>

<div class="grid gap-4 py-4">
	<div class="grid gap-2">
		<Label for="name">Nama Mata Pelajaran *</Label>
		<Input
			id="name"
			bind:value={name}
			placeholder="Misal: Matematika, Bahasa Indonesia"
			required
			minlength={2}
			maxlength={100}
		/>
	</div>
</div>
