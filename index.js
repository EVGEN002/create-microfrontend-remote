#!/usr/bin/env node

import { program } from "commander";
import download from "download-git-repo";
import path from "path";
import fs from "fs";
import inquirer from "inquirer";
import jsonfile from "jsonfile";

program
  .version("1.0.0")
  .command("init [project]")
  .description("Initialize a new project from a template")
  .option("-n, --name <type>", "Add your name")
  .action((project) => {
    const questions = [
      {
        type: "input",
        name: "appNameFromPrompt",
        message: "📦 Введите название проекта:",
      },
      {
        type: "input",
        name: "remoteComponent",
        message: "🔧 Enter the name of your remote component:",
      },
    ];
    if (project) questions.shift();
    inquirer.prompt(questions).then((answers) => {
      const { appNameFromPrompt, remoteComponent } = answers;
      const repoURL = `EVGEN002/webpack-microfrontend-template`;
      const appName = project ?? appNameFromPrompt;
      const targetPath = path.join(process.cwd(), appName);
      if (!fs.existsSync(targetPath)) {
        fs.mkdirSync(targetPath);
      }

      console.log(`Downloading template from ${repoURL}...`);

      download(repoURL, targetPath, (err) => {
        if (err) {
          console.error("Failed to download template:", err);
        } else {
          console.log("Template downloaded successfully!");
          console.log(`Your new project is ready at ${targetPath}`);

          const packageJsonPath = path.join(targetPath, "package.json");

          jsonfile.readFile(packageJsonPath, (err, packageJson) => {
            if (err) {
              console.error("Failed to read package.json:", err);
            } else {
              packageJson.name = appName;

              jsonfile.writeFile(
                packageJsonPath,
                packageJson,
                { spaces: 2 },
                (err) => {
                  if (err) {
                    console.error("Failed to update package.json:", err);
                  } else {
                    console.log(
                      `Updated package.json with the name: ${appName}`
                    );
                  }
                }
              );
            }
          });

          const webpackConfigPath = path.join(targetPath, "webpack.config.js");
          fs.readFile(webpackConfigPath, "utf8", (err, data) => {
            if (err) {
              console.error("Failed to read webpack.config.js:", err);
            } else {
              let result = data;
              result = result.replace(
                /(new ModuleFederationPlugin\({[\s\S]*?name:\s*')(.+?)(')/,
                `$1${appName}$3`
              );
              result = result.replace(
                /(exposes:\s*{[\s\S]*?'\.\/)(App)(':)/,
                `$1${remoteComponent}$3`
              );
              result = result.replace(
                /(exposes:\s*{[\s\S]*?':\s*'\.\/src\/)(App)(')/,
                `$1${remoteComponent}$3`
              );

              fs.writeFile(webpackConfigPath, result, "utf8", (err) => {
                if (err) {
                  console.error("Failed to update webpack.config.js:", err);
                } else {
                  console.log(
                    `Updated webpack.config.js with the name: ${appName} and remote component: ${remoteComponent}`
                  );
                }
              });
            }
          });
        }
      });
    });
  });

program.parse(process.argv);
