import type {
	ExpressiveCodeConfig,
	LicenseConfig,
	NavBarConfig,
	ProfileConfig,
	SiteConfig,
} from "./types/config";
import { LinkPreset } from "./types/config";

export const friendsConfig = [
	{
		title: "lvy",
		imgurl: "https://lvyovo-wiki.tech/images/avatar.png",
		desc: "很强的小姐姐，Web全栈、AI、算法都会，知识区UP养成中",
		siteurl: "https://lvyovo-wiki.tech",
		tags: ["Web全栈", "AI", "算法"],
	},
	{
		title: "feitwnd",
		imgurl: "https://avatars.githubusercontent.com/u/195735767?v=4",
		desc: "二次元浓度较高的Web全栈开发者",
		siteurl: "https://blog.feitwnd.cc",
		tags: ["Web全栈"],
	},
];

export const siteConfig: SiteConfig = {
	title: "Kakaraku",
	subtitle: "^_^",
	lang: "zh_CN", // Language code, e.g. 'en', 'zh_CN', 'ja', etc.
	themeColor: {
		hue: 250, // Default hue for the theme color, from 0 to 360. e.g. red: 0, teal: 200, cyan: 250, pink: 345
		fixed: false, // Hide the theme color picker for visitors
	},
	banner: {
		enable: true,
		src: "assets/images/demo-banner.png", // Relative to the /src directory. Relative to the /public directory if it starts with '/'
		position: "center", // Equivalent to object-position, only supports 'top', 'center', 'bottom'. 'center' by default
		credit: {
			enable: false, // Display the credit text of the banner image
			text: "", // Credit text to be displayed
			url: "", // (Optional) URL link to the original artwork or artist's page
		},
	},
	toc: {
		enable: true, // Display the table of contents on the right side of the post
		depth: 2, // Maximum heading depth to show in the table, from 1 to 3
	},
	favicon: [
		// Leave this array empty to use the default favicon
		// {
		//   src: '/favicon/icon.png',    // Path of the favicon, relative to the /public directory
		//   theme: 'light',              // (Optional) Either 'light' or 'dark', set only if you have different favicons for light and dark mode
		//   sizes: '32x32',              // (Optional) Size of the favicon, set only if you have favicons of different sizes
		// }
	],
};

export const navBarConfig: NavBarConfig = {
	links: [
		LinkPreset.Home,
		LinkPreset.Archive,
		LinkPreset.ACG,
		LinkPreset.About,
		LinkPreset.Friends,
		// {
		// 	name: "GitHub",
		// 	url: "https://github.com/Halory-Ito/kakaraku", // Internal links should not include the base path, as it is automatically added
		// 	external: true, // Show an external link icon and will open in a new tab
		// },
	],
};

export const profileConfig: ProfileConfig = {
	avatar: "assets/images/avatar.png", // Relative to the /src directory. Relative to the /public directory if it starts with '/'
	name: "Karaku",
	bio: "这个人很懒，什么都没有留下~",
	links: [
		{
			name: "Twitter",
			icon: "fa6-brands:twitter", // Visit https://icones.js.org/ for icon codes
			// You will need to install the corresponding icon set if it's not already included
			// `pnpm add @iconify-json/<icon-set-name>`
			url: "https://x.com/_Karakuku",
		},
		{
			name: "Steam",
			icon: "fa6-brands:steam",
			url: "https://steamcommunity.com/profiles/76561199326443732/",
		},
		{
			name: "GitHub",
			icon: "fa6-brands:github",
			url: "https://github.com/Halory-Ito",
		},
		{
			name: "QQ",
			icon: "fa6-brands:qq",
			url: "https://qm.qq.com/q/s9dtgngTvM",
		},
		// {
		// 	name: "Reddit",
		// 	icon: "fa6-brands:reddit",
		// 	url: "https://www.reddit.com",
		// },
	],
};

export const licenseConfig: LicenseConfig = {
	enable: true,
	name: "CC BY-NC-SA 4.0",
	url: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
};

export const expressiveCodeConfig: ExpressiveCodeConfig = {
	// Note: Some styles (such as background color) are being overridden, see the astro.config.mjs file.
	// Please select a dark theme, as this blog theme currently only supports dark background color
	theme: "github-dark",
};

export const agcConfig = {
	vndbUserId: "u335444",
	bangumiUserId: "1077797",
	bangumiUsername: "karaku",
};
