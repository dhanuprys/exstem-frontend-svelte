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

	let email = $state('');
	let password = $state('');
	let isLoading = $state(false);
	let error = $state<string | null>(null);

	async function handleLogin(e: Event) {
		e.preventDefault();
		isLoading = true;
		error = null;

		const result = await profileStore.login(email, password);
		if (!result?.success) {
			error = result?.error?.message || result?.error?.code || 'Login failed';
		}

		isLoading = false;
	}
</script>

<Card.Root class="mx-auto w-full max-w-sm">
	<Card.Header>
		<Card.Title class="text-2xl">Login</Card.Title>
		<Card.Description>Enter your email below to login to your account</Card.Description>
	</Card.Header>
	<Card.Content>
		<form onsubmit={handleLogin}>
			<FieldGroup>
				<Field>
					<FieldLabel for="email-{id}">Email</FieldLabel>
					<Input
						id="email-{id}"
						type="email"
						placeholder="m@example.com"
						required
						bind:value={email}
					/>
				</Field>
				<Field>
					<div class="flex items-center">
						<FieldLabel for="password-{id}">Password</FieldLabel>
						<a href="##" class="ms-auto inline-block text-sm underline">
							Forgot your password?
						</a>
					</div>
					<Input id="password-{id}" type="password" required bind:value={password} />
				</Field>
				{#if error}
					<div class="text-red-500 text-sm mb-2">{error}</div>
				{/if}
				<Field>
					<Button type="submit" class="w-full" disabled={isLoading}>
						{#if isLoading}
							<Loader2 class="mr-2 h-4 w-4 animate-spin" />
						{/if}
						Login
					</Button>
				</Field>
			</FieldGroup>
		</form>
	</Card.Content>
</Card.Root>
