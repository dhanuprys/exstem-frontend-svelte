<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageProps } from './$types';
	import { studentExamService } from '$lib/services/student/exam.service';
	import { toast } from 'svelte-sonner';
	import {
		KeyRound,
		ArrowLeft,
		Loader2,
		ShieldCheck,
		AlertTriangle,
		Clock,
		Wifi,
		LogOut
	} from '@lucide/svelte';

	let { params }: PageProps = $props();
	const examId = $derived(params.examId);

	let token = $state('');
	let isJoining = $state(false);
	let errorMessage = $state('');
	let agreedToRules = $state(false);

	async function handleJoin() {
		if (!agreedToRules) {
			toast.error('Anda harus menyetujui peraturan ujian terlebih dahulu.');
			return;
		}

		if (!token.trim() || token.trim().length < 4) {
			errorMessage = 'Token harus minimal 4 karakter.';
			return;
		}

		isJoining = true;
		errorMessage = '';

		try {
			await studentExamService.joinExam(examId, token.trim());
			toast.success('Berhasil bergabung! Mempersiapkan ujian...');
			goto(`/exams/${examId}`);
		} catch (err: any) {
			const errCode = err.response?.data?.error?.code;
			switch (errCode) {
				case 'INVALID_ENTRY_TOKEN':
					errorMessage = 'Token salah. Periksa kembali token dari Pengawas.';
					break;
				case 'EXAM_NOT_AVAILABLE':
					errorMessage = 'Ujian tidak tersedia, belum dimulai, atau waktu telah habis.';
					break;
				default:
					errorMessage = 'Gagal bergabung. Silakan coba lagi.';
			}
		} finally {
			isJoining = false;
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !isJoining) {
			handleJoin();
		}
	}
</script>

<svelte:head>
	<title>Mulai Ujian - Exstem</title>
</svelte:head>

