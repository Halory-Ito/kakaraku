<script lang="ts">
import Icon from "@iconify/svelte";
import { onMount } from "svelte";

type AcgCard = {
	title: string;
	comment: string;
	status: string;
	icon: string;
	cover?: string;
	link?: string;
};

export let animeCards: AcgCard[] = [];
export let mangaCards: AcgCard[] = [];

const tabs = [
	{
		key: "anime",
		label: "动画",
		icon: "material-symbols:live-tv-outline-rounded",
	},
	{
		key: "manga",
		label: "漫画",
		icon: "material-symbols:menu-book-outline-rounded",
	},
	{
		key: "game",
		label: "游戏",
		icon: "material-symbols:sports-esports-outline-rounded",
	},
	{
		key: "real",
		label: "三次元",
		icon: "material-symbols:theater-comedy-outline-rounded",
	},
] as const;

type TabKey = (typeof tabs)[number]["key"];
type SortOrder = "asc" | "desc";
const skeletonItems = [0, 1, 2, 3, 4, 5, 6, 7];

const pageSize = 8;
let activeTab: TabKey = "anime";
let currentPage = 1;

let bangumiAnimeCards: AcgCard[] = [];
let bangumiMangaCards: AcgCard[] = [];
let bangumiGameCards: AcgCard[] = [];
let bangumiRealCards: AcgCard[] = [];
let loadingBangumi = false;
let bangumiError = "";

let keywordByTab: Record<TabKey, string> = {
	anime: "",
	manga: "",
	game: "",
	real: "",
};

let selectedStatusByTab: Record<TabKey, string> = {
	anime: "all",
	manga: "all",
	game: "all",
	real: "all",
};

let sortOrderByTab: Record<TabKey, SortOrder> = {
	anime: "asc",
	manga: "asc",
	game: "asc",
	real: "asc",
};

$: resolvedAnimeCards =
	bangumiAnimeCards.length > 0 ? bangumiAnimeCards : animeCards;
$: resolvedMangaCards =
	bangumiMangaCards.length > 0 ? bangumiMangaCards : mangaCards;
$: resolvedGameCards = bangumiGameCards;
$: resolvedRealCards = bangumiRealCards;
$: activeSource =
	activeTab === "anime"
		? resolvedAnimeCards
		: activeTab === "manga"
			? resolvedMangaCards
			: activeTab === "game"
				? resolvedGameCards
				: resolvedRealCards;
$: activeKeyword = keywordByTab[activeTab].trim().toLowerCase();
$: activeKeywordTokens = activeKeyword.split(/\s+/).filter(Boolean);
$: activeSelectedStatus = selectedStatusByTab[activeTab];
$: activeSortOrder = sortOrderByTab[activeTab];
$: statusOptions = Array.from(
	new Set(
		activeSource
			.map((card) => getCardStatusValue(card))
			.filter((value) => value.length > 0),
	),
);
$: filteredCards = activeSource.filter((card) => {
	const searchText = getCardSearchText(card);
	const keywordMatch =
		activeKeywordTokens.length === 0 ||
		activeKeywordTokens.every((token) => searchText.includes(token));

	const statusMatch =
		activeSelectedStatus === "all" ||
		getCardStatusValue(card) === activeSelectedStatus;

	return keywordMatch && statusMatch;
});
$: sortedCards = [...filteredCards].sort((a, b) => {
	const direction = activeSortOrder === "asc" ? 1 : -1;
	return direction * a.title.localeCompare(b.title, "zh-Hans-CN");
});
$: totalPages = Math.max(1, Math.ceil(sortedCards.length / pageSize));
$: currentPage = Math.min(currentPage, totalPages);
$: start = (currentPage - 1) * pageSize;
$: pagedCards = sortedCards.slice(start, start + pageSize);

function switchTab(tab: TabKey) {
	if (activeTab === tab) return;
	activeTab = tab;
	currentPage = 1;
}

function goToPage(page: number) {
	if (page < 1 || page > totalPages) return;
	currentPage = page;
}

function updateKeyword(value: string) {
	keywordByTab[activeTab] = value;
	keywordByTab = { ...keywordByTab };
	currentPage = 1;
}

function updateSelectedStatus(value: string) {
	selectedStatusByTab[activeTab] = value;
	selectedStatusByTab = { ...selectedStatusByTab };
	currentPage = 1;
}

function updateSortOrder(value: SortOrder) {
	sortOrderByTab[activeTab] = value;
	sortOrderByTab = { ...sortOrderByTab };
	currentPage = 1;
}

function getSortLabel(order: SortOrder): string {
	return order === "asc" ? "标题升序" : "标题降序";
}

