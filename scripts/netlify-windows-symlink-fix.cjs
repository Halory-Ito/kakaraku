if (process.platform === "win32") {
	const fsPromises = require("node:fs/promises");
	const { syncBuiltinESMExports } = require("node:module");

	const originalSymlink = fsPromises.symlink.bind(fsPromises);

	fsPromises.symlink = async (target, path, type) => {
		const symlinkType = type === "dir" ? "junction" : type;
		return originalSymlink(target, path, symlinkType);
	};

	syncBuiltinESMExports();
}
