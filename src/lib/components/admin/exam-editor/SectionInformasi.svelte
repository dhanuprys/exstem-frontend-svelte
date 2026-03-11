<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Loader2, Save } from '@lucide/svelte';
	import { cheatLabels } from '$lib/types/cheat';

	let {
		formTitle = $bindable(),
		formDuration = $bindable(),
		formToken = $bindable(),
		formScheduledStart = $bindable(),
		formScheduledEnd = $bindable(),
		formQBankID = $bindable(),
		formQuestionCount = $bindable(),
		formRandomizeQuestions = $bindable(),
		formCheatRules = $bindable(),
		isSaving,
		formErrors,
		onsave
	} = $props<{
		formTitle: string;
		formDuration: number;
		formToken: string;
		formScheduledStart: string;
		formScheduledEnd: string;
		formQBankID: string | null;
		formQuestionCount: number;
		formRandomizeQuestions: boolean;
		formCheatRules: Record<string, boolean>;
		isSaving: boolean;
		formErrors: Record<string, string>;
		onsave: () => void;
	}>();

	import * as Field from '$lib/components/ui/field/index.js';
	import { questionService, type QBank } from '$lib/services/admin/question.service';
	import { Check, ChevronsUpDown, Search } from '@lucide/svelte';
	import { onMount, onDestroy } from 'svelte';

	let isQBankOpen = $state(false);
	let qbankSearchQuery = $state('');
	let qbanksList: QBank[] = $state([]);
	let isSearchingQBank = $state(false);
	let qbankSearchTimeout: ReturnType<typeof setTimeout>;

	let selectedQBank = $derived(qbanksList.find((q) => q.id === formQBankID) || null);

	async function searchQBanks(query: string = '') {
		isSearchingQBank = true;
		try {
			// Fetch up to 10 top results based on query
			const res = await questionService.getQBanks(1, 10, query);
			qbanksList = (res.data as any)?.qbanks || res.data?.data || [];
		} catch (error) {
			console.error('Failed to fetch qbanks', error);
		} finally {
			isSearchingQBank = false;
		}
	}

	function handleQBankSearch(e: Event) {
		const val = (e.target as HTMLInputElement).value;
		qbankSearchQuery = val;
		clearTimeout(qbankSearchTimeout);
		qbankSearchTimeout = setTimeout(() => searchQBanks(val), 300);
	}

	function selectQBank(id: string | null) {
		formQBankID = id;
		isQBankOpen = false;
		qbankSearchQuery = '';
		// reset list to default state next time
		searchQBanks('');
	}

	onMount(() => {
		searchQBanks(''); // load initial batch
	});

	onDestroy(() => {
		clearTimeout(qbankSearchTimeout);
	});
</script>

