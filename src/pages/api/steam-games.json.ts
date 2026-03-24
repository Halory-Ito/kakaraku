import { agcConfig } from "@/config";
import type { APIRoute } from "astro";

export const prerender = false;

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

export const GET: APIRoute = async ({ url }) => {
	const querySteamId = url.searchParams.get("steamId")?.trim();
	const steamId = querySteamId || agcConfig.steamId;
	const apiKey = import.meta.env.STEAM_API_KEY?.trim();

	if (!steamId) {
		return new Response(JSON.stringify({ games: [], error: "Steam ID missing" }), {
			status: 400,
			headers: {
				"Content-Type": "application/json; charset=utf-8",
			},
		});
	}

	if (!apiKey) {
		return new Response(JSON.stringify({ games: [], error: "STEAM_API_KEY is missing" }), {
			status: 500,
			headers: {
				"Content-Type": "application/json; charset=utf-8",
			},
		});
	}

	try {
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

		const games = rawGames
			.map((game) => ({
				appid: game.appid,
				name: game.name || `App ${game.appid}`,
				playtimeMinutes: game.playtime_forever || 0,
				url: `https://store.steampowered.com/app/${game.appid}/`,
				coverUrl: `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${game.appid}/header.jpg`,
				iconUrl: game.img_icon_url
					? `https://media.steampowered.com/steamcommunity/public/images/apps/${game.appid}/${game.img_icon_url}.jpg`
					: "",
			}))
			.sort((a, b) => b.playtimeMinutes - a.playtimeMinutes);

		if (games.length === 0) {
			return new Response(
				JSON.stringify({
					games: [],
					error: "No game data returned by Steam Web API (profile may be private)",
				}),
				{
					status: 403,
					headers: {
						"Content-Type": "application/json; charset=utf-8",
					},
				},
			);
		}

		return new Response(JSON.stringify({ games }), {
			headers: {
				"Content-Type": "application/json; charset=utf-8",
				"Cache-Control": "no-store",
			},
		});
	} catch (error) {
		console.error("Failed to fetch Steam games:", error);
		return new Response(JSON.stringify({ games: [], error: "Steam fetch failed" }), {
			status: 502,
			headers: {
				"Content-Type": "application/json; charset=utf-8",
			},
		});
	}
};
