<script lang="ts">
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import { profileStore } from '$lib/stores/admin/profile-store.svelte';
	import type { NavItem, NavGroup } from '$lib/types/nav';
	import { page } from '$app/stores';

	let {
		group,
		collapsibleSub = true
	}: {
		group: NavGroup;
		collapsibleSub?: boolean;
	} = $props();

	function isActive(url: string) {
		return $page.url.pathname === url;
	}

	function hasPermission(item: NavItem) {
		if (!item.requiredPermission) return true;
		return profileStore.permissions.includes(item.requiredPermission);
	}
</script>

<Sidebar.Group>
	{#if group.label}
		<Sidebar.GroupLabel>{group.label}</Sidebar.GroupLabel>
	{/if}
	<Sidebar.Menu>
		{#each group.items as item (item.title)}
			{#if hasPermission(item)}
				{#if item.items && item.items.length > 0}
					<Collapsible.Root open={item.isActive} class="group/collapsible">
						{#snippet child({ props })}
							<Sidebar.MenuItem {...props}>
								<Collapsible.Trigger>
									{#snippet child({ props })}
										<Sidebar.MenuButton {...props} tooltipContent={item.title}>
											{#if item.icon}
												<item.icon />
											{/if}
											<span>{item.title}</span>
											<ChevronRightIcon
												class="ms-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
											/>
										</Sidebar.MenuButton>
									{/snippet}
								</Collapsible.Trigger>
								<Collapsible.Content>
									<Sidebar.MenuSub>
										{#each item.items as subItem (subItem.title)}
											{#if hasPermission(subItem)}
												<Sidebar.MenuSubItem>
													<Sidebar.MenuSubButton isActive={isActive(subItem.url)}>
														{#snippet child({ props })}
															<a href={subItem.url} {...props}>
																{#if subItem.icon}
																	<subItem.icon class="mr-2 h-4 w-4" />
																{/if}
																<span>{subItem.title}</span>
															</a>
														{/snippet}
													</Sidebar.MenuSubButton>
												</Sidebar.MenuSubItem>
											{/if}
										{/each}
									</Sidebar.MenuSub>
								</Collapsible.Content>
							</Sidebar.MenuItem>
						{/snippet}
					</Collapsible.Root>
				{:else}
					<Sidebar.MenuItem>
						<Sidebar.MenuButton isActive={isActive(item.url)} tooltipContent={item.title}>
							{#snippet child({ props })}
								<a href={item.url} {...props}>
									{#if item.icon}
										<item.icon />
									{/if}
									<span>{item.title}</span>
									{#if item.badge}
										<Sidebar.MenuBadge>{item.badge}</Sidebar.MenuBadge>
									{/if}
								</a>
							{/snippet}
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
				{/if}
			{/if}
		{/each}
	</Sidebar.Menu>
</Sidebar.Group>
