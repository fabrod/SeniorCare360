import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, TextInput, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { userService, authService } from '../services/api';
import { setProfile, logout, RootState } from '../store';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../theme';

interface FieldDef {
  label: string;
  key: string;
  keyboard?: any;
  capitalize?: any;
  placeholder?: string;
  autoComplete?: any;
}

const PERSONAL_FIELDS: FieldDef[] = [
  { label: 'First Name', key: 'first_name', capitalize: 'sentences', autoComplete: 'given-name', placeholder: 'Dorothy' },
  { label: 'Last Name', key: 'last_name', capitalize: 'sentences', autoComplete: 'family-name', placeholder: 'Johnson' },
  { label: 'Phone', key: 'phone', keyboard: 'phone-pad', capitalize: 'none', autoComplete: 'tel', placeholder: '+1 (555) 000-0000' },
];

const ADDRESS_FIELDS: FieldDef[] = [
  { label: 'Street Address', key: 'address_line1', capitalize: 'sentences', autoComplete: 'street-address', placeholder: '123 Main Street' },
  { label: 'Apt / Unit', key: 'address_line2', capitalize: 'sentences', placeholder: 'Apt 4B (optional)' },
  { label: 'City', key: 'city', capitalize: 'sentences', autoComplete: 'address-level2', placeholder: 'Orlando' },
  { label: 'State', key: 'state', capitalize: 'characters', placeholder: 'FL' },
  { label: 'ZIP Code', key: 'zip_code', keyboard: 'numeric', capitalize: 'none', autoComplete: 'postal-code', placeholder: '32801' },
];

const INSURANCE_FIELDS: FieldDef[] = [
  { label: 'Medicare ID', key: 'medicare_id', capitalize: 'characters', placeholder: '1EG4-TE5-MK72' },
  { label: 'Medicaid ID', key: 'medicaid_id', capitalize: 'characters', placeholder: 'Optional' },
  { label: 'Insurance Provider', key: 'insurance_provider', capitalize: 'sentences', placeholder: 'BlueCross BlueShield' },
  { label: 'Member ID', key: 'insurance_member_id', capitalize: 'characters', placeholder: 'BCB-887234' },
];

