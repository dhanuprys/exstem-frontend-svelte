export function imageLoader(node: HTMLElement) {
	// A map to track loaders for each image so we can clean them up or update them
	const loaders = new Map<HTMLImageElement, HTMLElement>();

	function initImages() {
		const images = node.querySelectorAll('img');

		images.forEach((img) => {
			// If already processed or already fully loaded naturally
			if (loaders.has(img)) return;

			// Check if the browser already cached and fully rendered it instantly
			if (img.complete && img.naturalHeight !== 0) {
				img.style.opacity = '1';
				img.style.transition = 'none'; // No fade needed if instant
				return;
			}

			// Pre-configure the image to be completely hidden from document flow initially
			img.style.display = 'none';
			img.style.opacity = '0';
			img.style.transition = 'opacity 0.4s ease-in-out';

			// Create a simple inline-flex spinner to prevent absolute overlaps
			const spinner = document.createElement('div');
			spinner.className = 'inline-flex items-center justify-center p-3 my-2 rounded-md bg-muted/30 border border-muted';
			spinner.innerHTML = `<svg class="w-5 h-5 text-primary animate-spin" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg><span class="ml-2 text-sm font-medium text-muted-foreground">Memuat gambar...</span>`;

			// Insert spinner before the image naturally
			img.parentNode?.insertBefore(spinner, img);
			loaders.set(img, spinner);

			// Event listeners
			const handleLoad = () => {
				spinner.remove();
				loaders.delete(img);
				
				// Re-insert into document flow
				img.style.display = '';
				// Trigger layout reflow gracefully
				void img.offsetHeight; 
				// Fade in
				img.style.opacity = '1';

				img.removeEventListener('load', handleLoad);
				img.removeEventListener('error', handleError);
			};

			const handleError = () => {
				// Prevent image from ever showing, morph the spinner into an error badge inline
				spinner.className = 'inline-flex items-center justify-center p-3 my-2 rounded-md bg-destructive/10 border border-destructive/20';
				spinner.innerHTML = `<span class="text-sm font-medium text-destructive">Gambar gagal dirender</span>`;
				
				img.removeEventListener('load', handleLoad);
				img.removeEventListener('error', handleError);
			};

			img.addEventListener('load', handleLoad);
			img.addEventListener('error', handleError);
		});
	}

	// Initialize immediately
	initImages();

	// Setup a MutationObserver to catch images injected AFTER initial bind
	// (e.g. if {@html ...} completely replaces the content DOM dynamically)
	const observer = new MutationObserver((mutations) => {
		let shouldInit = false;
		mutations.forEach((mutation) => {
			if (mutation.addedNodes.length > 0) {
				shouldInit = true;
			}
		});
		if (shouldInit) initImages();
	});

	observer.observe(node, { childList: true, subtree: true });

	return {
		destroy() {
			observer.disconnect();
			loaders.clear();
		}
	};
}
