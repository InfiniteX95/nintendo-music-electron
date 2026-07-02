const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');
const fs = require('fs');
const path = require('path');

const ignoredFiles = [
  'RELEASES',
];

const ignoredExtensions = [
  '.nupkg',
];

function getReleaseFileName(result, artifact) {
  const platformMap = {
    linux: 'linux',
    win32: 'windows',
    darwin: 'macos',
  };

  const platform = platformMap[result.platform] ?? result.platform;
  const arch = result.arch;

  const fileName = path.basename(artifact);

  let extension;
  if (fileName.endsWith('.tar.gz')) {
    extension = '.tar.gz';
  } else {
    extension = path.extname(fileName);
  }

  let suffix = '';

  // Windows Installer
  if (extension === '.exe') {
    suffix = '_setup';
  }

  // Windows portable archive
  if (result.platform === 'win32' && extension === '.zip') {
    suffix = '_portable';
  }

  return `${productName}_${version}_${platform}_${arch}${suffix}${extension}`;
}

module.exports = {
  packagerConfig: {
    asar: true,
    download: {
      mirrorOptions: {
        mirror: "https://github.com/castlabs/electron-releases/releases/download/",
      },
    },
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
    },
    {
      name: '@electron-forge/maker-dmg',
    },
    {
      name: '@electron-forge/maker-zip',
    },
    {
      name: '@electron-forge/maker-deb',
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
  hooks: {
    postMake: async (_, makeResults) => {
      const releaseDir = path.join(__dirname, 'out', 'release');

      fs.rmSync(releaseDir, { recursive: true, force: true });
      fs.mkdirSync(releaseDir, { recursive: true });

      for (const result of makeResults) {
        for (const artifact of result.artifacts) {
          const fileName = path.basename(artifact);
          const destination = path.join(releaseDir, getReleaseFileName(result, artifact));

          if (ignoredFiles.includes(fileName) || ignoredExtensions.some(ext => fileName.endsWith(ext))) {
            continue;
          }

          fs.copyFileSync(artifact, destination);
        }
      }
    },
  },
};
