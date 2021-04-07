#!/usr/bin/env node
const path = require("path");
const fse = require("fs-extra");
const child_process = require("child_process");

const extensionsToBuild = process.argv.slice(2);
const extensions = [
  {
    name: "vscode-web-playground",
    copy: ["dist", "package.json"],
    commands: ["yarn"],
  },
  {
    name: "vscode-native-file-system",
    copy: ["dist", "package.json"],
    commands: ["yarn", "yarn package"],
  },
];

const myExtensions = [];

extensions.forEach(({ name, copy, commands }) => {
  if (
    !extensionsToBuild.length ||
    extensionsToBuild.find((extensionName) => extensionName === name)
  ) {
    console.log("\n* Adding extension ", name);
    fse.rmdirSync(
      path.resolve(
        __dirname,
        `./node_modules/vscode-web/dist/extensions/${name}/`
      ),
      { recursive: true }
    );
    fse.mkdirpSync(
      path.resolve(
        __dirname,
        `./node_modules/vscode-web/dist/extensions/${name}/`
      )
    );
    process.chdir(path.resolve(__dirname, `./extensions/${name}/`));
    commands.forEach((command) => {
      child_process.execSync(command, { stdio: "inherit" });
    });
    process.chdir(__dirname);
    copy.forEach((file) => {
      fse.copySync(
        path.resolve(__dirname, `extensions/${name}/${file}`),
        path.resolve(
          __dirname,
          `./node_modules/vscode-web/dist/extensions/${name}/${file}`
        )
      );
    });
  }
  const packageJSON = JSON.parse(
    fse.readFileSync(
      path.resolve(
        __dirname,
        `./node_modules/vscode-web/dist/extensions/${name}/package.json`
      ),
      { encoding: "utf-8" }
    )
  );
  myExtensions.push({
    packageJSON,
    extensionPath: name,
  });
});

console.log("* Creating ./playground.js");
const content = `var playground=${JSON.stringify(myExtensions)}`;
fse.writeFileSync("./playground.js", content);
