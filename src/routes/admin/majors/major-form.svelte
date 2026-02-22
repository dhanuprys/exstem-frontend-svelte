<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';

	export let code: string = '';
	export let longName: string = '';
</script>

<div class="grid gap-4 py-4">
	<div class="grid gap-2">
		<Label for="code">Kode Jurusan *</Label>
		<Input
			id="code"
			bind:value={code}
			placeholder="Misal: RPL, TKJ, IPA"
			required
			minlength={2}
			maxlength={50}
		/>
	</div>
	<div class="grid gap-2">
		<Label for="longName">Nama Panjang Jurusan *</Label>
		<Input
			id="longName"
			bind:value={longName}
			placeholder="Misal: Rekayasa Perangkat Lunak"
			required
			minlength={3}
			maxlength={255}
		/>
	</div>
</div>
