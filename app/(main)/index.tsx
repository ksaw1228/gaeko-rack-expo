import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { getRacks, moveGecko, swapGeckos, ApiError } from '../../services/api';
import { COLORS, CARE_THRESHOLD_DAYS } from '../../constants/config';
import type { Rack, Gecko, Cell } from '../../types';
import RackGrid from '../../components/RackGrid';
import AddRackModal from '../../components/modals/AddRackModal';
import EditRackModal from '../../components/modals/EditRackModal';

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const [racks, setRacks] = useState<Rack[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRack, setEditingRack] = useState<Rack | null>(null);
  const isMounted = useRef(true);

  // Move mode state
  const [moveMode, setMoveMode] = useState(false);
  const [selectedGecko, setSelectedGecko] = useState<{ gecko: Gecko; rackId: number } | null>(null);

  const loadRacks = useCallback(async () => {
    try {
      const data = await getRacks();
      if (isMounted.current) {
        setRacks(data);
      }
    } catch (error: unknown) {
      if (isMounted.current) {
        const message = error instanceof ApiError
          ? error.message
          : '랙 목록을 불러오는데 실패했습니다.';
        Alert.alert('오류', message);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    loadRacks();
    return () => {
      isMounted.current = false;
    };
  }, [loadRacks]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadRacks();
  }, [loadRacks]);

  const handleLogout = async () => {
    Alert.alert('로그아웃', '정말 로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
  };

  const handleCellPress = (cell: Cell, rackId: number) => {
    // If in move mode
    if (moveMode && selectedGecko) {
      handleMoveOrSwap(cell, rackId);
      return;
    }

    // Normal mode - view gecko or create new
    if (cell.gecko) {
      router.push(`/gecko/${cell.gecko.id}?rackId=${rackId}&row=${cell.row}&col=${cell.col}`);
    } else {
      router.push(`/gecko/new?rackId=${rackId}&row=${cell.row}&col=${cell.col}`);
    }
  };

  const handleCellLongPress = (cell: Cell, rackId: number) => {
    if (!cell.gecko) return;

    setMoveMode(true);
    setSelectedGecko({ gecko: cell.gecko, rackId });
    Alert.alert(
      '이동 모드',
      `${cell.gecko.name}을(를) 이동할 위치를 선택하세요.\n빈 칸을 탭하면 이동, 다른 게코가 있는 칸을 탭하면 교환합니다.`,
      [
        {
          text: '취소',
          style: 'cancel',
          onPress: () => {
            setMoveMode(false);
            setSelectedGecko(null);
          },
        },
        { text: '확인', style: 'default' },
      ]
    );
  };

  const handleMoveOrSwap = async (targetCell: Cell, targetRackId: number) => {
    if (!selectedGecko) return;

    const { gecko, rackId: sourceRackId } = selectedGecko;

    // Same cell - cancel
    if (targetRackId === sourceRackId && targetCell.row === gecko.row && targetCell.col === gecko.column) {
      setMoveMode(false);
      setSelectedGecko(null);
      return;
    }

    try {
      if (targetCell.gecko) {
        // Swap with another gecko
        Alert.alert(
          '게코 교환',
          `${gecko.name}과(와) ${targetCell.gecko.name}의 위치를 교환하시겠습니까?`,
          [
            {
              text: '취소',
              style: 'cancel',
              onPress: () => {
                setMoveMode(false);
                setSelectedGecko(null);
              },
            },
            {
              text: '교환',
              onPress: async () => {
                await swapGeckos(gecko.id, targetCell.gecko!.id);
                await loadRacks();
                setMoveMode(false);
                setSelectedGecko(null);
              },
            },
          ]
        );
      } else {
        // Move to empty cell
        await moveGecko(gecko.id, {
          rackId: targetRackId,
          row: targetCell.row,
          column: targetCell.col,
        });
        await loadRacks();
        setMoveMode(false);
        setSelectedGecko(null);
      }
    } catch (error: any) {
      Alert.alert('오류', error.response?.data?.message || '이동에 실패했습니다.');
      setMoveMode(false);
      setSelectedGecko(null);
    }
  };

  const cancelMoveMode = () => {
    setMoveMode(false);
    setSelectedGecko(null);
  };

  // Calculate stats
  const totalGeckos = racks.reduce((sum, rack) => sum + (rack.geckos?.length || 0), 0);
  const urgentCount = racks.reduce((sum, rack) => {
    return (
      sum +
      (rack.geckos?.filter((gecko) => {
        const now = new Date();
        const threshold = new Date(now.getTime() - CARE_THRESHOLD_DAYS * 24 * 60 * 60 * 1000);
        const lastFeeding = gecko.careLogs?.find((log) => log.type === 'FEEDING');
        const lastCleaning = gecko.careLogs?.find((log) => log.type === 'CLEANING');
        const needsFeeding = !lastFeeding || new Date(lastFeeding.createdAt) < threshold;
        const needsCleaning = !lastCleaning || new Date(lastCleaning.createdAt) < threshold;
        return needsFeeding || needsCleaning;
      }).length || 0)
    );
  }, 0);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>안녕하세요, {user?.name}님</Text>
          <Text style={styles.stats}>
            총 {totalGeckos}마리 {urgentCount > 0 && `| 관리 필요 ${urgentCount}마리`}
          </Text>
        </View>
        <View style={styles.headerButtons}>
          <Pressable style={styles.addButton} onPress={() => setShowAddModal(true)}>
            <Text style={styles.addButtonText}>+ 랙 추가</Text>
          </Pressable>
          <Pressable style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>로그아웃</Text>
          </Pressable>
        </View>
      </View>

      {/* Move mode indicator */}
      {moveMode && (
        <View style={styles.moveModeBar}>
          <Text style={styles.moveModeText}>
            🦎 {selectedGecko?.gecko.name} 이동 중 - 목표 위치를 탭하세요
          </Text>
          <Pressable onPress={cancelMoveMode}>
            <Text style={styles.moveModeCancel}>취소</Text>
          </Pressable>
        </View>
      )}

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.primary }]} />
          <Text style={styles.legendText}>정상</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.danger }]} />
          <Text style={styles.legendText}>관리 필요</Text>
        </View>
      </View>

      {/* Rack List */}
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
        {racks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyText}>아직 등록된 랙이 없습니다</Text>
            <Text style={styles.emptySubtext}>상단의 "랙 추가" 버튼을 눌러 시작하세요</Text>
          </View>
        ) : (
          racks.map((rack) => (
            <RackGrid
              key={rack.id}
              rack={rack}
              onCellPress={(cell) => handleCellPress(cell, rack.id)}
              onCellLongPress={(cell) => handleCellLongPress(cell, rack.id)}
              onEditRack={() => setEditingRack(rack)}
              moveMode={moveMode}
              selectedGeckoId={selectedGecko?.gecko.id}
            />
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modals */}
      <AddRackModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={loadRacks}
      />

      {editingRack && (
        <EditRackModal
          visible={!!editingRack}
          rack={editingRack}
          onClose={() => setEditingRack(null)}
          onSave={loadRacks}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  greeting: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  stats: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  logoutButton: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  logoutButtonText: {
    color: COLORS.textSecondary,
    fontWeight: '500',
    fontSize: 14,
  },
  moveModeBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primary,
  },
  moveModeText: {
    color: COLORS.primaryDark,
    fontWeight: '600',
    fontSize: 14,
  },
  moveModeCancel: {
    color: COLORS.danger,
    fontWeight: '600',
    fontSize: 14,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    paddingVertical: 10,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});
