<script lang="ts">
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { ArrowLeft } from '@lucide/svelte';
	import { goto } from '$app/navigation';

	let { title, description, backUrl, children } = $props<{
		title: string;
		description?: string;
		backUrl?: string;
		children?: import('svelte').Snippet;
	}>();
</script>

<div class="flex items-center justify-between space-y-2">
	<div class="flex items-center gap-4">
		{#if backUrl}
			<Button variant="outline" size="icon" onclick={() => goto(backUrl)}>
				<ArrowLeft class="h-4 w-4" />
			</Button>
		{/if}
		<div>
			<h2 class="text-2xl font-bold tracking-tight">{title}</h2>
			{#if description}
				<p class="text-muted-foreground">{description}</p>
			{/if}
		</div>
	</div>
	<div class="flex items-center space-x-2">
		{@render children?.()}
	</div>
</div>
<Separator class="my-4" />
