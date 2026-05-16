import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { medicationService } from '../services/api';
import { RootState } from '../store';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../theme';

export default function DeliveryScreen({ route, navigation }: any) {
  const { medication } = route.params;
  const profile = useSelector((state: RootState) => state.user.profile);
  const [loading, setLoading] = useState(false);
  const [useHome, setUseHome] = useState(true);
  const [customAddress, setCustomAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [delivered, setDelivered] = useState(false);
  const [deliveryResult, setDeliveryResult] = useState<any>(null);

  const homeAddress = profile
    ? [profile.address_line1, profile.address_line2, profile.city, profile.state, profile.zip_code]
        .filter(Boolean).join(', ')
    : null;

  const handleRequestDelivery = async () => {
    if (!useHome && !customAddress.trim()) {
      Alert.alert('Address Required', 'Please enter a delivery address.');
      return;
    }
    if (useHome && !homeAddress) {
      Alert.alert(
        'No Home Address',
        'Please add your home address in Profile first.',
        [
          { text: 'Go to Profile', onPress: () => navigation.navigate('Profile') },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }

    setLoading(true);
    try {
      const result = await medicationService.requestDelivery({
        medication_id: medication.id,
        use_saved_address: useHome,
        custom_address: useHome ? undefined : customAddress.trim(),
        special_instructions: notes.trim() || undefined,
      });
      setDeliveryResult(result);
      setDelivered(true);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.detail || 'Could not request delivery. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (delivered && deliveryResult) {
    return (
      <View style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={80} color={Colors.success} />
          </View>
          <Text style={styles.successTitle}>Delivery Requested! 🎉</Text>
          <Text style={styles.successSub}>Your prescription is on its way home.</Text>

          <View style={styles.successCard}>
            <DetailRow icon="medical" label="Medication" value={medication.name} />
            <DetailRow icon="location" label="Deliver To" value={deliveryResult.delivery_address} />
            <DetailRow icon="document-text" label="Order #" value={deliveryResult.pharmacy_order_id} />
            <DetailRow
              icon="time"
              label="Estimated Delivery"
              value={deliveryResult.estimated_delivery
                ? new Date(deliveryResult.estimated_delivery).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
                : '2–3 business days'
              }
            />
          </View>

          <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.doneBtnText}>← Back to Medications</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={28} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🚚 Request Delivery</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Medication info */}
        <View style={styles.medCard}>
          <View style={styles.medIcon}>
            <Ionicons name="medical" size={28} color={Colors.primary} />
          </View>
          <View>
            <Text style={styles.medName}>{medication.name}</Text>
            {medication.dosage && <Text style={styles.medDosage}>{medication.dosage}</Text>}
            {medication.pharmacy_rx_number && (
              <Text style={styles.medRx}>Rx: {medication.pharmacy_rx_number}</Text>
            )}
          </View>
        </View>

        {/* Delivery address selection */}
        <Text style={styles.sectionLabel}>📍 Delivery Address</Text>

        {/* Home address option */}
        <TouchableOpacity
          style={[styles.addrOption, useHome && styles.addrOptionActive]}
          onPress={() => setUseHome(true)}
        >
          <Ionicons
            name={useHome ? 'radio-button-on' : 'radio-button-off'}
            size={24}
            color={useHome ? Colors.primary : Colors.textMuted}
          />
          <View style={styles.addrOptionText}>
            <Text style={styles.addrOptionTitle}>🏠 My Home Address</Text>
            {homeAddress ? (
              <Text style={styles.addrOptionSub}>{homeAddress}</Text>
            ) : (
              <Text style={[styles.addrOptionSub, { color: Colors.warning }]}>
                ⚠️ No address saved — add in Profile
              </Text>
            )}
          </View>
        </TouchableOpacity>

        {/* Custom address option */}
        <TouchableOpacity
          style={[styles.addrOption, !useHome && styles.addrOptionActive]}
          onPress={() => setUseHome(false)}
        >
          <Ionicons
            name={!useHome ? 'radio-button-on' : 'radio-button-off'}
            size={24}
            color={!useHome ? Colors.primary : Colors.textMuted}
          />
          <View style={styles.addrOptionText}>
            <Text style={styles.addrOptionTitle}>📝 Different Address</Text>
            <Text style={styles.addrOptionSub}>Enter a custom delivery address</Text>
          </View>
        </TouchableOpacity>

        {!useHome && (
          <TextInput
            style={styles.customAddrInput}
            value={customAddress}
            onChangeText={setCustomAddress}
            placeholder="Enter full delivery address"
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={3}
          />
        )}

        {/* Special instructions */}
        <Text style={styles.sectionLabel}>📝 Special Instructions (optional)</Text>
        <TextInput
          style={styles.notesInput}
          value={notes}
          onChangeText={setNotes}
          placeholder="e.g. Leave at front door, ring doorbell..."
          placeholderTextColor={Colors.textMuted}
          multiline
          numberOfLines={3}
        />

        {/* Delivery info */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color={Colors.primary} />
          <Text style={styles.infoText}>
            Estimated delivery: 2–3 business days. You'll receive a notification when your prescription ships and when it arrives.
          </Text>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.requestBtn, loading && { opacity: 0.7 }]}
          onPress={handleRequestDelivery}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} size="large" />
          ) : (
            <>
              <Ionicons name="cube" size={24} color={Colors.white} />
              <Text style={styles.requestBtnText}>Request Home Delivery</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function DetailRow({ icon, label, value }: any) {
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon} size={18} color={Colors.primary} />
      <View style={{ flex: 1 }}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primary, paddingTop: 56, paddingBottom: 20,
    paddingHorizontal: Spacing.lg, flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.md,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: Typography.heading1, fontWeight: Typography.bold, color: Colors.white },
  content: { padding: Spacing.lg, paddingBottom: 48 },

  medCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.lg, flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    marginBottom: Spacing.lg, ...Shadows.card,
  },
  medIcon: {
    width: 56, height: 56, borderRadius: BorderRadius.md,
    backgroundColor: Colors.infoLight, justifyContent: 'center', alignItems: 'center',
  },
  medName: { fontSize: Typography.heading2, fontWeight: Typography.bold, color: Colors.textPrimary },
  medDosage: { fontSize: Typography.body, color: Colors.textSecondary, marginTop: 2 },
  medRx: { fontSize: Typography.bodySmall, color: Colors.textMuted, marginTop: 2 },

  sectionLabel: { fontSize: Typography.body, fontWeight: Typography.bold, color: Colors.textPrimary, marginBottom: Spacing.sm, marginTop: Spacing.md },

  addrOption: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.md, flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md,
    marginBottom: Spacing.sm, borderWidth: 2, borderColor: Colors.border, ...Shadows.card,
  },
  addrOptionActive: { borderColor: Colors.primary, backgroundColor: Colors.infoLight },
  addrOptionText: { flex: 1 },
  addrOptionTitle: { fontSize: Typography.body, fontWeight: Typography.semiBold, color: Colors.textPrimary },
  addrOptionSub: { fontSize: Typography.bodySmall, color: Colors.textSecondary, marginTop: 4 },

  customAddrInput: {
    borderWidth: 2, borderColor: Colors.border, borderRadius: BorderRadius.md,
    padding: 14, fontSize: Typography.body, color: Colors.textPrimary,
    backgroundColor: Colors.white, minHeight: 80, textAlignVertical: 'top',
    marginBottom: Spacing.md,
  },
  notesInput: {
    borderWidth: 2, borderColor: Colors.border, borderRadius: BorderRadius.md,
    padding: 14, fontSize: Typography.body, color: Colors.textPrimary,
    backgroundColor: Colors.white, minHeight: 80, textAlignVertical: 'top',
    marginBottom: Spacing.md,
  },

  infoBox: {
    backgroundColor: Colors.infoLight, borderRadius: BorderRadius.md,
    padding: Spacing.md, flexDirection: 'row', gap: Spacing.sm,
    alignItems: 'flex-start', marginBottom: Spacing.lg,
  },
  infoText: { flex: 1, fontSize: Typography.bodySmall, color: Colors.primary },

  requestBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.lg,
    padding: 20, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: Spacing.sm,
    ...Shadows.heavy,
  },
  requestBtnText: { color: Colors.white, fontSize: Typography.button, fontWeight: Typography.extraBold },

  // Success state
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  successIcon: { marginBottom: Spacing.lg },
  successTitle: { fontSize: Typography.displayM, fontWeight: Typography.extraBold, color: Colors.textPrimary, textAlign: 'center' },
  successSub: { fontSize: Typography.body, color: Colors.textSecondary, marginTop: 8, marginBottom: Spacing.xl, textAlign: 'center' },
  successCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl,
    padding: Spacing.lg, width: '100%', gap: Spacing.md, ...Shadows.card,
  },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  detailLabel: { fontSize: Typography.caption, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  detailValue: { fontSize: Typography.body, fontWeight: Typography.semiBold, color: Colors.textPrimary, marginTop: 2 },
  doneBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    padding: 18, marginTop: Spacing.xl, width: '100%', alignItems: 'center',
  },
  doneBtnText: { color: Colors.white, fontSize: Typography.button, fontWeight: Typography.bold },
});
