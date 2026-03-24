import { agcConfig } from "@/config";
import type { APIRoute } from "astro";

export const prerender = false;

type VndbGame = {
	id: string;
	name: string;
	playtimeMinutes: number;
	status?: string;
	source: "vndb";
	url: string;
	coverUrl?: string;
	iconUrl: string;
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
	const parts: string[] = [];

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
		parts.push(`约 ${estimate}`);
	}

	// if (entry.started) {
	// 	parts.push(entry.finished ? "已完成" : "进行中");
	// }

	return parts.join(" · ");
}
async function fetchVndbGames(vndbUserId: string): Promise<VndbGame[]> {
	const response = await fetch("https://api.vndb.org/kana/ulist", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"User-Agent": "kakaraku",
		},
		body: JSON.stringify({
			user: vndbUserId,
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

	return entries.reduce<VndbGame[]>((acc, entry) => {
		const title = entry.vn?.title?.trim();
		if (!title) return acc;

		acc.push({
			id: `vndb-${entry.id}`,
			name: title,
			playtimeMinutes: entry.vn?.length_minutes || 0,
			status: formatVndbStatus(entry),
			source: "vndb" as const,
			url: `https://vndb.org/${entry.id}`,
			coverUrl: entry.vn?.image?.thumbnail || entry.vn?.image?.url || "",
			iconUrl: "",
		});

		return acc;
	}, []);
}

export const GET: APIRoute = async ({ url }) => {
	const queryVndbUser = url.searchParams.get("vndbUser")?.trim();
	const vndbUser = queryVndbUser || agcConfig.vndbUserId?.trim();

	if (!vndbUser) {
		return new Response(JSON.stringify({ games: [], error: "VNDB user id missing" }), {
			status: 400,
			headers: {
				"Content-Type": "application/json; charset=utf-8",
				"Cache-Control": "no-store",
			},
		});
	}

	try {
		const games = await fetchVndbGames(vndbUser);

		if (games.length === 0) {
			return new Response(JSON.stringify({ games: [], error: "VNDB list is empty or private" }), {
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
		return new Response(JSON.stringify({ games: [], error: "VNDB fetch failed" }), {
			status: 502,
			headers: {
				"Content-Type": "application/json; charset=utf-8",
				"Cache-Control": "no-store",
			},
		});
	}
};
