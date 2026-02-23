<script lang="ts" module>
	import BookOpenIcon from '@lucide/svelte/icons/book-open';
	import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';
	import GraduationCapIcon from '@lucide/svelte/icons/graduation-cap';
	import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';
	import FileTextIcon from '@lucide/svelte/icons/file-text';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import BriefcaseIcon from '@lucide/svelte/icons/briefcase';
	import { PERMISSIONS } from '$lib/types/permissions';

	// This is sample data.
	const data = {
		navGroups: [
			{
				label: 'Main',
				items: [
					{
						title: 'Dashboard',
						url: '/admin',
						icon: LayoutDashboardIcon
					},
					{
						title: 'Sistem',
						url: '/admin/system',
						icon: SettingsIcon
					},
					{
						title: 'Siswa',
						url: '#',
						icon: GraduationCapIcon,
						requiredPermission: PERMISSIONS.STUDENTS_READ,
						items: [
							{
								title: 'Kelas',
								url: '/admin/classes',
								requiredPermission: PERMISSIONS.STUDENTS_READ
							},
							{
								title: 'Daftar Siswa',
								url: '/admin/students',
								requiredPermission: PERMISSIONS.STUDENTS_READ
							}
						]
					},
					{
						title: 'Kontrol Akses',
						url: '#',
						icon: ShieldCheckIcon,
						requiredPermission: PERMISSIONS.ADMINS_READ, // Ensure they can at least see one of these
						items: [
							{
								title: 'Peran',
								url: '/admin/roles',
								requiredPermission: PERMISSIONS.ROLES_READ
							},
							{
								title: 'Pengguna',
								url: '/admin/users',
								requiredPermission: PERMISSIONS.ADMINS_READ
							}
						]
					},
					{
						title: 'Ujian',
						url: '/admin/exams',
						icon: FileTextIcon,
						requiredPermission: PERMISSIONS.EXAMS_READ
					},
					{
						title: 'Bank Soal',
						url: '/admin/qbanks',
						icon: FileTextIcon,
						requiredPermission: PERMISSIONS.QBANKS_READ
					},
					{
						title: 'Mata Pelajaran',
						url: '/admin/subjects',
						icon: BookOpenIcon,
						requiredPermission: PERMISSIONS.SUBJECTS_READ
					},
					{
						title: 'Jurusan',
						url: '/admin/majors',
						icon: BriefcaseIcon,
						requiredPermission: PERMISSIONS.MAJOR_READ
					},
					{
						title: 'Pengaturan App',
						url: '/admin/settings',
						icon: SettingsIcon,
						requiredPermission: PERMISSIONS.SETTINGS_READ
					}
				]
			}
		]
	};
</script>

<script lang="ts">
	import NavGroup from './nav-group.svelte';
	import NavUser from './nav-user.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import type { ComponentProps } from 'svelte';
	import { profileStore } from '$lib/stores/admin/profile-store.svelte';

	let {
		ref = $bindable(null),
		collapsible = 'icon',
		...restProps
	}: ComponentProps<typeof Sidebar.Root> = $props();

	const user = $derived(profileStore.admin);
	const userProfile = $derived({
		name: user?.name || 'User',
		email: user?.email || '',
		avatar: ''
	});
</script>

<Sidebar.Root {collapsible} {...restProps}>
	<Sidebar.Header>
		<div class="flex h-12 items-center px-4">
			<h2
				class="text-xl font-bold tracking-tight text-primary transition-opacity duration-200 group-data-[collapsible=icon]/sidebar:opacity-0"
			>
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
