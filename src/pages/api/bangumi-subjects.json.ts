import { agcConfig } from "@/config";
import type { APIRoute } from "astro";

type BangumiSubject = {
	id: number;
	name: string;
	name_cn?: string;
	short_summary?: string;
	images?: {
		large?: string;
		common?: string;
		medium?: string;
		small?: string;
		grid?: string;
	};
	rank?: number;
	score?: number;
	eps?: number;
	volumes?: number;
};

type BangumiCollection = {
	type?: number;
	rate?: number;
	ep_status?: number;
	vol_status?: number;
	tags?: string[];
	subject?: BangumiSubject;
};

type BangumiPaged<T> = {
	data?: T[];
};

type AcgItem = {
	title: string;
	comment: string;
	status: string;
	icon: string;
	cover?: string;
	link: string;
};

function collectionTypeToLabel(type?: number): string {
	switch (type) {
		case 1:
			return "想看";
		case 2:
			return "看过";
		case 3:
			return "在看";
		case 4:
			return "搁置";
		case 5:
			return "抛弃";
		default:
			return "收藏";
	}
}

function buildHeaders(): HeadersInit {
	return {
		"User-Agent": "kakaraku (https://github.com/Halory-Ito/kakaraku)",
	};
}

function toAnimeItem(collection: BangumiCollection): AcgItem | null {
	const subject = collection.subject;
	if (!subject) return null;

	const title = subject.name_cn?.trim() || subject.name;
	const summary = subject.short_summary?.trim() || "来自 Bangumi 动画收藏";
	const status = `${collectionTypeToLabel(collection.type)} · ${collection.ep_status || 0}${subject.eps ? `/${subject.eps}` : ""} 话`;
	const tags = collection.tags?.slice(0, 3).join(" / ");
	const score = collection.rate || subject.score;

	return {
		title,
		comment: tags ? `${summary.length > 64 ? `${summary.slice(0, 64)}...` : summary} · ${tags}` : summary,
		status: score ? `${status} · 评分 ${Number(score).toFixed(1)}` : status,
		icon: "material-symbols:live-tv-outline-rounded",
		cover: subject.images?.common || subject.images?.large || subject.images?.medium || subject.images?.small,
		link: `https://bgm.tv/subject/${subject.id}`,
	};
}

function toBookItem(collection: BangumiCollection): AcgItem | null {
	const subject = collection.subject;
	if (!subject) return null;

	const title = subject.name_cn?.trim() || subject.name;
	const summary = subject.short_summary?.trim() || "来自 Bangumi 书籍收藏";
	const status = `${collectionTypeToLabel(collection.type)} · ${collection.vol_status || 0}${subject.volumes ? `/${subject.volumes}` : ""} 卷`;
	const chapterProgress = collection.ep_status ? ` · ${collection.ep_status} 章` : "";
	const score = collection.rate || subject.score;

	return {
		title,
		comment: summary.length > 72 ? `${summary.slice(0, 72)}...` : summary,
		status: score
			? `${status}${chapterProgress} · 评分 ${Number(score).toFixed(1)}`
			: `${status}${chapterProgress}`,
		icon: "material-symbols:menu-book-outline-rounded",
		cover: subject.images?.common || subject.images?.large || subject.images?.medium || subject.images?.small,
		link: `https://bgm.tv/subject/${subject.id}`,
	};
}

async function fetchCollections(username: string, subjectType: "1" | "2"): Promise<BangumiCollection[]> {
	const params = new URLSearchParams({
		subject_type: subjectType,
		limit: "100",
		offset: "0",
	});

	const response = await fetch(`https://api.bgm.tv/v0/users/${encodeURIComponent(username)}/collections?${params.toString()}`, {
		headers: buildHeaders(),
	});

	if (!response.ok) {
		throw new Error(`Bangumi collections fetch failed: ${response.status}`);
	}

	const data = (await response.json()) as BangumiPaged<BangumiCollection>;
	return data.data || [];
}

export const GET: APIRoute = async () => {
	const username = agcConfig.bangumiUsername?.trim() || agcConfig.bangumiUserId?.trim();

	if (!username) {
		return new Response(JSON.stringify({ anime: [], manga: [], error: "Bangumi username missing" }), {
			status: 400,
			headers: {
				"Content-Type": "application/json; charset=utf-8",
			},
		});
	}

	try {
		const [animeCollections, bookCollections] = await Promise.all([
			fetchCollections(username, "2"),
			fetchCollections(username, "1"),
		]);

		const anime = animeCollections
			.map(toAnimeItem)
			.filter((item): item is AcgItem => item !== null);

		const manga = bookCollections
			.map(toBookItem)
			.filter((item): item is AcgItem => item !== null);

		return new Response(JSON.stringify({ anime, manga }), {
			headers: {
				"Content-Type": "application/json; charset=utf-8",
				"Cache-Control": "public, max-age=1800",
			},
		});
	} catch (error) {
		console.error("Failed to fetch Bangumi subjects:", error);
		return new Response(JSON.stringify({ anime: [], manga: [], error: "Bangumi fetch failed" }), {
			status: 502,
			headers: {
				"Content-Type": "application/json; charset=utf-8",
			},
		});
	}
};