<div class="mx-auto max-w-5xl px-6 py-8 md:py-12">
	<!-- Back Link -->
	<button
		onclick={() => goto('/')}
		class="mb-6 flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
	>
		<ArrowLeft class="h-4 w-4" />
		Daftar Ujian
	</button>

	<!-- Left Col: Rules & Warnings -->
	<div class="space-y-6 lg:col-span-3">
		<div>
			<h1 class="text-3xl font-extrabold tracking-tight">Persiapan Ujian</h1>
			<p class="mt-2 text-muted-foreground">
				Harap baca dengan cermat panduan dan tata tertib berikut sebelum memulai.
			</p>
		</div>

		<div class="grid gap-8 lg:grid-cols-5">
			<div class="col-span-full grid gap-4 md:col-span-3">
				<!-- Rule 1: Anti-cheat -->
				<div class="flex gap-4 px-5 py-3">
					<div
						class="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
					>
						<AlertTriangle class="h-5 w-5" />
					</div>
					<div>
						<h3 class="font-bold">Kejujuran & Pengawasan</h3>
						<p class="mt-1 text-sm leading-relaxed text-muted-foreground">
							Sistem mencatat segala aktivitas abnormal, percobaan menyalin soal, dan perpindahan
							tab. Segala bentuk kecurangan akan dilaporkan secara otomatis ke Pengawas.
						</p>
					</div>
				</div>

				<!-- Rule 2: Time Limits -->
				<div class="flex gap-4 px-5 py-3">
					<div
						class="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
					>
						<Clock class="h-5 w-5" />
					</div>
					<div>
						<h3 class="font-bold">Batas Waktu Otomatis</h3>
						<p class="mt-1 text-sm leading-relaxed text-muted-foreground">
							Ujian dibatasi oleh waktu. Jika waktu habis, jawabanmu akan tersimpan dan dikumpulkan
							secara otomatis walau kamu belum menekan tombol Selesai.
						</p>
					</div>
				</div>

				<!-- Rule 3: Session Lock -->
				<div class="flex gap-4 px-5 py-3">
					<div
						class="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
					>
						<LogOut class="h-5 w-5" />
					</div>
					<div>
						<h3 class="font-bold">Sesi Terkunci</h3>
						<p class="mt-1 text-sm leading-relaxed text-muted-foreground">
							Selama ujian berlangsung (Sedang Dikerjakan), kamu tidak dapat membuka ujian lain atau
							kembali ke halaman utama. Harap selesaikan ujian terlebih dahulu.
						</p>
					</div>
				</div>

				<!-- Rule 4: Connectivity -->
				<div class="flex gap-4 px-5 py-3">
					<div
						class="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
					>
						<Wifi class="h-5 w-5" />
					</div>
					<div>
						<h3 class="font-bold">Penyimpanan Realtime</h3>
						<p class="mt-1 text-sm leading-relaxed text-muted-foreground">
							Jawabanmu selalu disimpan seketika melalui jalur langsung server. Status koneksi hijau
							menandakan sistem aman. Jika terputus sementara, jangan tutup browser, biarkan sistem
							memulihkan koneksi!
						</p>
					</div>
				</div>
			</div>
			<!-- Right Col: The Action Box -->
			<div class="col-span-full lg:col-span-2">
				<div class="sticky top-6 overflow-hidden rounded-2xl border bg-card shadow-2xl">
					<!-- Header -->
					<div class="border-b bg-primary/5 p-6 text-center">
						<div
							class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm"
						>
							<ShieldCheck class="h-8 w-8" />
						</div>
						<h2 class="mt-4 text-xl font-bold">Verifikasi Ujian</h2>
						<p class="mt-1 text-sm text-muted-foreground">Masukkan token valid dari Pengawas</p>
					</div>

					<!-- Body Form -->
					<div class="space-y-6 p-6">
						<!-- Agreement Checkbox -->
						<label
							class="flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all hover:bg-muted/50 {agreedToRules
								? 'border-primary/30 bg-primary/5'
								: ''}"
						>
							<div class="mt-0.5 flex shrink-0 items-center justify-center">
								<input type="checkbox" bind:checked={agreedToRules} class="peer sr-only" />
								<div
									class="h-5 w-5 rounded border-2 border-muted-foreground bg-background transition-all peer-checked:border-primary peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background"
								>
									{#if agreedToRules}
										<svg
											class="h-full w-full stroke-primary-foreground p-0.5"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="3"
											stroke-linecap="round"
											stroke-linejoin="round"
										>
											<polyline points="20 6 9 17 4 12"></polyline>
										</svg>
									{/if}
								</div>
							</div>
							<div class="space-y-1">
								<p
									class="text-sm font-semibold {agreedToRules ? 'text-primary' : 'text-foreground'}"
								>
									Saya Setuju
								</p>
								<p class="text-xs leading-relaxed text-muted-foreground">
									Saya telah membaca, mengerti, dan berjanji akan menaati peraturan ujian yang
									berlaku.
								</p>
							</div>
						</label>

						<div class="space-y-4">
							<div class="relative">
								<KeyRound
									class="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 {agreedToRules
										? 'text-primary'
										: 'text-muted-foreground'}"
								/>
								<input
									type="text"
									bind:value={token}
									onkeydown={handleKeydown}
									placeholder={agreedToRules ? 'TOKEN UJIAN' : 'KLIK SETUJU DULU'}
									class="flex h-14 w-full rounded-xl border-2 border-input bg-background/50 pr-4 pl-11 text-center font-mono text-xl font-bold tracking-[0.2em] uppercase shadow-sm transition-all focus-visible:border-primary focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 {agreedToRules
										? 'border-primary/50'
										: ''}"
									maxlength="20"
									disabled={isJoining || !agreedToRules}
								/>
							</div>

							<!-- Error -->
							{#if errorMessage}
								<div
									class="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-center"
								>
									<p class="text-sm font-medium text-destructive">{errorMessage}</p>
								</div>
							{/if}

							<!-- Submit Button -->
							<button
								onclick={handleJoin}
								disabled={isJoining || !agreedToRules || !token.trim()}
								class="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary text-base font-bold text-primary-foreground shadow-md transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none"
							>
								{#if isJoining}
									<Loader2 class="h-5 w-5 animate-spin" />
									Masuk Ke Ruangan...
								{:else}
									Buka Ujian Sekarang
								{/if}
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