function getCardStatusValue(card: AcgCard): string {
	const statusTags = card.status
		.split(" · ")
		.map((item) => item.trim())
		.filter(Boolean);

	const preferredStates = [
		"在看",
		"想看",
		"看过",
		"搁置",
		"抛弃",
		"收藏",
		"在读",
		"想读",
		"读过",
		"在玩",
		"想玩",
		"玩过",
		"通关",
		"未游玩",
	];

	const matched = statusTags.find((tag) =>
		preferredStates.some((state) => tag.includes(state)),
	);

	if (matched) {
		return matched;
	}

	if (statusTags.length > 0) {
		return statusTags[0];
	}

	return "未分类";
}

function getCardSearchText(card: AcgCard): string {
	const statusTags = card.status
		.split(" · ")
		.map((item) => item.trim())
		.filter(Boolean)
		.join(" ");

	return [
		card.title,
		card.comment,
		card.status,
		statusTags,
		getCardStatusValue(card),
		card.link || "",
	]
		.join(" ")
		.toLowerCase();
}

function getTagClass(tag: string): string {
	if (tag.includes("评分")) {
		return "bg-sky-500/15 text-sky-600 dark:text-sky-300";
	}

	if (tag.includes("小时") || tag.includes("分钟") || tag.includes("游玩")) {
		return "bg-violet-500/15 text-violet-600 dark:text-violet-300";
	}

	if (
		tag.includes("/") ||
		tag.includes("话") ||
		tag.includes("卷") ||
		tag.includes("章")
	) {
		return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300";
	}

	if (
		tag.includes("在看") ||
		tag.includes("想看") ||
		tag.includes("看过") ||
		tag.includes("在读") ||
		tag.includes("想读") ||
		tag.includes("读过") ||
		tag.includes("在玩") ||
		tag.includes("想玩") ||
		tag.includes("玩过") ||
		tag.includes("搁置") ||
		tag.includes("抛弃") ||
		tag.includes("收藏")
	) {
		return "bg-amber-500/15 text-amber-600 dark:text-amber-300";
	}

	return "bg-[var(--primary)]/10 text-[var(--primary)]";
}
async function loadBangumiSubjects() {
	loadingBangumi = true;
	bangumiError = "";
	try {
		const response = await fetch("/api/bangumi-subjects.json", {
			cache: "no-store",
		});
		if (!response.ok) {
			throw new Error(`Bangumi API failed: ${response.status}`);
		}
		const data = (await response.json()) as {
			anime: AcgCard[];
			manga: AcgCard[];
			game: AcgCard[];
			real: AcgCard[];
		};
		bangumiAnimeCards = data.anime || [];
		bangumiMangaCards = data.manga || [];
		bangumiGameCards = data.game || [];
		bangumiRealCards = data.real || [];
	} catch (error) {
		console.error(error);
		bangumiError = "Bangumi 数据加载失败。";
	} finally {
		loadingBangumi = false;
	}
}

onMount(() => {
	loadBangumiSubjects();
});
</script>

