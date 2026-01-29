import { useState, useEffect } from 'react';
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
import { updateRack, deleteRack } from '../../services/api';
import type { Rack } from '../../types';

interface EditRackModalProps {
  visible: boolean;
  rack: Rack;
  onClose: () => void;
  onSave: () => void;
}

export default function EditRackModal({ visible, rack, onClose, onSave }: EditRackModalProps) {
  const [name, setName] = useState('');
  const [rows, setRows] = useState('');
  const [columns, setColumns] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (rack) {
      setName(rack.name);
      setRows(rack.rows.toString());
      setColumns(rack.columns.toString());
    }
  }, [rack]);

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

    // Check if any geckos would be outside the new dimensions
    const geckosOutside = rack.geckos?.filter(
      (gecko) => gecko.row > rowsNum || gecko.column > colsNum
    );

    if (geckosOutside && geckosOutside.length > 0) {
      Alert.alert(
        '주의',
        `${geckosOutside.length}마리의 게코가 새 크기 범위 밖에 있습니다. 먼저 해당 게코들을 이동해주세요.`,
        [{ text: '확인' }]
      );
      return;
    }

    setSaving(true);
    try {
      await updateRack(rack.id, {
        name: name.trim(),
        rows: rowsNum,
        columns: colsNum,
      });
      onSave();
      onClose();
    } catch (error: any) {
      Alert.alert('오류', error.response?.data?.message || '랙 수정에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    const geckoCount = rack.geckos?.length || 0;

    if (geckoCount > 0) {
      Alert.alert(
        '경고',
        `이 랙에 ${geckoCount}마리의 게코가 있습니다. 삭제하면 모든 게코와 기록이 함께 삭제됩니다. 정말 삭제하시겠습니까?`,
        [
          { text: '취소', style: 'cancel' },
          {
            text: '삭제',
            style: 'destructive',
            onPress: confirmDelete,
          },
        ]
      );
    } else {
      Alert.alert('랙 삭제', '이 랙을 삭제하시겠습니까?', [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: confirmDelete,
        },
      ]);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await deleteRack(rack.id);
      onSave();
      onClose();
    } catch (error: any) {
      Alert.alert('오류', error.response?.data?.message || '랙 삭제에 실패했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>랙 수정</Text>
            <Pressable onPress={onClose}>
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
                placeholder="랙 이름"
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
                />
              </View>
              <View style={[styles.inputGroup, styles.halfInput]}>
                <Text style={styles.label}>행 (세로)</Text>
                <TextInput
                  style={styles.input}
                  value={rows}
                  onChangeText={setRows}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            <View style={styles.info}>
              <Text style={styles.infoText}>
                현재 게코 수: {rack.geckos?.length || 0}마리
              </Text>
            </View>

            <View style={styles.buttonRow}>
              <Pressable style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>취소</Text>
              </Pressable>
              <Pressable
                style={[styles.saveButton, saving && styles.buttonDisabled]}
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

            <Pressable
              style={[styles.deleteButton, deleting && styles.buttonDisabled]}
              onPress={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.deleteButtonText}>랙 삭제</Text>
              )}
            </Pressable>
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
  info: {
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
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
  buttonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  deleteButton: {
    backgroundColor: COLORS.danger,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
