<script lang="ts">
	import AdminLoginForm from '$lib/components/auth/admin-login-form.svelte';
	import { overrideAssetPath } from '$lib/utils/assets';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const settings = $derived(data.settings);
</script>

<svelte:head>
	<title>Admin Login - Exstem</title>
</svelte:head>

<div class="relative flex h-screen w-full items-center justify-center px-4">
	{#if settings.school_bg_url}
		<div class="absolute inset-0 z-0">
			<img
				src={overrideAssetPath(settings.school_bg_url)}
				alt="Background"
				class="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
			/>
			<div class="absolute inset-0 bg-background/80 backdrop-blur-sm"></div>
		</div>
	{/if}

	<div class="z-10 w-full max-w-sm">
		<AdminLoginForm />
	</div>
</div>
