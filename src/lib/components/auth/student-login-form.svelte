<script lang="ts">
	import {
		FieldGroup,
		Field,
		FieldLabel,
		FieldDescription,
		FieldSeparator
	} from '$lib/components/ui/field/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { cn, type WithElementRef } from '$lib/utils.js';
	import type { HTMLFormAttributes } from 'svelte/elements';
	import { profileStore } from '$lib/stores/student/profile-store.svelte';
	import { Loader2 } from '@lucide/svelte';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: WithElementRef<HTMLFormAttributes> = $props();

	const id = $props.id();

	let nisn = $state('');
	let password = $state('');
	let isLoading = $state(false);
	let error = $state<string | null>(null);

	async function handleLogin(e: Event) {
		e.preventDefault();
		isLoading = true;
		error = null;

		const result = await profileStore.login(nisn, password);
		if (!result?.success) {
			error = result?.error?.message || result?.error?.code || 'Login failed';
		}

		isLoading = false;
	}
</script>

<form
	class={cn('flex flex-col gap-6', className)}
	bind:this={ref}
	{...restProps}
	onsubmit={handleLogin}
>
	<FieldGroup>
		<div class="flex flex-col items-center gap-1 text-center">
			<h1 class="text-2xl font-bold">Login to your account</h1>
			<p class="text-sm text-balance text-muted-foreground">
				Masukkan username dan password Anda
			</p>
		</div>
		<Field>
			<FieldLabel for="username-{id}">Username</FieldLabel>
			<Input
				id="username-{id}"
				type="text"
				placeholder="Masukkan username Anda"
				required
				bind:value={nisn}
			/>
		</Field>
		<Field>
			<div class="flex items-center">
				<FieldLabel for="password-{id}">Password</FieldLabel>
				<a href="##" class="ms-auto text-sm underline-offset-4 hover:underline">
					Lupa password?
				</a>
			</div>
			<Input id="password-{id}" type="password" required bind:value={password} />
		</Field>
		{#if error}
			<div class="text-red-500 text-sm">{error}</div>
		{/if}
		<Field>
			<Button type="submit" disabled={isLoading}>
				{#if isLoading}
					<Loader2 class="mr-2 h-4 w-4 animate-spin" />
				{/if}
				Login
			</Button>
		</Field>
		<FieldSeparator>Or continue with</FieldSeparator>
		<Field>
			<FieldDescription class="text-center">
				Mengalami kendala?
				<a href="##" class="underline underline-offset-4">Hubungi Admin</a>
			</FieldDescription>
		</Field>
	</FieldGroup>
</form>
