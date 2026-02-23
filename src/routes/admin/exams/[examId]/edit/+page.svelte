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
	import { questionService, type QBank } from '$lib/services/admin/question.service';
	import PageHeader from '$lib/components/ui/page-header.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { toast } from 'svelte-sonner';
	import { Loader2 } from '@lucide/svelte';

	import SectionInformasi from '$lib/components/admin/exam-editor/SectionInformasi.svelte';
	import SectionTarget from '$lib/components/admin/exam-editor/SectionTarget.svelte';

	let examId = page.params.examId as string;
	let exam: Exam | null = $state(null);
	let targetRules: ExamTargetRule[] = $state([]);
	let classes: Class[] = $state([]);
	let majorsList: Major[] = $state([]);
	let qbanksList: QBank[] = $state([]);

	let isLoading = $state(true);
	let isSaving = $state(false);
	let isPublishing = $state(false);
	let isRefreshing = $state(false);

	// Layout is now vertical, no activeTab needed
	// --- Tab 1: Informasi State ---
	let formTitle = $state('');
	let formDuration = $state(90);
	let formScheduledStart = $state('');
	let formScheduledEnd = $state('');
	let formToken = $state('');

	let formQBankID = $state<string | null>(null);
	let formQuestionCount = $state(10);
	let formRandomizeQuestions = $state(true);
	let formCheatRules = $state<Record<string, boolean>>({});

	async function loadInitialData() {
		isLoading = true;
		try {
			// Load Exam
			exam = (await examService.getExam(examId)).data;
			if (!exam) return;

			formTitle = exam.title;
			formDuration = exam.duration_minutes;
			formToken = exam.entry_token || '';

			formQBankID = exam.qbank_id || null;
			formQuestionCount = exam.question_count ?? 10;
			formRandomizeQuestions = exam.randomize_questions ?? true;

			if (exam.cheat_rules) {
				try {
					let parsed =
						typeof exam.cheat_rules === 'string' ? JSON.parse(exam.cheat_rules) : exam.cheat_rules;
					formCheatRules = parsed || {};
				} catch (e) {
					formCheatRules = {};
				}
			}

			if (exam.scheduled_start) {
				formScheduledStart = new Date(exam.scheduled_start).toISOString().slice(0, 16);
			}
			if (exam.scheduled_end) {
				formScheduledEnd = new Date(exam.scheduled_end).toISOString().slice(0, 16);
			}

			targetRules = (await examService.getTargetRules(examId)) || [];

			const classRes = await classService.getClasses();
			classes = classRes.data.data.classes || [];

			const resMajors = await majorService.getMajors();
			majorsList = resMajors.data.data.majors || [];

			const resQBanks = await questionService.getQBanks(1, 1000);
			qbanksList = Array.isArray(resQBanks)
				? resQBanks
				: (resQBanks as any).data || (resQBanks as any).qbanks || [];
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
			// Clean up cheat rules (omit false/empty)
			const cleanCheatRules: Record<string, boolean> = {};
			for (const [key, val] of Object.entries(formCheatRules)) {
				if (val) cleanCheatRules[key] = true;
			}

			await examService.updateExam(examId, {
				title: formTitle,
				duration_minutes: formDuration,
				entry_token: formToken || undefined,
				scheduled_start: formScheduledStart
					? new Date(formScheduledStart).toISOString()
					: undefined,
				scheduled_end: formScheduledEnd ? new Date(formScheduledEnd).toISOString() : undefined,
				qbank_id: formQBankID || undefined,
				question_count: formQuestionCount,
				randomize_questions: formRandomizeQuestions,
				cheat_rules: cleanCheatRules
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

	async function removeTargetRule(index: number) {
		const rule = targetRules[index];
		if (rule.id) {
			// Rule is already saved to DB, need to call API
			try {
				await examService.deleteTargetRule(examId, rule.id);
				toast.success('Aturan target berhasil dihapus');
			} catch (err: any) {
				const message = err.response?.data?.error?.message || 'Gagal menghapus aturan target';
				toast.error(message);
				return; // Stop if delete fails
			}
		}
		// Remove from UI array
		targetRules.splice(index, 1);
	}

	async function handleRuleUpdate(rule: ExamTargetRule) {
		if (!rule.id) return;
		try {
			await examService.updateTargetRule(examId, rule.id, {
				class_id: rule.class_id || undefined,
				grade_level: rule.grade_level || undefined,
				major_code: rule.major_code || undefined,
				religion: rule.religion || undefined
			});
			toast.success('Aturan target berhasil diperbarui');
		} catch (err: any) {
			const message = err.response?.data?.error?.message || 'Gagal memperbarui aturan target';
			toast.error(message);
		}
	}

	async function saveTargetRules() {
		isSaving = true;
		try {
			const newRules = targetRules.filter((r) => !r.id);
			if (newRules.length === 0) {
				return; // Nothing to save
			}

			for (const rule of newRules) {
				await examService.addTargetRule(examId, {
					class_id: rule.class_id || undefined,
					grade_level: rule.grade_level || undefined,
					major_code: rule.major_code || undefined,
					religion: rule.religion || undefined
				});
			}
			toast.success('Aturan target baru berhasil disimpan');

			// Refresh to get the actual IDs from the database so realtime edits work on them
			targetRules = (await examService.getTargetRules(examId)) || [];
		} catch (err: any) {
			const message = err.response?.data?.error?.message || 'Gagal menyimpan target peserta';
			toast.error(message);
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

	async function refreshCache() {
		isRefreshing = true;
		try {
			await examService.refreshCache(examId);
			toast.success('Cache berhasil diperbarui!');
		} catch (err) {
			toast.error('Gagal memperbarui cache');
		} finally {
			isRefreshing = false;
		}
	}

	onMount(() => {
		loadInitialData();
	});
</script>

<svelte:head>
	<title>Edit Ujian - Exstem</title>
</svelte:head>

<div class="flex h-full flex-1 flex-col space-y-4 p-8">
	<PageHeader
		title="Editor Ujian"
		description={exam ? `Mengedit: ${exam.title}` : 'Memuat Editor...'}
		backUrl="/admin/exams"
	>
		{#if exam?.status === 'PUBLISHED'}
			<div class="flex items-center space-x-2">
				<span
					class="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-800 dark:bg-green-900 dark:text-green-300"
				>
					Telah Diterbitkan
				</span>
				<Button
					variant="outline"
					size="sm"
					onclick={refreshCache}
					disabled={isRefreshing || isLoading}
				>
					{#if isRefreshing}<Loader2 class="mr-2 h-4 w-4 animate-spin" />{/if}
					Perbarui Cache
				</Button>
			</div>
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
		<div class="mt-4 flex w-full flex-col items-center space-y-8 pb-12">
			<div class="w-full">
				<SectionInformasi
					bind:formTitle
					bind:formDuration
					bind:formToken
					bind:formScheduledStart
					bind:formScheduledEnd
					bind:formQBankID
					bind:formQuestionCount
					bind:formRandomizeQuestions
					bind:formCheatRules
					{isSaving}
					onsave={saveInformation}
				/>
			</div>

			<div class="w-full">
				<SectionTarget
					bind:targetRules
					{classes}
					{majorsList}
					{isSaving}
					onsave={saveTargetRules}
					onadd={addTargetRule}
					onremove={removeTargetRule}
					onupdate={handleRuleUpdate}
				/>
			</div>
		</div>
	{/if}
</div>
