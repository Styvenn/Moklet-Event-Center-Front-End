import { useRef } from 'react';
import { Animated, PanResponder } from 'react-native';

const DRAG_DISMISS_THRESHOLD = 80;
const DRAG_MAX_OPACITY = 300;

export function useDragToClose(onClose: () => void) {
  const translateY = useRef(new Animated.Value(0)).current;

  const overlayOpacity = translateY.interpolate({
    inputRange: [0, DRAG_MAX_OPACITY],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => gs.dy > 2,
      onPanResponderMove: (_, gs) => {
        if (gs.dy > 0) translateY.setValue(gs.dy);
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > DRAG_DISMISS_THRESHOLD) {
          Animated.timing(translateY, {
            toValue: 700,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            translateY.setValue(0);
            onClose();
          });
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 4,
          }).start();
        }
      },
    })
  ).current;

  return { translateY, overlayOpacity, panResponder };
}
