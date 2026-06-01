const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [...(config.watchFolders ?? []), workspaceRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Empêche Metro de voir les copies imbriquées de react/react-native sous nativewind
// (sinon "Invalid hook call" / multiple copies of React).
// Bloque aussi la copie hissée à la racine de react-native-gesture-handler
// (gorhom/bottom-sheet a tiré une 2.31.2 alors que v2 locale = 2.28.0 SDK 54),
// sinon le composant natif RNGestureHandlerRootView est enregistré deux fois.
// On cible la copie racine via le chemin "TaxiLink/node_modules/react-native-gesture-handler"
// (la copie locale est sous "TaxiLink/apps/mobile-driver-v2/node_modules/..." donc non matchée).
const blockedNested = [
  /node_modules[\\/]nativewind[\\/]node_modules[\\/]react[\\/].*/,
  /node_modules[\\/]nativewind[\\/]node_modules[\\/]react-native[\\/].*/,
  /node_modules[\\/]nativewind[\\/]node_modules[\\/]react-native-reanimated[\\/].*/,
  /[\\/]TaxiLink[\\/]node_modules[\\/]react-native-gesture-handler[\\/].*/,
];
config.resolver.blockList = Array.isArray(config.resolver.blockList)
  ? [...config.resolver.blockList, ...blockedNested]
  : config.resolver.blockList
    ? [config.resolver.blockList, ...blockedNested]
    : blockedNested;

module.exports = withNativeWind(config, { input: './global.css' });
