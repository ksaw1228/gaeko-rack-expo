import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { COLORS, getImageUrl } from '../constants/config';
import type { Gecko, Gender } from '../types';
import { GENDERS } from '../types';

interface GeckoDetailProps {
  gecko: Gecko | null;
  isEditing: boolean;
  isNew: boolean;
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
  onShowWeightChart: () => void;
  photoUrl?: string;
  photoCount: number;
}

interface FormData {
  name: string;
  morph: string;
  birthDate: string;
  gender: Gender;
  weight: string;
  notes: string;
}

export default function GeckoDetail({
  gecko,
  isEditing,
  isNew,
  onSave,
  onCancel,
  onShowWeightChart,
  photoUrl,
  photoCount,
}: GeckoDetailProps) {
  const [form, setForm] = useState<FormData>({
    name: '',
    morph: '',
    birthDate: '',
    gender: 'UNKNOWN',
    weight: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (gecko) {
      setForm({
        name: gecko.name || '',
        morph: gecko.morph || '',
        birthDate: gecko.birthDate ? gecko.birthDate.split('T')[0] : '',
        gender: gecko.gender || 'UNKNOWN',
        weight: gecko.weight?.toString() || '',
        notes: gecko.notes || '',
      });
    }
  }, [gecko]);

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      Alert.alert('오류', '이름을 입력해주세요.');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        name: form.name.trim(),
        morph: form.morph.trim() || null,
        birthDate: form.birthDate || null,
        gender: form.gender,
        weight: form.weight ? parseFloat(form.weight) : null,
        notes: form.notes.trim() || null,
      });
    } catch (error: any) {
      Alert.alert('오류', error.response?.data?.message || '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // View mode
  if (!isEditing && gecko) {
    return (
      <View style={styles.container}>
        <View style={styles.infoSection}>
          <View style={styles.photoSection}>
            {photoUrl ? (
              <Image source={{ uri: getImageUrl(photoUrl) }} style={styles.photo} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Text style={styles.photoPlaceholderText}>🦎</Text>
              </View>
            )}
            {photoCount > 1 && (
              <View style={styles.photoCount}>
                <Text style={styles.photoCountText}>+{photoCount - 1}</Text>
              </View>
            )}
          </View>

          <View style={styles.infoContent}>
            <InfoRow label="모프" value={gecko.morph || '-'} />
            <InfoRow
              label="성별"
              value={GENDERS.find((g) => g.value === gecko.gender)?.label || '-'}
            />
            <InfoRow
              label="생년월일"
              value={gecko.birthDate ? gecko.birthDate.split('T')[0] : '-'}
            />
            <View style={styles.weightRow}>
              <Text style={styles.label}>체중:</Text>
              <Text style={styles.value}>{gecko.weight ? `${gecko.weight}g` : '-'}</Text>
              <Pressable style={styles.chartButton} onPress={onShowWeightChart}>
                <Text style={styles.chartButtonText}>📊 그래프</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {gecko.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>메모</Text>
            <Text style={styles.notesText}>{gecko.notes}</Text>
          </View>
        )}
      </View>
    );
  }

  // Edit mode
  return (
    <View style={styles.container}>
      <View style={styles.formSection}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>이름 *</Text>
          <TextInput
            style={styles.input}
            value={form.name}
            onChangeText={(text) => setForm({ ...form, name: text })}
            placeholder="이름을 입력하세요"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>모프</Text>
          <TextInput
            style={styles.input}
            value={form.morph}
            onChangeText={(text) => setForm({ ...form, morph: text })}
            placeholder="예: Harlequin, Dalmatian"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>성별</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={form.gender}
              onValueChange={(value) => setForm({ ...form, gender: value as Gender })}
              style={styles.picker}
            >
              {GENDERS.map((g) => (
                <Picker.Item key={g.value} label={g.label} value={g.value} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>생년월일</Text>
          <TextInput
            style={styles.input}
            value={form.birthDate}
            onChangeText={(text) => setForm({ ...form, birthDate: text })}
            placeholder="YYYY-MM-DD"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>체중 (g)</Text>
          <TextInput
            style={styles.input}
            value={form.weight}
            onChangeText={(text) => setForm({ ...form, weight: text })}
            keyboardType="numeric"
            placeholder="체중을 입력하세요"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>메모</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={form.notes}
            onChangeText={(text) => setForm({ ...form, notes: text })}
            placeholder="메모를 입력하세요"
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.buttonRow}>
          {!isNew && (
            <Pressable style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>취소</Text>
            </Pressable>
          )}
          <Pressable
            style={[styles.saveButton, saving && styles.buttonDisabled, isNew && styles.fullWidth]}
            onPress={handleSubmit}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.saveButtonText}>저장</Text>
            )}
          </Pressable>
        </View>

        {isNew && (
          <Pressable style={styles.backButton} onPress={onCancel}>
            <Text style={styles.backButtonText}>돌아가기</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.label}>{label}:</Text>
      <Text style={styles.value}>{value}</Text>
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
  infoSection: {
    flexDirection: 'row',
  },
  photoSection: {
    marginRight: 16,
  },
  photo: {
    width: 96,
    height: 96,
    borderRadius: 12,
  },
  photoPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  photoPlaceholderText: {
    fontSize: 40,
  },
  photoCount: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  photoCountText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  infoContent: {
    flex: 1,
    justifyContent: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginRight: 6,
  },
  value: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chartButton: {
    marginLeft: 8,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  chartButtonText: {
    fontSize: 12,
    color: COLORS.primaryDark,
    fontWeight: '500',
  },
  notesSection: {
    marginTop: 12,
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 8,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  formSection: {},
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
    color: COLORS.text,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  saveButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  fullWidth: {
    flex: 1,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  backButton: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});
