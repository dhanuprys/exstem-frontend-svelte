<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Loader2, Save, Plus, Trash2, Users } from '@lucide/svelte';
	import type { ExamTargetRule } from '$lib/services/admin/exam.service';
	import type { Class } from '$lib/services/admin/class.service';
	import type { Major } from '$lib/services/admin/major.service';

	let {
		targetRules = $bindable(),
		classes,
		majorsList,
		isSaving,
		onsave,
		onadd,
		onremove,
		onupdate
	} = $props<{
		targetRules: ExamTargetRule[];
		classes: Class[];
		majorsList: Major[];
		isSaving: boolean;
		onsave: () => void;
		onadd: () => void;
		onremove: (index: number) => void;
		onupdate: (rule: ExamTargetRule) => void;
	}>();

	const RELIGION_OPTIONS = ['Islam', 'Kristen Protestan', 'Katolik', 'Hindu', 'Buddha', 'Konghucu'];
	const GRADE_OPTIONS = ['X', 'XI', 'XII'];
</script>

<div class="rounded-xl border bg-card p-8 shadow-sm">
	<div class="mb-8 flex items-center justify-between border-b pb-4">
		<div>
			<h3 class="text-xl font-bold tracking-tight">Aturan Penargetan Peserta</h3>
			<p class="mt-1 text-sm text-muted-foreground">
				Tentukan kombinasi segmentasi siswa yang berhak mengikuti ujian ini (Relasi antar aturan
				adalah OR / ATAU).
			</p>
		</div>
		<Button variant="default" size="sm" onclick={onadd}>
			<Plus class="mr-2 h-4 w-4" /> Tambah Aturan Target
		</Button>
	</div>

	{#if targetRules.length === 0}
		<div
			class="flex flex-col items-center justify-center rounded-xl border-2 border-dashed bg-muted/20 py-16 text-center"
		>
			<div class="mb-4 rounded-full bg-primary/10 p-4">
				<Users class="h-8 w-8 text-primary" />
			</div>
			<h4 class="text-lg font-bold">Terbuka Untuk Semua Kelas</h4>
			<p class="mt-2 mb-6 max-w-sm text-sm text-muted-foreground">
				Saat ini tidak ada aturan penargetan. Artinya, semua akun siswa yang mengetahui Token dan
				Jadwal dapat mendaftar masuk ke ujian ini.
			</p>
			<Button variant="secondary" onclick={onadd}>
				<Plus class="mr-2 h-4 w-4" /> Buat Batasan Target Pertama
			</Button>
		</div>
	{:else}
		<div class="space-y-4">
			{#each targetRules as rule, i}
				<div
					class="flex flex-col gap-4 rounded-xl border bg-muted/5 p-5 shadow-sm transition-all hover:bg-muted/10"
				>
					<div class="mb-1 flex items-center justify-between border-b pb-3">
						<span class="text-sm font-bold tracking-widest text-muted-foreground uppercase">
							Aturan Target #{i + 1}
						</span>
						<Button
							variant="ghost"
							size="icon"
							class="h-8 w-8 text-destructive hover:bg-destructive/10"
							title="Hapus Aturan"
							onclick={() => onremove(i)}
						>
							<Trash2 class="h-4 w-4" />
						</Button>
					</div>

					<div class="grid flex-1 grid-cols-1 gap-6 md:grid-cols-4">
						<div class="space-y-2">
							<label class="text-xs font-bold text-foreground/80" for={`class_id_${i}`}
								>SPESIFIK KELAS (Prioritas Utama)</label
							>
							<select
								id={`class_id_${i}`}
								bind:value={rule.class_id}
								onchange={() => rule.id && onupdate(rule)}
								class="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm font-medium shadow-sm transition-all focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none"
							>
								<option value={null}>— Bebas / Berlaku Semua —</option>
								{#each classes as cls}
									<option value={cls.id}>
										{cls.grade_level}
										{cls.major_code}
										{cls.group_number}
									</option>
								{/each}
							</select>
						</div>
						<div class="space-y-2">
							<label class="text-xs font-bold text-foreground/80" for={`grade_${i}`}
								>TINGKATAN (Opsional)</label
							>
							<select
								id={`grade_${i}`}
								bind:value={rule.grade_level}
								onchange={() => rule.id && onupdate(rule)}
								class="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm font-medium shadow-sm transition-all focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none"
							>
								<option value={null}>— Bebas —</option>
								{#each GRADE_OPTIONS as gr}
									<option value={gr}>{gr}</option>
								{/each}
							</select>
						</div>
						<div class="space-y-2">
							<label class="text-xs font-bold text-foreground/80" for={`major_${i}`}
								>JURUSAN (Opsional)</label
							>
							<select
								id={`major_${i}`}
								bind:value={rule.major_code}
								onchange={() => rule.id && onupdate(rule)}
								class="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm font-medium shadow-sm transition-all focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none"
							>
								<option value={null}>— Bebas —</option>
								{#each majorsList as major}
									<option value={major.code}>{major.code} - {major.long_name}</option>
								{/each}
							</select>
						</div>
						<div class="space-y-2">
							<label class="text-xs font-bold text-foreground/80" for={`religion_${i}`}
								>AGAMA (Opsional)</label
							>
							<select
								id={`religion_${i}`}
								bind:value={rule.religion}
								onchange={() => rule.id && onupdate(rule)}
								class="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm font-medium shadow-sm transition-all focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none"
							>
								<option value={null}>— Bebas —</option>
								{#each RELIGION_OPTIONS as rel}
									<option value={rel}>{rel}</option>
								{/each}
							</select>
						</div>
					</div>
				</div>
			{/each}
		</div>
		{#if targetRules.length > 0 && targetRules.some((r: ExamTargetRule) => !r.id)}
			<div class="mt-8 flex justify-end">
				<Button
					onclick={onsave}
					disabled={isSaving}
					size="lg"
					class="w-full font-semibold sm:w-auto"
				>
					{#if isSaving}<Loader2 class="mr-2 h-5 w-5 animate-spin" />{/if}
					<Save class="mr-2 h-5 w-5" /> Simpan Aturan Target Baru
				</Button>
			</div>
		{/if}
	{/if}
</div>
