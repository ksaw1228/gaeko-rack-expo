import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import GeckoCell from './GeckoCell';
import type { Cell } from '../types';

interface DraggableGeckoCellProps {
  cell: Cell;
  rackId: number;
  status: 'empty' | 'good' | 'urgent';
  onPress: () => void;
  onDragStart: (cell: Cell, rackId: number) => void;
  onDragEnd: (x: number, y: number) => void;
  fixedWidth: boolean;
  isDragging: boolean;
  isDropTarget: boolean;
}

export default function DraggableGeckoCell({
  cell,
  rackId,
  status,
  onPress,
  onDragStart,
  onDragEnd,
  fixedWidth,
  isDragging,
  isDropTarget,
}: DraggableGeckoCellProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const zIndex = useSharedValue(1);
  const opacity = useSharedValue(1);

  const panGesture = Gesture.Pan()
    .enabled(!!cell.gecko)
    .minDistance(10)
    .onStart(() => {
      scale.value = withSpring(1.15);
      zIndex.value = 1000;
      opacity.value = 0.9;
      runOnJS(onDragStart)(cell, rackId);
    })
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      const finalX = event.absoluteX;
      const finalY = event.absoluteY;

      // Animate back to original position
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      scale.value = withSpring(1);
      zIndex.value = 1;
      opacity.value = 1;

      // Notify parent of drop position
      runOnJS(onDragEnd)(finalX, finalY);
    });

  const tapGesture = Gesture.Tap()
    .onEnd(() => {
      runOnJS(onPress)();
    });

  // Use Exclusive to prefer pan over tap when dragging
  const composedGesture = Gesture.Exclusive(panGesture, tapGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    zIndex: zIndex.value,
    opacity: opacity.value,
  }));

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={[styles.wrapper, animatedStyle]}>
        <GeckoCell
          cell={cell}
          status={status}
          onPress={() => {}}
          onLongPress={() => {}}
          fixedWidth={fixedWidth}
          isSelected={isDragging}
          isMoveTarget={isDropTarget && !isDragging}
        />
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    // Wrapper takes the size of its child
  },
});
