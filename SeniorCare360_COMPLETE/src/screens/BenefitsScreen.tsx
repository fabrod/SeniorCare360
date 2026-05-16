// ─── BenefitsScreen ───────────────────────────────────────────────────────────
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Linking, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { benefitsService } from '../services/api';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../theme';

export default function BenefitsScreen() {
  const [benefits, setBenefits] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    benefitsService.list().then(r => setBenefits(r.benefits)).catch(() => {});
  }, []);

  const categories = [...new Set(benefits.map((b: any) => b.category))];

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>⭐ Benefits & Resources</Text>
        <Text style={s.headerSub}>Programs you may qualify for</Text>
      </View>

      <ScrollView contentContainerStyle={s.content}>
        {categories.map(cat => (
          <View key={cat}>
            <Text style={s.catTitle}>{cat}</Text>
            {benefits.filter((b: any) => b.category === cat).map((b: any) => (
              <TouchableOpacity key={b.name} style={s.benefitCard} onPress={() => setSelected(b)}>
                <View style={s.benefitIcon}>
                  <Ionicons name="star" size={22} color={Colors.accent} />
                </View>
                <View style={s.benefitText}>
                  <Text style={s.benefitName}>{b.name}</Text>
                  <Text style={s.benefitDesc} numberOfLines={2}>{b.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        ))}
        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Detail Modal */}
      <Modal visible={!!selected} animationType="slide" presentationStyle="pageSheet">
        {selected && (
          <View style={s.modal}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle} numberOfLines={2}>{selected.name}</Text>
              <TouchableOpacity onPress={() => setSelected(null)}>
                <Ionicons name="close" size={28} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={s.modalContent}>
              <View style={s.modalBadge}><Text style={s.modalBadgeText}>{selected.category}</Text></View>
              <Text style={s.modalDesc}>{selected.description}</Text>
              <InfoBlock label="✅ Who qualifies" text={selected.eligibility} />
              <InfoBlock label="📝 How to apply" text={selected.how_to_apply} />
              {selected.phone && (
                <TouchableOpacity style={s.callBtn} onPress={() => Linking.openURL(`tel:${selected.phone}`)}>
                  <Ionicons name="call" size={22} color={Colors.white} />
                  <Text style={s.callBtnText}>Call {selected.phone}</Text>
                </TouchableOpacity>
              )}
              {selected.website && (
                <TouchableOpacity style={s.webBtn} onPress={() => Linking.openURL(selected.website)}>
                  <Ionicons name="globe" size={22} color={Colors.primary} />
                  <Text style={s.webBtnText}>Visit Website</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
}

function InfoBlock({ label, text }: any) {
  return (
    <View style={s.infoBlock}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoText}>{text}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.accent, paddingTop: 56, paddingBottom: 20, paddingHorizontal: Spacing.lg },
  headerTitle: { fontSize: Typography.heading1, fontWeight: Typography.bold, color: Colors.white },
  headerSub: { fontSize: Typography.bodySmall, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  content: { padding: Spacing.lg },
  catTitle: { fontSize: Typography.heading2, fontWeight: Typography.bold, color: Colors.textPrimary, marginTop: Spacing.md, marginBottom: Spacing.sm },
  benefitCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.md, flexDirection: 'row', alignItems: 'center',
    marginBottom: Spacing.sm, ...Shadows.card,
  },
  benefitIcon: { width: 44, height: 44, borderRadius: BorderRadius.md, backgroundColor: Colors.accentLight + '40', justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  benefitText: { flex: 1 },
  benefitName: { fontSize: Typography.body, fontWeight: Typography.semiBold, color: Colors.textPrimary },
  benefitDesc: { fontSize: Typography.bodySmall, color: Colors.textSecondary, marginTop: 2 },
  modal: { flex: 1, backgroundColor: Colors.white },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: Spacing.lg, paddingTop: 20, borderBottomWidth: 1, borderColor: Colors.borderLight, gap: Spacing.md },
  modalTitle: { flex: 1, fontSize: Typography.heading2, fontWeight: Typography.bold, color: Colors.textPrimary },
  modalContent: { padding: Spacing.lg, paddingBottom: 48 },
  modalBadge: { alignSelf: 'flex-start', backgroundColor: Colors.accentLight + '50', borderRadius: BorderRadius.full, paddingVertical: 4, paddingHorizontal: 12, marginBottom: Spacing.md },
  modalBadgeText: { fontSize: Typography.bodySmall, fontWeight: Typography.semiBold, color: Colors.accentDark },
  modalDesc: { fontSize: Typography.body, color: Colors.textSecondary, lineHeight: 26, marginBottom: Spacing.lg },
  infoBlock: { backgroundColor: Colors.offWhite, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.md },
  infoLabel: { fontSize: Typography.bodySmall, fontWeight: Typography.bold, color: Colors.textPrimary, marginBottom: 4 },
  infoText: { fontSize: Typography.body, color: Colors.textSecondary, lineHeight: 24 },
  callBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  callBtnText: { color: Colors.white, fontSize: Typography.button, fontWeight: Typography.bold },
  webBtn: { backgroundColor: Colors.infoLight, borderRadius: BorderRadius.md, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, borderWidth: 1.5, borderColor: Colors.primary },
  webBtnText: { color: Colors.primary, fontSize: Typography.button, fontWeight: Typography.bold },
});
