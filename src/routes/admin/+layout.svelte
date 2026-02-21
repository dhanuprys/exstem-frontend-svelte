<script lang="ts">
	import AppSidebar from '$lib/components/sidebar/app-sidebar.svelte';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { profileStore } from '$lib/stores/admin/profile-store.svelte';
	import { onMount } from 'svelte';

	import { page } from '$app/state';
	import { getBreadcrumbs } from '$lib/utils/breadcrumbs';
	import ModeToggler from '$lib/components/mode-toggler.svelte';

	const { children } = $props();

	onMount(() => {
		profileStore.init();
	});

	let breadcrumbs = $derived(getBreadcrumbs(page.url.pathname));
</script>

<Sidebar.Provider>
	<AppSidebar />
	<Sidebar.Inset>
		<header
			class="flex h-16 shrink-0 gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12"
		>
			<div class="flex w-full items-center justify-between px-4">
				<div class="flex items-center gap-2">
					<Sidebar.Trigger class="-ms-1" />
					<Separator orientation="vertical" class="me-2 data-[orientation=vertical]:h-4" />
					<Breadcrumb.Root>
						<Breadcrumb.List>
							{#each breadcrumbs as breadcrumb, i}
								<Breadcrumb.Item class="hidden md:block">
									{#if i === breadcrumbs.length - 1}
										<Breadcrumb.Page>{breadcrumb.label}</Breadcrumb.Page>
									{:else}
										<Breadcrumb.Link href={breadcrumb.href}>{breadcrumb.label}</Breadcrumb.Link>
									{/if}
								</Breadcrumb.Item>
								{#if i < breadcrumbs.length - 1}
									<Breadcrumb.Separator class="hidden md:block" />
								{/if}
							{/each}
						</Breadcrumb.List>
					</Breadcrumb.Root>
				</div>
				<div>
					<ModeToggler />
				</div>
			</div>
		</header>
		{@render children()}
	</Sidebar.Inset>
</Sidebar.Provider>
