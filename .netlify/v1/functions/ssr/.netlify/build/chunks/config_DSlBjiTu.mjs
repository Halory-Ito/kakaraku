var LinkPreset = /* @__PURE__ */ ((LinkPreset2) => {
  LinkPreset2[LinkPreset2["Home"] = 0] = "Home";
  LinkPreset2[LinkPreset2["Archive"] = 1] = "Archive";
  LinkPreset2[LinkPreset2["ACG"] = 2] = "ACG";
  LinkPreset2[LinkPreset2["About"] = 3] = "About";
  LinkPreset2[LinkPreset2["Friends"] = 4] = "Friends";
  return LinkPreset2;
})(LinkPreset || {});

const config$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	LinkPreset
}, Symbol.toStringTag, { value: 'Module' }));

const friendsConfig = [
  {
    title: "lvy",
    imgurl: "https://lvyovo-wiki.tech/images/avatar.png",
    desc: "很强的小姐姐，Web全栈、AI、算法都会，知识区UP养成中",
    siteurl: "https://lvyovo-wiki.tech",
    tags: ["Web全栈", "AI", "算法"]
  },
  {
    title: "feitwnd",
    imgurl: "https://feitwnd.oss-cn-shanghai.aliyuncs.com/image/avatar.png",
    desc: "工作室学弟，学习能力很强，至少比当年的我强",
    siteurl: "https://blog.feitwnd.cc",
    tags: ["Web全栈"]
  }
];
const siteConfig = {
  title: "Kakaraku",
  subtitle: "^_^",
  lang: "zh_CN",
  // Language code, e.g. 'en', 'zh_CN', 'ja', etc.
  themeColor: {
    hue: 250},
  banner: {
    enable: true,
    src: "assets/images/demo-banner.png",
    // Relative to the /src directory. Relative to the /public directory if it starts with '/'
    position: "center",
    // Equivalent to object-position, only supports 'top', 'center', 'bottom'. 'center' by default
    credit: {
      enable: false}
  },
  toc: {
    // Display the table of contents on the right side of the post
    depth: 2
    // Maximum heading depth to show in the table, from 1 to 3
  },
  favicon: [
    // Leave this array empty to use the default favicon
    // {
    //   src: '/favicon/icon.png',    // Path of the favicon, relative to the /public directory
    //   theme: 'light',              // (Optional) Either 'light' or 'dark', set only if you have different favicons for light and dark mode
    //   sizes: '32x32',              // (Optional) Size of the favicon, set only if you have favicons of different sizes
    // }
  ]
};
const navBarConfig = {
  links: [
    LinkPreset.Home,
    LinkPreset.Archive,
    LinkPreset.ACG,
    LinkPreset.About,
    LinkPreset.Friends,
    {
      name: "GitHub",
      url: "https://github.com/Halory-Ito/kakaraku",
      // Internal links should not include the base path, as it is automatically added
      external: true
      // Show an external link icon and will open in a new tab
    }
  ]
};
const profileConfig = {
  avatar: "assets/images/avatar.png",
  // Relative to the /src directory. Relative to the /public directory if it starts with '/'
  name: "Karaku",
  bio: "这个人很懒，什么都没有留下~",
  links: [
    {
      name: "Twitter",
      icon: "fa6-brands:twitter",
      // Visit https://icones.js.org/ for icon codes
      // You will need to install the corresponding icon set if it's not already included
      // `pnpm add @iconify-json/<icon-set-name>`
      url: "https://x.com/_Karakuku"
    },
    {
      name: "Steam",
      icon: "fa6-brands:steam",
      url: "https://steamcommunity.com/profiles/76561199326443732/"
    },
    {
      name: "GitHub",
      icon: "fa6-brands:github",
      url: "https://github.com/Halory-Ito"
    },
    {
      name: "QQ",
      icon: "fa6-brands:qq",
      url: "https://qm.qq.com/q/s9dtgngTvM"
    }
    // {
    // 	name: "Reddit",
    // 	icon: "fa6-brands:reddit",
    // 	url: "https://www.reddit.com",
    // },
  ]
};
const licenseConfig = {
  name: "CC BY-NC-SA 4.0",
  url: "https://creativecommons.org/licenses/by-nc-sa/4.0/"
};
const agcConfig = {
  steamId: "76561199326443732",
  bangumiUserId: "1077797",
  bangumiUsername: "karaku"
};

const config = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	agcConfig,
	friendsConfig,
	licenseConfig,
	navBarConfig,
	profileConfig,
	siteConfig
}, Symbol.toStringTag, { value: 'Module' }));

export { LinkPreset as L, agcConfig as a, config as b, config$1 as c, friendsConfig as f, licenseConfig as l, navBarConfig as n, profileConfig as p, siteConfig as s };