export default function ProfileScreen({ navigation }: any) {
  const dispatch = useDispatch();
  const profile = useSelector((state: RootState) => state.user.profile);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({
    first_name: profile?.first_name || '',
    last_name: profile?.last_name || '',
    phone: profile?.phone || '',
    address_line1: profile?.address_line1 || '',
    address_line2: profile?.address_line2 || '',
    city: profile?.city || '',
    state: profile?.state || '',
    zip_code: profile?.zip_code || '',
    medicare_id: profile?.medicare_id || '',
    medicaid_id: profile?.medicaid_id || '',
    insurance_provider: profile?.insurance_provider || '',
    insurance_member_id: profile?.insurance_member_id || '',
  });

  const upd = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.first_name.trim()) {
      Alert.alert('Required', 'First name cannot be empty.'); return;
    }
    if (!form.last_name.trim()) {
      Alert.alert('Required', 'Last name cannot be empty.'); return;
    }
    setLoading(true);
    try {
      const updated = await userService.updateProfile(form);
      dispatch(setProfile(updated));
      setEditing(false);
      Alert.alert('✅ Saved', 'Your profile has been updated.');
    } catch {
      Alert.alert('Error', 'Could not save. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form to current profile
    setForm({
      first_name: profile?.first_name || '',
      last_name: profile?.last_name || '',
      phone: profile?.phone || '',
      address_line1: profile?.address_line1 || '',
      address_line2: profile?.address_line2 || '',
      city: profile?.city || '',
      state: profile?.state || '',
      zip_code: profile?.zip_code || '',
      medicare_id: profile?.medicare_id || '',
      medicaid_id: profile?.medicaid_id || '',
      insurance_provider: profile?.insurance_provider || '',
      insurance_member_id: profile?.insurance_member_id || '',
    });
    setEditing(false);
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await authService.logout();
          dispatch(logout());
        },
      },
    ]);
  };

  const renderField = (f: FieldDef, isLast = false) => (
    <View
      key={f.key}
      style={[styles.fieldRow, !isLast && { borderBottomWidth: 1, borderBottomColor: Colors.borderLight }]}
    >
      <Text style={styles.fieldLabel}>{f.label}</Text>
      {editing ? (
        <TextInput
          style={styles.fieldInput}
          value={form[f.key]}
          onChangeText={v => upd(f.key, v)}
          placeholder={f.placeholder || f.label}
          placeholderTextColor={Colors.textMuted}
          keyboardType={f.keyboard || 'default'}
          autoCapitalize={f.capitalize || 'none'}
          autoCorrect={false}
          autoComplete={f.autoComplete}
        />
      ) : (
        <Text style={styles.fieldValue} numberOfLines={2}>
          {(profile as any)?.[f.key] || '—'}
        </Text>
      )}
    </View>
  );

  const initials =
    (profile?.first_name?.[0] || '').toUpperCase() +
    (profile?.last_name?.[0] || '').toUpperCase();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{initials || '?'}</Text>
        </View>
        <Text style={styles.headerName}>
          {profile?.first_name} {profile?.last_name}
        </Text>
        <Text style={styles.headerEmail}>{profile?.email}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Edit / Save button */}
        <TouchableOpacity
          style={editing ? styles.saveBtn : styles.editBtn}
          onPress={editing ? handleSave : () => setEditing(true)}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <Ionicons
                name={editing ? 'checkmark-circle' : 'pencil'}
                size={20}
                color={Colors.white}
              />
              <Text style={styles.actionBtnText}>
                {editing ? 'Save Changes' : 'Edit Profile'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {editing && (
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        )}

        {/* Personal Info */}
        <Text style={styles.sectionHeader}>👤 Personal Information</Text>
        <View style={styles.card}>
          {PERSONAL_FIELDS.map((f, i) =>
            renderField(f, i === PERSONAL_FIELDS.length - 1)
          )}
        </View>

        {/* Home Address */}
        <Text style={styles.sectionHeader}>🏠 Home Delivery Address</Text>
        <Text style={styles.sectionNote}>
          Prescriptions will be delivered to this address.
        </Text>
        <View style={styles.card}>
          {ADDRESS_FIELDS.map((f, i) =>
            renderField(f, i === ADDRESS_FIELDS.length - 1)
          )}
        </View>

        {/* Insurance */}
        <Text style={styles.sectionHeader}>🏥 Insurance & Benefits</Text>
        <View style={styles.card}>
          {INSURANCE_FIELDS.map((f, i) =>
            renderField(f, i === INSURANCE_FIELDS.length - 1)
          )}
        </View>

        {/* Navigation options */}
        <Text style={styles.sectionHeader}>⚙️ More Options</Text>
        <View style={styles.card}>
          {[
            { label: 'My Appointments', icon: 'calendar', screen: 'Appointments' },
            { label: 'Emergency Contacts', icon: 'alert-circle', screen: 'Emergency' },
            { label: 'Family Circle', icon: 'people', screen: 'Family' },
          ].map((item, i, arr) => (
            <TouchableOpacity
              key={item.label}
              style={[
                styles.navRow,
                i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
              ]}
              onPress={() => navigation.navigate(item.screen)}
            >
              <Ionicons name={item.icon as any} size={22} color={Colors.primary} />
              <Text style={styles.navLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color={Colors.danger} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={{ height: 48 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: 60, paddingBottom: 32,
    alignItems: 'center', paddingHorizontal: Spacing.lg,
  },
  avatarCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 3, borderColor: Colors.white,
  },
  avatarText: {
    fontSize: Typography.displayM,
    fontWeight: Typography.extraBold,
    color: Colors.white,
  },
  headerName: {
    fontSize: Typography.heading1,
    fontWeight: Typography.bold,
    color: Colors.white,
  },
  headerEmail: {
    fontSize: Typography.bodySmall,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
  },

  content: { padding: Spacing.lg },

  editBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    padding: 14, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: Spacing.sm, marginBottom: Spacing.sm,
  },
  saveBtn: {
    backgroundColor: Colors.success, borderRadius: BorderRadius.md,
    padding: 14, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: Spacing.sm, marginBottom: Spacing.sm,
  },
  actionBtnText: {
    color: Colors.white,
    fontSize: Typography.button,
    fontWeight: Typography.bold,
  },
  cancelBtn: {
    borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: BorderRadius.md, padding: 12,
    alignItems: 'center', marginBottom: Spacing.md,
  },
  cancelBtnText: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },

  sectionHeader: {
    fontSize: Typography.heading3,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  sectionNote: {
    fontSize: Typography.bodySmall,
    color: Colors.primary,
    fontWeight: Typography.medium,
    marginBottom: Spacing.sm,
  },

  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
    ...Shadows.card,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    minHeight: 56,
  },
  fieldLabel: {
    width: 130,
    fontSize: Typography.bodySmall,
    fontWeight: Typography.semiBold,
    color: Colors.textSecondary,
  },
  fieldValue: {
    flex: 1,
    fontSize: Typography.body,
    color: Colors.textPrimary,
  },
  fieldInput: {
    flex: 1,
    fontSize: Typography.body,
    color: Colors.textPrimary,
    borderBottomWidth: 1.5,
    borderBottomColor: Colors.primary,
    paddingVertical: 4,
    minHeight: 32,
  },

  navRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: Spacing.md, gap: Spacing.md, minHeight: 56,
  },
  navLabel: {
    flex: 1,
    fontSize: Typography.body,
    fontWeight: Typography.medium,
    color: Colors.textPrimary,
  },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: Spacing.sm,
    padding: Spacing.lg,
    backgroundColor: Colors.dangerLight,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  logoutText: {
    fontSize: Typography.body,
    fontWeight: Typography.bold,
    color: Colors.danger,
  },
});
