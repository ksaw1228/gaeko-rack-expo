import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Image,
  Modal,
  TextInput,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../constants/config';
import { uploadGeckoPhotoWithDate, setMainPhoto, deletePhoto } from '../services/api';
import type { Photo } from '../types';

interface PhotoGalleryProps {
  geckoId: number;
  photos: Photo[];
  onPhotosChange: (photos: Photo[]) => void;
}

export default function PhotoGallery({ geckoId, photos, onPhotosChange }: PhotoGalleryProps) {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [photoDate, setPhotoDate] = useState('');
  const [uploading, setUploading] = useState(false);

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('권한 필요', '사진 라이브러리 접근 권한이 필요합니다.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadImage(result.assets[0]);
    }
  };

  const uploadImage = async (asset: ImagePicker.ImagePickerAsset) => {
    setUploading(true);
    try {
      const uri = asset.uri;
      const fileName = asset.fileName || `photo_${Date.now()}.jpg`;
      const type = asset.mimeType || 'image/jpeg';
      const takenAt = photoDate || new Date().toISOString().split('T')[0];

      const newPhoto = await uploadGeckoPhotoWithDate(geckoId, uri, fileName, type, takenAt);

      // Add new photo to list and update main photo if needed
      let updatedPhotos: Photo[];
      if (newPhoto.isMain) {
        updatedPhotos = photos.map((p) => ({ ...p, isMain: false }));
        updatedPhotos.unshift(newPhoto);
      } else {
        updatedPhotos = [newPhoto, ...photos];
      }

      onPhotosChange(updatedPhotos);
      setShowUploadModal(false);
      setPhotoDate('');
    } catch (error: any) {
      Alert.alert('오류', '사진 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const handleSetMainPhoto = async (photoId: number) => {
    try {
      await setMainPhoto(photoId);
      const updatedPhotos = photos.map((p) => ({
        ...p,
        isMain: p.id === photoId,
      }));
      onPhotosChange(updatedPhotos);
    } catch (error) {
      Alert.alert('오류', '대표 이미지 설정에 실패했습니다.');
    }
  };

  const handleDeletePhoto = async (photoId: number) => {
    Alert.alert('사진 삭제', '이 사진을 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePhoto(photoId);
            const updatedPhotos = photos.filter((p) => p.id !== photoId);
            onPhotosChange(updatedPhotos);
          } catch (error) {
            Alert.alert('오류', '사진 삭제에 실패했습니다.');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>사진 갤러리</Text>
        <Text style={styles.count}>({photos.length}장)</Text>
      </View>

      <View style={styles.buttonRow}>
        <Pressable style={styles.addButton} onPress={() => setShowUploadModal(true)}>
          <Text style={styles.addButtonText}>📷 사진 추가</Text>
        </Pressable>
        {photos.length > 0 && (
          <Pressable style={styles.viewButton} onPress={() => setShowGalleryModal(true)}>
            <Text style={styles.viewButtonText}>🖼️ 갤러리 보기</Text>
          </Pressable>
        )}
      </View>

      {/* Preview of photos */}
      {photos.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.previewScroll}>
          {photos.slice(0, 5).map((photo) => (
            <View key={photo.id} style={styles.previewItem}>
              <Image source={{ uri: photo.photoUrl }} style={styles.previewImage} />
              {photo.isMain && (
                <View style={styles.mainBadge}>
                  <Text style={styles.mainBadgeText}>대표</Text>
                </View>
              )}
            </View>
          ))}
          {photos.length > 5 && (
            <Pressable style={styles.moreItem} onPress={() => setShowGalleryModal(true)}>
              <Text style={styles.moreText}>+{photos.length - 5}</Text>
            </Pressable>
          )}
        </ScrollView>
      )}

      {/* Upload Modal */}
      <Modal visible={showUploadModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>📷 사진 추가</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>촬영 날짜</Text>
              <TextInput
                style={styles.input}
                value={photoDate || new Date().toISOString().split('T')[0]}
                onChangeText={setPhotoDate}
                placeholder="YYYY-MM-DD"
              />
            </View>

            <Pressable
              style={[styles.uploadArea, uploading && styles.uploadAreaDisabled]}
              onPress={handlePickImage}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color={COLORS.primary} size="large" />
              ) : (
                <>
                  <Text style={styles.uploadIcon}>📷</Text>
                  <Text style={styles.uploadText}>탭하여 사진 선택</Text>
                </>
              )}
            </Pressable>

            <Pressable style={styles.cancelButton} onPress={() => setShowUploadModal(false)}>
              <Text style={styles.cancelButtonText}>취소</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Gallery Modal */}
      <Modal visible={showGalleryModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.galleryModal}>
            <View style={styles.galleryHeader}>
              <Text style={styles.galleryTitle}>🖼️ 사진 갤러리 ({photos.length}장)</Text>
              <Pressable onPress={() => setShowGalleryModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.galleryContent}>
              <View style={styles.galleryGrid}>
                {photos.map((photo) => (
                  <View key={photo.id} style={styles.galleryItem}>
                    <Image source={{ uri: photo.photoUrl }} style={styles.galleryImage} />
                    {photo.isMain && (
                      <View style={styles.mainBadgeLarge}>
                        <Text style={styles.mainBadgeLargeText}>대표</Text>
                      </View>
                    )}
                    <Text style={styles.photoDate}>
                      {new Date(photo.takenAt).toLocaleDateString('ko-KR')}
                    </Text>
                    <View style={styles.photoActions}>
                      {!photo.isMain && (
                        <Pressable
                          style={styles.photoActionButton}
                          onPress={() => handleSetMainPhoto(photo.id)}
                        >
                          <Text style={styles.photoActionText}>⭐</Text>
                        </Pressable>
                      )}
                      <Pressable
                        style={[styles.photoActionButton, styles.deleteButton]}
                        onPress={() => handleDeletePhoto(photo.id)}
                      >
                        <Text style={styles.photoActionText}>✕</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>

              <Pressable
                style={styles.addPhotoButton}
                onPress={() => {
                  setShowGalleryModal(false);
                  setShowUploadModal(true);
                }}
              >
                <Text style={styles.addPhotoButtonText}>📷 새 사진 추가</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  count: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 6,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  addButton: {
    flex: 1,
    backgroundColor: COLORS.primaryLight,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  addButtonText: {
    color: COLORS.primaryDark,
    fontWeight: '600',
    fontSize: 14,
  },
  viewButton: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  viewButtonText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
    fontSize: 14,
  },
  previewScroll: {
    marginTop: 8,
  },
  previewItem: {
    marginRight: 8,
    position: 'relative',
  },
  previewImage: {
    width: 70,
    height: 70,
    borderRadius: 10,
  },
  mainBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mainBadgeText: {
    color: 'white',
    fontSize: 9,
    fontWeight: '600',
  },
  moreItem: {
    width: 70,
    height: 70,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    width: '85%',
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  uploadArea: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  uploadAreaDisabled: {
    opacity: 0.5,
  },
  uploadIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  uploadText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  cancelButton: {
    backgroundColor: COLORS.background,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  galleryModal: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    width: '95%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  galleryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  galleryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  closeButton: {
    fontSize: 20,
    color: COLORS.textSecondary,
    padding: 4,
  },
  galleryContent: {
    padding: 16,
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  galleryItem: {
    width: '47%',
    position: 'relative',
  },
  galleryImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
  },
  mainBadgeLarge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  mainBadgeLargeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  photoDate: {
    position: 'absolute',
    bottom: 28,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    color: 'white',
    fontSize: 11,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  photoActions: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    gap: 4,
  },
  photoActionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    backgroundColor: COLORS.danger,
  },
  photoActionText: {
    color: 'white',
    fontSize: 12,
  },
  addPhotoButton: {
    backgroundColor: COLORS.primaryLight,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  addPhotoButtonText: {
    color: COLORS.primaryDark,
    fontWeight: '600',
    fontSize: 14,
  },
});
