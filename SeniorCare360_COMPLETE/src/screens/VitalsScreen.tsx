import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, Alert, RefreshControl, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { vitalsService } from '../services/api';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../theme';

const { width } = Dimensions.get('window');

const VITAL_TYPES = [
  { key: 'blood_pressure', label: 'Blood Pressure', icon: 'heart', unit: 'mmHg', color: Colors.danger, hasSecondary: true, primaryLabel: 'Systolic', secondaryLabel: 'Diastolic' },
  { key: 'glucose', label: 'Blood Glucose', icon: 'water', unit: 'mg/dL', color: Colors.accent, hasSecondary: false },
  { key: 'heart_rate', label: 'Heart Rate', icon: 'pulse', unit: 'bpm', color: Colors.emergency, hasSecondary: false },
  { key: 'weight', label: 'Weight', icon: 'scale', unit: 'lbs', color: Colors.primary, hasSecondary: false },
  { key: 'oxygen_saturation', label: 'Oxygen (SpO2)', icon: 'cellular', unit: '%', color: Colors.success, hasSecondary: false },
  { key: 'temperature', label: 'Temperature', icon: 'thermometer', unit: '°F', color: Colors.warning, hasSecondary: false },
];

export default function VitalsScreen() {
  const [vitals, setVitals] = useState<any[]>([]);
  const [selectedType, setSelectedType] = useState(VITAL_TYPES[0]);
  const [showModal, setShowModal] = useState(false);
  const [primaryVal, setPrimaryVal] = useState('');
  const [secondaryVal, setSecondaryVal] = useState('');
  const [notes, setNotes] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadVitals = useCallback(async () => {
    try {
      const data = await vitalsService.list(selectedType.key);
      setVitals(data);
    } catch {}
  }, [selectedType.key]);

  useEffect(() => { loadVitals(); }, [selectedType]);
  const onRefresh = async () => { setRefreshing(true); await loadVitals(); setRefreshing(false); };

  const handleLog = async () => {
    if (!primaryVal) { Alert.alert('Required', `Enter ${selectedType.primaryLabel || 'value'}`); return; }
    try {
      await vitalsService.log({
        vital_type: selectedType.key,
        value_primary: parseFloat(primaryVal),
        value_secondary: secondaryVal ? parseFloat(secondaryVal) : null,
        unit: selectedType.unit,
        notes: notes || null,
      });
      await loadVitals();
      setShowModal(false);
      setPrimaryVal(''); setSecondaryVal(''); setNotes('');
    } catch { Alert.alert('Error', 'Could not save reading.'); }
  };

  // Chart data from last 10 readings
  const chartVitals = vitals.slice(0, 10).reverse();
  const chartData = chartVitals.map(v => v.value_primary);
  const chartLabels = chartVitals.map(v =>
    new Date(v.recorded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  );

  const latestVital = vitals[0];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>❤️ Health Vitals</Text>
        <Text style={styles.headerSub}>Track your health readings</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Type selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeRow}>
          {VITAL_TYPES.map(vt => (
            <TouchableOpacity
              key={vt.key}
              style={[styles.typeBtn, selectedType.key === vt.key && { backgroundColor: vt.color }]}
              onPress={() => setSelectedType(vt)}
            >
              <Ionicons name={vt.icon as any} size={18} color={selectedType.key === vt.key ? Colors.white : vt.color} />
              <Text style={[styles.typeBtnText, selectedType.key === vt.key && { color: Colors.white }]}>
                {vt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Latest reading */}
        {latestVital ? (
          <View style={[styles.latestCard, { borderTopColor: selectedType.color }]}>
            <Text style={styles.latestLabel}>Latest Reading</Text>
            <Text style={[styles.latestValue, { color: selectedType.color }]}>
              {latestVital.value_primary}
              {selectedType.hasSecondary && latestVital.value_secondary ? `/${latestVital.value_secondary}` : ''}
              {' '}{selectedType.unit}
            </Text>
            <Text style={styles.latestDate}>
              {new Date(latestVital.recorded_at).toLocaleString()}
            </Text>
          </View>
        ) : (
          <View style={styles.noDataCard}>
            <Ionicons name="analytics-outline" size={40} color={Colors.border} />
            <Text style={styles.noDataText}>No {selectedType.label} readings yet</Text>
          </View>
        )}

        {/* Chart */}
        {chartData.length > 1 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>{selectedType.label} Trend</Text>
            <LineChart
              data={{
                labels: chartLabels,
                datasets: [{ data: chartData, color: () => selectedType.color, strokeWidth: 3 }],
              }}
              width={width - Spacing.lg * 2 - Spacing.lg * 2}
              height={180}
              chartConfig={{
                backgroundColor: Colors.white,
                backgroundGradientFrom: Colors.white,
                backgroundGradientTo: Colors.white,
                decimalPlaces: 0,
                color: () => selectedType.color,
                labelColor: () => Colors.textSecondary,
                style: { borderRadius: 8 },
                propsForDots: { r: '5', strokeWidth: '2', stroke: selectedType.color },
              }}
              bezier
              style={{ borderRadius: 8, marginTop: 8 }}
            />
          </View>
        )}

        {/* History list */}
        <Text style={styles.historyTitle}>Recent Readings</Text>
        {vitals.slice(0, 20).map(v => (
          <View key={v.id} style={styles.historyRow}>
            <View style={[styles.historyDot, { backgroundColor: selectedType.color }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.historyValue}>
                {v.value_primary}
                {selectedType.hasSecondary && v.value_secondary ? `/${v.value_secondary}` : ''}
                {' '}{v.unit}
              </Text>
              {v.notes && <Text style={styles.historyNotes}>{v.notes}</Text>}
            </View>
            <Text style={styles.historyDate}>
              {new Date(v.recorded_at).toLocaleDateString()}
            </Text>
          </View>
        ))}
        <View style={{ height: 32 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: selectedType.color }]}
        onPress={() => setShowModal(true)}
      >
        <Ionicons name="add" size={32} color={Colors.white} />
      </TouchableOpacity>

      {/* Log Modal */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Log {selectedType.label}</Text>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Ionicons name="close" size={28} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalForm}>
            <Text style={styles.formLabel}>{selectedType.primaryLabel || 'Value'} ({selectedType.unit})</Text>
            <TextInput
              style={styles.formInput}
              value={primaryVal}
              onChangeText={setPrimaryVal}
              placeholder={`e.g. ${selectedType.key === 'blood_pressure' ? '120' : '98.6'}`}
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
            />
            {selectedType.hasSecondary && (
              <>
                <Text style={styles.formLabel}>{selectedType.secondaryLabel} (mmHg)</Text>
                <TextInput
                  style={styles.formInput}
                  value={secondaryVal}
                  onChangeText={setSecondaryVal}
                  placeholder="e.g. 80"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                />
              </>
            )}
            <Text style={styles.formLabel}>Notes (optional)</Text>
            <TextInput
              style={[styles.formInput, { minHeight: 80, textAlignVertical: 'top' }]}
              value={notes}
              onChangeText={setNotes}
              placeholder="How are you feeling?"
              placeholderTextColor={Colors.textMuted}
              multiline
            />
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: selectedType.color }]} onPress={handleLog}>
              <Text style={styles.saveBtnText}>Save Reading</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.danger, paddingTop: 56, paddingBottom: 20, paddingHorizontal: Spacing.lg,
  },
  headerTitle: { fontSize: Typography.heading1, fontWeight: Typography.bold, color: Colors.white },
  headerSub: { fontSize: Typography.bodySmall, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  content: { padding: Spacing.lg },

  typeRow: { marginBottom: Spacing.md, marginHorizontal: -Spacing.sm },
  typeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 10, paddingHorizontal: 14,
    borderRadius: BorderRadius.full, backgroundColor: Colors.white,
    marginHorizontal: 4, borderWidth: 1.5, borderColor: Colors.border,
  },
  typeBtnText: { fontSize: Typography.bodySmall, fontWeight: Typography.semiBold, color: Colors.textPrimary },

  latestCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl,
    padding: Spacing.lg, marginBottom: Spacing.md,
    borderTopWidth: 4, ...Shadows.card,
  },
  latestLabel: { fontSize: Typography.bodySmall, color: Colors.textMuted, fontWeight: Typography.medium, textTransform: 'uppercase' },
  latestValue: { fontSize: 48, fontWeight: Typography.extraBold, marginVertical: 4 },
  latestDate: { fontSize: Typography.bodySmall, color: Colors.textSecondary },

  noDataCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, padding: Spacing.xl, alignItems: 'center', marginBottom: Spacing.md },
  noDataText: { fontSize: Typography.body, color: Colors.textMuted, marginTop: Spacing.sm },

  chartCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl,
    padding: Spacing.lg, marginBottom: Spacing.md, ...Shadows.card, overflow: 'hidden',
  },
  chartTitle: { fontSize: Typography.body, fontWeight: Typography.bold, color: Colors.textPrimary },

  historyTitle: { fontSize: Typography.heading2, fontWeight: Typography.bold, color: Colors.textPrimary, marginBottom: Spacing.md, marginTop: Spacing.sm },
  historyRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.white, borderRadius: BorderRadius.md,
    padding: Spacing.md, marginBottom: Spacing.sm, ...Shadows.card,
  },
  historyDot: { width: 12, height: 12, borderRadius: 6 },
  historyValue: { fontSize: Typography.body, fontWeight: Typography.semiBold, color: Colors.textPrimary },
  historyNotes: { fontSize: Typography.bodySmall, color: Colors.textSecondary, marginTop: 2 },
  historyDate: { fontSize: Typography.bodySmall, color: Colors.textMuted },

  fab: {
    position: 'absolute', bottom: 32, right: 24,
    width: 64, height: 64, borderRadius: 32,
    justifyContent: 'center', alignItems: 'center', ...Shadows.heavy,
  },

  modal: { flex: 1, backgroundColor: Colors.white },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Spacing.lg, paddingTop: 20, borderBottomWidth: 1, borderColor: Colors.borderLight,
  },
  modalTitle: { fontSize: Typography.heading1, fontWeight: Typography.bold, color: Colors.textPrimary },
  modalForm: { padding: Spacing.lg, paddingBottom: 48 },
  formLabel: { fontSize: Typography.body, fontWeight: Typography.semiBold, color: Colors.textPrimary, marginBottom: 8, marginTop: Spacing.md },
  formInput: {
    borderWidth: 2, borderColor: Colors.border, borderRadius: BorderRadius.md,
    padding: 14, fontSize: Typography.body, color: Colors.textPrimary,
    backgroundColor: Colors.offWhite, minHeight: 56,
  },
  saveBtn: { borderRadius: BorderRadius.md, padding: 18, alignItems: 'center', marginTop: Spacing.xl },
  saveBtnText: { color: Colors.white, fontSize: Typography.button, fontWeight: Typography.bold },
});
