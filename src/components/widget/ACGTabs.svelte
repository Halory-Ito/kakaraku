<script lang="ts">
import { onMount } from "svelte";
import Icon from "@iconify/svelte";

type AcgCard = {
	title: string;
	comment: string;
	status: string;
	icon: string;
	cover?: string;
	link?: string;
};

type SteamGame = {
	appid: number;
	name: string;
	playtimeMinutes: number;
	url: string;
	coverUrl?: string;
	iconUrl: string;
};

export let animeCards: AcgCard[] = [];
export let mangaCards: AcgCard[] = [];
export let steamId = "";

const tabs = [
	{ key: "anime", label: "动画", icon: "material-symbols:live-tv-outline-rounded" },
	{ key: "manga", label: "漫画", icon: "material-symbols:menu-book-outline-rounded" },
	{ key: "game", label: "游戏", icon: "material-symbols:sports-esports-outline-rounded" },
] as const;

type TabKey = (typeof tabs)[number]["key"];

const pageSize = 6;
let activeTab: TabKey = "anime";
let currentPage = 1;

let gameCards: AcgCard[] = [];
let bangumiAnimeCards: AcgCard[] = [];
let bangumiMangaCards: AcgCard[] = [];
let loadingGames = false;
let gameError = "";
let loadingBangumi = false;
let bangumiError = "";

$: resolvedAnimeCards = bangumiAnimeCards.length > 0 ? bangumiAnimeCards : animeCards;
$: resolvedMangaCards = bangumiMangaCards.length > 0 ? bangumiMangaCards : mangaCards;
$: activeSource = activeTab === "anime" ? resolvedAnimeCards : activeTab === "manga" ? resolvedMangaCards : gameCards;
$: totalPages = Math.max(1, Math.ceil(activeSource.length / pageSize));
$: currentPage = Math.min(currentPage, totalPages);
$: start = (currentPage - 1) * pageSize;
$: pagedCards = activeSource.slice(start, start + pageSize);

function switchTab(tab: TabKey) {
	if (activeTab === tab) return;
	activeTab = tab;
	currentPage = 1;
}

function goToPage(page: number) {
	if (page < 1 || page > totalPages) return;
	currentPage = page;
}

function playtimeToStatus(minutes: number): string {
	if (!minutes || minutes <= 0) {
		return "未游玩";
	}

	const hours = minutes / 60;
	if (hours < 1) {
		return `游玩 ${minutes} 分钟`;
	}
	return `游玩 ${hours.toFixed(1)} 小时`;
}

function toGameCard(game: SteamGame): AcgCard {
	return {
		title: game.name,
		comment: "",
		status: playtimeToStatus(game.playtimeMinutes),
		icon: "fa6-brands:steam",
		cover: game.coverUrl || game.iconUrl,
	};
}

function getTagClass(tag: string): string {
	if (tag.includes("评分")) {
		return "bg-sky-500/15 text-sky-600 dark:text-sky-300";
	}

	if (tag.includes("小时") || tag.includes("分钟") || tag.includes("游玩")) {
		return "bg-violet-500/15 text-violet-600 dark:text-violet-300";
	}

	if (tag.includes("/") || tag.includes("话") || tag.includes("卷") || tag.includes("章")) {
		return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300";
	}

	if (tag.includes("在看") || tag.includes("想看") || tag.includes("看过") || tag.includes("搁置") || tag.includes("抛弃") || tag.includes("收藏")) {
		return "bg-amber-500/15 text-amber-600 dark:text-amber-300";
	}

	return "bg-[var(--primary)]/10 text-[var(--primary)]";
}

async function loadSteamGames() {
	if (!steamId) {
		gameError = "未配置 Steam ID";
		return;
	}

	loadingGames = true;
	gameError = "";
	try {
		const response = await fetch(`/api/steam-games.json?steamId=${encodeURIComponent(steamId)}`);
		if (!response.ok) {
			const errData = (await response.json().catch(() => null)) as { error?: string } | null;
			throw new Error(errData?.error || `Steam API failed: ${response.status}`);
		}
		const data = (await response.json()) as { games: SteamGame[]; error?: string };
		if (data.error) {
			throw new Error(data.error);
		}
		gameCards = (data.games || []).map(toGameCard);
	} catch (error) {
		console.error(error);
		if (error instanceof Error) {
			gameError = `Steam 数据加载失败：${error.message}`;
		} else {
			gameError = "Steam 数据加载失败，请确认个人资料公开可见。";
		}
	} finally {
		loadingGames = false;
	}
}

async function loadBangumiSubjects() {
	loadingBangumi = true;
	bangumiError = "";
	try {
		const response = await fetch("/api/bangumi-subjects.json");
		if (!response.ok) {
			throw new Error(`Bangumi API failed: ${response.status}`);
		}
		const data = (await response.json()) as { anime: AcgCard[]; manga: AcgCard[] };
		bangumiAnimeCards = data.anime || [];
		bangumiMangaCards = data.manga || [];
	} catch (error) {
		console.error(error);
		bangumiError = "Bangumi 数据加载失败，已使用本地数据兜底。";
	} finally {
		loadingBangumi = false;
	}
}

onMount(() => {
	loadSteamGames();
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

	{#if activeTab === "game" && loadingGames}
		<div class="text-sm text-black/60 dark:text-white/60">正在加载 Steam 游戏数据...</div>
	{:else if (activeTab === "anime" || activeTab === "manga") && loadingBangumi}
		<div class="text-sm text-black/60 dark:text-white/60">正在加载 Bangumi 条目数据...</div>
	{:else if activeTab === "game" && gameError}
		<div class="text-sm text-red-500">{gameError}</div>
	{:else if (activeTab === "anime" || activeTab === "manga") && bangumiError && activeSource.length === 0}
		<div class="text-sm text-red-500">{bangumiError}</div>
	{:else if pagedCards.length === 0}
		<div class="text-sm text-black/60 dark:text-white/60">暂无数据</div>
	{:else}
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
			{#each pagedCards as card}
				{@const isGameCard = card.icon === "fa6-brands:steam"}
				<article class="rounded-[var(--radius-large)] border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 p-5 transition hover:shadow-md hover:-translate-y-0.5">
					{#if card.cover}
						<div class="mb-3 rounded-lg overflow-hidden border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5">
							<img
								src={card.cover}
								alt={`${card.title} cover`}
								class={`w-full ${isGameCard ? "aspect-video object-cover" : "aspect-[3/4] object-cover bg-black/10 dark:bg-white/10"}`}
								loading="lazy"
							/>
						</div>
					{/if}
					<div class="flex items-center justify-between mb-3 gap-3">
						<div class="flex flex-col min-w-0 w-full">
							<div class="flex items-center text-[var(--primary)] min-w-0">
							<!-- <Icon icon={card.icon} class="text-[1.2rem] mr-2 flex-shrink-0" /> -->
							<h3 class="font-bold text-lg text-black/80 dark:text-white/85 truncate">{card.title}</h3>
							</div>
							<div class="mt-2 flex flex-wrap gap-2">
								{#each card.status.split(" · ") as tag}
									<span class={`text-xs rounded-full px-2 py-1 font-semibold whitespace-nowrap ${getTagClass(tag)}`}>{tag}</span>
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
