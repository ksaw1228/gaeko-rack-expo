import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { COLORS } from '../../constants/config';
import { createRack } from '../../services/api';

interface AddRackModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
}

export default function AddRackModal({ visible, onClose, onSave }: AddRackModalProps) {
  const [name, setName] = useState('');
  const [rows, setRows] = useState('3');
  const [columns, setColumns] = useState('4');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('오류', '랙 이름을 입력해주세요.');
      return;
    }

    const rowsNum = parseInt(rows, 10);
    const colsNum = parseInt(columns, 10);

    if (isNaN(rowsNum) || rowsNum < 1 || rowsNum > 20) {
      Alert.alert('오류', '행 수는 1~20 사이여야 합니다.');
      return;
    }

    if (isNaN(colsNum) || colsNum < 1 || colsNum > 20) {
      Alert.alert('오류', '열 수는 1~20 사이여야 합니다.');
      return;
    }

    setSaving(true);
    try {
      await createRack({
        name: name.trim(),
        rows: rowsNum,
        columns: colsNum,
      });
      onSave();
      handleClose();
    } catch (error: any) {
      Alert.alert('오류', error.response?.data?.message || '랙 생성에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setName('');
    setRows('3');
    setColumns('4');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>새 랙 추가</Text>
            <Pressable onPress={handleClose}>
              <Text style={styles.closeButton}>✕</Text>
            </Pressable>
          </View>

          <View style={styles.content}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>랙 이름 *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="예: 크레스티드 랙 1"
                autoFocus
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfInput]}>
                <Text style={styles.label}>열 (가로)</Text>
                <TextInput
                  style={styles.input}
                  value={columns}
                  onChangeText={setColumns}
                  keyboardType="number-pad"
                  placeholder="4"
                />
              </View>
              <View style={[styles.inputGroup, styles.halfInput]}>
                <Text style={styles.label}>행 (세로)</Text>
                <TextInput
                  style={styles.input}
                  value={rows}
                  onChangeText={setRows}
                  keyboardType="number-pad"
                  placeholder="3"
                />
              </View>
            </View>

            <Text style={styles.preview}>
              미리보기: {columns || '0'} x {rows || '0'} = {(parseInt(columns) || 0) * (parseInt(rows) || 0)}칸
            </Text>

            <View style={styles.buttonRow}>
              <Pressable style={styles.cancelButton} onPress={handleClose}>
                <Text style={styles.cancelButtonText}>취소</Text>
              </Pressable>
              <Pressable
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleSubmit}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>생성</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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
  content: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  preview: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
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
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
