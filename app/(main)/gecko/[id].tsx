import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  getGecko,
  createGecko,
  updateGecko,
  deleteGecko,
  getGeckoLogs,
  getGeckoPhotos,
} from '../../../services/api';
import { COLORS } from '../../../constants/config';
import type { Gecko, CareLog, Photo } from '../../../types';
import GeckoDetail from '../../../components/GeckoDetail';
import CareLogSection from '../../../components/CareLogSection';
import PhotoGallery from '../../../components/PhotoGallery';
import WeightChart from '../../../components/WeightChart';

// Safe parseInt with NaN check
const safeParseInt = (value: string | undefined): number | null => {
  if (!value) return null;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? null : parsed;
};

export default function GeckoScreen() {
  const params = useLocalSearchParams<{
    id: string;
    rackId?: string;
    row?: string;
    col?: string;
  }>();

  const isNew = params.id === 'new';
  const geckoId = isNew ? null : safeParseInt(params.id);
  const rackId = safeParseInt(params.rackId);
  const row = safeParseInt(params.row);
  const col = safeParseInt(params.col);

  const [gecko, setGecko] = useState<Gecko | null>(null);
  const [careLogs, setCareLogs] = useState<CareLog[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [isEditing, setIsEditing] = useState(isNew);
  const [showWeightChart, setShowWeightChart] = useState(false);
  const isMounted = useRef(true);

  const loadGeckoData = useCallback(async () => {
    if (!geckoId) return;

    try {
      const [geckoData, logsData, photosData] = await Promise.all([
        getGecko(geckoId),
        getGeckoLogs(geckoId),
        getGeckoPhotos(geckoId),
      ]);
      if (isMounted.current) {
        setGecko(geckoData);
        setCareLogs(logsData);
        setPhotos(photosData);
      }
    } catch (error: unknown) {
      if (isMounted.current) {
        Alert.alert('오류', '게코 정보를 불러오는데 실패했습니다.');
        router.back();
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [geckoId]);

  useEffect(() => {
    isMounted.current = true;
    loadGeckoData();
    return () => {
      isMounted.current = false;
    };
  }, [loadGeckoData]);

  const handleSave = async (data: any) => {
    try {
      if (isNew) {
        await createGecko({
          ...data,
          rackId,
          row,
          column: col,
        });
      } else if (gecko) {
        await updateGecko(gecko.id, data);
      }
      router.back();
    } catch (error: any) {
      throw error;
    }
  };

  const handleDelete = async () => {
    if (!gecko) return;

    Alert.alert('개체 삭제', '정말 삭제하시겠습니까? 모든 관리 기록과 사진이 삭제됩니다.', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteGecko(gecko.id);
            router.back();
          } catch (error: any) {
            Alert.alert('오류', '삭제에 실패했습니다.');
          }
        },
      },
    ]);
  };

  const handleCareLogChange = (logs: CareLog[]) => {
    setCareLogs(logs);
  };

  const handlePhotosChange = (newPhotos: Photo[]) => {
    setPhotos(newPhotos);
    // Update main photo URL in gecko
    const mainPhoto = newPhotos.find((p) => p.isMain);
    if (gecko && mainPhoto) {
      setGecko({ ...gecko, photoUrl: mainPhoto.photoUrl });
    }
  };

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
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.closeButton} onPress={() => router.back()}>
          <Text style={styles.closeButtonText}>X</Text>
        </Pressable>
        <Text style={styles.title}>
          {isNew ? '새 개체 등록' : gecko?.name || '게코'}
        </Text>
        <View style={styles.headerRight}>
          {gecko && !isEditing && (
            <Pressable style={styles.editButton} onPress={() => setIsEditing(true)}>
              <Text style={styles.editButtonText}>수정</Text>
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Gecko Detail / Edit Form */}
        <GeckoDetail
          gecko={gecko}
          isEditing={isEditing}
          isNew={isNew}
          onSave={handleSave}
          onCancel={() => {
            if (isNew) {
              router.back();
            } else {
              setIsEditing(false);
            }
          }}
          onShowWeightChart={() => setShowWeightChart(true)}
          photoUrl={photos.find((p) => p.isMain)?.photoUrl || gecko?.photoUrl}
          photoCount={photos.length}
        />

        {/* Only show additional sections for existing geckos in view mode */}
        {gecko && !isEditing && (
          <>
            {/* Photo Gallery */}
            <PhotoGallery
              geckoId={gecko.id}
              photos={photos}
              onPhotosChange={handlePhotosChange}
            />

            {/* Care Log Section */}
            <CareLogSection
              geckoId={gecko.id}
              careLogs={careLogs}
              onCareLogsChange={handleCareLogChange}
            />

            {/* Delete Button */}
            <Pressable style={styles.deleteButton} onPress={handleDelete}>
              <Text style={styles.deleteButtonText}>개체 삭제</Text>
            </Pressable>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Weight Chart Modal */}
      {showWeightChart && (
        <WeightChart careLogs={careLogs} onClose={() => setShowWeightChart(false)} />
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerRight: {
    width: 36,
  },
  editButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  editButtonText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  deleteButton: {
    backgroundColor: COLORS.danger,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});
