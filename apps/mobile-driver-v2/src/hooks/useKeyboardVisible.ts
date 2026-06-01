import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

/**
 * Renvoie `true` quand le clavier logiciel est visible à l'écran.
 * Utile pour masquer un footer sticky qui gênerait la saisie.
 *
 * Sur iOS, `keyboardWillShow`/`keyboardWillHide` se déclenchent avant l'animation
 * → meilleur visuel. Sur Android seul `keyboardDidShow`/`Did Hide` est fiable.
 */
export function useKeyboardVisible(): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const sub1 = Keyboard.addListener(showEvent, () => setVisible(true));
    const sub2 = Keyboard.addListener(hideEvent, () => setVisible(false));
    return () => {
      sub1.remove();
      sub2.remove();
    };
  }, []);

  return visible;
}
