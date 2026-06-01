module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }]],
    plugins: [
      'react-native-worklets/plugin',
      // Force expo-router env substitution (EXPO_ROUTER_APP_ROOT etc.).
      // babel-preset-expo n'active ce plugin que si `hasModule('expo-router')`
      // résout depuis sa propre position (root node_modules dans ce monorepo) ;
      // expo-router est ici dans apps/mobile-driver-v2/node_modules, pas hoist,
      // donc on l'ajoute à la main pour que la substitution s'opère bien.
      require('babel-preset-expo/build/expo-router-plugin').expoRouterBabelPlugin,
    ],
  };
};
