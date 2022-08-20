// Node.js core
const { resolve } = require('path');

const fs = require('fs-extra');
const chalk = require('chalk');

// Migration Helpers
const { v4 } = require('../../lib');

const { migratePlugin, migrateApiFolder, migrateDependencies, migrateApplicationFolderStructure } =
  v4.migrationHelpers;

// Global utils
const { isPathStrapiApp, logger, isCleanGitRepo, promptUser } = require('../../lib/global/utils');

const migrate = async (type, path, pathForV4Plugin, cliOptions) => {
  // Check the path exists
  const exists = await fs.pathExists(resolve(path));
  if (!exists) {
    logger.error(`${chalk.yellow(resolve(path))} does not exist`);
    process.exit(1);
  }

  try {
    switch (type) {
      case 'application':
        await migrateApplicationToV4(path, cliOptions);
        break;
      case 'dependencies':
        await migrateDependenciesToV4(path);
        break;
      case 'plugin':
        await migratePluginToV4(path, pathForV4Plugin);
        break;
    }
  } catch (error) {
    logger.error(error.message);
    process.exit(1);
  }
};

// `strapi-codemods migrate:application`
const migrateApplicationToV4 = async (path, cliOptions) => {
  const promptOptions = {
    type: 'input',
    name: 'path',
    message: 'Enter the path to your Strapi application',
    when: !path,
  };

  const options = await promptUser(promptOptions);
  const projectPath = path || options.path;

  if (!cliOptions.skipWorkingTreeCheck) {
    await isCleanGitRepo(projectPath);
  }
  await isPathStrapiApp(projectPath);
  await migrateDependencies(projectPath);
  await migrateApplicationFolderStructure(projectPath);
  await migrateApiFolder(projectPath);
};

// `strapi-codemods migrate:plugin`
const migratePluginToV4 = async (pathToV3, pathForV4Plugin) => {
  const promptOptions = [
    {
      type: 'input',
      name: 'path',
      message: 'Enter the path to your v3 Strapi plugin',
      when: !pathToV3,
    },
    {
      type: 'input',
      name: 'pathForV4',
      message: 'Where would you like to create your v4 plugin?',
      default(answers) {
        const path = pathToV3 || answers.pathToV3;
        return `${resolve(path)}-v4`;
      },
      when: !pathForV4Plugin,
    },
  ];

  const response = await promptUser(promptOptions);
  const path = pathToV3 || response.path;
  const pathForV4 = pathForV4Plugin || response.pathForV4;

  await isPathStrapiApp(path);
  await migratePlugin(path, resolve(pathForV4));
};

// `strapi-codemods migrate:dependencies`
const migrateDependenciesToV4 = async (path) => {
  const promptOptions = {
    type: 'input',
    name: 'path',
    message: 'Enter the path to your Strapi application or plugin',
    when: !path,
  };

  const response = await promptUser(promptOptions);
  const projectPath = path || response.path;

  await isPathStrapiApp(projectPath);
  await migrateDependencies(projectPath);
};

module.exports = migrate;
