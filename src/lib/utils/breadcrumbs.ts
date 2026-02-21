export interface BreadcrumbItem {
	label: string;
	href: string;
}

export function getBreadcrumbs(pathname: string): BreadcrumbItem[] {
	const paths = pathname.split('/').filter((path) => path !== '');
	const breadcrumbs: BreadcrumbItem[] = [];

	let currentPath = '';

	// Custom Mapping for specific paths
	const labelMapping: Record<string, string> = {
		admin: 'Dashboard',
		students: 'Siswa',
		roles: 'Peran',
		users: 'Pengguna',
		exams: 'Ujian'
		// Add more mappings here as needed
	};

	paths.forEach((path) => {
		currentPath += `/${path}`;

		let label = labelMapping[path] || path;

		// Capitalize if not mapped
		if (!labelMapping[path]) {
			label = label.charAt(0).toUpperCase() + label.slice(1);
			// Replace hyphens with spaces
			label = label.replace(/-/g, ' ');
		}

		breadcrumbs.push({
			label,
			href: currentPath
		});
	});

	return breadcrumbs;
}
