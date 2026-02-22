<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import {
		examService,
		type Exam,
		type ExamTargetRule,
		type Question
	} from '$lib/services/admin/exam.service';
	import { classService, type Class } from '$lib/services/admin/class.service';
	import { majorService, type Major } from '$lib/services/admin/major.service';
	import { subjectService, type Subject } from '$lib/services/admin/subject.service';
	import PageHeader from '$lib/components/ui/page-header.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { toast } from 'svelte-sonner';
	import { Loader2 } from '@lucide/svelte';

	import TabInformasi from '$lib/components/admin/exam-editor/TabInformasi.svelte';
	import TabTarget from '$lib/components/admin/exam-editor/TabTarget.svelte';
	import TabSoal from '$lib/components/admin/exam-editor/TabSoal.svelte';

	let examId = page.params.examId as string;
	let exam: Exam | null = $state(null);
	let targetRules: ExamTargetRule[] = $state([]);
	let questions: Question[] = $state([]);
	let classes: Class[] = $state([]);
	let subjects: Subject[] = $state([]);
	let majorsList: Major[] = $state([]);

	let isLoading = $state(true);
	let isSaving = $state(false);
	let isPublishing = $state(false);

	let activeTab = $state<'informasi' | 'target' | 'soal'>('informasi');

	// --- Tab 1: Informasi State ---
	let formTitle = $state('');
	let formSubjectId: number | null = $state(null);
	let formDuration = $state(90);
	let formScheduledStart = $state('');
	let formScheduledEnd = $state('');
	let formToken = $state('');

	// --- Tab 3: Soal State ---
	let activeQuestionIndex = $state(0);

	async function loadInitialData() {
		isLoading = true;
		try {
			// Load Exam
			exam = (await examService.getExam(examId)).data;
			if (!exam) return;

			formTitle = exam.title;
			formSubjectId = exam.subject_id || null;
			formDuration = exam.duration_minutes;
			formToken = exam.entry_token || '';
			if (exam.scheduled_start) {
				formScheduledStart = new Date(exam.scheduled_start).toISOString().slice(0, 16);
			}
			if (exam.scheduled_end) {
				formScheduledEnd = new Date(exam.scheduled_end).toISOString().slice(0, 16);
			}

			targetRules = (await examService.getTargetRules(examId)) || [];
			questions = (await examService.getQuestions(examId)) || [];

			const classRes = await classService.getClasses();
			classes = classRes.data.data.classes || [];

			const resSubjects = await subjectService.getSubjects();
			subjects = resSubjects.data.data.subjects || [];

			const resMajors = await majorService.getMajors();
			majorsList = resMajors.data.data.majors || [];
		} catch (error) {
			toast.error('Gagal memuat data ujian');
			goto('/admin/exams');
		} finally {
			isLoading = false;
		}
	}

	async function saveInformation() {
		isSaving = true;
		try {
			await examService.updateExam(examId, {
				title: formTitle,
				subject_id: formSubjectId === null ? 0 : formSubjectId,
				duration_minutes: formDuration,
				entry_token: formToken || undefined,
				scheduled_start: formScheduledStart
					? new Date(formScheduledStart).toISOString()
					: undefined,
				scheduled_end: formScheduledEnd ? new Date(formScheduledEnd).toISOString() : undefined
			});
			toast.success('Informasi ujian berhasil disimpan');
			if (exam) exam.status = 'DRAFT';
		} catch (err: any) {
			const message = err.response?.data?.error?.message || 'Gagal menyimpan informasi';
			toast.error(message);
		} finally {
			isSaving = false;
		}
	}

	function addTargetRule() {
		targetRules.push({
			exam_id: examId,
			class_id: null,
			grade_level: null,
			major_code: null,
			religion: null
		});
	}

	function removeTargetRule(index: number) {
		targetRules.splice(index, 1);
	}

	async function saveTargetRules() {
		isSaving = true;
		try {
			for (const rule of targetRules) {
				await examService.addTargetRule(examId, {
					class_id: rule.class_id || undefined,
					grade_level: rule.grade_level || undefined,
					major_code: rule.major_code || undefined,
					religion: rule.religion || undefined
				});
			}
			toast.success(
				'Aturan target berhasil disimpan. (Catatan: versi saat ini hanya menambahkan aturan baru)'
			);
		} catch (err) {
			toast.error('Gagal menyimpan target peserta');
		} finally {
			isSaving = false;
		}
	}

	function addQuestion() {
		questions.push({
			exam_id: examId,
			question_text: '',
			question_type: 'MULTIPLE_CHOICE',
			options: ['', '', '', '', ''],
			correct_option: '0',
			order_num: questions.length + 1,
			score_value: 1
		});
		activeQuestionIndex = questions.length - 1;
	}

	function removeQuestion(index: number) {
		questions.splice(index, 1);
		questions.forEach((q, i) => (q.order_num = i + 1));
		if (activeQuestionIndex >= questions.length) {
			activeQuestionIndex = questions.length - 1;
		}
	}

	function addOption() {
		if (
			questions.length > 0 &&
			activeQuestionIndex >= 0 &&
			activeQuestionIndex < questions.length
		) {
			questions[activeQuestionIndex].options.push('');
		}
	}

	function removeOption(optIdx: number) {
		if (
			questions.length > 0 &&
			activeQuestionIndex >= 0 &&
			activeQuestionIndex < questions.length
		) {
			const q = questions[activeQuestionIndex];
			if (q.options.length <= 2) {
				toast.error('Minimal harus ada 2 pilihan jawaban');
				return;
			}
			q.options.splice(optIdx, 1);
			// Reset correct option index safely if it points out of bounds or to the deleted item
			let correctIdx = parseInt(q.correct_option, 10);
			if (correctIdx === optIdx) {
				q.correct_option = '0';
			} else if (correctIdx > optIdx) {
				q.correct_option = String(correctIdx - 1);
			}
		}
	}

	async function saveQuestions() {
		for (let i = 0; i < questions.length; i++) {
			const q = questions[i];
			if (!q.question_text || q.question_text === '<p></p>') {
				toast.error(`Pertanyaan nomor ${q.order_num} belum diisi`);
				return;
			}
		}

		isSaving = true;
		try {
			await examService.replaceQuestions(examId, questions);
			toast.success('Semua soal berhasil disimpan');
		} catch (err) {
			toast.error('Gagal menyimpan soal');
		} finally {
			isSaving = false;
		}
	}

	async function publishExam() {
		isPublishing = true;
		try {
			await examService.publishExam(examId);
			toast.success('Ujian berhasil diterbitkan!');
			if (exam) exam.status = 'PUBLISHED';
		} catch (err) {
			toast.error('Gagal menerbitkan ujian');
		} finally {
			isPublishing = false;
		}
	}

	onMount(() => {
		loadInitialData();
	});
