<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Editor } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';
	import Image from '@tiptap/extension-image';
	import Placeholder from '@tiptap/extension-placeholder';
	import { api } from '$lib/utils/api'; // using global axios client instance if possible
	import {
		overrideAssetUrls,
		removeBaseAssetUrls,
		normalizeHtmlForComparison,
		cleanEditorAttributes,
		overrideAssetPath
	} from '$lib/utils/assets';
	import {
		Bold,
		Italic,
		Link,
		Image as ImageIcon,
		Code,
		Heading1,
		Heading2,
		List,
		ListOrdered,
		Quote,
		Undo,
		Redo
	} from '@lucide/svelte';

	let {
		value = $bindable(''),
		placeholder = 'Ketik soal di sini...',
		onChange = () => {}
	} = $props<{ value?: string; placeholder?: string; onChange?: (html: string) => void }>();

	let element: HTMLElement;
	let editor: Editor | undefined = $state();

	// Support external updates
	$effect(() => {
		if (editor && value !== undefined) {
			const currentContent = normalizeHtmlForComparison(editor.getHTML());
			const incomingContent = normalizeHtmlForComparison(value);

			if (currentContent !== incomingContent) {
				const hydrated = overrideAssetUrls(value);
				editor.commands.setContent(hydrated, { emitUpdate: false });
			}
		}
	});

	onMount(() => {
		editor = new Editor({
			element: element,
			extensions: [
				StarterKit,
				Image.configure({
					inline: true,
					allowBase64: true
				}),
				Placeholder.configure({
					placeholder: placeholder,
					emptyEditorClass: 'is-editor-empty'
				})
			],
			content: overrideAssetUrls(value),
			onTransaction: () => {
				editor = editor; // trigger reactivity
			},
			onUpdate: ({ editor }) => {
				const html = editor.getHTML();
				const cleanDehydratedHtml = cleanEditorAttributes(removeBaseAssetUrls(html));
				value = cleanDehydratedHtml;
				onChange(cleanDehydratedHtml);
			},
			editorProps: {
				attributes: {
					class:
						'prose prose-sm sm:prose-base dark:prose-invert focus:outline-none max-w-none min-h-[150px] p-4'
				},
				handlePaste: (view, event, slice) => {
					return handleFileUpload(event.clipboardData?.files, view, event);
				},
				handleDrop: (view, event, slice, moved) => {
					if (!moved) {
						return handleFileUpload(event.dataTransfer?.files, view, event);
					}
					return false;
				}
			}
		});
	});

	onDestroy(() => {
		if (editor) {
			editor.destroy();
		}
	});

	function handleFileUpload(files: FileList | null | undefined, view: any, event: Event): boolean {
		if (!files || files.length === 0) return false;

		const imageFiles = Array.from(files).filter((file) => file.type.startsWith('image/'));
		if (imageFiles.length === 0) return false;

		event.preventDefault();

		imageFiles.forEach(async (file) => {
			try {
				const formData = new FormData();
				formData.append('file', file);

				// Upload file to the media endpoint
				const res = await api.post('/admin/media/upload', formData, {
					headers: { 'Content-Type': 'multipart/form-data' }
				});

				const url = res.data?.data?.url;
				if (url && editor) {
					editor
						.chain()
						.focus()
						.setImage({ src: overrideAssetPath(url) })
						.run();
				}
			} catch (err) {
				console.error('Image upload failed:', err);
				// fallback: might want to show a toast message here
			}
		});

		return true;
	}

	function toggleBold() {
		editor?.chain().focus().toggleBold().run();
	}
	function toggleItalic() {
		editor?.chain().focus().toggleItalic().run();
	}
	function toggleHeading1() {
		editor?.chain().focus().toggleHeading({ level: 1 }).run();
	}
	function toggleHeading2() {
		editor?.chain().focus().toggleHeading({ level: 2 }).run();
	}
	function toggleBulletList() {
		editor?.chain().focus().toggleBulletList().run();
	}
	function toggleOrderedList() {
		editor?.chain().focus().toggleOrderedList().run();
	}
	function toggleBlockquote() {
		editor?.chain().focus().toggleBlockquote().run();
	}
	function toggleCodeBlock() {
		editor?.chain().focus().toggleCodeBlock().run();
	}
	function undo() {
		editor?.chain().focus().undo().run();
	}
	function redo() {
		editor?.chain().focus().redo().run();
	}
