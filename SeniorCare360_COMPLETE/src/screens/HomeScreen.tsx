import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Alert, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import * as Location from 'expo-location';
import { RootState } from '../store';
import { authService } from '../services/api';
import { emergencyService, medicationService } from '../services/api';
import { logout } from '../store';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../theme';
import { format } from 'date-fns';

const QuickCard = ({ icon, title, subtitle, color, onPress }: any) => (
  <TouchableOpacity style={[styles.quickCard, { borderLeftColor: color }]} onPress={onPress} activeOpacity={0.8}>
    <View style={[styles.quickIconBox, { backgroundColor: color + '20' }]}>
      <Ionicons name={icon} size={28} color={color} />
    </View>
    <View style={styles.quickCardText}>
      <Text style={styles.quickTitle}>{title}</Text>
      {subtitle && <Text style={styles.quickSubtitle}>{subtitle}</Text>}
    </View>
    <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
  </TouchableOpacity>
);

export default function HomeScreen({ navigation }: any) {
  const dispatch = useDispatch();
  const { firstName } = useSelector((state: RootState) => state.auth);
  const profile = useSelector((state: RootState) => state.user.profile);
  const [meds, setMeds] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [sosLoading, setSosLoading] = useState(false);
  const today = format(new Date(), 'EEEE, MMMM do');

  const loadData = useCallback(async () => {
    try {
      const m = await medicationService.list();
      setMeds(m);
    } catch {}
  }, []);

  useEffect(() => { loadData(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSOS = async () => {
    Alert.alert(
      '🚨 Emergency SOS',
      'This will alert all your emergency contacts immediately. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'YES — SEND SOS!',
          style: 'destructive',
          onPress: async () => {
            setSosLoading(true);
            try {
              const { status } = await Location.requestForegroundPermissionsAsync();
              let lat, lng;
              if (status === 'granted') {
                const loc = await Location.getCurrentPositionAsync({});
                lat = loc.coords.latitude;
                lng = loc.coords.longitude;
              }
              const result = await emergencyService.triggerSOS({ latitude: lat, longitude: lng });
              Alert.alert('✅ SOS Sent!', result.message);
            } catch {
              Alert.alert('Error', 'Could not send SOS. Please call 911 directly.');
            } finally {
              setSosLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        onPress: async () => {
          await authService.logout();
          dispatch(logout());
        },
      },
    ]);
  };

  const activeMeds = meds.filter(m => m.status === 'active');
  const refillNeeded = meds.filter(m => m.refills_remaining === 0);
  const readyToDeliver = meds.filter(m => ['ready_for_pickup', 'ready_for_delivery'].includes(m.status));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.dateText}>{today}</Text>
          <Text style={styles.greeting}>Good Day, {firstName}! 👋</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={26} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* SOS Button — most prominent for seniors */}
        <TouchableOpacity style={styles.sosButton} onPress={handleSOS} activeOpacity={0.85}>
          <Ionicons name="warning" size={36} color={Colors.white} />
          <View>
            <Text style={styles.sosBtnTitle}>{sosLoading ? 'Sending SOS...' : '🆘 EMERGENCY SOS'}</Text>
            <Text style={styles.sosBtnSub}>Tap to alert your family & contacts</Text>
          </View>
        </TouchableOpacity>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: Colors.infoLight }]}>
            <Text style={styles.statNum}>{activeMeds.length}</Text>
            <Text style={styles.statLabel}>Active Meds</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: Colors.warningLight }]}>
            <Text style={[styles.statNum, { color: Colors.warning }]}>{refillNeeded.length}</Text>
            <Text style={styles.statLabel}>Refill Needed</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: Colors.successLight }]}>
            <Text style={[styles.statNum, { color: Colors.success }]}>{readyToDeliver.length}</Text>
            <Text style={styles.statLabel}>Ready to Ship</Text>
          </View>
        </View>

        {/* Address check */}
        {profile && !profile.address_line1 && (
          <TouchableOpacity
            style={styles.alertBanner}
            onPress={() => navigation.navigate('Profile')}
          >
            <Ionicons name="location-outline" size={20} color={Colors.warning} />
            <Text style={styles.alertBannerText}>
              Add your home address to enable one-tap prescription delivery!
            </Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.warning} />
          </TouchableOpacity>
        )}

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <QuickCard
          icon="medical" title="My Medications"
          subtitle={`${activeMeds.length} active prescriptions`}
          color={Colors.primary}
          onPress={() => navigation.navigate('Medications')}
        />
        <QuickCard
          icon="cube-outline" title="Medication Delivery"
          subtitle="Track & request prescription delivery"
          color={Colors.accent}
          onPress={() => navigation.navigate('Medications')}
        />
        <QuickCard
          icon="heart" title="Health Vitals"
          subtitle="Log blood pressure, glucose & more"
          color={Colors.danger}
          onPress={() => navigation.navigate('Vitals')}
        />
        <QuickCard
          icon="calendar" title="My Appointments"
          subtitle="Doctor visits & reminders"
          color={Colors.success}
          onPress={() => navigation.navigate('Appointments')}
        />
        <QuickCard
          icon="people" title="Family Circle"
          subtitle="Keep loved ones connected"
          color={Colors.primaryLight}
          onPress={() => navigation.navigate('Family')}
        />
        <QuickCard
          icon="star" title="Benefits & Resources"
          subtitle="Medicare, Medicaid, SSA & more"
          color={Colors.accent}
          onPress={() => navigation.navigate('Benefits')}
        />
        <QuickCard
          icon="alert-circle" title="Emergency Contacts"
          subtitle="Manage your safety contacts"
          color={Colors.emergency}
          onPress={() => navigation.navigate('Emergency')}
        />

        {/* Refill Alerts */}
        {refillNeeded.length > 0 && (
          <View style={styles.refillSection}>
            <Text style={styles.sectionTitle}>⚠️ Needs Refill</Text>
            {refillNeeded.map(med => (
              <TouchableOpacity
                key={med.id}
                style={styles.refillCard}
                onPress={() => navigation.navigate('MedDetail', { medication: med })}
              >
                <View>
                  <Text style={styles.refillMedName}>{med.name}</Text>
                  <Text style={styles.refillDosage}>{med.dosage} — {med.frequency}</Text>
                </View>
                <TouchableOpacity
                  style={styles.deliverNowBtn}
                  onPress={() => navigation.navigate('Delivery', { medication: med })}
                >
                  <Text style={styles.deliverNowText}>Deliver Now</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: 56, paddingBottom: 24, paddingHorizontal: Spacing.lg,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
  },
  dateText: { color: Colors.primaryLight, fontSize: Typography.bodySmall, fontWeight: Typography.medium },
  greeting: { color: Colors.white, fontSize: Typography.heading1, fontWeight: Typography.bold, marginTop: 2 },
  logoutBtn: { padding: 8 },

  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.lg },

  sosButton: {
    backgroundColor: Colors.emergency,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    marginBottom: Spacing.lg,
    ...Shadows.emergency,
  },
  sosBtnTitle: { color: Colors.white, fontSize: Typography.heading2, fontWeight: Typography.extraBold },
  sosBtnSub: { color: 'rgba(255,255,255,0.8)', fontSize: Typography.bodySmall, marginTop: 2 },

  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  statCard: {
    flex: 1, borderRadius: BorderRadius.lg,
    padding: Spacing.md, alignItems: 'center',
  },
  statNum: { fontSize: Typography.displayM, fontWeight: Typography.extraBold, color: Colors.primary },
  statLabel: { fontSize: Typography.caption, color: Colors.textSecondary, textAlign: 'center', marginTop: 2 },

  alertBanner: {
    backgroundColor: Colors.warningLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    marginBottom: Spacing.lg,
    borderWidth: 1, borderColor: Colors.warning + '40',
  },
  alertBannerText: { flex: 1, fontSize: Typography.bodySmall, color: Colors.warning, fontWeight: Typography.medium },

  sectionTitle: {
    fontSize: Typography.heading2,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },

  quickCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    flexDirection: 'row', alignItems: 'center',
    marginBottom: Spacing.sm,
    borderLeftWidth: 4,
    ...Shadows.card,
  },
  quickIconBox: {
    width: 52, height: 52, borderRadius: BorderRadius.md,
    justifyContent: 'center', alignItems: 'center',
    marginRight: Spacing.md,
  },
  quickCardText: { flex: 1 },
  quickTitle: { fontSize: Typography.body, fontWeight: Typography.semiBold, color: Colors.textPrimary },
  quickSubtitle: { fontSize: Typography.bodySmall, color: Colors.textSecondary, marginTop: 2 },

  refillSection: { marginTop: Spacing.md },
  refillCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: Spacing.sm,
    borderLeftWidth: 4, borderLeftColor: Colors.warning,
    ...Shadows.card,
  },
  refillMedName: { fontSize: Typography.body, fontWeight: Typography.bold, color: Colors.textPrimary },
  refillDosage: { fontSize: Typography.bodySmall, color: Colors.textSecondary, marginTop: 2 },
  deliverNowBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
    paddingVertical: 10, paddingHorizontal: 14,
  },
  deliverNowText: { color: Colors.white, fontSize: Typography.bodySmall, fontWeight: Typography.bold },
});
