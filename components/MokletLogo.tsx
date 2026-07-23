// components/MokletLogo.tsx
import React from 'react';
import { View, Image, StyleSheet, ImageStyle, ViewStyle } from 'react-native';

type Props = {
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  imageStyle?: ImageStyle;
};

export default function MokletLogo({ size = 'medium', style, imageStyle }: Props) {
  // Dimensions based on logo aspect ratio (approx 16:9 or 1.77:1)
  const baseWidth = size === 'small' ? 160 : size === 'large' ? 260 : 210;
  const baseHeight = size === 'small' ? 90 : size === 'large' ? 146 : 118;

  return (
    <View style={[styles.container, style]}>
      <Image
        source={require('../assets/logo.png')}
        style={[
          styles.logoImage,
          { width: baseWidth, height: baseHeight },
          imageStyle,
        ]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    alignSelf: 'center',
  },
});
