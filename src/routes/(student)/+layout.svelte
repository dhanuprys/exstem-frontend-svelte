<script lang="ts">
	import { profileStore } from '$lib/stores/student/profile-store.svelte';
	import { lobbyService } from '$lib/services/student/lobby.service';
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
				const res = await lobbyService.getActiveSession();
				const activeSession = res.data.data;
				if (activeSession?.exam_id) {
					window.location.href = `/exams/${activeSession.exam_id}`;
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
			class="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60"
		>
			<div class="flex h-16 items-center justify-between gap-2 px-4 md:px-6">
				<!-- Left: Branding -->
				<a href="/" class="flex items-center gap-2 overflow-hidden md:gap-3">
					{#if data.settings.school_logo_url}
						<img
							src={overrideAssetPath(data.settings.school_logo_url)}
							alt="School Logo"
							class="h-8 w-8 shrink-0 object-contain md:h-10 md:w-10"
						/>
					{:else}
						<GraduationCap class="h-6 w-6 shrink-0 text-primary md:h-7 md:w-7" />
					{/if}
					{#if data.settings.school_name}
						<div class="flex min-w-0 flex-col">
							<h1
								class="truncate text-base leading-tight font-bold tracking-tight text-primary md:text-lg md:leading-8"
							>
								{data.settings.school_name}
							</h1>
							<span class="hidden text-[10px] text-muted-foreground sm:inline-block md:text-xs"
								>EXSTEM CBT by Dedan Labs</span
							>
						</div>
					{:else}
						<h1 class="text-xl font-bold tracking-tight text-primary">EXSTEM</h1>
					{/if}
				</a>

				<!-- Right: Student Info + Logout -->
				{#if profileStore.student}
					<div class="flex shrink-0 items-center gap-1 sm:gap-2">
						<div class="flex items-center gap-2 sm:gap-4">
							<div class="hidden text-right sm:block">
								<p class="max-w-[120px] truncate text-sm font-semibold md:max-w-full">
									{profileStore.student.name}
								</p>
								<p class="text-xs text-muted-foreground">NISN: {profileStore.student.nisn}</p>
							</div>
							<button
								onclick={() => profileStore.logout()}
								class="flex h-8 w-8 items-center justify-center rounded-full border text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive sm:h-9 sm:w-9"
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