<div class="mt-8">
	<div class="flex flex-wrap gap-2 mb-5">
		{#each tabs as tab}
			<button
				type="button"
				on:click={() => switchTab(tab.key)}
				class="btn-plain rounded-lg h-10 px-4 font-bold active:scale-95 transition flex items-center gap-2"
				class:bg-[var(--btn-plain-bg-hover)]={activeTab === tab.key}
				aria-pressed={activeTab === tab.key}
			>
				<Icon icon={tab.icon} class="text-[1rem]" />
				{tab.label}
			</button>
		{/each}
	</div>

	<div class="card-base mb-5 border border-[var(--line-divider)] p-4 md:p-5 space-y-4">
		<label class="flex flex-col gap-1.5 text-sm">
			<span class="text-75 font-semibold">关键字搜索</span>
			<input
				type="text"
				value={keywordByTab[activeTab]}
				on:input={(event) =>
					updateKeyword((event.currentTarget as HTMLInputElement).value)}
				placeholder="搜索标题、状态、标签、备注"
				class="h-10 rounded-lg px-3 border border-[var(--line-divider)] bg-[var(--btn-plain-bg-hover)] text-75 placeholder:text-black/35 dark:placeholder:text-white/35 outline-none focus:ring-2 focus:ring-[var(--primary)]/35"
			/>
		</label>

		<div class="space-y-1.5">
			<div class="text-75 text-sm font-semibold">状态筛选</div>
			<div class="flex flex-wrap gap-2">
				<button
					type="button"
					on:click={() => updateSelectedStatus("all")}
					class="btn-plain rounded-lg h-9 px-3 text-sm font-semibold active:scale-95"
					class:bg-[var(--btn-plain-bg-hover)]={selectedStatusByTab[activeTab] === "all"}
					aria-pressed={selectedStatusByTab[activeTab] === "all"}
				>
					全部状态
				</button>
				{#each statusOptions as status}
					<button
						type="button"
						on:click={() => updateSelectedStatus(status)}
						class="btn-plain rounded-lg h-9 px-3 text-sm font-semibold active:scale-95"
						class:bg-[var(--btn-plain-bg-hover)]={selectedStatusByTab[activeTab] === status}
						aria-pressed={selectedStatusByTab[activeTab] === status}
					>
						{status}
					</button>
				{/each}
			</div>
		</div>

		<div class="space-y-1.5">
			<div class="text-75 text-sm font-semibold">排序方式</div>
			<div class="flex flex-wrap gap-2">
				{#each ["asc", "desc"] as order}
					<button
						type="button"
						on:click={() => updateSortOrder(order as SortOrder)}
						class="btn-plain rounded-lg h-9 px-3 text-sm font-semibold active:scale-95"
						class:bg-[var(--btn-plain-bg-hover)]={sortOrderByTab[activeTab] === order}
						aria-pressed={sortOrderByTab[activeTab] === order}
					>
						{getSortLabel(order as SortOrder)}
					</button>
				{/each}
			</div>
		</div>
	</div>

	{#if loadingBangumi}
		<div class="grid grid-cols-2 lg:grid-cols-4 gap-3" aria-label="加载骨架">
			{#each skeletonItems as item}
				<article class="rounded-[var(--radius-large)] border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 p-3 md:p-3.5 animate-pulse">
					<div class="mb-2 rounded-lg overflow-hidden border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 aspect-[3/4]"></div>
					<div class="space-y-2">
						<div class="h-4 w-3/4 rounded bg-black/10 dark:bg-white/10"></div>
						<div class="flex flex-wrap gap-2">
							<div class="h-5 w-16 rounded-full bg-black/10 dark:bg-white/10"></div>
							<div class="h-5 w-14 rounded-full bg-black/10 dark:bg-white/10"></div>
							<div class="h-5 w-12 rounded-full bg-black/10 dark:bg-white/10"></div>
						</div>
					</div>
				</article>
			{/each}
		</div>
	{:else if bangumiError && activeSource.length === 0}
		<div class="text-sm text-red-500">{bangumiError}</div>
	{:else if pagedCards.length === 0}
		<div class="text-sm text-black/60 dark:text-white/60">暂无符合条件的数据</div>
	{:else}
		<div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
			{#each pagedCards as card}
				<article class="rounded-[var(--radius-large)] border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 p-3 md:p-3.5 transition hover:shadow-md hover:-translate-y-0.5">
					{#if card.cover}
						<div class="mb-2 rounded-lg overflow-hidden border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5">
							<img
								src={card.cover}
								alt={`${card.title} cover`}
								class="w-full aspect-[3/4] object-cover bg-black/10 dark:bg-white/10"
								loading="lazy"
							/>
						</div>
					{/if}
					<div class="flex items-center justify-between mb-2 gap-2">
						<div class="flex flex-col min-w-0 w-full">
							<div class="flex items-center text-[var(--primary)] min-w-0">
							<!-- <Icon icon={card.icon} class="text-[1.2rem] mr-2 flex-shrink-0" /> -->
							<h3 class="font-bold text-sm md:text-base text-black/80 dark:text-white/85 truncate">{card.title}</h3>
							</div>
							<div class="mt-1.5 flex flex-wrap gap-1.5">
								{#each card.status.split(" · ") as tag}
									<span class={`text-[11px] rounded-full px-1.5 py-0.5 font-semibold whitespace-nowrap ${getTagClass(tag)}`}>{tag}</span>
								{/each}
							</div>
						</div>
					</div>
				</article>
			{/each}
		</div>
	{/if}

	{#if totalPages > 1}
		<div class="mt-5 flex items-center justify-center gap-2 flex-wrap">
			<button type="button" class="btn-plain rounded-lg h-9 px-3 text-sm font-semibold" on:click={() => goToPage(currentPage - 1)} disabled={currentPage <= 1}>
				上一页
			</button>

			{#each Array(totalPages) as _, index}
				{@const page = index + 1}
				<button
					type="button"
					on:click={() => goToPage(page)}
					class="btn-plain rounded-lg h-9 min-w-9 px-3 text-sm font-semibold"
					class:bg-[var(--btn-plain-bg-hover)]={page === currentPage}
					aria-current={page === currentPage ? "page" : undefined}
				>
					{page}
				</button>
			{/each}

			<button type="button" class="btn-plain rounded-lg h-9 px-3 text-sm font-semibold" on:click={() => goToPage(currentPage + 1)} disabled={currentPage >= totalPages}>
				下一页
			</button>
		</div>
	{/if}
</div>
