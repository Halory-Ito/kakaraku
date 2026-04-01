import type { APIRoute } from "astro";
import { agcConfig } from "@/config";

export const prerender = false;

type BangumiTimelineItem = {
	title: string;
	link: string;
	description: string;
	pubDate: string;
};

type AcgCard = {
	title: string;
	comment: string;
	status: string;
	icon: string;
	cover?: string;
	link?: string;
	timestamp?: number;
};

const REQUEST_TIMEOUT_MS = 12000;
const MAX_LIMIT = 50;

function clampNumber(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

function parsePositiveInt(raw: string | null, fallback: number): number {
	if (!raw) return fallback;
	const parsed = Number.parseInt(raw, 10);
	if (!Number.isFinite(parsed) || parsed < 0) return fallback;
	return parsed;
}

function isRetriableStatus(status: number): boolean {
	return status === 429 || status >= 500;
}

function parseXmlText(source: string, tag: string): string {
	const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
	const matched = source.match(regex);
	return matched?.[1]?.trim() || "";
}

function stripCdata(value: string): string {
	return value
		.replace(/^<!\[CDATA\[/, "")
		.replace(/\]\]>$/, "")
		.trim();
}

function decodeHtmlEntities(input: string): string {
	const namedEntities: Record<string, string> = {
		"&amp;": "&",
		"&lt;": "<",
		"&gt;": ">",
		"&quot;": '"',
		"&#39;": "'",
		"&nbsp;": " ",
	};

	return input
		.replace(/&(?:amp|lt|gt|quot|#39|nbsp);/g, (entity) => namedEntities[entity] || entity)
		.replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number.parseInt(code, 10)))
		.replace(/&#x([0-9a-fA-F]+);/g, (_, code) =>
			String.fromCodePoint(Number.parseInt(code, 16)),
		);
}

function stripHtml(input: string): string {
	return decodeHtmlEntities(input.replace(/<[^>]*>/g, " "))
		.replace(/\s+/g, " ")
		.trim();
}

function extractFirstSubjectLink(html: string): string | undefined {
	const match = html.match(/href="(https?:\/\/bgm\.tv\/subject\/\d+)"/i);
	return match?.[1];
}

function getTimelineIconByText(title: string, description: string): string {
	const text = `${title} ${description}`;

	if (/游戏|在玩|想玩|玩过|通关/i.test(text)) {
		return "material-symbols:sports-esports-outline-rounded";
	}

	if (/动画|看过|在看|想看|话/i.test(text)) {
		return "material-symbols:live-tv-outline-rounded";
	}

	if (/读过|在读|想读|书|卷|章/i.test(text)) {
		return "material-symbols:menu-book-outline-rounded";
	}

	if (/三次元|条目|观看/i.test(text)) {
		return "material-symbols:theater-comedy-outline-rounded";
	}

	return "material-symbols:schedule-outline-rounded";
}

function parseTimelineRss(xml: string): BangumiTimelineItem[] {
	const itemBlocks = Array.from(xml.matchAll(/<item>([\s\S]*?)<\/item>/gi));

	return itemBlocks
		.map(([, block]) => {
			const title = decodeHtmlEntities(stripCdata(parseXmlText(block, "title")));
			const link = stripCdata(parseXmlText(block, "link"));
			const description = stripCdata(parseXmlText(block, "description"));
			const pubDate = stripCdata(parseXmlText(block, "pubDate"));

			if (!title || !pubDate) {
				return null;
			}

			return {
				title,
				link,
				description,
				pubDate,
			};
		})
		.filter((item): item is BangumiTimelineItem => item !== null);
}

function formatTimestamp(timestamp: number): string {
	const date = new Date(timestamp * 1000);
	const now = new Date();
	const diff = now.getTime() - date.getTime();
	const days = Math.floor(diff / (1000 * 60 * 60 * 24));

	if (days === 0) {
		return "今天";
	} else if (days === 1) {
		return "昨天";
	} else if (days < 7) {
		return `${days} 天前`;
	} else if (days < 30) {
		const weeks = Math.floor(days / 7);
		return `${weeks} 周前`;
	} else if (days < 365) {
		const months = Math.floor(days / 30);
		return `${months} 个月前`;
	} else {
		const years = Math.floor(days / 365);
		return `${years} 年前`;
	}
}

function formatDate(timestamp: number): string {
	const date = new Date(timestamp * 1000);
	return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

function toTimelineCard(item: BangumiTimelineItem): AcgCard | null {
	const timestamp = Date.parse(item.pubDate);
	if (!Number.isFinite(timestamp)) {
		return null;
	}

	const subjectLink = extractFirstSubjectLink(item.description);
	const textDescription = stripHtml(item.description);
	const timeLabel = formatTimestamp(Math.floor(timestamp / 1000));
	const dateLabel = formatDate(Math.floor(timestamp / 1000));

	return {
		title: item.title,
		comment: textDescription || item.title,
		status: `${timeLabel} · ${dateLabel}`,
		icon: getTimelineIconByText(item.title, textDescription),
		link: subjectLink || item.link,
		timestamp: Math.floor(timestamp / 1000),
	};
}

async function fetchTimeline(
	username: string,
	limit: number = 30,
	offset: number = 0,
): Promise<BangumiTimelineItem[]> {
	const requestUrl = `https://bgm.tv/feed/user/${encodeURIComponent(username)}/timeline`;

	let lastError: unknown;

	for (let attempt = 0; attempt < 2; attempt += 1) {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

		try {
			const response = await fetch(requestUrl, {
				headers: {
					"User-Agent": "kakaraku (https://github.com/Halory-Ito/kakaraku)",
					Accept: "application/rss+xml, application/xml;q=0.9, text/xml;q=0.8, */*;q=0.1",
				},
				signal: controller.signal,
				cache: "no-store",
			});

			if (!response.ok) {
				if (attempt === 0 && isRetriableStatus(response.status)) {
					await new Promise((resolve) => setTimeout(resolve, 400));
					continue;
				}
				throw new Error(`Bangumi timeline fetch failed: ${response.status}`);
			}

			const xml = await response.text();
			const parsed = parseTimelineRss(xml);
			return parsed.slice(offset, offset + limit);
		} catch (error) {
			lastError = error;
			if (attempt === 0) {
				await new Promise((resolve) => setTimeout(resolve, 400));
				continue;
			}
		} finally {
			clearTimeout(timeout);
		}
	}

	throw lastError instanceof Error
		? lastError
		: new Error("Bangumi timeline fetch failed");
}

export const GET: APIRoute = async ({ url }) => {
	const username = agcConfig.bangumiUsername?.trim() || agcConfig.bangumiUserId?.trim();

	if (!username) {
		return new Response(
			JSON.stringify({
				timeline: [],
				hasMore: false,
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

	const limitParam = url.searchParams.get("limit");
	const offsetParam = url.searchParams.get("offset");
	const limit = clampNumber(parsePositiveInt(limitParam, 30), 1, MAX_LIMIT);
	const offset = parsePositiveInt(offsetParam, 0);

	try {
		const timelineData = await fetchTimeline(username, limit, offset);
		const timeline = timelineData
			.map(toTimelineCard)
			.filter((card): card is AcgCard => card !== null);

		return new Response(
			JSON.stringify({
				timeline,
				hasMore: timelineData.length === limit,
				offset: offset + timelineData.length,
			}),
			{
				headers: {
					"Content-Type": "application/json; charset=utf-8",
					"Cache-Control": "no-store",
				},
			},
		);
	} catch (error) {
		console.error("Failed to fetch Bangumi timeline:", error);
		return new Response(
			JSON.stringify({
				timeline: [],
				hasMore: false,
				offset,
				error: "Bangumi timeline fetch failed",
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
