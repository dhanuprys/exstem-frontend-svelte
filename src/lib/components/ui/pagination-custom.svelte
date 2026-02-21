<script lang="ts">
	import * as Pagination from "$lib/components/ui/pagination/index.js";
	import type { Pagination as PaginationType } from "$lib/types/api";

    let { pagination, onPageChange } = $props<{
        pagination: PaginationType;
        onPageChange: (page: number) => void;
    }>();

    // Derived state for pagination calc
    let count = $derived(pagination.total_items);
    let perPage = $derived(pagination.per_page);
    let currentPage = $derived(pagination.page);
    // let totalPages = $derived(pagination.total_pages); // Not strictly needed by Pagination.Root but useful

</script>

<Pagination.Root 
    {count} 
    {perPage} 
    page={currentPage} 
    onPageChange={onPageChange}
    class="flex justify-end"
>
	{#snippet children({ pages, currentPage })}
		<Pagination.Content>
			<Pagination.Item>
				<Pagination.PrevButton />
			</Pagination.Item>
			{#each pages as page (page.key)}
				{#if page.type === "ellipsis"}
					<Pagination.Item>
						<Pagination.Ellipsis />
					</Pagination.Item>
				{:else}
					<Pagination.Item>
						<Pagination.Link {page} isActive={currentPage === page.value}>
							{page.value}
						</Pagination.Link>
					</Pagination.Item>
				{/if}
			{/each}
			<Pagination.Item>
				<Pagination.NextButton />
			</Pagination.Item>
		</Pagination.Content>
	{/snippet}
</Pagination.Root>
