<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { ArrowLeft } from '@lucide/svelte';
	import PageHeader from '$lib/components/ui/page-header.svelte';
	import QuestionEditor from '$lib/components/admin/exam-editor/question-editor.svelte';
	import { questionService, type QBank } from '$lib/services/admin/question.service';

	const bankId = page.params.bankId as string;

	let qbank = $state<QBank | null>(null);

	onMount(async () => {
		try {
			const res = await questionService.getQBank(bankId);
			qbank = res.data;
		} catch {
			toast.error('Bank soal tidak ditemukan');
			goto('/admin/qbanks');
		}
	});
</script>

<svelte:head>
	<title>Detail Bank Soal - Exstem</title>
</svelte:head>

<div class="flex h-full flex-1 flex-col p-8">
	<div class="mb-6">
		<button
			onclick={() => goto('/admin/qbanks')}
			class="mb-3 flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
		>
			<ArrowLeft class="h-4 w-4" /> Kembali ke Daftar Bank Soal
		</button>
		<PageHeader
			title={qbank?.name ?? '...'}
			description={qbank?.description ?? 'Memuat bank soal...'}
		/>
	</div>

	<QuestionEditor qbankId={bankId} />
</div>
