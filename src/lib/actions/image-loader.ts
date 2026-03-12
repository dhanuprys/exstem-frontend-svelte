export function imageLoader(node: HTMLElement) {
	// A map to track loaders for each image so we can clean them up or update them
	const loaders = new Map<HTMLImageElement, HTMLSpanElement>();

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

			// Pre-configure the image to be invisible initially
			img.style.opacity = '0';
			img.style.transition = 'opacity 0.4s ease-in-out';

			// Create the skeleton wrapper
			// Wrap the image in a relative container so the absolute skeleton aligns perfectly
			const wrapper = document.createElement('span');
			wrapper.className = 'relative inline-block w-full max-w-full align-middle';
			// Insert wrapper before the image, then move image inside it
			img.parentNode?.insertBefore(wrapper, img);
			wrapper.appendChild(img);

			// Create the visual skeleton element
			const skeleton = document.createElement('div');
			skeleton.className = 'absolute inset-0 z-10 animate-pulse rounded-md bg-muted flex items-center justify-center';
			// Optional: adding a generic icon or spinner inside the skeleton
			skeleton.innerHTML = `<svg class="w-6 h-6 text-muted-foreground/40 animate-spin" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>`;

			// Set absolute skeleton dimensions to cover the image space completely.
			// Because <img> height is 0 when loading without explicit height/width attrs,
			// we enforce a minimum skeleton height
			skeleton.style.minHeight = '150px';

			wrapper.appendChild(skeleton);
			loaders.set(img, wrapper); // Track the wrapper for potential cleanup

			// Event listeners
			const handleLoad = () => {
				img.style.opacity = '1'; // Fade in
				skeleton.style.opacity = '0'; // Fade out skeleton
				skeleton.style.transition = 'opacity 0.3s ease';
				
				setTimeout(() => {
					skeleton.remove(); // Remove skeleton from DOM after fade
					loaders.delete(img);
				}, 300);

				img.removeEventListener('load', handleLoad);
				img.removeEventListener('error', handleError);
			};

			const handleError = () => {
				// If image fails to load, leave an error state
				skeleton.className = 'absolute inset-0 z-10 rounded-md bg-destructive/10 flex items-center justify-center border border-destructive/20';
				skeleton.innerHTML = `<span class="text-xs text-destructive">Gambar gagal dirender</span>`;
				skeleton.style.minHeight = '50px';
				
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
