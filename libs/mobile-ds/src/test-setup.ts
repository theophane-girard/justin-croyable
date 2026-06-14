import { Animated } from 'react-native';

// Les animations JS de React Native (`useNativeDriver: false`) planifient des
// callbacks via des timers. S'ils se déclenchent après le teardown d'un test,
// Jest lève « access ... after it has been torn down » et fait tomber toute la
// suite. On rend `timing`/`spring` synchrones (sans boucle) pour les tests :
// les composants restent rendus dans leur état initial, ce qui suffit aux
// assertions (présence de texte, callbacks).
const synchronousAnimation = () => ({
  start: (callback?: (result: { finished: boolean }) => void) =>
    callback?.({ finished: true }),
  stop: () => undefined,
  reset: () => undefined,
});

jest.spyOn(Animated, 'timing').mockImplementation(synchronousAnimation as never);
jest.spyOn(Animated, 'spring').mockImplementation(synchronousAnimation as never);
