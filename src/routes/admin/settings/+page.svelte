<script lang="ts">
	import { onMount } from 'svelte';
	import PageHeader from '$lib/components/ui/page-header.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import {
		Card,
		CardContent,
		CardDescription,
		CardFooter,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card/index.js';
	import { settingService } from '$lib/services/admin/setting.service';
	import { mediaService } from '$lib/services/admin/media.service';
	import { toast } from 'svelte-sonner';
	import { Loader2, Upload } from '@lucide/svelte';
	import { overrideAssetPath } from '$lib/utils/assets';

	let isLoading = $state(true);
	let isSaving = $state(false);
	let isUploading = $state(false);

	let settings = $state({
		school_name: '',
		school_location: '',
		school_logo_url: '',
		login_bg_url: ''
	});

	let fileInput: HTMLInputElement | undefined = $state();
	let bgInput: HTMLInputElement | undefined = $state();
	let isUploadingBg = $state(false);

	async function handleBgUpload(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		isUploadingBg = true;
		try {
			const res = await mediaService.uploadImage(file);
			settings.login_bg_url = res.data.data.url;
			toast.success('Latar belakang berhasil diunggah');
		} catch (error) {
			toast.error('Gagal mengunggah latar belakang');
		} finally {
			isUploadingBg = false;
			if (bgInput) bgInput.value = '';
		}
	}

	function triggerBgInput() {
		bgInput?.click();
	}

	async function loadData() {
		isLoading = true;
		try {
			const res = await settingService.getSettings();
			if (res.data.data.settings) {
				const fetchedSettings = res.data.data.settings;
				for (const [key, value] of Object.entries(fetchedSettings)) {
					if (key in settings) {
						settings[key as keyof typeof settings] = value;
					}
				}
			}
		} catch (error) {
			console.log(error);
			toast.error('Gagal memuat pengaturan');
		} finally {
			isLoading = false;
		}
	}

	async function saveSettings() {
		isSaving = true;
		try {
			await settingService.updateSettings({
				settings: settings
			});
			toast.success('Pengaturan berhasil disimpan');
		} catch (error) {
			toast.error('Gagal menyimpan pengaturan');
		} finally {
			isSaving = false;
		}
	}

	async function handleFileUpload(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		isUploading = true;
		try {
			const res = await mediaService.uploadImage(file);
			settings.school_logo_url = res.data.data.url;
			toast.success('Logo berhasil diunggah');
		} catch (error) {
			toast.error('Gagal mengunggah logo');
		} finally {
			isUploading = false;
			// Optionally clear the input so the same file could be selected again
			if (fileInput) fileInput.value = '';
		}
	}

	function triggerFileInput() {
		fileInput?.click();
	}

	onMount(() => {
		loadData();
	});
</script>

<svelte:head>
	<title>Pengaturan Server - Exstem</title>
</svelte:head>

<div class="flex h-full flex-1 flex-col space-y-8 p-8">
	<PageHeader
		title="Pengaturan Aplikasi"
		description="Konfigurasi identitas sekolah dan opsi umum."
	/>

	<div class="grid gap-6">
		<Card>
			<CardHeader>
				<CardTitle>Identitas Sekolah</CardTitle>
				<CardDescription>
					Informasi ini akan ditampilkan pada portal login siswa dan berkas cetak.
				</CardDescription>
			</CardHeader>
			<CardContent class="grid gap-6">
				{#if isLoading}
					<div class="flex items-center justify-center p-8">
						<Loader2 class="h-8 w-8 animate-spin text-muted-foreground" />
					</div>
				{:else}
					<div class="grid gap-2">
						<Label for="school_name">Nama Sekolah</Label>
						<Input
							id="school_name"
							bind:value={settings.school_name}
							placeholder="Misal: SMA Negeri 1 Kota Jaya"
						/>
					</div>

					<div class="grid gap-2">
						<Label for="school_location">Lokasi Sekolah / Alamat</Label>
						<Input
							id="school_location"
							bind:value={settings.school_location}
							placeholder="Misal: Jl. Pendidikan No. 1"
						/>
					</div>

					<div class="grid gap-4">
						<Label>Logo Sekolah</Label>
						<div class="flex items-start gap-6">
							<div
								class="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-md border border-dashed bg-muted/50"
							>
								{#if settings.school_logo_url}
									<img
										src={overrideAssetPath(settings.school_logo_url)}
										alt="Logo Sekolah"
										class="h-full w-full object-contain"
									/>
								{:else}
									<span class="text-xs text-muted-foreground">Tidak Ada Logo</span>
								{/if}
							</div>
							<div class="grid gap-2">
								<Button variant="outline" onclick={triggerFileInput} disabled={isUploading}>
									{#if isUploading}
										<Loader2 class="mr-2 h-4 w-4 animate-spin" />
										Mengunggah...
									{:else}
										<Upload class="mr-2 h-4 w-4" />
										Unggah Logo Baru
									{/if}
								</Button>
								<p class="text-[0.8rem] text-muted-foreground">
									Disarankan menggunakan file PNG atau SVG persegi (aspek rasio 1:1) maksimal 2MB.
								</p>
								<input
									type="file"
									accept="image/*"
									class="hidden"
									bind:this={fileInput}
									onchange={handleFileUpload}
								/>
							</div>
						</div>
					</div>

					<div class="mt-6 grid gap-4 border-t pt-6">
						<Label>Latar Belakang Login</Label>
						<div class="flex items-start gap-6">
							<div
								class="relative flex h-24 w-40 shrink-0 items-center justify-center overflow-hidden rounded-md border border-dashed bg-muted/50"
							>
								{#if settings.login_bg_url}
									<img
										src={overrideAssetPath(settings.login_bg_url)}
										alt="Login Background"
										class="h-full w-full object-cover"
									/>
								{:else}
									<span class="px-2 text-center text-xs text-muted-foreground"
										>Tidak Ada Latar Belakang</span
									>
								{/if}
							</div>
							<div class="grid gap-2">
								<Button variant="outline" onclick={triggerBgInput} disabled={isUploadingBg}>
									{#if isUploadingBg}
										<Loader2 class="mr-2 h-4 w-4 animate-spin" />
										Mengunggah...
									{:else}
										<Upload class="mr-2 h-4 w-4" />
										Unggah Latar Belakang
									{/if}
								</Button>
								<p class="text-[0.8rem] text-muted-foreground">
									Disarankan gambar landscape resolusi tinggi (misal: 1920x1080) maksimal 5MB.
								</p>
								<input
									type="file"
									accept="image/*"
									class="hidden"
									bind:this={bgInput}
									onchange={handleBgUpload}
								/>
							</div>
						</div>
					</div>
				{/if}
			</CardContent>
			<CardFooter class="border-t px-6 py-4">
				<Button onclick={saveSettings} disabled={isLoading || isSaving}>
					{#if isSaving}
						<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					{/if}
					Simpan Perubahan
				</Button>
			</CardFooter>
		</Card>
	</div>
</div>
