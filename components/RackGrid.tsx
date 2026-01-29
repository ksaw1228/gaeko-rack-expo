import { useMemo } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { COLORS, CARE_THRESHOLD_DAYS } from '../constants/config';
import type { Rack, Gecko, Cell } from '../types';
import GeckoCell from './GeckoCell';

interface RackGridProps {
  rack: Rack;
  onCellPress: (cell: Cell) => void;
  onCellLongPress: (cell: Cell) => void;
  onEditRack: () => void;
  moveMode: boolean;
  selectedGeckoId?: number;
}

function getGeckoStatus(gecko: Gecko | null): 'empty' | 'good' | 'urgent' {
  if (!gecko) return 'empty';

  const now = new Date();
  const threshold = new Date(now.getTime() - CARE_THRESHOLD_DAYS * 24 * 60 * 60 * 1000);

  const lastFeeding = gecko.careLogs?.find((log) => log.type === 'FEEDING');
  const lastCleaning = gecko.careLogs?.find((log) => log.type === 'CLEANING');

  const needsFeeding = !lastFeeding || new Date(lastFeeding.createdAt) < threshold;
  const needsCleaning = !lastCleaning || new Date(lastCleaning.createdAt) < threshold;

  if (needsFeeding || needsCleaning) return 'urgent';
  return 'good';
}

export default function RackGrid({
  rack,
  onCellPress,
  onCellLongPress,
  onEditRack,
  moveMode,
  selectedGeckoId,
}: RackGridProps) {
  const grid = useMemo(() => {
    const cells: Cell[][] = [];
    for (let row = rack.rows; row >= 1; row--) {
      const rowCells: Cell[] = [];
      for (let col = 1; col <= rack.columns; col++) {
        const gecko = rack.geckos?.find((g) => g.row === row && g.column === col) || null;
        rowCells.push({ row, col, gecko });
      }
      cells.push(rowCells);
    }
    return cells;
  }, [rack]);

  const needsScroll = rack.columns > 4;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.dot} />
          <Text style={styles.title}>{rack.name}</Text>
          <Text style={styles.size}>
            {rack.columns}x{rack.rows}
          </Text>
        </View>
        <Pressable style={styles.editButton} onPress={onEditRack}>
          <Text style={styles.editButtonText}>편집</Text>
        </Pressable>
      </View>

      {needsScroll ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={[styles.gridContainer, { minWidth: rack.columns * 80 + 56 }]}>
            {grid.map((rowCells, rowIdx) => (
              <View key={rowIdx} style={styles.row}>
                <View style={styles.rowLabel}>
                  <Text style={styles.rowLabelText}>{rack.rows - rowIdx}층</Text>
                </View>
                {rowCells.map((cell) => (
                  <GeckoCell
                    key={`${rack.id}-${cell.row}-${cell.col}`}
                    cell={cell}
                    status={getGeckoStatus(cell.gecko)}
                    onPress={() => onCellPress(cell)}
                    onLongPress={() => onCellLongPress(cell)}
                    fixedWidth={true}
                    isSelected={moveMode && cell.gecko?.id === selectedGeckoId}
                    isMoveTarget={moveMode && cell.gecko?.id !== selectedGeckoId}
                  />
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
      ) : (
        <View style={styles.gridContainer}>
          {grid.map((rowCells, rowIdx) => (
            <View key={rowIdx} style={styles.row}>
              <View style={styles.rowLabel}>
                <Text style={styles.rowLabelText}>{rack.rows - rowIdx}층</Text>
              </View>
              {rowCells.map((cell) => (
                <GeckoCell
                  key={`${rack.id}-${cell.row}-${cell.col}`}
                  cell={cell}
                  status={getGeckoStatus(cell.gecko)}
                  onPress={() => onCellPress(cell)}
                  onLongPress={() => onCellLongPress(cell)}
                  fixedWidth={false}
                  isSelected={moveMode && cell.gecko?.id === selectedGeckoId}
                  isMoveTarget={moveMode && cell.gecko?.id !== selectedGeckoId}
                />
              ))}
            </View>
          ))}
        </View>
      )}

      {needsScroll && <Text style={styles.scrollHint}>스크롤 가능</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  size: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 8,
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.background,
    borderRadius: 8,
  },
  editButtonText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  gridContainer: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 8,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  rowLabel: {
    width: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowLabelText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  scrollHint: {
    textAlign: 'center',
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 8,
  },
});
