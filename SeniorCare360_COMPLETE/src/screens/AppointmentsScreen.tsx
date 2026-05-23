import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, Alert, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { appointmentService, familyService } from '../services/api';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../theme';
import { format, addHours, startOfHour } from 'date-fns';

// Simple time picker — hours and minutes
function SimpleTimePicker({ hour, minute, onChange }: {
  hour: number; minute: number;
  onChange: (h: number, m: number) => void;
}) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = [0, 15, 30, 45];
  return (
    <View style={tp.row}>
      <ScrollView style={tp.col} showsVerticalScrollIndicator={false}>
        {hours.map(h => (
          <TouchableOpacity
            key={h}
            style={[tp.item, h === hour && tp.selected]}
            onPress={() => onChange(h, minute)}
          >
            <Text style={[tp.itemText, h === hour && tp.selectedText]}>
              {h.toString().padStart(2, '0')}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <Text style={tp.colon}>:</Text>
      <ScrollView style={tp.col} showsVerticalScrollIndicator={false}>
        {minutes.map(m => (
          <TouchableOpacity
            key={m}
            style={[tp.item, m === minute && tp.selected]}
            onPress={() => onChange(hour, m)}
          >
            <Text style={[tp.itemText, m === minute && tp.selectedText]}>
              {m.toString().padStart(2, '0')}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

// Simple date picker — pick month/day/year offsets
function SimpleDatePicker({ date, onChange }: {
  date: Date; onChange: (d: Date) => void;
}) {
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={dp.row}>
      {days.map((d, i) => {
        const selected = format(d, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
        return (
          <TouchableOpacity
            key={i}
            style={[dp.dayBtn, selected && dp.daySelected]}
            onPress={() => {
              const newDate = new Date(date);
              newDate.setFullYear(d.getFullYear());
              newDate.setMonth(d.getMonth());
              newDate.setDate(d.getDate());
              onChange(newDate);
            }}
          >
            <Text style={[dp.dayName, selected && dp.daySelectedText]}>
              {format(d, 'EEE')}
            </Text>
            <Text style={[dp.dayNum, selected && dp.daySelectedText]}>
              {format(d, 'd')}
            </Text>
            <Text style={[dp.dayMonth, selected && dp.daySelectedText]}>
              {format(d, 'MMM')}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

export function AppointmentsScreen({ navigation }: any) {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [apptDate, setApptDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
    return d;
  });
  const [form, setForm] = useState({
    doctor_name: '',
    specialty: '',
    clinic_name: '',
    address: '',
    phone: '',
    notes: '',
  });

  const load = async () => {
    try {
      setAppointments(await appointmentService.list(false));
    } catch {}
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!form.doctor_name.trim()) {
      Alert.alert('Required', 'Please enter the doctor\'s name.'); return;
    }
    try {
      await appointmentService.create({
        ...form,
        doctor_name: form.doctor_name.trim(),
        appointment_date: apptDate.toISOString(),
      });
      await load();
      setShowModal(false);
      setForm({ doctor_name: '', specialty: '', clinic_name: '', address: '', phone: '', notes: '' });
    } catch {
      Alert.alert('Error', 'Could not save appointment. Please try again.');
    }
  };

  const handleComplete = async (id: number) => {
    try { await appointmentService.complete(id); await load(); } catch {}
  };

  const handleDelete = (appt: any) => {
    Alert.alert(
      'Remove Appointment',
      `Remove appointment with ${appt.doctor_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await appointmentService.delete(appt.id);
            await load();
          },
        },
      ]
    );
  };

  const formFields = [
    { label: 'Doctor Name *', key: 'doctor_name', capitalize: 'sentences', placeholder: 'Dr. Sarah Johnson' },
    { label: 'Specialty', key: 'specialty', capitalize: 'sentences', placeholder: 'Cardiology' },
    { label: 'Clinic / Hospital', key: 'clinic_name', capitalize: 'sentences', placeholder: 'Orlando Health' },
    { label: 'Address', key: 'address', capitalize: 'sentences', placeholder: '123 Medical Blvd, Orlando, FL' },
    { label: 'Phone', key: 'phone', capitalize: 'none', keyboard: 'phone-pad', placeholder: '(407) 555-0100' },
    { label: 'Notes', key: 'notes', capitalize: 'sentences', placeholder: 'Bring medication list', multiline: true },
  ];

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={28} color={Colors.white} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>📅 My Appointments</Text>
          <Text style={s.headerSub}>{appointments.length} total</Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowModal(true)}>
          <Ionicons name="add" size={26} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.content}>
        {appointments.length === 0 && (
          <View style={s.empty}>
            <Ionicons name="calendar-outline" size={64} color={Colors.border} />
            <Text style={s.emptyTitle}>No appointments yet</Text>
            <Text style={s.emptySub}>Tap + to schedule your first doctor visit</Text>
          </View>
        )}

        {/* Show/hide toggle */}
        {appointments.length > 0 && (
          <TouchableOpacity
            style={s.toggleBtn}
            onPress={() => setShowAll(v => !v)}
          >
            <Text style={s.toggleText}>
              {showAll ? 'Show Upcoming Only' : 'Show All (including completed)'}
            </Text>
          </TouchableOpacity>
        )}

        {appointments
          .filter(a => showAll || !a.is_completed)
          .map(a => (
            <View key={a.id} style={[s.card, a.is_completed && s.cardCompleted]}>
              <View style={s.cardTop}>
                <View style={[s.cardIcon, a.is_completed && { backgroundColor: Colors.borderLight }]}>
                  <Ionicons
                    name="medical"
                    size={24}
                    color={a.is_completed ? Colors.textMuted : Colors.primary}
                  />
                </View>
                <View style={s.cardInfo}>
                  <Text style={s.doctorName}>{a.doctor_name}</Text>
                  {a.specialty && <Text style={s.specialty}>{a.specialty}</Text>}
                  {a.clinic_name && <Text style={s.clinic}>🏥 {a.clinic_name}</Text>}
                  <Text style={[s.date, { color: a.is_completed ? Colors.textMuted : Colors.primary }]}>
                    📅 {format(new Date(a.appointment_date), 'EEEE, MMMM d, yyyy')}
                  </Text>
                  <Text style={[s.time, { color: a.is_completed ? Colors.textMuted : Colors.textSecondary }]}>
                    🕐 {format(new Date(a.appointment_date), 'h:mm a')}
                  </Text>
                  {a.notes && <Text style={s.notes}>📝 {a.notes}</Text>}
                </View>
              </View>
              <View style={s.cardActions}>
                {!a.is_completed && (
                  <TouchableOpacity style={s.completeBtn} onPress={() => handleComplete(a.id)}>
                    <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
                    <Text style={s.completeBtnText}>Mark Done</Text>
                  </TouchableOpacity>
                )}
                {a.is_completed && (
                  <View style={s.doneTag}>
                    <Text style={s.doneTagText}>✅ Completed</Text>
                  </View>
                )}
                <TouchableOpacity onPress={() => handleDelete(a)} style={s.deleteBtn}>
                  <Ionicons name="trash-outline" size={20} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Add Appointment Modal */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <View style={s.modal}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Add Appointment</Text>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Ionicons name="close" size={28} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={s.modalForm} keyboardShouldPersistTaps="handled">
            {/* Date picker */}
            <Text style={s.formLabel}>📅 Select Date</Text>
            <SimpleDatePicker
              date={apptDate}
              onChange={d => {
                const updated = new Date(apptDate);
                updated.setFullYear(d.getFullYear());
                updated.setMonth(d.getMonth());
                updated.setDate(d.getDate());
                setApptDate(updated);
              }}
            />

            {/* Time picker */}
            <Text style={s.formLabel}>🕐 Select Time</Text>
            <SimpleTimePicker
              hour={apptDate.getHours()}
              minute={apptDate.getMinutes()}
              onChange={(h, m) => {
                const updated = new Date(apptDate);
                updated.setHours(h, m, 0, 0);
                setApptDate(updated);
              }}
            />

            <View style={s.selectedDateTime}>
              <Text style={s.selectedDateTimeText}>
                ✅ {format(apptDate, 'EEEE, MMMM d, yyyy \'at\' h:mm a')}
              </Text>
            </View>

            {/* Text fields */}
            {formFields.map(f => (
              <View key={f.key}>
                <Text style={s.formLabel}>{f.label}</Text>
                <TextInput
                  style={[s.formInput, (f as any).multiline && { minHeight: 80, textAlignVertical: 'top' }]}
                  value={(form as any)[f.key]}
                  onChangeText={v => setForm(prev => ({ ...prev, [f.key]: v }))}
                  placeholder={f.placeholder}
                  placeholderTextColor={Colors.textMuted}
                  keyboardType={(f as any).keyboard || 'default'}
                  autoCapitalize={f.capitalize as any}
                  autoCorrect={false}
                  multiline={(f as any).multiline}
                />
              </View>
            ))}

            <TouchableOpacity style={s.saveBtn} onPress={handleAdd}>
              <Text style={s.saveBtnText}>📅 Save Appointment</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

// ─── FamilyScreen ──────────────────────────────────────────────────────────────
export function FamilyScreen({ navigation }: any) {
  const [members, setMembers] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: '',
    member_relationship: '',
    email: '',
    phone: '',
    can_view_medications: true,
    can_view_vitals: true,
    can_receive_sos: true,
  });

  const loadFamily = async () => {
    try {
      setMembers(await familyService.list());
    } catch {}
  };

  useEffect(() => { loadFamily(); }, []);

  const updateForm = (key: string, value: string | boolean) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleInvite = async () => {
    if (!form.name.trim()) {
      Alert.alert('Required', 'Please enter your family member\'s name.'); return;
    }
    if (!form.email.trim() && !form.phone.trim()) {
      Alert.alert('Required', 'Please enter an email or phone number.'); return;
    }

    try {
      await familyService.invite({
        name: form.name.trim(),
        member_relationship: form.member_relationship.trim() || undefined,
        email: form.email.trim().toLowerCase() || undefined,
        phone: form.phone.trim() || undefined,
        can_view_medications: form.can_view_medications,
        can_view_vitals: form.can_view_vitals,
        can_receive_sos: form.can_receive_sos,
      });
      await loadFamily();
      setShowModal(false);
      setForm({
        name: '',
        member_relationship: '',
        email: '',
        phone: '',
        can_view_medications: true,
        can_view_vitals: true,
        can_receive_sos: true,
      });
    } catch (err: any) {
      Alert.alert('Could Not Invite', err?.response?.data?.detail || 'Please try again.');
    }
  };

  const handleDelete = (member: any) => {
    Alert.alert('Remove Family Member', `Remove ${member.name} from your circle?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await familyService.delete(member.id);
          await loadFamily();
        },
      },
    ]);
  };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={28} color={Colors.white} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>👨‍👩‍👧 Family Circle</Text>
          <Text style={s.headerSub}>{members.length} trusted contact{members.length === 1 ? '' : 's'}</Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowModal(true)}>
          <Ionicons name="add" size={26} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.content}>
        <View style={s.familyIntro}>
          <Ionicons name="shield-checkmark" size={30} color={Colors.primary} />
          <Text style={s.familyIntroText}>
            Add trusted people who can help monitor medications, vitals, and emergency alerts.
          </Text>
        </View>

        {members.length === 0 && (
          <View style={s.empty}>
            <Ionicons name="people-outline" size={64} color={Colors.border} />
            <Text style={s.emptyTitle}>No family members yet</Text>
            <Text style={s.emptySub}>Tap + to invite someone you trust</Text>
          </View>
        )}

        {members.map(member => (
          <View key={member.id} style={s.familyCard}>
            <View style={s.familyAvatar}>
              <Text style={s.familyInitial}>{member.name?.[0]?.toUpperCase() || '?'}</Text>
            </View>
            <View style={s.familyInfo}>
              <Text style={s.familyName}>{member.name}</Text>
              {member.member_relationship && <Text style={s.familyMeta}>{member.member_relationship}</Text>}
              {!!member.email && <Text style={s.familyMeta}>{member.email}</Text>}
              {!!member.phone && <Text style={s.familyMeta}>{member.phone}</Text>}
              <Text style={[s.familyStatus, member.invite_accepted ? s.accepted : s.pending]}>
                {member.invite_accepted ? 'Connected' : 'Invite pending'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(member)} style={s.deleteBtn}>
              <Ionicons name="trash-outline" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity style={s.goBtn} onPress={() => navigation.navigate('Emergency')}>
          <Ionicons name="alert-circle" size={20} color={Colors.white} />
          <Text style={s.goBtnText}>Manage Emergency Contacts</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <View style={s.modal}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Invite Family Member</Text>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Ionicons name="close" size={28} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={s.modalForm} keyboardShouldPersistTaps="handled">
            {([
              ['Full Name *', 'name', 'e.g. Maria Johnson', 'default'],
              ['Relationship', 'member_relationship', 'Daughter, spouse, caregiver', 'default'],
              ['Email', 'email', 'maria@example.com', 'email-address'],
              ['Phone', 'phone', '(407) 555-0100', 'phone-pad'],
            ] as [string, string, string, any][]).map(([label, key, placeholder, keyboard]) => (
              <View key={key}>
                <Text style={s.formLabel}>{label}</Text>
                <TextInput
                  style={s.formInput}
                  value={(form as any)[key]}
                  onChangeText={value => updateForm(key, value)}
                  placeholder={placeholder}
                  placeholderTextColor={Colors.textMuted}
                  keyboardType={keyboard}
                  autoCapitalize={keyboard === 'default' ? 'words' : 'none'}
                  autoCorrect={false}
                />
              </View>
            ))}

            {([
              ['can_view_medications', 'Can view medications'],
              ['can_view_vitals', 'Can view health vitals'],
              ['can_receive_sos', 'Can receive SOS alerts'],
            ] as [string, string][]).map(([key, label]) => (
              <TouchableOpacity key={key} style={s.permissionRow} onPress={() => updateForm(key, !(form as any)[key])}>
                <Ionicons name={(form as any)[key] ? 'checkbox' : 'square-outline'} size={24} color={Colors.primary} />
                <Text style={s.permissionText}>{label}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={s.saveBtn} onPress={handleInvite}>
              <Text style={s.saveBtnText}>Send Invite</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

// ─── MedDetailScreen ──────────────────────────────────────────────────────────
export function MedDetailScreen({ route, navigation }: any) {
  const { medication: med } = route.params;
  const rows = [
    ['💊 Medication', med.name],
    ['🧬 Generic Name', med.generic_name],
    ['⚖️ Dosage', med.dosage],
    ['⏰ Frequency', med.frequency],
    ['📋 Instructions', med.instructions],
    ['👨‍⚕️ Prescriber', med.prescriber],
    ['🏪 Pharmacy', med.pharmacy_name],
    ['📝 Rx Number', med.pharmacy_rx_number],
    ['🔄 Refills Left', String(med.refills_remaining ?? '—')],
    ['📊 Status', med.status?.replace(/_/g, ' ')],
  ].filter(([, v]) => v && v !== 'undefined');

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={28} color={Colors.white} />
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>{med.name}</Text>
      </View>
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.detailCard}>
          {rows.map(([label, val], i) => (
            <View
              key={label}
              style={[s.detailRow, i < rows.length - 1 && { borderBottomWidth: 1, borderBottomColor: Colors.borderLight }]}
            >
              <Text style={s.detailLabel}>{label}</Text>
              <Text style={s.detailValue}>{val}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity
          style={s.deliverBtn}
          onPress={() => navigation.navigate('Delivery', { medication: med })}
        >
          <Ionicons name="cube" size={22} color={Colors.white} />
          <Text style={s.deliverBtnText}>🚚 Deliver to My Home</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

export default AppointmentsScreen;

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.success, paddingTop: 56, paddingBottom: 20,
    paddingHorizontal: Spacing.lg, flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.md,
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: Typography.heading1, fontWeight: Typography.bold, color: Colors.white },
  headerSub: { fontSize: Typography.bodySmall, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  addBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },

  content: { padding: Spacing.lg },

  empty: { alignItems: 'center', paddingVertical: 80, gap: Spacing.md },
  emptyTitle: { fontSize: Typography.heading2, fontWeight: Typography.bold, color: Colors.textMuted },
  emptySub: { fontSize: Typography.body, color: Colors.textMuted, textAlign: 'center' },

  toggleBtn: {
    backgroundColor: Colors.infoLight, borderRadius: BorderRadius.md,
    padding: 10, alignItems: 'center', marginBottom: Spacing.md,
  },
  toggleText: { fontSize: Typography.bodySmall, color: Colors.primary, fontWeight: Typography.semiBold },

  card: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl,
    padding: Spacing.lg, marginBottom: Spacing.md, ...Shadows.card,
  },
  cardCompleted: { opacity: 0.65 },
  cardTop: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  cardIcon: {
    width: 48, height: 48, borderRadius: BorderRadius.md,
    backgroundColor: Colors.infoLight, justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  cardInfo: { flex: 1, gap: 3 },
  doctorName: { fontSize: Typography.body, fontWeight: Typography.bold, color: Colors.textPrimary },
  specialty: { fontSize: Typography.bodySmall, color: Colors.textSecondary },
  clinic: { fontSize: Typography.bodySmall, color: Colors.textSecondary },
  date: { fontSize: Typography.bodySmall, fontWeight: Typography.semiBold, marginTop: 4 },
  time: { fontSize: Typography.bodySmall, fontWeight: Typography.medium },
  notes: { fontSize: Typography.bodySmall, color: Colors.textSecondary, fontStyle: 'italic', marginTop: 2 },

  cardActions: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginTop: 4,
  },
  completeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    padding: 8, backgroundColor: Colors.successLight, borderRadius: BorderRadius.sm,
  },
  completeBtnText: { fontSize: Typography.bodySmall, fontWeight: Typography.semiBold, color: Colors.success },
  doneTag: {
    backgroundColor: Colors.successLight, borderRadius: BorderRadius.sm, padding: 8,
  },
  doneTagText: { fontSize: Typography.bodySmall, color: Colors.success, fontWeight: Typography.medium },
  deleteBtn: { padding: 8 },

  // Modal
  modal: { flex: 1, backgroundColor: Colors.white },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Spacing.lg, paddingTop: 20,
    borderBottomWidth: 1, borderColor: Colors.borderLight,
  },
  modalTitle: { fontSize: Typography.heading1, fontWeight: Typography.bold, color: Colors.textPrimary },
  modalForm: { padding: Spacing.lg, paddingBottom: 60 },
  formLabel: {
    fontSize: Typography.body, fontWeight: Typography.semiBold,
    color: Colors.textPrimary, marginBottom: 8, marginTop: Spacing.md,
  },
  formInput: {
    borderWidth: 2, borderColor: Colors.border, borderRadius: BorderRadius.md,
    paddingHorizontal: 14, paddingVertical: 14, fontSize: Typography.body,
    color: Colors.textPrimary, backgroundColor: Colors.offWhite, minHeight: 56,
  },
  selectedDateTime: {
    backgroundColor: Colors.infoLight, borderRadius: BorderRadius.md,
    padding: Spacing.md, marginTop: Spacing.md,
  },
  selectedDateTimeText: { fontSize: Typography.body, color: Colors.primary, fontWeight: Typography.semiBold },
  saveBtn: {
    backgroundColor: Colors.success, borderRadius: BorderRadius.md,
    padding: 18, alignItems: 'center', marginTop: Spacing.xl,
  },
  saveBtnText: { color: Colors.white, fontSize: Typography.button, fontWeight: Typography.bold },

  // Family
  familyIntro: {
    backgroundColor: Colors.infoLight,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  familyIntroText: { flex: 1, fontSize: Typography.bodySmall, color: Colors.primary, lineHeight: 21 },
  familyCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.card,
  },
  familyAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  familyInitial: { fontSize: Typography.heading2, fontWeight: Typography.bold, color: Colors.white },
  familyInfo: { flex: 1 },
  familyName: { fontSize: Typography.body, fontWeight: Typography.bold, color: Colors.textPrimary },
  familyMeta: { fontSize: Typography.bodySmall, color: Colors.textSecondary, marginTop: 2 },
  familyStatus: { fontSize: Typography.caption, fontWeight: Typography.bold, marginTop: 6 },
  accepted: { color: Colors.success },
  pending: { color: Colors.warning },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: Colors.offWhite,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  permissionText: { fontSize: Typography.body, color: Colors.textPrimary },
  goBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  goBtnText: { color: Colors.white, fontSize: Typography.button, fontWeight: Typography.bold },

  // MedDetail
  detailCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl,
    overflow: 'hidden', marginBottom: Spacing.lg, ...Shadows.card,
  },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', padding: Spacing.md, minHeight: 52 },
  detailLabel: { width: 140, fontSize: Typography.bodySmall, fontWeight: Typography.semiBold, color: Colors.textSecondary },
  detailValue: { flex: 1, fontSize: Typography.body, color: Colors.textPrimary },
  deliverBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.lg,
    padding: 20, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: Spacing.sm, ...Shadows.heavy,
  },
  deliverBtnText: { color: Colors.white, fontSize: Typography.button, fontWeight: Typography.extraBold },
});

// ── Date/Time Picker Styles ───────────────────────────────────────────────────
const tp = StyleSheet.create({
  row: { flexDirection: 'row', height: 160, gap: 8 },
  col: { flex: 1, backgroundColor: Colors.offWhite, borderRadius: BorderRadius.md },
  colon: { fontSize: 28, fontWeight: Typography.bold, color: Colors.textPrimary, alignSelf: 'center' },
  item: { padding: 12, alignItems: 'center' },
  selected: { backgroundColor: Colors.primary, borderRadius: BorderRadius.sm, margin: 4 },
  itemText: { fontSize: Typography.body, color: Colors.textPrimary, fontWeight: Typography.medium },
  selectedText: { color: Colors.white, fontWeight: Typography.bold },
});

const dp = StyleSheet.create({
  row: { flexDirection: 'row', marginBottom: Spacing.sm },
  dayBtn: {
    width: 64, alignItems: 'center', padding: 10,
    borderRadius: BorderRadius.md, marginRight: 8,
    backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border,
  },
  daySelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dayName: { fontSize: 11, color: Colors.textMuted, fontWeight: Typography.semiBold },
  dayNum: { fontSize: 22, fontWeight: Typography.bold, color: Colors.textPrimary, marginVertical: 2 },
  dayMonth: { fontSize: 11, color: Colors.textMuted },
  daySelectedText: { color: Colors.white },
});
