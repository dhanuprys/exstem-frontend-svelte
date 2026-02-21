export interface ApiResponse<T> {
	data: T;
	error?: ErrorBody;
	pagination?: Pagination;
	metadata: Metadata;
}

export interface ErrorBody {
	code: string;
	message: string;
	fields?: Record<string, string>;
}

export interface Pagination {
	page: number;
	per_page: number;
	total_items: number;
	total_pages: number;
}

export interface Metadata {
	request_id: string;
	timestamp: string;
}
