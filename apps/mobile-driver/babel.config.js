module.exports = function (api) {
  api.cache(true)
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }]],
    plugins: [
      // Required by react-native-reanimated 4 (transitif via @gorhom/bottom-sheet).
      // Doit etre le DERNIER plugin.
      'react-native-worklets/plugin',
    ],
  }
}
