import { Pressable, View, Text, Image, StyleSheet } from 'react-native';
import { COLORS } from '../constants/config';
import type { Cell } from '../types';

interface GeckoCellProps {
  cell: Cell;
  status: 'empty' | 'good' | 'urgent';
  onPress: () => void;
  onLongPress: () => void;
  fixedWidth: boolean;
  isSelected?: boolean;
  isMoveTarget?: boolean;
}

const statusStyles = {
  empty: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.borderDark,
    borderStyle: 'dashed' as const,
  },
  good: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
    borderStyle: 'solid' as const,
  },
  urgent: {
    backgroundColor: COLORS.dangerLight,
    borderColor: COLORS.danger,
    borderStyle: 'solid' as const,
  },
};

const statusBadgeColors: Record<string, string> = {
  good: COLORS.primary,
  urgent: COLORS.danger,
  empty: COLORS.textLight,
};

export default function GeckoCell({
  cell,
  status,
  onPress,
  onLongPress,
  fixedWidth,
  isSelected,
  isMoveTarget,
}: GeckoCellProps) {
  const { gecko } = cell;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.cell,
        fixedWidth ? styles.fixedWidth : styles.flexWidth,
        !gecko?.photoUrl && {
          backgroundColor: statusStyles[status].backgroundColor,
          borderColor: statusStyles[status].borderColor,
          borderStyle: statusStyles[status].borderStyle,
        },
        pressed && styles.pressed,
        isSelected && styles.selected,
        isMoveTarget && styles.moveTarget,
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={500}
    >
      {gecko ? (
        <View style={styles.geckoContent}>
          {gecko.photoUrl ? (
            <>
              <Image source={{ uri: gecko.photoUrl }} style={styles.photo} />
              <View style={styles.photoOverlay} />
              <View style={[styles.statusBadge, { backgroundColor: statusBadgeColors[status] }]} />
              <View style={styles.nameContainer}>
                <Text style={styles.nameOnPhoto} numberOfLines={1}>
                  {gecko.name}
                </Text>
              </View>
            </>
          ) : (
            <>
              <View style={[styles.statusBadge, { backgroundColor: statusBadgeColors[status] }]} />
              <Text style={styles.geckoEmoji}>🦎</Text>
              <Text style={styles.geckoName} numberOfLines={1}>
                {gecko.name}
              </Text>
              {gecko.morph && (
                <Text style={styles.geckoMorph} numberOfLines={1}>
                  {gecko.morph}
                </Text>
              )}
            </>
          )}
        </View>
      ) : (
        <View style={styles.emptyContent}>
          <View style={styles.addIcon}>
            <Text style={styles.addIconText}>+</Text>
          </View>
          <Text style={styles.addText}>추가</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cell: {
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 2,
    marginHorizontal: 4,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fixedWidth: {
    width: 72,
  },
  flexWidth: {
    flex: 1,
    minWidth: 60,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  selected: {
    borderColor: COLORS.primary,
    borderWidth: 3,
    transform: [{ scale: 0.95 }],
    opacity: 0.7,
  },
  moveTarget: {
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  geckoContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photo: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  photoOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 10,
  },
  statusBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: 'white',
    zIndex: 10,
  },
  nameContainer: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
  },
  nameOnPhoto: {
    fontSize: 11,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  geckoEmoji: {
    fontSize: 28,
    marginBottom: 2,
  },
  geckoName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  geckoMorph: {
    fontSize: 9,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  emptyContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  addIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  addIconText: {
    fontSize: 18,
    color: COLORS.textLight,
  },
  addText: {
    fontSize: 10,
    color: COLORS.textLight,
  },
});
