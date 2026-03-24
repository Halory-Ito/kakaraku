import { agcConfig } from "@/config";
import type { APIRoute } from "astro";

export const prerender = false;

type UnifiedGame = {
	id: string;
	name: string;
	playtimeMinutes: number;
	status?: string;
	source: "steam" | "vndb";
	url: string;
	coverUrl?: string;
	iconUrl: string;
};

type SteamOwnedGame = {
	appid: number;
	name?: string;
	playtime_forever?: number;
	img_icon_url?: string;
};

type SteamOwnedGamesResponse = {
	response?: {
		game_count?: number;
		games?: SteamOwnedGame[];
	};
};

type VndbImage = {
	url?: string;
	thumbnail?: string;
};

type VndbLabel = {
	id?: number;
	label?: string;
};

type VndbEntry = {
	id: string;
	vote?: number;
	started?: string | null;
	finished?: string | null;
	labels?: VndbLabel[];
	vn?: {
		title?: string;
		length_minutes?: number | null;
		rating?: number | null;
		image?: VndbImage | null;
	};
};

type VndbResponse = {
	results?: VndbEntry[];
};

function formatHours(minutes?: number | null): string {
	if (!minutes || minutes <= 0) return "";
	const hours = minutes / 60;
	if (hours < 1) return `${minutes} 分钟`;
	return `${hours.toFixed(1)} 小时`;
}

function formatVndbStatus(entry: VndbEntry): string {
	const parts: string[] = ["VNDB"];

	const labels = (entry.labels || [])
		.map((label) => label.label?.trim())
		.filter((label): label is string => Boolean(label));

	if (labels.length > 0) {
		parts.push(labels.slice(0, 2).join(" / "));
	}

	if (entry.vote && entry.vote > 0) {
		parts.push(`评分 ${(entry.vote / 10).toFixed(1)}`);
	} else if (entry.vn?.rating && entry.vn.rating > 0) {
		parts.push(`站内评分 ${(entry.vn.rating / 10).toFixed(1)}`);
	}

	const estimate = formatHours(entry.vn?.length_minutes);
	if (estimate) {
		parts.push(`时长约 ${estimate}`);
	}

	if (entry.started) {
		parts.push(entry.finished ? "已完成" : "进行中");
	}

	return parts.join(" · ");
}

async function fetchSteamGames(steamId: string, apiKey: string): Promise<UnifiedGame[]> {
	const apiUrl = new URL("https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/");
	apiUrl.searchParams.set("key", apiKey);
	apiUrl.searchParams.set("steamid", steamId);
	apiUrl.searchParams.set("include_appinfo", "1");
	apiUrl.searchParams.set("include_played_free_games", "1");

	const response = await fetch(apiUrl, {
		headers: {
			"User-Agent": "kakaraku",
		},
	});

	if (!response.ok) {
		throw new Error(`Steam fetch failed: ${response.status}`);
	}

	const data = (await response.json()) as SteamOwnedGamesResponse;
	const rawGames = data.response?.games || [];

	return rawGames
		.map((game) => ({
			id: `steam-${game.appid}`,
			name: game.name || `App ${game.appid}`,
			playtimeMinutes: game.playtime_forever || 0,
			source: "steam" as const,
			url: `https://store.steampowered.com/app/${game.appid}/`,
			coverUrl: `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${game.appid}/header.jpg`,
			iconUrl: game.img_icon_url
				? `https://media.steampowered.com/steamcommunity/public/images/apps/${game.appid}/${game.img_icon_url}.jpg`
				: "",
		}))
		.sort((a, b) => b.playtimeMinutes - a.playtimeMinutes);
}

async function fetchVndbGames(vndbApiKey: string): Promise<UnifiedGame[]> {
	const response = await fetch("https://api.vndb.org/kana/ulist", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Token ${vndbApiKey}`,
			"User-Agent": "kakaraku",
		},
		body: JSON.stringify({
			fields: "vote,started,finished,labels{id,label},vn.title,vn.length_minutes,vn.rating,vn.image.url,vn.image.thumbnail",
			sort: "lastmod",
			reverse: true,
			results: 30,
		}),
	});

	if (!response.ok) {
		throw new Error(`VNDB fetch failed: ${response.status}`);
	}

	const data = (await response.json()) as VndbResponse;
	const entries = data.results || [];

	return entries.reduce<UnifiedGame[]>((acc, entry) => {
		const title = entry.vn?.title?.trim();
		if (!title) return acc;

		acc.push({
			id: `vndb-${entry.id}`,
			name: title,
			playtimeMinutes: entry.vn?.length_minutes || 0,
			status: formatVndbStatus(entry),
			source: "vndb",
			url: `https://vndb.org/${entry.id}`,
			coverUrl: entry.vn?.image?.thumbnail || entry.vn?.image?.url || "",
			iconUrl: "",
		});

		return acc;
	}, []);
}

export const GET: APIRoute = async ({ url }) => {
	const querySteamId = url.searchParams.get("steamId")?.trim();
	const steamId = querySteamId || agcConfig.steamId;
	const steamApiKey = import.meta.env.STEAM_API_KEY?.trim();
	const vndbApiKey = import.meta.env.VNDB_API_KEY?.trim();

	try {
		const errors: string[] = [];

		const steamPromise = steamId && steamApiKey
			? fetchSteamGames(steamId, steamApiKey).catch((error) => {
				errors.push(error instanceof Error ? error.message : "Steam fetch failed");
				return [] as UnifiedGame[];
			})
			: Promise.resolve([] as UnifiedGame[]);

		const vndbPromise = vndbApiKey
			? fetchVndbGames(vndbApiKey).catch((error) => {
				errors.push(error instanceof Error ? error.message : "VNDB fetch failed");
				return [] as UnifiedGame[];
			})
			: Promise.resolve([] as UnifiedGame[]);

		const [steamGames, vndbGames] = await Promise.all([steamPromise, vndbPromise]);
		const games = [...steamGames, ...vndbGames];

		if (games.length === 0) {
			const tips: string[] = [];
			if (!steamId) tips.push("Steam ID missing");
			if (!steamApiKey) tips.push("STEAM_API_KEY missing");
			if (!vndbApiKey) tips.push("VNDB_API_KEY missing");

			const errorMessage = errors[0] || tips.join("; ") || "No game data available";
			return new Response(JSON.stringify({ games: [], error: errorMessage }), {
				status: 200,
				headers: {
					"Content-Type": "application/json; charset=utf-8",
					"Cache-Control": "no-store",
				},
			});
		}

		return new Response(JSON.stringify({ games }), {
			headers: {
				"Content-Type": "application/json; charset=utf-8",
				"Cache-Control": "no-store",
			},
		});
	} catch (error) {
		console.error("Failed to fetch game data:", error);
		return new Response(JSON.stringify({ games: [], error: "Game fetch failed" }), {
			status: 502,
			headers: {
				"Content-Type": "application/json; charset=utf-8",
				"Cache-Control": "no-store",
			},
		});
	}
};
