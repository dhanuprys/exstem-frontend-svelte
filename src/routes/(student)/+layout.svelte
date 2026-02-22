<script lang="ts">
	import { profileStore } from '$lib/stores/student/profile-store.svelte';
	import { lobbyService, type LobbyExam } from '$lib/services/student/lobby.service';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { LogOut, GraduationCap } from '@lucide/svelte';
	import ModeToggler from '$lib/components/mode-toggler.svelte';
	import type { LayoutProps } from './$types';
	import { overrideAssetPath } from '$lib/utils/assets';

	let { children, data }: LayoutProps = $props();
	let isReady = $state(false);

	onMount(async () => {
		await profileStore.init();
		if (!profileStore.student) return;

		// ── Session Lock Guard ──
		// If student has an IN_PROGRESS exam, redirect to it (unless already on exam page).
		const currentPath = $page.url.pathname;
		if (!currentPath.startsWith('/exams/')) {
			try {
				const res = await lobbyService.getExams();
				const exams: LobbyExam[] = res.data.data.exams || [];
				const activeExam = exams.find((e) => e.session_status === 'IN_PROGRESS');
				if (activeExam) {
					window.location.href = `/exams/${activeExam.id}`;
					return;
				}
			} catch {
				// Fail silently, lobby page will handle errors.
			}
		}

		isReady = true;
	});
</script>

{#if isReady}
	<div class="flex min-h-screen flex-col bg-background">
		<!-- Header -->
		<header
			class="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
		>
			<div class="flex h-16 items-center justify-between px-6">
				<!-- Left: Branding -->
				<a href="/" class="flex items-center gap-2">
					{#if data.settings.school_logo_url}
						<img
							src={overrideAssetPath(data.settings.school_logo_url)}
							alt="School Logo"
							class="h-10 w-10 object-contain"
						/>
					{:else}
						<GraduationCap class="h-7 w-7 text-primary" />
					{/if}
					{#if data.settings.school_name}
						<div>
							<h1 class="text-lg leading-4 font-bold tracking-tight text-primary">
								{data.settings.school_name}
							</h1>
							<span class="text-xs text-muted-foreground">EXSTEM CBT by Dedan Labs</span>
						</div>
					{:else}
						<h1 class="text-xl font-bold tracking-tight text-primary">EXSTEM</h1>
					{/if}
				</a>

				<!-- Right: Student Info + Logout -->
				{#if profileStore.student}
					<div class="flex items-center gap-2">
						<div class="flex items-center gap-4">
							<div class="text-right">
								<p class="text-sm font-semibold">{profileStore.student.name}</p>
								<p class="text-xs text-muted-foreground">NISN: {profileStore.student.nisn}</p>
							</div>
							<button
								onclick={() => profileStore.logout()}
								class="flex h-9 w-9 items-center justify-center rounded-full border text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
								title="Keluar"
							>
								<LogOut class="h-4 w-4" />
							</button>
						</div>
						<ModeToggler />
					</div>
				{/if}
			</div>
		</header>

		<!-- Main Content -->
		<main class="flex-1">
			{@render children()}
		</main>
	</div>
{:else}
	<div class="flex min-h-screen items-center justify-center bg-background">
		<div class="flex flex-col items-center gap-3">
			<div
				class="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"
			></div>
			<p class="text-sm text-muted-foreground">Memuat...</p>
		</div>
	</div>
{/if}
