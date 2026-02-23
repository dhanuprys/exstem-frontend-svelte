<script lang="ts">
	import Separator from '$lib/components/ui/separator/separator.svelte';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { Clock, Loader2, Send, Wifi, WifiOff, LayoutGrid } from '@lucide/svelte';
	import Button from '$lib/components/ui/button/button.svelte';

	interface Props {
		title: string;
		timerDisplay: string;
		isTimerCritical: boolean;
		wsConnected: boolean;
		isSubmitting: boolean;
		onSubmit: () => void;
		onOpenGrid?: () => void;
	}

	let {
		title,
		timerDisplay,
		isTimerCritical,
		wsConnected,
		isSubmitting,
		onSubmit,
		onOpenGrid
	}: Props = $props();
</script>

<div
	class="flex items-center justify-between border-b bg-background/95 px-4 py-3 backdrop-blur md:px-6"
>
	<div class="flex items-center gap-2 md:gap-3">
		{#if onOpenGrid}
			<Button
				variant="outline"
				size="icon"
				class="h-8 w-8 shrink-0 md:hidden"
				onclick={onOpenGrid}
				title="Daftar Soal"
			>
				<LayoutGrid class="h-4 w-4" />
			</Button>
		{/if}
		<h2 class="line-clamp-1 text-sm font-bold md:text-base">{title}</h2>
		<Separator orientation="vertical" class="h-4" />

		<Tooltip.Root>
			<Tooltip.Trigger>
				<div class="flex items-center gap-1 text-xs text-muted-foreground">
					{#if wsConnected}
						<Wifi class="h-3.5 w-3.5 text-green-500" />
						<span class="hidden sm:inline">Terhubung ke server</span>
					{:else}
						<WifiOff class="h-3.5 w-3.5 text-destructive" />
						<span class="hidden sm:inline">Terputus dari server</span>
					{/if}
				</div>
			</Tooltip.Trigger>
			<Tooltip.Content>
				{#if wsConnected}
					Jawaban anda siap untuk otomatis disimpan
				{:else}
					Koneksi ke server terputus, jawaban anda tidak akan disimpan otomatis
				{/if}
			</Tooltip.Content>
		</Tooltip.Root>
	</div>
	<div class="flex items-center gap-3">
		<div
			class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-sm font-bold
				{isTimerCritical ? 'animate-pulse bg-destructive/10 text-destructive' : 'bg-muted text-foreground'}"
		>
			<Clock class="h-4 w-4" />
			{timerDisplay}
		</div>
		<button
			onclick={onSubmit}
			disabled={isSubmitting}
			class="flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 disabled:opacity-50"
		>
			{#if isSubmitting}
				<Loader2 class="h-4 w-4 animate-spin" />
			{:else}
				<Send class="h-4 w-4" />
			{/if}
			<span class="hidden sm:inline">Selesai</span>
		</button>
	</div>
</div>
