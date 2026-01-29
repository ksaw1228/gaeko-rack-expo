import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { COLORS } from '../constants/config';
import type { CareLog } from '../types';

interface WeightChartProps {
  careLogs: CareLog[];
  onClose: () => void;
}

export default function WeightChart({ careLogs, onClose }: WeightChartProps) {
  // Filter and sort weight logs
  const weightLogs = careLogs
    .filter((log) => log.type === 'WEIGHT' && log.value)
    .map((log) => ({
      date: new Date(log.createdAt),
      weight: parseFloat(log.value!.replace('g', '')),
    }))
    .filter((log) => !isNaN(log.weight))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (weightLogs.length === 0) {
    return (
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>📊 체중 그래프</Text>
            <Pressable onPress={onClose}>
              <Text style={styles.closeButton}>✕</Text>
            </Pressable>
          </View>
          <View style={styles.emptyContent}>
            <Text style={styles.emptyIcon}>⚖️</Text>
            <Text style={styles.emptyText}>체중 기록이 없습니다</Text>
            <Text style={styles.emptySubtext}>체중을 기록하면 그래프로 확인할 수 있어요</Text>
          </View>
        </View>
      </View>
    );
  }

  const screenWidth = Dimensions.get('window').width;

  const labels = weightLogs.map((log) => {
    const month = log.date.getMonth() + 1;
    const day = log.date.getDate();
    return `${month}/${day}`;
  });

  const weights = weightLogs.map((log) => log.weight);
  const latestWeight = weights[weights.length - 1];
  const firstWeight = weights[0];
  const totalChange = latestWeight - firstWeight;
  const avgWeight = (weights.reduce((a, b) => a + b, 0) / weights.length).toFixed(1);

  // Limit to last 10 entries for display
  const displayLabels = labels.slice(-10);
  const displayWeights = weights.slice(-10);

  const chartData = {
    labels: displayLabels,
    datasets: [
      {
        data: displayWeights,
        strokeWidth: 3,
      },
    ],
  };

  const chartConfig = {
    backgroundGradientFrom: COLORS.background,
    backgroundGradientTo: COLORS.background,
    color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    propsForDots: {
      r: '5',
      strokeWidth: '2',
      stroke: COLORS.primary,
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: 'rgba(0, 0, 0, 0.05)',
    },
    decimalPlaces: 0,
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>📊 체중 그래프</Text>
          <Pressable onPress={onClose}>
            <Text style={styles.closeButton}>✕</Text>
          </Pressable>
        </View>

        {/* Stats summary */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>현재</Text>
            <Text style={styles.statValue}>{latestWeight}g</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>평균</Text>
            <Text style={styles.statValue}>{avgWeight}g</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>변화</Text>
            <Text
              style={[
                styles.statValue,
                totalChange > 0
                  ? styles.statPositive
                  : totalChange < 0
                  ? styles.statNegative
                  : {},
              ]}
            >
              {totalChange > 0 ? '+' : ''}
              {totalChange.toFixed(1)}g
            </Text>
          </View>
        </View>

        {/* Chart */}
        <View style={styles.chartContainer}>
          <LineChart
            data={chartData}
            width={screenWidth * 0.85 - 32}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
            withHorizontalLines
            withVerticalLines={false}
            fromZero={false}
            yAxisSuffix="g"
          />
        </View>

        {/* Record count */}
        <Text style={styles.recordCount}>총 {weightLogs.length}회 기록</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    width: '90%',
    maxWidth: 500,
    padding: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  closeButton: {
    fontSize: 20,
    color: COLORS.textSecondary,
    padding: 4,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  statItem: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statPositive: {
    color: COLORS.primary,
  },
  statNegative: {
    color: COLORS.danger,
  },
  chartContainer: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  chart: {
    borderRadius: 8,
  },
  recordCount: {
    textAlign: 'center',
    color: COLORS.textLight,
    fontSize: 14,
    marginTop: 16,
  },
});
