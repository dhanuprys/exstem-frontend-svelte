<script lang="ts">
	import { Separator } from "$lib/components/ui/separator/index.js";

	let { title, description, children } = $props();
</script>

<div class="flex items-center justify-between space-y-2">
	<div>
		<h2 class="text-2xl font-bold tracking-tight">{title}</h2>
		{#if description}
			<p class="text-muted-foreground">{description}</p>
		{/if}
	</div>
	<div class="flex items-center space-x-2">
		{@render children?.()}
	</div>
</div>
<Separator class="my-4" />
