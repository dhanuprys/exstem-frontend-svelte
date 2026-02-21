import { API_BASE_URL } from './api';

const basePath = API_BASE_URL.replace(/\/$/, '');

/**
 * Hydrates an HTML string by prepending the backend API base URL to relative asset paths.
 * E.g., <img src="/uploads/..." /> -> <img src="http://localhost:8050/uploads/..." />
 *
 * Perfect for Student View renders or Editor initializations.
 */
export function overrideAssetUrls(html: string | null | undefined): string {
	if (!html) return '';

	// Matches any src="/uploads..." or href="/uploads..." replacing them with Absolute URLs
	let processed = html.replace(/(src|href)=(['"])\/(uploads\/.*?)\2/gi, `$1=$2${basePath}/$3$2`);

	return processed;
}

/**
 * Hydrates a single raw asset path by prepending the backend API base URL.
 * E.g., "/uploads/..." -> "http://localhost:8050/uploads/..."
 */
export function overrideAssetPath(path: string | null | undefined): string {
	if (!path) return '';
	if (path.startsWith('/uploads/')) {
		return `${basePath}${path}`;
	}
	return path;
}

/**
 * Dehydrates an HTML string by stripping the backend API base URL from embedded asset paths,
 * returning them to pure relative paths for clean storage in the database.
 * E.g., <img src="http://localhost:8050/uploads/..." /> -> <img src="/uploads/..." />
 */
export function removeBaseAssetUrls(html: string | null | undefined): string {
	if (!html) return '';

	const escapedBaseUrl = basePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	const regex = new RegExp(`(src|href)=(['"])${escapedBaseUrl}/(uploads/.*?)\\2`, 'gi');

	let processed = html.replace(regex, `$1=$2/$3$2`);

	return processed;
}

/**
 * Strips Tiptap proprietary tagging (like contenteditable, draggable) preventing dirty
 * metadata from reaching the database or student DOM.
 */
export function cleanEditorAttributes(html: string | null | undefined): string {
	if (!html) return '';
	let processed = html;
	processed = processed.replace(/\s+contenteditable=(['"])[^'"]*\1/gi, '');
	processed = processed.replace(/\s+draggable=(['"])[^'"]*\1/gi, '');
	return processed;
}

/**
 * Normalizes HTML for editor synchronization comparisons ensuring external value edits
 * securely sync inwards without breaking typing focus boundaries.
 */
export function normalizeHtmlForComparison(html: string | null | undefined): string {
	return cleanEditorAttributes(removeBaseAssetUrls(html));
}
