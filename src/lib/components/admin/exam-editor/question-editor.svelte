<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Loader2, Save, Plus, Trash2, FileText, Download, Upload } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import mammoth from 'mammoth';
	import RichTextEditor from '$lib/components/editor/RichTextEditor.svelte';
	import { questionService, type Question } from '$lib/services/admin/question.service';
	import { DocxParserUtils } from '$lib/services/admin/docx-parser.utils';
	import { mediaService } from '$lib/services/admin/media.service';

	let { qbankId }: { qbankId: string } = $props();

	// ─── State ───────────────────────────────────────────────────────
	let questions = $state<Question[]>([]);
	let activeQuestionIndex = $state(0);
	let isLoading = $state(true);
	let isSaving = $state(false);
	let isImportingDocx = $state(false);
	let fileInputDocx: HTMLInputElement | undefined = $state();

	let activeQuestion = $derived<Question | null>(questions[activeQuestionIndex] ?? null);

	function getTotalScore(qs: Question[]): number {
		return qs.reduce((acc, q) => acc + (Number(q.score_value) || 0), 0);
	}

	// ─── Load ─────────────────────────────────────────────────────────
	onMount(async () => {
		try {
			questions = (await questionService.getQuestions(qbankId)) ?? [];
		} catch {
			toast.error('Gagal memuat soal');
		} finally {
			isLoading = false;
		}
	});

	// ─── Question Mutations ───────────────────────────────────────────
	function addQuestion() {
		questions = [
			...questions,
			{
				question_text: '',
				question_type: 'MULTIPLE_CHOICE',
				options: ['', '', '', '', ''],
				correct_option: '0',
				order_num: questions.length + 1,
				score_value: 1
			}
		];
		activeQuestionIndex = questions.length - 1;
	}

	function removeQuestion(index: number) {
		questions = questions.filter((_, i) => i !== index);
		if (activeQuestionIndex >= questions.length) {
			activeQuestionIndex = Math.max(0, questions.length - 1);
		}
	}

	function addOption() {
		if (!activeQuestion || activeQuestion.options.length >= 8) return;
		questions[activeQuestionIndex] = {
			...activeQuestion,
			options: [...activeQuestion.options, '']
		};
	}

	function removeOption(optIdx: number) {
		if (!activeQuestion || activeQuestion.options.length <= 2) return;
		const updated = activeQuestion.options.filter((_: string, i: number) => i !== optIdx);
		let correct = activeQuestion.correct_option;
		if (correct === String(optIdx)) correct = '0';
		else if (Number(correct) > optIdx) correct = String(Number(correct) - 1);
		questions[activeQuestionIndex] = {
			...activeQuestion,
			options: updated,
			correct_option: correct
		};
	}

	// ─── Save ─────────────────────────────────────────────────────────
	async function saveQuestions() {
		isSaving = true;
		try {
			const payload = questions.map((q, i) => ({ ...q, order_num: i + 1 }));
			await questionService.replaceQuestions(qbankId, payload);
			toast.success('Soal berhasil disimpan');
		} catch {
			toast.error('Gagal menyimpan soal');
		} finally {
			isSaving = false;
		}
	}

	// ─── DOCX Import ──────────────────────────────────────────────────
	function copyTemplate() {
		const template = `[SOAL 1]
Siapa nama presiden pertama Indonesia?
[A] Soekarno
[B] Soeharto
[C] B.J. Habibie
[D] Megawati
[E] Joko Widodo
[JAWABAN] A

[SOAL 2]
Warna bendera Indonesia dari atas ke bawah adalah?
[A] Putih dan Merah
[B] Merah dan Putih
[C] Hijau dan Kuning
[D] Biru dan Putih
[E] Hitam dan Putih
[JAWABAN] B`;
		navigator.clipboard.writeText(template);
		toast.success('Template berhasil disalin ke clipboard');
	}

	async function importDocx(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		isImportingDocx = true;
		try {
			const arrayBuffer = await file.arrayBuffer();
			const options = {
				convertImage: mammoth.images.imgElement(function (image) {
					return image.readAsArrayBuffer().then(async function (imageBuffer) {
						try {
							const blob = new Blob([imageBuffer], { type: image.contentType });
							const ext = image.contentType.split('/')[1] || 'png';
							const uploadedFile = new File([blob], `docx-img-${Date.now()}.${ext}`, {
								type: image.contentType
							});
							const uploadRes = await mediaService.uploadImage(uploadedFile);
							return { src: uploadRes.data.data.url };
						} catch {
							return { src: '' };
						}
					});
				})
			};

			const result = await mammoth.convertToHtml({ arrayBuffer }, options);
			const importedQuestions = DocxParserUtils.parseHtmlToQuestions(result.value);

			if (importedQuestions.length > 0) {
				questions = [...questions, ...importedQuestions];
				activeQuestionIndex = questions.length - importedQuestions.length;
				toast.success(`Berhasil mengimpor ${importedQuestions.length} soal`);
			} else {
				toast.error('Gagal mengimpor: Tidak ada pola soal yang ditemukan');
			}
		} catch (error) {
			console.error('DOCX Import Error', error);
			toast.error('Gagal memproses file DOCX');
		} finally {
			isImportingDocx = false;
			if (fileInputDocx) fileInputDocx.value = '';
		}
	}
