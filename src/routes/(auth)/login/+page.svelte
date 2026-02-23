<script lang="ts">
	import StudentLoginForm from '$lib/components/auth/student-login-form.svelte';
	import { GalleryVerticalEndIcon } from '@lucide/svelte';
	import { overrideAssetPath } from '$lib/utils/assets';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const settings = $derived(data.settings);
</script>

<svelte:head>
	<title>Login - Exstem</title>
</svelte:head>

<div class="grid min-h-svh lg:grid-cols-2">
	<div class="flex flex-col gap-4 p-6 md:p-10">
		<div class="flex justify-center gap-2 md:justify-start">
			<a href="/" class="flex items-center gap-2 font-medium">
				{#if settings.school_logo_url}
					<div class="flex size-8 items-center justify-center overflow-hidden rounded-md">
						<img
							src={overrideAssetPath(settings.school_logo_url)}
							alt="Logo"
							class="h-full w-full object-contain"
						/>
					</div>
				{:else}
					<div
						class="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground"
					>
						<GalleryVerticalEndIcon class="size-4" />
					</div>
				{/if}
				{settings.school_name}
			</a>
		</div>
		<div class="flex flex-1 items-center justify-center">
			<div class="w-full max-w-xs">
				<StudentLoginForm />
			</div>
		</div>
	</div>
	<div class="relative hidden bg-muted lg:block">
		<img
			src={overrideAssetPath(settings.school_bg_url)}
			alt="Background"
			class="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
		/>
	</div>
</div>
