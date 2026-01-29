import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  Modal,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { COLORS } from '../constants/config';
import { createCareLog, deleteCareLog } from '../services/api';
import type { CareLog, CareType } from '../types';
import { CARE_TYPES, LAYING_OPTIONS } from '../types';

interface CareLogSectionProps {
  geckoId: number;
  careLogs: CareLog[];
  onCareLogsChange: (logs: CareLog[]) => void;
}

export default function CareLogSection({
  geckoId,
  careLogs,
  onCareLogsChange,
}: CareLogSectionProps) {
  const [loadingType, setLoadingType] = useState<CareType | null>(null);
  const [successType, setSuccessType] = useState<CareType | null>(null);
  const [deletingLogId, setDeletingLogId] = useState<number | null>(null);
  const [showAllLogs, setShowAllLogs] = useState(false);

  // Popup states
  const [showWeightPopup, setShowWeightPopup] = useState(false);
  const [showMatingPopup, setShowMatingPopup] = useState(false);
  const [showLayingPopup, setShowLayingPopup] = useState(false);
  const [showOtherPopup, setShowOtherPopup] = useState(false);

  // Input states
  const [weightInput, setWeightInput] = useState('');
  const [matingInput, setMatingInput] = useState('');
  const [otherInput, setOtherInput] = useState('');

  // Past date state
  const [usePastDate, setUsePastDate] = useState(false);
  const [customDate, setCustomDate] = useState('');
  const [customTime, setCustomTime] = useState('');

  const handleCareLog = async (type: CareType, note = '', value = '') => {
    setLoadingType(type);
    setSuccessType(null);

    try {
      const logData: any = { type, note, value };

      if (usePastDate && customDate && customTime) {
        logData.createdAt = new Date(`${customDate}T${customTime}:00`).toISOString();
      }

      const newLog = await createCareLog(geckoId, logData);

      const updated = [newLog, ...careLogs].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      onCareLogsChange(updated);

      setSuccessType(type);
      setTimeout(() => setSuccessType(null), 2000);

      if (usePastDate) {
        setUsePastDate(false);
        setCustomDate('');
        setCustomTime('');
      }
    } catch (error: any) {
      Alert.alert('오류', '기록 추가에 실패했습니다.');
    } finally {
      setLoadingType(null);
    }
  };

  const handleCareButtonClick = (type: CareType) => {
    if (['FEEDING', 'CLEANING', 'SHEDDING'].includes(type)) {
      handleCareLog(type);
    } else if (type === 'WEIGHT') {
      setWeightInput('');
      setShowWeightPopup(true);
    } else if (type === 'MATING') {
      setMatingInput('');
      setShowMatingPopup(true);
    } else if (type === 'LAYING') {
      setShowLayingPopup(true);
    } else if (type === 'OTHER') {
      setOtherInput('');
      setShowOtherPopup(true);
    }
  };

  const handleWeightSubmit = () => {
    if (!weightInput) {
      Alert.alert('오류', '체중을 입력해주세요.');
      return;
    }
    handleCareLog('WEIGHT', '', weightInput + 'g');
    setShowWeightPopup(false);
    setWeightInput('');
  };

  const handleMatingSubmit = () => {
    handleCareLog('MATING', matingInput ? `수컷: ${matingInput}` : '', '');
    setShowMatingPopup(false);
    setMatingInput('');
  };

  const handleLayingSubmit = (eggType: string) => {
    handleCareLog('LAYING', eggType, '');
    setShowLayingPopup(false);
  };

  const handleOtherSubmit = () => {
    if (!otherInput.trim()) {
      Alert.alert('오류', '내용을 입력해주세요.');
      return;
    }
    handleCareLog('OTHER', otherInput, '');
    setShowOtherPopup(false);
    setOtherInput('');
  };

  const handleDeleteLog = async (logId: number) => {
    Alert.alert('기록 삭제', '이 기록을 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          setDeletingLogId(logId);
          try {
            await deleteCareLog(logId);
            onCareLogsChange(careLogs.filter((log) => log.id !== logId));
          } catch (error) {
            Alert.alert('오류', '삭제에 실패했습니다.');
          } finally {
            setDeletingLogId(null);
          }
        },
      },
    ]);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('ko-KR');
  };

  const getDaysSince = (dateStr: string) => {
    const days = Math.floor(
      (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)
    );
    return days;
  };

  const formatLogDisplay = (log: CareLog) => {
    const typeInfo = CARE_TYPES.find((t) => t.value === log.type);
    let display = typeInfo?.label || log.type;
    if (log.value) display += ` (${log.value})`;
    if (log.note) display += ` - ${log.note}`;
    return { icon: typeInfo?.icon || '📝', display };
  };

  const initializeDateTimeInputs = () => {
    const now = new Date();
    setCustomDate(now.toISOString().split('T')[0]);
    setCustomTime(now.toTimeString().slice(0, 5));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>관리 기록 추가</Text>

      {/* Past date option */}
      <View style={styles.pastDateSection}>
        <Pressable
          style={styles.checkboxRow}
          onPress={() => {
            const newValue = !usePastDate;
            setUsePastDate(newValue);
            if (newValue) initializeDateTimeInputs();
          }}
        >
          <View style={[styles.checkbox, usePastDate && styles.checkboxChecked]}>
            {usePastDate && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>과거 날짜로 기록</Text>
        </Pressable>

        {usePastDate && (
          <View style={styles.dateTimeRow}>
            <TextInput
              style={[styles.dateInput, styles.dateField]}
              value={customDate}
              onChangeText={setCustomDate}
              placeholder="YYYY-MM-DD"
            />
            <TextInput
              style={[styles.dateInput, styles.timeField]}
              value={customTime}
              onChangeText={setCustomTime}
              placeholder="HH:MM"
            />
          </View>
        )}
      </View>

      {/* Care type buttons */}
      <View style={styles.buttonGrid}>
        {CARE_TYPES.map((type) => {
          const isLoading = loadingType === type.value;
          const isSuccess = successType === type.value;

          return (
            <Pressable
              key={type.value}
              style={[
                styles.careButton,
                isSuccess && styles.careButtonSuccess,
                isLoading && styles.careButtonDisabled,
              ]}
              onPress={() => handleCareButtonClick(type.value)}
              disabled={isLoading}
            >
              <Text style={styles.careButtonIcon}>
                {isLoading ? '⏳' : isSuccess ? '✅' : type.icon}
              </Text>
              <Text style={styles.careButtonLabel}>
                {isSuccess ? '완료!' : type.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Recent logs */}
      <Text style={styles.sectionTitle}>
        최근 기록 <Text style={styles.logCount}>({careLogs.length}건)</Text>
      </Text>

      {careLogs.length > 0 ? (
        <>
          {careLogs.slice(0, 5).map((log, index) => {
            const { icon, display } = formatLogDisplay(log);
            const daysSince = getDaysSince(log.createdAt);
            const isDeleting = deletingLogId === log.id;
            const isNew = index === 0 && successType;

            return (
              <View
                key={log.id}
                style={[styles.logItem, isNew && styles.logItemNew, isDeleting && styles.logItemDeleting]}
              >
                <Text style={styles.logIcon}>{icon}</Text>
                <View style={styles.logContent}>
                  <Text style={styles.logDisplay} numberOfLines={1}>
                    {display}
                  </Text>
                  <Text style={styles.logDate}>{formatDate(log.createdAt)}</Text>
                </View>
                <View
                  style={[
                    styles.daysBadge,
                    daysSince >= 3 ? styles.daysBadgeUrgent : styles.daysBadgeGood,
                  ]}
                >
                  <Text
                    style={[
                      styles.daysBadgeText,
                      daysSince >= 3 ? styles.daysBadgeTextUrgent : styles.daysBadgeTextGood,
                    ]}
                  >
                    {daysSince === 0 ? '오늘' : `${daysSince}일 전`}
                  </Text>
                </View>
                <Pressable
                  style={styles.deleteLogButton}
                  onPress={() => handleDeleteLog(log.id)}
                  disabled={isDeleting}
                >
                  <Text style={styles.deleteLogButtonText}>{isDeleting ? '⏳' : '✕'}</Text>
                </Pressable>
              </View>
            );
          })}

          {careLogs.length > 5 && (
            <Pressable style={styles.showAllButton} onPress={() => setShowAllLogs(true)}>
              <Text style={styles.showAllButtonText}>
                전체 기록 보기 ({careLogs.length}건) →
              </Text>
            </Pressable>
          )}
        </>
      ) : (
        <Text style={styles.emptyText}>아직 기록이 없습니다</Text>
      )}

      {/* Weight Popup */}
      <Modal visible={showWeightPopup} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.popup}>
            <Text style={styles.popupTitle}>⚖️ 체중 기록</Text>
            {usePastDate && customDate && (
              <Text style={styles.popupDateInfo}>📅 {customDate} {customTime}</Text>
            )}
            <View style={styles.weightInputRow}>
              <TextInput
                style={styles.weightInput}
                value={weightInput}
                onChangeText={setWeightInput}
                keyboardType="numeric"
                placeholder="0"
                autoFocus
              />
              <Text style={styles.weightUnit}>g</Text>
            </View>
            <View style={styles.popupButtons}>
              <Pressable
                style={styles.popupCancelButton}
                onPress={() => setShowWeightPopup(false)}
              >
                <Text style={styles.popupCancelButtonText}>취소</Text>
              </Pressable>
              <Pressable style={styles.popupConfirmButton} onPress={handleWeightSubmit}>
                <Text style={styles.popupConfirmButtonText}>기록</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Mating Popup */}
      <Modal visible={showMatingPopup} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.popup}>
            <Text style={styles.popupTitle}>💕 메이팅 기록</Text>
            {usePastDate && customDate && (
              <Text style={styles.popupDateInfo}>📅 {customDate} {customTime}</Text>
            )}
            <Text style={styles.popupLabel}>메이팅한 수컷 (선택)</Text>
            <TextInput
              style={styles.popupInput}
              value={matingInput}
              onChangeText={setMatingInput}
              placeholder="수컷 이름 입력"
              autoFocus
            />
            <View style={styles.popupButtons}>
              <Pressable
                style={styles.popupCancelButton}
                onPress={() => setShowMatingPopup(false)}
              >
                <Text style={styles.popupCancelButtonText}>취소</Text>
              </Pressable>
              <Pressable style={styles.popupConfirmButton} onPress={handleMatingSubmit}>
                <Text style={styles.popupConfirmButtonText}>기록</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Laying Popup */}
      <Modal visible={showLayingPopup} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.popup}>
            <Text style={styles.popupTitle}>🥚 산란 기록</Text>
            {usePastDate && customDate && (
              <Text style={styles.popupDateInfo}>📅 {customDate} {customTime}</Text>
            )}
            {LAYING_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                style={styles.layingOption}
                onPress={() => handleLayingSubmit(option.value)}
              >
                <Text style={styles.layingOptionText}>{option.label}</Text>
              </Pressable>
            ))}
            <Pressable
              style={styles.popupCancelButtonFull}
              onPress={() => setShowLayingPopup(false)}
            >
              <Text style={styles.popupCancelButtonText}>취소</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Other Popup */}
      <Modal visible={showOtherPopup} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.popup}>
            <Text style={styles.popupTitle}>📝 기타 기록</Text>
            {usePastDate && customDate && (
              <Text style={styles.popupDateInfo}>📅 {customDate} {customTime}</Text>
            )}
            <TextInput
              style={[styles.popupInput, styles.textArea]}
              value={otherInput}
              onChangeText={setOtherInput}
              placeholder="내용을 입력하세요"
              multiline
              numberOfLines={3}
              autoFocus
            />
            <View style={styles.popupButtons}>
              <Pressable
                style={styles.popupCancelButton}
                onPress={() => setShowOtherPopup(false)}
              >
                <Text style={styles.popupCancelButtonText}>취소</Text>
              </Pressable>
              <Pressable style={styles.popupConfirmButton} onPress={handleOtherSubmit}>
                <Text style={styles.popupConfirmButtonText}>기록</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* All Logs Modal */}
      <Modal visible={showAllLogs} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.allLogsModal}>
            <View style={styles.allLogsHeader}>
              <Text style={styles.allLogsTitle}>📋 전체 기록 ({careLogs.length}건)</Text>
              <Pressable onPress={() => setShowAllLogs(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </Pressable>
            </View>
            <ScrollView style={styles.allLogsList}>
              {careLogs.map((log) => {
                const { icon, display } = formatLogDisplay(log);
                const daysSince = getDaysSince(log.createdAt);
                const isDeleting = deletingLogId === log.id;

                return (
                  <View
                    key={log.id}
                    style={[styles.logItem, isDeleting && styles.logItemDeleting]}
                  >
                    <Text style={styles.logIcon}>{icon}</Text>
                    <View style={styles.logContent}>
                      <Text style={styles.logDisplay} numberOfLines={1}>
                        {display}
                      </Text>
                      <Text style={styles.logDate}>{formatDate(log.createdAt)}</Text>
                    </View>
                    <View
                      style={[
                        styles.daysBadge,
                        daysSince >= 3 ? styles.daysBadgeUrgent : styles.daysBadgeGood,
                      ]}
                    >
                      <Text
                        style={[
                          styles.daysBadgeText,
                          daysSince >= 3 ? styles.daysBadgeTextUrgent : styles.daysBadgeTextGood,
                        ]}
                      >
                        {daysSince === 0 ? '오늘' : `${daysSince}일 전`}
                      </Text>
                    </View>
                    <Pressable
                      style={styles.deleteLogButton}
                      onPress={() => handleDeleteLog(log.id)}
                      disabled={isDeleting}
                    >
                      <Text style={styles.deleteLogButtonText}>
                        {isDeleting ? '⏳' : '✕'}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  logCount: {
    color: COLORS.textSecondary,
    fontWeight: 'normal',
  },
  pastDateSection: {
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 4,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkmark: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 14,
    color: COLORS.text,
  },
  dateTimeRow: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 8,
  },
  dateInput: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  dateField: {
    flex: 1,
  },
  timeField: {
    width: 100,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 8,
  },
  careButton: {
    width: '23%',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  careButtonSuccess: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  careButtonDisabled: {
    opacity: 0.5,
  },
  careButtonIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  careButtonLabel: {
    fontSize: 11,
    color: COLORS.text,
    fontWeight: '500',
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
  },
  logItemNew: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  logItemDeleting: {
    opacity: 0.5,
  },
  logIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  logContent: {
    flex: 1,
  },
  logDisplay: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  logDate: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  daysBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  daysBadgeGood: {
    backgroundColor: COLORS.primaryLight,
  },
  daysBadgeUrgent: {
    backgroundColor: COLORS.dangerLight,
  },
  daysBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  daysBadgeTextGood: {
    color: COLORS.primaryDark,
  },
  daysBadgeTextUrgent: {
    color: COLORS.danger,
  },
  deleteLogButton: {
    marginLeft: 8,
    padding: 4,
  },
  deleteLogButtonText: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  showAllButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  showAllButtonText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  emptyText: {
    color: COLORS.textLight,
    textAlign: 'center',
    paddingVertical: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popup: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    width: '85%',
    maxWidth: 320,
  },
  popupTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  popupDateInfo: {
    fontSize: 12,
    color: COLORS.primaryDark,
    backgroundColor: COLORS.primaryLight,
    textAlign: 'center',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  popupLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  popupInput: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  weightInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  weightInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  weightUnit: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
    marginLeft: 8,
  },
  popupButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  popupCancelButton: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  popupCancelButtonFull: {
    backgroundColor: COLORS.background,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  popupCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  popupConfirmButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  popupConfirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  layingOption: {
    backgroundColor: COLORS.background,
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    alignItems: 'center',
  },
  layingOptionText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  allLogsModal: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    width: '95%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  allLogsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  allLogsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  closeButton: {
    fontSize: 20,
    color: COLORS.textSecondary,
    padding: 4,
  },
  allLogsList: {
    padding: 16,
  },
});
