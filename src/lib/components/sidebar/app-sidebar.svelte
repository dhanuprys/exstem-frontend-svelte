<script lang="ts" module>
	import BookOpenIcon from "@lucide/svelte/icons/book-open";
	import ChartPieIcon from "@lucide/svelte/icons/chart-pie";
	import LayoutDashboardIcon from "@lucide/svelte/icons/layout-dashboard";
	import UsersIcon from "@lucide/svelte/icons/users";
	import GraduationCapIcon from "@lucide/svelte/icons/graduation-cap";
	import ShieldCheckIcon from "@lucide/svelte/icons/shield-check";
	import FileTextIcon from "@lucide/svelte/icons/file-text";
	import { PERMISSIONS } from "$lib/types/permissions";

	// This is sample data.
	const data = {
		navGroups: [
			{
				label: "Main",
				items: [
					{
						title: "Dashboard",
						url: "/admin",
						icon: LayoutDashboardIcon,
					},
					{
						title: "Siswa",
						url: "#",
						icon: GraduationCapIcon,
						requiredPermission: PERMISSIONS.STUDENTS_READ,
						items: [
							{
								title: "Kelas",
								url: "/admin/classes",
								requiredPermission: PERMISSIONS.STUDENTS_READ,
							},
							{
								title: "Daftar Siswa",
								url: "/admin/students",
								requiredPermission: PERMISSIONS.STUDENTS_READ,
							},
						],
					},
					{
						title: "Kontrol Akses",
						url: "#",
						icon: ShieldCheckIcon,
						requiredPermission: PERMISSIONS.ADMINS_READ, // Ensure they can at least see one of these
						items: [
							{
								title: "Peran",
								url: "/admin/roles",
								requiredPermission: PERMISSIONS.ROLES_READ,
							},
							{
								title: "Pengguna",
								url: "/admin/users",
								requiredPermission: PERMISSIONS.ADMINS_READ,
							},
						],
					},
					{
						title: "Ujian",
						url: "/admin/exams",
						icon: FileTextIcon,
						requiredPermission: PERMISSIONS.EXAMS_READ,
					},
				]
			},
		],
	};
</script>

<script lang="ts">
	import NavGroup from "./nav-group.svelte";
	import NavUser from "./nav-user.svelte";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import type { ComponentProps } from "svelte";
	import { profileStore } from "$lib/stores/admin/profile-store.svelte";

	let {
		ref = $bindable(null),
		collapsible = "icon",
		...restProps
	}: ComponentProps<typeof Sidebar.Root> = $props();

	const user = $derived(profileStore.admin);
	const userProfile = $derived({
		name: user?.name || 'User',
		email: user?.email || '',
		avatar: '',
	});
</script>

<Sidebar.Root {collapsible} {...restProps}>
	<Sidebar.Header>
		<div class="flex h-12 items-center px-4">
			<h2 class="text-xl font-bold tracking-tight text-primary transition-opacity duration-200 group-data-[collapsible=icon]/sidebar:opacity-0">
				EXSTEM
			</h2>
		</div>
	</Sidebar.Header>
	<Sidebar.Content>
		{#each data.navGroups as group}
			<NavGroup {group} />
		{/each}
	</Sidebar.Content>
	<Sidebar.Footer>
		<NavUser user={userProfile} />
	</Sidebar.Footer>
	<Sidebar.Rail />
</Sidebar.Root>
