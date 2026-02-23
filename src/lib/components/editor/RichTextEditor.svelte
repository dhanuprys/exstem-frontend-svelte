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
					// First try to handle raw image files from clipboard (direct image paste)
					if (handleFileUpload(event.clipboardData?.files, view, event)) {
						return true;
					}
					// If no raw files, let TipTap handle the HTML paste normally.
					// After TipTap processes the paste, we scan for embedded base64 images
					// (from Word/Google Docs paste) and upload them asynchronously.
					setTimeout(() => uploadBase64Images(), 100);
					return false;
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

	/**
	 * Scans the editor DOM for any <img> with a base64 `data:` src,
	 * uploads each to the server, and replaces the src in the editor.
	 * This handles pasting from Word/Google Docs which embed images as data URIs.
	 */
	async function uploadBase64Images() {
		if (!editor) return;

		const editorElement = editor.view.dom as HTMLElement;
		const base64Imgs = editorElement.querySelectorAll('img[src^="data:"]');
		if (base64Imgs.length === 0) return;

		for (const img of base64Imgs) {
			const src = img.getAttribute('src');
			if (!src) continue;

			try {
				// Convert data URI to Blob
				const res = await fetch(src);
				const blob = await res.blob();
				const ext = blob.type.split('/')[1] || 'png';
				const file = new File([blob], `paste-${Date.now()}.${ext}`, { type: blob.type });

				const formData = new FormData();
				formData.append('file', file);

				const uploadRes = await api.post('/admin/media/upload', formData, {
					headers: { 'Content-Type': 'multipart/form-data' }
				});

				const url = uploadRes.data?.data?.url;
				if (url) {
					// Replace the base64 src with the uploaded server URL directly in the editor
					// by finding the img node in the ProseMirror document and updating its src
					const { state } = editor.view;
					const { tr } = state;
					let updated = false;

					state.doc.descendants((node, pos) => {
						if (node.type.name === 'image' && node.attrs.src === src) {
							tr.setNodeMarkup(pos, undefined, {
								...node.attrs,
								src: overrideAssetPath(url)
							});
							updated = true;
						}
					});

					if (updated) {
						editor.view.dispatch(tr);
					}
				}
			} catch (err) {
				console.error('Failed to upload base64 image:', err);
			}
		}
	}

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
			<div class="grow"></div>
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
