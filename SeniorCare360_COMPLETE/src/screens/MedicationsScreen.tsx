import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, RefreshControl, Modal, TextInput, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { medicationService } from '../services/api';
import { setMedications, RootState } from '../store';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../theme';

const STATUS_COLORS: Record<string, string> = {
  active: Colors.success,
  discontinued: Colors.textMuted,
  refill_needed: Colors.warning,
  ready_for_pickup: Colors.accent,
  ready_for_delivery: Colors.primary,
};

const STATUS_LABELS: Record<string, string> = {
  active: '✅ Active',
  discontinued: '🚫 Discontinued',
  refill_needed: '⚠️ Needs Refill',
  ready_for_pickup: '🏪 Ready for Pickup',
  ready_for_delivery: '🚚 Ready to Deliver',
};

function MedCard({ med, onDeliver, onPress, onDelete }: any) {
  return (
    <TouchableOpacity style={styles.medCard} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.medHeader}>
        <View style={styles.medIconBox}>
          <Ionicons name="medical" size={24} color={Colors.primary} />
        </View>
        <View style={styles.medInfo}>
          <Text style={styles.medName}>{med.name}</Text>
          {med.generic_name && <Text style={styles.medGeneric}>{med.generic_name}</Text>}
        </View>
        <TouchableOpacity onPress={onDelete} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="trash-outline" size={20} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      <View style={styles.medDetails}>
        {med.dosage && (
          <View style={styles.detailRow}>
            <Ionicons name="flask-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.detailText}>{med.dosage}</Text>
          </View>
        )}
        {med.frequency && (
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.detailText}>{med.frequency}</Text>
          </View>
        )}
        {med.pharmacy_name && (
          <View style={styles.detailRow}>
            <Ionicons name="business-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.detailText}>{med.pharmacy_name}</Text>
          </View>
        )}
        <View style={styles.detailRow}>
          <Ionicons name="refresh-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.detailText}>Refills remaining: {med.refills_remaining}</Text>
        </View>
      </View>

      {/* Status badge */}
      <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[med.status] + '20', borderColor: STATUS_COLORS[med.status] }]}>
        <Text style={[styles.statusText, { color: STATUS_COLORS[med.status] }]}>
          {STATUS_LABELS[med.status] || med.status}
        </Text>
      </View>

      {/* One-tap delivery button */}
      <TouchableOpacity style={styles.deliverBtn} onPress={onDeliver} activeOpacity={0.85}>
        <Ionicons name="cube" size={20} color={Colors.white} />
        <Text style={styles.deliverBtnText}>🚚 Deliver to My Home</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function MedicationsScreen({ navigation }: any) {
  const dispatch = useDispatch();
  const meds = useSelector((state: RootState) => state.medications.list);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', generic_name: '', dosage: '', frequency: '',
    prescriber: '', pharmacy_name: '', pharmacy_rx_number: '',
    refills_remaining: '0', instructions: '',
  });

  const loadMeds = useCallback(async () => {
    try {
      const list = await medicationService.list();
      dispatch(setMedications(list));
    } catch {}
  }, []);

  useEffect(() => { loadMeds(); }, []);

  const onRefresh = async () => { setRefreshing(true); await loadMeds(); setRefreshing(false); };

  const handleDelete = (med: any) => {
    Alert.alert('Remove Medication', `Remove ${med.name} from your list?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          try {
            await medicationService.delete(med.id);
            await loadMeds();
          } catch { Alert.alert('Error', 'Could not remove medication.'); }
        },
      },
    ]);
  };

  const handleAddMed = async () => {
    if (!form.name.trim()) { Alert.alert('Required', 'Please enter the medication name.'); return; }
    setAddLoading(true);
    try {
      await medicationService.add({
        ...form,
        refills_remaining: parseInt(form.refills_remaining) || 0,
      });
      await loadMeds();
      setShowAddModal(false);
      setForm({ name: '', generic_name: '', dosage: '', frequency: '', prescriber: '', pharmacy_name: '', pharmacy_rx_number: '', refills_remaining: '0', instructions: '' });
    } catch { Alert.alert('Error', 'Could not add medication.'); }
    finally { setAddLoading(false); }
  };

  const handleDeliver = (med: any) => {
    navigation.navigate('Delivery', { medication: med });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>💊 My Medications</Text>
          <Text style={styles.headerSub}>{meds.length} prescription{meds.length !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
          <Ionicons name="add" size={28} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {meds.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="medical-outline" size={64} color={Colors.border} />
            <Text style={styles.emptyTitle}>No medications yet</Text>
            <Text style={styles.emptySub}>Tap + to add your prescriptions</Text>
          </View>
        ) : (
          meds.map(med => (
            <MedCard
              key={med.id}
              med={med}
              onPress={() => navigation.navigate('MedDetail', { medication: med })}
              onDeliver={() => handleDeliver(med)}
              onDelete={() => handleDelete(med)}
            />
          ))
        )}
        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Add Medication Modal */}
      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Medication</Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Ionicons name="close" size={28} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalForm}>
            {([
              ['Medication Name *', 'name', 'e.g. Lisinopril'],
              ['Generic Name', 'generic_name', 'e.g. lisinopril'],
              ['Dosage', 'dosage', 'e.g. 10mg'],
              ['Frequency', 'frequency', 'e.g. Once daily in the morning'],
              ['Prescribing Doctor', 'prescriber', 'Dr. Smith'],
              ['Pharmacy Name', 'pharmacy_name', 'CVS Pharmacy'],
              ['Rx Number', 'pharmacy_rx_number', 'RX123456'],
              ['Refills Remaining', 'refills_remaining', '3'],
              ['Special Instructions', 'instructions', 'Take with food'],
            ] as [string, string, string][]).map(([label, field, ph]) => (
              <View key={field}>
                <Text style={styles.formLabel}>{label}</Text>
                <TextInput
                  style={styles.formInput}
                  value={(form as any)[field]}
                  onChangeText={v => setForm(f => ({ ...f, [field]: v }))}
                  placeholder={ph}
                  placeholderTextColor={Colors.textMuted}
                  keyboardType={field === 'refills_remaining' ? 'numeric' : 'default'}
                />
              </View>
            ))}
            <TouchableOpacity style={styles.saveBtn} onPress={handleAddMed} disabled={addLoading}>
              {addLoading ? <ActivityIndicator color={Colors.white} /> :
                <Text style={styles.saveBtnText}>Save Medication</Text>}
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
    backgroundColor: Colors.primary, paddingTop: 56, paddingBottom: 20,
    paddingHorizontal: Spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
  },
  headerTitle: { fontSize: Typography.heading1, fontWeight: Typography.bold, color: Colors.white },
  headerSub: { fontSize: Typography.bodySmall, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  addBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },

  list: { padding: Spacing.lg },

  medCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  medHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.sm },
  medIconBox: {
    width: 48, height: 48, borderRadius: BorderRadius.md,
    backgroundColor: Colors.infoLight, justifyContent: 'center', alignItems: 'center',
    marginRight: Spacing.md,
  },
  medInfo: { flex: 1 },
  medName: { fontSize: Typography.heading2, fontWeight: Typography.bold, color: Colors.textPrimary },
  medGeneric: { fontSize: Typography.bodySmall, color: Colors.textSecondary, marginTop: 2 },

  medDetails: { gap: 6, marginBottom: Spacing.md },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { fontSize: Typography.bodySmall, color: Colors.textSecondary },

  statusBadge: {
    alignSelf: 'flex-start', borderRadius: BorderRadius.full,
    paddingVertical: 4, paddingHorizontal: 12,
    borderWidth: 1, marginBottom: Spacing.md,
  },
  statusText: { fontSize: Typography.bodySmall, fontWeight: Typography.semiBold },

  deliverBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    padding: 16, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
  },
  deliverBtnText: { color: Colors.white, fontSize: Typography.button, fontWeight: Typography.bold },

  empty: { alignItems: 'center', paddingVertical: 80 },
  emptyTitle: { fontSize: Typography.heading2, fontWeight: Typography.bold, color: Colors.textMuted, marginTop: Spacing.md },
  emptySub: { fontSize: Typography.body, color: Colors.textMuted, marginTop: 8 },

  modal: { flex: 1, backgroundColor: Colors.white },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Spacing.lg, paddingTop: 20, borderBottomWidth: 1, borderColor: Colors.borderLight,
  },
  modalTitle: { fontSize: Typography.heading1, fontWeight: Typography.bold, color: Colors.textPrimary },
  modalForm: { padding: Spacing.lg, paddingBottom: 48 },
  formLabel: { fontSize: Typography.body, fontWeight: Typography.semiBold, color: Colors.textPrimary, marginBottom: 6, marginTop: Spacing.md },
  formInput: {
    borderWidth: 2, borderColor: Colors.border, borderRadius: BorderRadius.md,
    padding: 14, fontSize: Typography.body, color: Colors.textPrimary,
    backgroundColor: Colors.offWhite, minHeight: 52,
  },
  saveBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    padding: 18, alignItems: 'center', marginTop: Spacing.xl,
  },
  saveBtnText: { color: Colors.white, fontSize: Typography.button, fontWeight: Typography.bold },
});