</script>

<!-- ── Loading ───────────────────────────────────────────────────────── -->
{#if isLoading}
	<div class="flex flex-1 items-center justify-center py-24">
		<Loader2 class="h-8 w-8 animate-spin text-primary" />
	</div>
{:else}
	<!-- ── Toolbar ─────────────────────────────────────────────────────── -->
	<div
		class="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-4 shadow-sm"
	>
		<div class="flex flex-wrap items-center gap-2">
			<Button variant="outline" onclick={copyTemplate} title="Salin Template DOCX">
				<Download class="mr-2 h-4 w-4" /> Salin Template DOCX
			</Button>
			<Button
				variant="outline"
				onclick={() => fileInputDocx?.click()}
				disabled={isImportingDocx}
				title="Import DOCX"
			>
				{#if isImportingDocx}
					<Loader2 class="mr-2 h-4 w-4 animate-spin" />
				{:else}
					<Upload class="mr-2 h-4 w-4" />
				{/if}
				Import DOCX
			</Button>
			<input
				type="file"
				accept=".docx"
				class="hidden"
				bind:this={fileInputDocx}
				onchange={importDocx}
			/>
			<Button variant="secondary" onclick={addQuestion} title="Tambah Soal Baru">
				<Plus class="mr-2 h-4 w-4" /> Tambah Soal
			</Button>
		</div>
		<div class="flex items-center gap-4">
			<!-- <div class="flex items-center gap-2 rounded-lg bg-muted/50 px-4 py-2">
				<span class="text-xs font-bold tracking-widest text-muted-foreground uppercase"
					>Total Bobot:</span
				>
				<span class="text-lg font-black text-primary">{getTotalScore(questions)}</span>
			</div> -->
			<Button
				variant="default"
				class="font-bold shadow-sm"
				onclick={saveQuestions}
				disabled={isSaving}
			>
				{#if isSaving}<Loader2 class="mr-2 h-4 w-4 animate-spin" />{/if}
				<Save class="mr-2 h-4 w-4" /> Simpan Semua Soal
			</Button>
		</div>
	</div>

	<!-- ── Two-panel Editor ────────────────────────────────────────────── -->
	<div class="mt-4 flex min-h-[700px] flex-1 overflow-hidden rounded-xl border bg-card shadow-sm">
		<!-- Sidebar -->
		<div class="flex w-64 flex-col border-r bg-muted/10">
			<div class="flex items-center justify-center border-b bg-muted/20 p-4">
				<span class="text-xs font-bold tracking-widest text-muted-foreground uppercase">
					Daftar Soal ({questions.length})
				</span>
			</div>
			<div class="flex-1 space-y-1.5 overflow-y-auto p-3">
				{#if questions.length === 0}
					<div class="flex flex-col items-center justify-center p-6 text-center opacity-70">
						<FileText class="mb-2 h-8 w-8 text-muted-foreground" />
						<p class="text-xs font-medium text-muted-foreground">Belum ada soal.</p>
					</div>
				{:else}
					{#each questions as _q, index (index)}
						<button
							class="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors {activeQuestionIndex ===
							index
								? 'bg-primary font-medium text-primary-foreground'
								: 'font-medium hover:bg-muted'}"
							onclick={() => (activeQuestionIndex = index)}
						>
							<span>Soal No. {index + 1}</span>
							{#if activeQuestionIndex === index}
								<div
									role="button"
									tabindex="0"
									class="text-primary-foreground/70 hover:text-white"
									onclick={(e) => {
										e.stopPropagation();
										removeQuestion(index);
									}}
									onkeydown={(e) => {
										if (e.key === 'Enter') {
											e.stopPropagation();
											removeQuestion(index);
										}
									}}
								>
									<Trash2 class="h-3 w-3" />
								</div>
							{/if}
						</button>
					{/each}
				{/if}
			</div>
			<div class="border-t bg-muted/20 p-4 text-center text-xs text-muted-foreground">
				Lengkapi detail soal di area utama.
			</div>
		</div>

		<!-- Main area -->
		<div class="flex flex-1 flex-col overflow-y-auto bg-background p-8">
			{#if activeQuestion !== null && questions.length > 0}
				{@const currentQ = questions[activeQuestionIndex]}

				<!-- Header row -->
				<div class="mb-8 flex items-end justify-between border-b pb-4">
					<div>
						<h3 class="text-xl font-bold tracking-tight">
							Edit Soal Nomor {activeQuestionIndex + 1}
						</h3>
						<p class="mt-1 text-sm text-muted-foreground">
							Gunakan editor Rich Text untuk memasukkan teks, rumus, gambar, atau media.
						</p>
					</div>
					<!-- <div class="flex items-center gap-3 rounded-lg border bg-muted/10 px-4 py-2 shadow-sm">
						<label
							for={`score_${activeQuestionIndex}`}
							class="text-sm font-bold tracking-widest text-muted-foreground uppercase"
							>Bobot Skor:</label
						>
						<input
							id={`score_${activeQuestionIndex}`}
							type="number"
							min="1"
							bind:value={currentQ.score_value}
							class="h-9 w-20 rounded-md border text-center text-lg font-bold shadow-sm focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none"
						/>
					</div> -->
				</div>

				<!-- Question text -->
				<div class="mb-8">
					<p class="mb-3 text-sm font-bold tracking-widest text-muted-foreground uppercase">
						Isi Pertanyaan
					</p>
					<div
						class="overflow-hidden rounded-xl border shadow-sm transition-all focus-within:ring-2 focus-within:ring-primary"
					>
						<RichTextEditor
							bind:value={currentQ.question_text}
							placeholder="Ketik pertanyaan atau unggah/paste gambar di sini..."
						/>
					</div>
				</div>

				<!-- Options -->
				<div class="mb-4">
					<div class="mb-6 flex items-center justify-between">
						<p class="text-sm font-bold tracking-widest text-muted-foreground uppercase">
							Pilihan Jawaban (Ganda)
						</p>
						<Button variant="outline" size="sm" onclick={addOption} class="shadow-sm">
							<Plus class="mr-2 h-4 w-4" /> Tambah Pilihan
						</Button>
					</div>
					<div class="space-y-6">
						{#each currentQ.options as _opt, optIdx (optIdx)}
							<div class="flex items-start gap-4">
								<div class="pt-2">
									<input
										id={`radio_opt_${optIdx}`}
										type="radio"
										name={`correct_option_${activeQuestionIndex}`}
										value={String(optIdx)}
										bind:group={currentQ.correct_option}
										class="mt-3 h-5 w-5 cursor-pointer accent-primary"
										title="Tandai sebagai jawaban benar"
									/>
								</div>
								<div
									class="flex-1 rounded-xl border bg-card text-sm shadow-sm transition-all focus-within:border-primary focus-within:ring-1 focus-within:ring-primary {currentQ.correct_option ===
									String(optIdx)
										? 'border-primary bg-primary/5 ring-2 ring-primary'
										: ''}"
								>
									<div
										class="flex items-center justify-between rounded-t-xl border-b px-4 py-2 transition-colors {currentQ.correct_option ===
										String(optIdx)
											? 'bg-primary/10'
											: 'bg-muted/30'}"
									>
										<label
											for={`radio_opt_${optIdx}`}
											class="flex cursor-pointer items-center gap-2 font-bold {currentQ.correct_option ===
											String(optIdx)
												? 'text-primary'
												: 'text-muted-foreground'}"
										>
											Pilihan {String.fromCharCode(65 + optIdx)}
											{#if currentQ.correct_option === String(optIdx)}
												<span
													class="rounded-full bg-primary px-2 py-0.5 text-xs font-black tracking-widest text-primary-foreground uppercase"
												>
													Kunci Jawaban
												</span>
											{/if}
										</label>
										{#if currentQ.options.length > 2}
											<Button
												variant="ghost"
												size="icon"
												class="h-7 w-7 rounded-full text-destructive hover:bg-destructive/10"
												onclick={() => removeOption(optIdx)}
												title="Hapus Pilihan"
											>
												<Trash2 class="h-4 w-4" />
											</Button>
										{/if}
									</div>
									<div class="overflow-hidden rounded-b-xl bg-background">
										<RichTextEditor
											bind:value={currentQ.options[optIdx]}
											placeholder={`Ketik isi pilihan ${String.fromCharCode(65 + optIdx)}...`}
										/>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{:else}
				<!-- Empty state -->
				<div
					class="m-4 flex h-full flex-col items-center justify-center rounded-xl border-2 border-dashed bg-muted/10 text-muted-foreground"
				>
					<div class="mb-6 rounded-full bg-background p-6 shadow-sm">
						<FileText class="h-16 w-16 text-muted-foreground/50" />
					</div>
					<h4 class="mb-2 text-xl font-bold text-foreground/80">Pilih Soal Untuk Diedit</h4>
					<p class="max-w-sm text-center text-sm">
						Silakan pilih soal dari navigasi di sebelah kiri, atau tekan tombol
						<strong>+ Tambah Soal</strong> untuk mulai membuat soal pertama.
					</p>
				</div>
			{/if}
		</div>
	</div>
{/if}
