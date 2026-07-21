// components/MokletLogo.tsx
// Logo "ME MOKLET EVENT CENTER" dibuat dengan kode murni (tanpa file gambar eksternal)

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/theme';

type Props = {
  size?: 'small' | 'medium' | 'large';
};

export default function MokletLogo({ size = 'medium' }: Props) {
  const scale = size === 'small' ? 0.65 : size === 'large' ? 1.2 : 1;

  return (
    <View style={styles.container}>
      {/* ME monogram block */}
      <View style={[styles.monogram, { width: 64 * scale, height: 64 * scale, borderRadius: 4 * scale }]}>
        {/* M letter — left half, red */}
        <View style={[styles.mBlock, { borderRadius: 3 * scale }]}>
          <Text style={[styles.mText, { fontSize: 28 * scale, lineHeight: 34 * scale }]}>M</Text>
        </View>
        {/* E letter — right half, dark */}
        <View style={[styles.eBlock, { borderRadius: 3 * scale }]}>
          <Text style={[styles.eText, { fontSize: 28 * scale, lineHeight: 34 * scale }]}>E</Text>
        </View>
      </View>

      {/* Text under logo */}
      <View style={styles.textBlock}>
        <Text style={[styles.mokletText, { fontSize: 13 * scale, letterSpacing: 3 * scale }]}>MOKLET</Text>
        <View style={styles.divider} />
        <Text style={[styles.eventText, { fontSize: 7 * scale, letterSpacing: 1.5 * scale }]}>EVENT CENTER</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 8,
  },
  monogram: {
    flexDirection: 'row',
    overflow: 'hidden',
    backgroundColor: '#1A1A1A',
  },
  mBlock: {
    flex: 1,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mText: {
    fontWeight: '900',
    color: '#FFFFFF',
    fontStyle: 'italic',
  },
  eBlock: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eText: {
    fontWeight: '900',
    color: '#FFFFFF',
    fontStyle: 'italic',
  },
  textBlock: {
    alignItems: 'center',
    gap: 3,
  },
  mokletText: {
    fontWeight: '700',
    color: Colors.textMain,
    letterSpacing: 3,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: Colors.textMain,
    marginVertical: 1,
  },
  eventText: {
    fontWeight: '400',
    color: Colors.textSubtitle,
    letterSpacing: 1.5,
  },
});
