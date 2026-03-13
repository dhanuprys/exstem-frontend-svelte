<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import {
		FieldGroup,
		Field,
		FieldLabel,
		FieldDescription
	} from '$lib/components/ui/field/index.js';
	import { profileStore } from '$lib/stores/admin/profile-store.svelte';
	import { Loader2 } from '@lucide/svelte';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: { ref?: HTMLElement | null; class?: string } = $props();

	const id = $props.id();

	let identifier = $state('');
	let password = $state('');
	let isLoading = $state(false);
	let error = $state<string | null>(null);

	async function handleLogin(e: Event) {
		e.preventDefault();
		isLoading = true;
		error = null;

		const result = await profileStore.login(identifier, password);
		if (!result?.success) {
			error = result?.error?.message || result?.error?.code || 'Login gagal';
		}

		isLoading = false;
	}
</script>

<Card.Root class="mx-auto w-full max-w-sm">
	<Card.Header>
		<Card.Title class="text-2xl">Masuk</Card.Title>
		<Card.Description>Masukkan username atau email Anda di bawah ini untuk masuk</Card.Description>
	</Card.Header>
	<Card.Content>
		<form onsubmit={handleLogin}>
			<FieldGroup>
				<Field>
					<FieldLabel for="identifier-{id}">Username atau Email</FieldLabel>
					<Input
						id="identifier-{id}"
						type="text"
						placeholder="admin ATAU m@example.com"
						required
						bind:value={identifier}
					/>
				</Field>
				<Field>
					<div class="flex items-center">
						<FieldLabel for="password-{id}">Kata Sandi</FieldLabel>
						<a href="##" class="ms-auto inline-block text-sm underline"> Lupa kata sandi? </a>
					</div>
					<Input id="password-{id}" type="password" required bind:value={password} />
				</Field>
				{#if error}
					<div class="mb-2 text-sm text-red-500">{error}</div>
				{/if}
				<Field>
					<Button type="submit" class="w-full" disabled={isLoading}>
						{#if isLoading}
							<Loader2 class="mr-2 h-4 w-4 animate-spin" />
						{/if}
						Masuk
					</Button>
				</Field>
			</FieldGroup>
		</form>
	</Card.Content>
</Card.Root>
