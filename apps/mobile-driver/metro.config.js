// Metro doit etre configure manuellement pour npm workspaces :
// 1) watchFolders : ajouter le root du monorepo aux defaults (pour resoudre @taxilink/*)
// 2) nodeModulesPaths : node_modules locaux + root, dans cet ordre
// Cf. https://docs.expo.dev/guides/monorepos/

const { getDefaultConfig } = require('expo/metro-config')
const { withNativeWind } = require('nativewind/metro')
const path = require('path')

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

// Ajout du workspace root aux watchFolders existants (sans casser les defaults Expo).
config.watchFolders = [...(config.watchFolders ?? []), workspaceRoot]

// Resolution des modules : local d'abord, puis fallback workspace root.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]

module.exports = withNativeWind(config, { input: './global.css' })
