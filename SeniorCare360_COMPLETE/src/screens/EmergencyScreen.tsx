import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Modal, TextInput, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { emergencyService } from '../services/api';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../theme';

export default function EmergencyScreen({ navigation }: any) {
  const [contacts, setContacts] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [sosLoading, setSosLoading] = useState(false);
  const [form, setForm] = useState({ name: '', relationship: '', phone: '', email: '', is_primary: false, notify_on_sos: true });

  const loadContacts = async () => {
    try { setContacts(await emergencyService.getContacts()); } catch {}
  };

  useEffect(() => { loadContacts(); }, []);

  const handleSOS = async () => {
    Alert.alert('🚨 EMERGENCY SOS', 'Send SOS to all emergency contacts now?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'YES — SEND SOS!', style: 'destructive',
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
          } catch { Alert.alert('Error', 'Could not send SOS. Please call 911 directly.'); }
          finally { setSosLoading(false); }
        },
      },
    ]);
  };

  const handleDelete = (c: any) => {
    Alert.alert('Remove Contact', `Remove ${c.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => { await emergencyService.deleteContact(c.id); await loadContacts(); } },
    ]);
  };

  const handleAdd = async () => {
    if (!form.name || !form.phone) { Alert.alert('Required', 'Name and phone are required.'); return; }
    try {
      await emergencyService.addContact(form);
      await loadContacts();
      setShowModal(false);
      setForm({ name: '', relationship: '', phone: '', email: '', is_primary: false, notify_on_sos: true });
    } catch { Alert.alert('Error', 'Could not add contact.'); }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={28} color={Colors.white} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>🆘 Emergency</Text>
          <Text style={styles.headerSub}>Safety contacts & SOS</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Big SOS */}
        <TouchableOpacity style={styles.sosBtn} onPress={handleSOS} activeOpacity={0.85}>
          <Ionicons name="warning" size={48} color={Colors.white} />
          <Text style={styles.sosBtnTitle}>{sosLoading ? 'Sending...' : '🆘 SEND SOS NOW'}</Text>
          <Text style={styles.sosBtnSub}>Alerts all contacts with your GPS location</Text>
        </TouchableOpacity>

        {/* Call 911 */}
        <TouchableOpacity style={styles.call911} onPress={() => Linking.openURL('tel:911')}>
          <Ionicons name="call" size={24} color={Colors.white} />
          <Text style={styles.call911Text}>Call 911</Text>
        </TouchableOpacity>

        {/* Contacts list */}
        <View style={styles.contactsHeader}>
          <Text style={styles.sectionTitle}>Emergency Contacts ({contacts.length})</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
            <Ionicons name="add" size={22} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {contacts.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={48} color={Colors.border} />
            <Text style={styles.emptyText}>Add emergency contacts so we can alert them if you need help</Text>
          </View>
        )}

        {contacts.map(c => (
          <View key={c.id} style={[styles.contactCard, c.is_primary && { borderLeftColor: Colors.emergency }]}>
            <View style={styles.contactIcon}>
              <Text style={styles.contactInitial}>{c.name[0]}</Text>
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactName}>{c.name} {c.is_primary && '⭐'}</Text>
              {c.relationship && <Text style={styles.contactRel}>{c.relationship}</Text>}
              <Text style={styles.contactPhone}>{c.phone}</Text>
            </View>
            <View style={styles.contactActions}>
              <TouchableOpacity onPress={() => Linking.openURL(`tel:${c.phone}`)} style={styles.callBtn}>
                <Ionicons name="call" size={18} color={Colors.success} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(c)}>
                <Ionicons name="trash-outline" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Add Contact Modal */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Emergency Contact</Text>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Ionicons name="close" size={28} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalForm}>
            {([['Full Name *', 'name', 'default'], ['Relationship', 'relationship', 'default'], ['Phone Number *', 'phone', 'phone-pad'], ['Email', 'email', 'email-address']] as [string, string, any][]).map(([label, field, kb]) => (
              <View key={field}>
                <Text style={styles.formLabel}>{label}</Text>
                <TextInput
                  style={styles.formInput}
                  value={(form as any)[field]}
                  onChangeText={v => setForm(f => ({ ...f, [field]: v }))}
                  placeholder={label}
                  placeholderTextColor={Colors.textMuted}
                  keyboardType={kb}
                  autoCapitalize={kb === 'default' ? 'words' : 'none'}
                />
              </View>
            ))}
            <TouchableOpacity style={styles.toggleRow} onPress={() => setForm(f => ({ ...f, is_primary: !f.is_primary }))}>
              <Ionicons name={form.is_primary ? 'checkbox' : 'square-outline'} size={24} color={Colors.primary} />
              <Text style={styles.toggleText}>Set as Primary Emergency Contact</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleAdd}>
              <Text style={styles.saveBtnText}>Add Contact</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.emergency, paddingTop: 56, paddingBottom: 20, paddingHorizontal: Spacing.lg, flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.md },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: Typography.heading1, fontWeight: Typography.bold, color: Colors.white },
  headerSub: { fontSize: Typography.bodySmall, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  content: { padding: Spacing.lg },
  sosBtn: { backgroundColor: Colors.emergency, borderRadius: BorderRadius.xl, padding: Spacing.xl, alignItems: 'center', marginBottom: Spacing.md, ...Shadows.emergency },
  sosBtnTitle: { color: Colors.white, fontSize: Typography.displayM, fontWeight: Typography.extraBold, marginTop: Spacing.sm },
  sosBtnSub: { color: 'rgba(255,255,255,0.8)', fontSize: Typography.body, marginTop: 4, textAlign: 'center' },
  call911: { backgroundColor: Colors.danger, borderRadius: BorderRadius.md, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, marginBottom: Spacing.lg },
  call911Text: { color: Colors.white, fontSize: Typography.button, fontWeight: Typography.bold },
  contactsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitle: { fontSize: Typography.heading2, fontWeight: Typography.bold, color: Colors.textPrimary },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  empty: { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, padding: Spacing.xl, alignItems: 'center', gap: Spacing.md },
  emptyText: { fontSize: Typography.body, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24 },
  contactCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm, borderLeftWidth: 4, borderLeftColor: Colors.primary, ...Shadows.card },
  contactIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  contactInitial: { fontSize: Typography.heading2, fontWeight: Typography.bold, color: Colors.white },
  contactInfo: { flex: 1 },
  contactName: { fontSize: Typography.body, fontWeight: Typography.bold, color: Colors.textPrimary },
  contactRel: { fontSize: Typography.bodySmall, color: Colors.textSecondary },
  contactPhone: { fontSize: Typography.bodySmall, color: Colors.primary, marginTop: 2 },
  contactActions: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },
  callBtn: { padding: 4 },
  modal: { flex: 1, backgroundColor: Colors.white },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg, paddingTop: 20, borderBottomWidth: 1, borderColor: Colors.borderLight },
  modalTitle: { fontSize: Typography.heading1, fontWeight: Typography.bold, color: Colors.textPrimary },
  modalForm: { padding: Spacing.lg, paddingBottom: 48 },
  formLabel: { fontSize: Typography.body, fontWeight: Typography.semiBold, color: Colors.textPrimary, marginBottom: 8, marginTop: Spacing.md },
  formInput: { borderWidth: 2, borderColor: Colors.border, borderRadius: BorderRadius.md, padding: 14, fontSize: Typography.body, color: Colors.textPrimary, backgroundColor: Colors.offWhite, minHeight: 56 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.lg, padding: Spacing.md, backgroundColor: Colors.offWhite, borderRadius: BorderRadius.md },
  toggleText: { fontSize: Typography.body, color: Colors.textPrimary },
  saveBtn: { backgroundColor: Colors.emergency, borderRadius: BorderRadius.md, padding: 18, alignItems: 'center', marginTop: Spacing.xl },
  saveBtnText: { color: Colors.white, fontSize: Typography.button, fontWeight: Typography.bold },
});
