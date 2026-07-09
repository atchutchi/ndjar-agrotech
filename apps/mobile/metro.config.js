const fs = require("node:fs");
const path = require("node:path");

const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

const workspaceRoot = path.resolve(__dirname, "../..");
config.watchFolders = [workspaceRoot];

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.endsWith(".js")) {
    const originDirectory = path.dirname(context.originModulePath);
    const tsCandidate = path.resolve(
      originDirectory,
      moduleName.replace(/\.js$/, ".ts"),
    );

    if (fs.existsSync(tsCandidate)) {
      return {
        filePath: tsCandidate,
        type: "sourceFile",
      };
    }
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
