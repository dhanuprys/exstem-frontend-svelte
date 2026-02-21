<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Loader2, Save } from '@lucide/svelte';
	import type { Subject } from '$lib/services/admin/subject.service';

	let {
		formTitle = $bindable(),
		formSubjectId = $bindable(),
		formDuration = $bindable(),
		formToken = $bindable(),
		formScheduledStart = $bindable(),
		formScheduledEnd = $bindable(),
		subjects = [],
		isSaving,
		onsave
	} = $props<{
		formTitle: string;
		formSubjectId: number | null;
		formDuration: number;
		formToken: string;
		formScheduledStart: string;
		formScheduledEnd: string;
		subjects: Subject[];
		isSaving: boolean;
		onsave: () => void;
	}>();
</script>

<div class="max-w-4xl rounded-xl border bg-card p-8 shadow-sm">
	<div class="mb-6 border-b pb-4">
		<h3 class="text-xl font-bold tracking-tight">Pengaturan Master Ujian</h3>
		<p class="mt-1 text-sm text-muted-foreground">
			Konfigurasi dasar metadata ujian, waktu pelaksanaan, dan akses masuk.
		</p>
	</div>

	<div class="space-y-8">
		<div class="space-y-3">
			<label for="title" class="text-sm font-semibold text-foreground/90"
				>Judul Ujian <span class="text-destructive">*</span></label
			>
			<input
				id="title"
				bind:value={formTitle}
				class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
			/>
		</div>
		<div class="space-y-3">
			<label for="subject" class="text-sm font-semibold text-foreground/90">Mata Pelajaran</label>
			<select
				id="subject"
				bind:value={formSubjectId}
				class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
			>
				<option value={null}>-- Tanpa Mata Pelajaran --</option>
				{#each subjects as subject}
					<option value={subject.id}>{subject.name}</option>
				{/each}
			</select>
		</div>
		<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
			<div class="space-y-3">
				<label for="duration" class="text-sm font-semibold text-foreground/90"
					>Durasi Pengerjaan (Menit) <span class="text-destructive">*</span></label
				>
				<div class="relative">
					<input
						id="duration"
						type="number"
						bind:value={formDuration}
						min="1"
						class="flex h-11 w-full rounded-md border border-input bg-background px-4 py-2 text-sm shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:outline-none"
					/>
					<div
						class="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm text-muted-foreground"
					>
						Menit
					</div>
				</div>
			</div>
			<div class="space-y-3">
				<label for="token" class="text-sm font-semibold text-foreground/90"
					>Token Ujian (Digenerasi Otomatis)</label
				>
				<input
					id="token"
					value={formToken}
					readonly
					class="flex h-11 w-full cursor-not-allowed rounded-md border border-input bg-muted/50 px-4 py-2 font-mono text-sm font-bold tracking-[0.2em] text-muted-foreground shadow-sm focus-visible:outline-none"
				/>
			</div>
		</div>
		<div class="grid grid-cols-1 gap-6 rounded-lg border bg-muted/20 p-4 md:grid-cols-2">
			<div class="space-y-3">
				<label for="start" class="text-sm font-semibold text-foreground/90"
					>Jadwal Mulai Tepat Waktu (Opsional)</label
				>
				<input
					id="start"
					type="datetime-local"
					bind:value={formScheduledStart}
					class="flex h-11 w-full rounded-md border border-input bg-background px-4 py-2 text-sm shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:outline-none"
				/>
			</div>
			<div class="space-y-3">
				<label for="end" class="text-sm font-semibold text-foreground/90"
					>Jadwal Terakhir / Ditutup (Opsional)</label
				>
				<input
					id="end"
					type="datetime-local"
					bind:value={formScheduledEnd}
					class="flex h-11 w-full rounded-md border border-input bg-background px-4 py-2 text-sm shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:outline-none"
				/>
			</div>
		</div>
	</div>
	<div class="mt-8 flex justify-end">
		<Button onclick={onsave} disabled={isSaving} size="lg" class="w-full font-semibold sm:w-auto">
			{#if isSaving}<Loader2 class="mr-2 h-4 w-4 animate-spin" />{/if}
			<Save class="mr-2 h-4 w-4" /> Simpan Informasi
		</Button>
	</div>
</div>
