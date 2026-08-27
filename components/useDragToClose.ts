// components/useDragToClose.ts
import { useRef } from 'react';
import { PanResponder, Animated, Easing } from 'react-native';

const DISMISS_DISTANCE = 90;
const DISMISS_VELOCITY = 0.4;
const OVERLAY_FADE_DISTANCE = 320;

/**
 * Custom Hook untuk bottom sheet modal dengan gesture drag-to-close & backdrop dismissal yang responsif.
 */
export function useDragToClose(onClose: () => void) {
  const translateY = useRef(new Animated.Value(0)).current;

  const overlayOpacity = translateY.interpolate({
    inputRange: [0, OVERLAY_FADE_DISTANCE],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => {
        // Aktif saat gesture dominan ditarik ke bawah
        return gs.dy > 3 && Math.abs(gs.dy) > Math.abs(gs.dx);
      },
      onPanResponderGrant: () => {
        translateY.stopAnimation();
      },
      onPanResponderMove: (_, gs) => {
        if (gs.dy > 0) {
          // Gerakan ke bawah: translasi langsung 1:1
          translateY.setValue(gs.dy);
        } else {
          // Gerakan ke atas: berikan tahanan lembut (rubber band)
          translateY.setValue(gs.dy * 0.15);
        }
      },
      onPanResponderRelease: (_, gs) => {
        const isFlickDown = gs.vy > DISMISS_VELOCITY;
        const isPulledEnough = gs.dy > DISMISS_DISTANCE;

        if (isFlickDown || isPulledEnough) {
          // Animasi keluar ke bawah
          Animated.timing(translateY, {
            toValue: 700,
            duration: 180,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }).start(() => {
            translateY.setValue(0);
            onClose();
          });
        } else {
          // Spring kembali ke posisi awal
          Animated.spring(translateY, {
            toValue: 0,
            damping: 18,
            mass: 0.8,
            stiffness: 250,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  return { translateY, overlayOpacity, panResponder };
}
