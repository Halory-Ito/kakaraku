import type { APIRoute } from "astro";
import { agcConfig } from "@/config";

export const prerender = false;

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

type SubjectType = "1" | "2" | "4" | "6";

function collectionTypeToLabel(
	type: number | undefined,
	subjectType: SubjectType,
): string {
	const labelMapBySubjectType: Record<SubjectType, [string, string, string]> = {
		"1": ["想读", "读过", "在读"],
		"2": ["想看", "看过", "在看"],
		"4": ["想玩", "玩过", "在玩"],
		"6": ["想看", "看过", "在看"],
	};

	const [wishLabel, doneLabel, doingLabel] = labelMapBySubjectType[subjectType];

	switch (type) {
		case 1:
			return wishLabel;
		case 2:
			return doneLabel;
		case 3:
			return doingLabel;
		case 4:
			return "搁置";
		case 5:
			return "抛弃";
		default:
			return "收藏";
	}
}

function baseMeta(subject: BangumiSubject) {
	const title = subject.name_cn?.trim() || subject.name;
	const cover =
		subject.images?.common ||
		subject.images?.large ||
		subject.images?.medium ||
		subject.images?.small;

	return {
		title,
		cover,
		link: `https://bgm.tv/subject/${subject.id}`,
	};
}

function buildHeaders(): HeadersInit {
	return {
		"User-Agent": "kakaraku (https://github.com/Halory-Ito/kakaraku)",
	};
}

function toAnimeItem(collection: BangumiCollection): AcgItem | null {
	const subject = collection.subject;
	if (!subject) return null;

	const { title, cover, link } = baseMeta(subject);
	const summary = subject.short_summary?.trim() || "来自 Bangumi 动画收藏";
	const status = `${collectionTypeToLabel(collection.type, "2")} · ${collection.ep_status || 0}${subject.eps ? `/${subject.eps}` : ""} 话`;
	const tags = collection.tags?.slice(0, 3).join(" / ");
	const score = collection.rate || subject.score;

	return {
		title,
		comment: tags
			? `${summary.length > 64 ? `${summary.slice(0, 64)}...` : summary} · ${tags}`
			: summary,
		status: score ? `${status} · 评分 ${Number(score).toFixed(1)}` : status,
		icon: "material-symbols:live-tv-outline-rounded",
		cover,
		link,
	};
}

function toBookItem(collection: BangumiCollection): AcgItem | null {
	const subject = collection.subject;
	if (!subject) return null;

	const { title, cover, link } = baseMeta(subject);
	const summary = subject.short_summary?.trim() || "来自 Bangumi 书籍收藏";
	const status = `${collectionTypeToLabel(collection.type, "1")} · ${collection.vol_status || 0}${subject.volumes ? `/${subject.volumes}` : ""} 卷`;
	const chapterProgress = collection.ep_status
		? ` · ${collection.ep_status} 章`
		: "";
	const score = collection.rate || subject.score;

	return {
		title,
		comment: summary.length > 72 ? `${summary.slice(0, 72)}...` : summary,
		status: score
			? `${status}${chapterProgress} · 评分 ${Number(score).toFixed(1)}`
			: `${status}${chapterProgress}`,
		icon: "material-symbols:menu-book-outline-rounded",
		cover,
		link,
	};
}

function toGameItem(collection: BangumiCollection): AcgItem | null {
	const subject = collection.subject;
	if (!subject) return null;

	const { title, cover, link } = baseMeta(subject);
	const summary = subject.short_summary?.trim() || "来自 Bangumi 游戏收藏";
	const status = collectionTypeToLabel(collection.type, "4");
	const tags = collection.tags?.slice(0, 3).join(" / ");
	const score = collection.rate || subject.score;

	return {
		title,
		comment: tags
			? `${summary.length > 64 ? `${summary.slice(0, 64)}...` : summary} · ${tags}`
			: summary,
		status: score ? `${status} · 评分 ${Number(score).toFixed(1)}` : status,
		icon: "material-symbols:sports-esports-outline-rounded",
		cover,
		link,
	};
}

function toRealItem(collection: BangumiCollection): AcgItem | null {
	const subject = collection.subject;
	if (!subject) return null;

	const { title, cover, link } = baseMeta(subject);
	const summary = subject.short_summary?.trim() || "来自 Bangumi 三次元收藏";
	const progress =
		collection.ep_status || subject.eps
			? `${collection.ep_status || 0}${subject.eps ? `/${subject.eps}` : ""} 集`
			: "";
	const status = progress
		? `${collectionTypeToLabel(collection.type, "6")} · ${progress}`
		: collectionTypeToLabel(collection.type, "6");
	const tags = collection.tags?.slice(0, 3).join(" / ");
	const score = collection.rate || subject.score;

	return {
		title,
		comment: tags
			? `${summary.length > 64 ? `${summary.slice(0, 64)}...` : summary} · ${tags}`
			: summary,
		status: score ? `${status} · 评分 ${Number(score).toFixed(1)}` : status,
		icon: "material-symbols:theater-comedy-outline-rounded",
		cover,
		link,
	};
}

async function fetchCollections(
	username: string,
	subjectType: SubjectType,
): Promise<BangumiCollection[]> {
	const params = new URLSearchParams({
		subject_type: subjectType,
		limit: "100",
		offset: "0",
	});

	const response = await fetch(
		`https://api.bgm.tv/v0/users/${encodeURIComponent(username)}/collections?${params.toString()}`,
		{
			headers: buildHeaders(),
		},
	);

	if (!response.ok) {
		throw new Error(`Bangumi collections fetch failed: ${response.status}`);
	}

	const data = (await response.json()) as BangumiPaged<BangumiCollection>;
	return data.data || [];
}

export const GET: APIRoute = async () => {
	const username =
		agcConfig.bangumiUsername?.trim() || agcConfig.bangumiUserId?.trim();

	if (!username) {
		return new Response(
			JSON.stringify({
				anime: [],
				manga: [],
				game: [],
				real: [],
				error: "Bangumi username missing",
			}),
			{
				status: 400,
				headers: {
					"Content-Type": "application/json; charset=utf-8",
				},
			},
		);
	}

	try {
		const [
			animeCollections,
			bookCollections,
			gameCollections,
			realCollections,
		] = await Promise.all([
			fetchCollections(username, "2"),
			fetchCollections(username, "1"),
			fetchCollections(username, "4"),
			fetchCollections(username, "6"),
		]);

		const anime = animeCollections
			.map(toAnimeItem)
			.filter((item): item is AcgItem => item !== null);

		const manga = bookCollections
			.map(toBookItem)
			.filter((item): item is AcgItem => item !== null);

		const game = gameCollections
			.map(toGameItem)
			.filter((item): item is AcgItem => item !== null);

		const real = realCollections
			.map(toRealItem)
			.filter((item): item is AcgItem => item !== null);

		return new Response(JSON.stringify({ anime, manga, game, real }), {
			headers: {
				"Content-Type": "application/json; charset=utf-8",
				"Cache-Control": "no-store",
			},
		});
	} catch (error) {
		console.error("Failed to fetch Bangumi subjects:", error);
		return new Response(
			JSON.stringify({
				anime: [],
				manga: [],
				game: [],
				real: [],
				error: "Bangumi fetch failed",
			}),
			{
				status: 502,
				headers: {
					"Content-Type": "application/json; charset=utf-8",
				},
			},
		);
	}
};