</script>

<div class="flex h-full flex-1 flex-col space-y-4 p-8">
	<PageHeader
		title="Editor Ujian"
		description={exam ? `Mengedit: ${exam.title}` : 'Memuat Editor...'}
		backUrl="/admin/exams"
	>
		{#if exam?.status === 'PUBLISHED'}
			<span
				class="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-800 dark:bg-green-900 dark:text-green-300"
			>
				Telah Diterbitkan
			</span>
		{:else}
			<Button variant="default" onclick={publishExam} disabled={isPublishing || isLoading}>
				{#if isPublishing}<Loader2 class="mr-2 h-4 w-4 animate-spin" />{/if}
				Terbitkan Ujian
			</Button>
		{/if}
	</PageHeader>

	{#if isLoading}
		<div class="flex items-center justify-center p-24">
			<Loader2 class="h-8 w-8 animate-spin text-primary" />
		</div>
	{:else}
		<div class="flex gap-2 rounded-t-xl border-b bg-muted/10 px-2 pt-2">
			<button
				class="rounded-t-lg px-6 py-3 text-sm font-bold transition-all {activeTab === 'informasi'
					? 'border-x border-t-2 border-primary bg-background text-primary shadow-sm'
					: 'border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground'}"
				onclick={() => (activeTab = 'informasi')}
			>
				1. Informasi Ujian
			</button>
			<button
				class="rounded-t-lg px-6 py-3 text-sm font-bold transition-all {activeTab === 'target'
					? 'border-x border-t-2 border-primary bg-background text-primary shadow-sm'
					: 'border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground'}"
				onclick={() => (activeTab = 'target')}
			>
				2. Target Peserta
			</button>
			<button
				class="rounded-t-lg px-6 py-3 text-sm font-bold transition-all {activeTab === 'soal'
					? 'border-x border-t-2 border-primary bg-background text-primary shadow-sm'
					: 'border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground'}"
				onclick={() => (activeTab = 'soal')}
			>
				3. Bank Soal
			</button>
		</div>

		<div class="mt-4">
			{#if activeTab === 'informasi'}
				<TabInformasi
					bind:formTitle
					bind:formSubjectId
					bind:formDuration
					bind:formToken
					bind:formScheduledStart
					bind:formScheduledEnd
					{subjects}
					{isSaving}
					onsave={saveInformation}
				/>
			{/if}

			{#if activeTab === 'target'}
				<TabTarget
					bind:targetRules
					{classes}
					{majorsList}
					{isSaving}
					onsave={saveTargetRules}
					onadd={addTargetRule}
					onremove={removeTargetRule}
				/>
			{/if}

			{#if activeTab === 'soal'}
				<TabSoal
					bind:questions
					bind:activeQuestionIndex
					{isSaving}
					onsave={saveQuestions}
					onaddQuestion={addQuestion}
					onremoveQuestion={removeQuestion}
					onaddOption={addOption}
					onremoveOption={removeOption}
				/>
			{/if}
		</div>
	{/if}
</div>