<div class="rounded-xl border bg-card p-8 shadow-sm">
	<div class="mb-6 border-b pb-4">
		<h3 class="text-xl font-bold tracking-tight">Pengaturan Master Ujian</h3>
		<p class="mt-1 text-sm text-muted-foreground">
			Konfigurasi dasar metadata ujian, waktu pelaksanaan, dan akses masuk.
		</p>
	</div>

	<div class="space-y-8">
		<Field.Field>
			<Field.Label for="title">Judul Ujian <span class="text-destructive">*</span></Field.Label>
			<input
				id="title"
				bind:value={formTitle}
				aria-invalid={!!formErrors.title}
				class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
			/>
			{#if formErrors.title}
				<Field.Error>{formErrors.title}</Field.Error>
			{/if}
		</Field.Field>
		<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
			<Field.Field>
				<Field.Label for="duration">Durasi Pengerjaan (Menit) <span class="text-destructive">*</span></Field.Label>
				<div class="relative">
					<input
						id="duration"
						type="number"
						bind:value={formDuration}
						min="1"
						aria-invalid={!!formErrors.duration_minutes}
						class="flex h-11 w-full rounded-md border border-input bg-background px-4 py-2 text-sm shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:outline-none"
					/>
					<div
						class="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm text-muted-foreground"
					>
						Menit
					</div>
				</div>
				{#if formErrors.duration_minutes}
					<Field.Error>{formErrors.duration_minutes}</Field.Error>
				{/if}
			</Field.Field>
			<Field.Field>
				<Field.Label for="token">Token Ujian (Digenerasi Otomatis)</Field.Label>
				<input
					id="token"
					value={formToken}
					readonly
					aria-invalid={!!formErrors.entry_token}
					class="flex h-11 w-full cursor-not-allowed rounded-md border border-input bg-muted/50 px-4 py-2 font-mono text-sm font-bold tracking-[0.2em] text-muted-foreground shadow-sm focus-visible:outline-none"
				/>
				{#if formErrors.entry_token}
					<Field.Error>{formErrors.entry_token}</Field.Error>
				{/if}
			</Field.Field>
		</div>
		<Field.Field class="relative">
			<Field.Label for="qbank">Bank Soal</Field.Label>

			<div class="relative w-full">
				<button
					type="button"
					onclick={() => (isQBankOpen = !isQBankOpen)}
					class="flex w-full items-center justify-between rounded-md border border-input bg-background px-4 py-2 text-sm shadow-sm hover:bg-accent hover:text-accent-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none"
				>
					<span class="truncate pr-4">
						{selectedQBank
							? selectedQBank.name
							: '-- Tanpa Bank Soal (Gunakan Soal Ujian Tersendiri) --'}
					</span>
					<ChevronsUpDown class="h-4 w-4 shrink-0 opacity-50" />
				</button>

				{#if isQBankOpen}
					<div
						class="absolute z-50 mt-1 max-h-[300px] w-full animate-in overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md fade-in-0 outline-none zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
					>
						<div class="flex items-center border-b px-3">
							<Search class="mr-2 h-4 w-4 shrink-0 opacity-50" />
							<input
								class="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
								placeholder="Cari bank soal..."
								value={qbankSearchQuery}
								oninput={handleQBankSearch}
							/>
						</div>

						<div class="max-h-[250px] overflow-y-auto p-1">
							{#if isSearchingQBank}
								<div class="py-6 text-center text-sm text-muted-foreground">Mencari...</div>
							{:else}
								<button
									type="button"
									class="relative flex w-full cursor-default items-center rounded-sm py-1.5 pr-2 pl-8 text-sm outline-none select-none hover:bg-accent hover:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 {formQBankID ===
									null
										? 'bg-accent text-accent-foreground'
										: ''}"
									onclick={() => selectQBank(null)}
								>
									{#if formQBankID === null}
										<span class="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
											<Check class="h-4 w-4" />
										</span>
									{/if}
									-- Tanpa Bank Soal --
								</button>

								{#each qbanksList as qbank}
									<button
										type="button"
										class="relative flex w-full cursor-default items-center rounded-sm py-1.5 pr-2 pl-8 text-sm outline-none select-none hover:bg-accent hover:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 {formQBankID ===
										qbank.id
											? 'bg-accent text-accent-foreground'
											: ''}"
										onclick={() => selectQBank(qbank.id)}
									>
										{#if formQBankID === qbank.id}
											<span class="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
												<Check class="h-4 w-4" />
											</span>
										{/if}
										{qbank.name}
									</button>
								{/each}

								{#if qbanksList.length === 0}
									<div class="py-6 text-center text-sm text-muted-foreground">
										Pencarian tidak ditemukan.
									</div>
								{/if}
							{/if}
						</div>
					</div>
				{/if}
			</div>
			{#if formErrors.qbank_id}
				<Field.Error>{formErrors.qbank_id}</Field.Error>
			{/if}
		</Field.Field>
		<div class="grid grid-cols-1 gap-6 rounded-lg border bg-muted/20 p-4 md:grid-cols-2">
			<Field.Field>
				<Field.Label for="start">Jadwal Mulai Tepat Waktu (Opsional)</Field.Label>
				<input
					id="start"
					type="datetime-local"
					bind:value={formScheduledStart}
					aria-invalid={!!formErrors.scheduled_start}
					class="flex h-11 w-full rounded-md border border-input bg-background px-4 py-2 text-sm shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:outline-none"
				/>
				{#if formErrors.scheduled_start}
					<Field.Error>{formErrors.scheduled_start}</Field.Error>
				{/if}
			</Field.Field>
			<Field.Field>
				<Field.Label for="end">Jadwal Terakhir / Ditutup (Opsional)</Field.Label>
				<input
					id="end"
					type="datetime-local"
					bind:value={formScheduledEnd}
					aria-invalid={!!formErrors.scheduled_end}
					class="flex h-11 w-full rounded-md border border-input bg-background px-4 py-2 text-sm shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:outline-none"
				/>
				{#if formErrors.scheduled_end}
					<Field.Error>{formErrors.scheduled_end}</Field.Error>
				{/if}
			</Field.Field>
		</div>
		<div class="grid grid-cols-1 gap-6 rounded-lg border bg-muted/20 p-4 md:grid-cols-2">
			<Field.Field>
				<Field.Label for="count">Jumlah Soal yang Ditampilkan</Field.Label>
				<input
					id="count"
					type="number"
					bind:value={formQuestionCount}
					min="1"
					aria-invalid={!!formErrors.question_count}
					class="flex h-11 w-full rounded-md border border-input bg-background px-4 py-2 text-sm shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:outline-none"
				/>
				<Field.Description>
					Jika diatur lebih kecil dari jumlah soal pada bank soal, soal akan diambil secara acak.
				</Field.Description>
				{#if formErrors.question_count}
					<Field.Error>{formErrors.question_count}</Field.Error>
				{/if}
			</Field.Field>
			<div class="flex flex-col justify-center space-y-3">
				<label class="flex cursor-pointer items-center space-x-3 pt-6">
					<input
						type="checkbox"
						bind:checked={formRandomizeQuestions}
						class="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
					/>
					<span class="text-sm font-semibold text-foreground/90"
						>Acak Urutan Soal & Pilihan Ganda</span
					>
				</label>
			</div>
		</div>

		<div class="space-y-4 rounded-lg border bg-muted/20 p-4">
			<h4 class="text-sm font-semibold text-foreground/90">
				Aturan Pencegahan Kecurangan (Mencegah Aksi Berikut)
			</h4>
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
				{#each Object.entries(cheatLabels) as [key, label]}
					<label
						class="flex cursor-pointer items-center space-x-3 rounded-md p-2 transition-colors hover:bg-muted/50"
					>
						<input
							type="checkbox"
							bind:checked={formCheatRules[key]}
							class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
						/>
						<span
							class="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
							>{label}</span
						>
					</label>
				{/each}
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
