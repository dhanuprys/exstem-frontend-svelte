<script lang="ts">
	import { profileStore } from '$lib/stores/student/profile-store.svelte';
	import { onMount } from 'svelte';

	let { children } = $props();

	onMount(() => {
		profileStore.init();
	});
</script>

{@render children()}