</script>

<div
	class="flex w-full flex-col overflow-hidden rounded-md border bg-background focus-within:border-primary focus-within:ring-2 focus-within:ring-ring"
>
	{#if editor}
		<div class="flex flex-wrap items-center gap-1 border-b bg-muted/30 p-1">
			<button
				class="btn-ghost rounded p-2 hover:bg-muted {editor.isActive('bold')
					? 'bg-muted text-foreground'
					: 'text-muted-foreground'}"
				onclick={toggleBold}
				title="Bold"
				type="button"
			>
				<Bold size={16} />
			</button>
			<button
				class="btn-ghost rounded p-2 hover:bg-muted {editor.isActive('italic')
					? 'bg-muted text-foreground'
					: 'text-muted-foreground'}"
				onclick={toggleItalic}
				title="Italic"
				type="button"
			>
				<Italic size={16} />
			</button>
			<div class="mx-1 h-6 w-px bg-border"></div>
			<button
				class="btn-ghost rounded p-2 hover:bg-muted {editor.isActive('heading', { level: 1 })
					? 'bg-muted text-foreground'
					: 'text-muted-foreground'}"
				onclick={toggleHeading1}
				title="Heading 1"
				type="button"
			>
				<Heading1 size={16} />
			</button>
			<button
				class="btn-ghost rounded p-2 hover:bg-muted {editor.isActive('heading', { level: 2 })
					? 'bg-muted text-foreground'
					: 'text-muted-foreground'}"
				onclick={toggleHeading2}
				title="Heading 2"
				type="button"
			>
				<Heading2 size={16} />
			</button>
			<div class="mx-1 h-6 w-px bg-border"></div>
			<button
				class="btn-ghost rounded p-2 hover:bg-muted {editor.isActive('bulletList')
					? 'bg-muted text-foreground'
					: 'text-muted-foreground'}"
				onclick={toggleBulletList}
				title="Bullet List"
				type="button"
			>
				<List size={16} />
			</button>
			<button
				class="btn-ghost rounded p-2 hover:bg-muted {editor.isActive('orderedList')
					? 'bg-muted text-foreground'
					: 'text-muted-foreground'}"
				onclick={toggleOrderedList}
				title="Ordered List"
				type="button"
			>
				<ListOrdered size={16} />
			</button>
			<div class="mx-1 h-6 w-px bg-border"></div>
			<button
				class="btn-ghost rounded p-2 hover:bg-muted {editor.isActive('blockquote')
					? 'bg-muted text-foreground'
					: 'text-muted-foreground'}"
				onclick={toggleBlockquote}
				title="Blockquote"
				type="button"
			>
				<Quote size={16} />
			</button>
			<button
				class="btn-ghost rounded p-2 hover:bg-muted {editor.isActive('codeBlock')
					? 'bg-muted text-foreground'
					: 'text-muted-foreground'}"
				onclick={toggleCodeBlock}
				title="Code Block"
				type="button"
			>
				<Code size={16} />
			</button>
			<div class="flex-grow"></div>
			<button
				class="btn-ghost rounded p-2 text-muted-foreground hover:bg-muted"
				onclick={undo}
				disabled={!editor.can().undo()}
				title="Undo"
				type="button"
			>
				<Undo size={16} />
			</button>
			<button
				class="btn-ghost rounded p-2 text-muted-foreground hover:bg-muted"
				onclick={redo}
				disabled={!editor.can().redo()}
				title="Redo"
				type="button"
			>
				<Redo size={16} />
			</button>
		</div>
	{/if}

	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="tiptap-editor-wrap cursor-text bg-background"
		onclick={() => editor?.commands.focus()}
	>
		<div bind:this={element} class="h-full w-full outline-none"></div>
	</div>
</div>

<style>
	:global(.tiptap p.is-editor-empty:first-child::before) {
		color: hsl(var(--muted-foreground));
		content: attr(data-placeholder);
		float: left;
		height: 0;
		pointer-events: none;
	}
	:global(.tiptap p) {
		margin-top: 0.5em;
		margin-bottom: 0.5em;
	}
	:global(.tiptap-editor-wrap .tiptap:focus) {
		outline: none;
	}
</style>
