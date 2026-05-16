import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView,
  Platform, TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { loginSuccess, setProfile } from '../store';
import { authService, userService } from '../services/api';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../theme';

interface FieldConfig {
  label: string;
  field: string;
  placeholder: string;
  keyboardType?: TextInputProps['keyboardType'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
  secure?: boolean;
  autoComplete?: TextInputProps['autoComplete'];
}

const FIELDS: FieldConfig[] = [
  {
    label: '👤 First Name',
    field: 'first_name',
    placeholder: 'e.g. Dorothy',
    keyboardType: 'default',
    autoCapitalize: 'sentences',
    autoComplete: 'given-name',
  },
  {
    label: '👤 Last Name',
    field: 'last_name',
    placeholder: 'e.g. Johnson',
    keyboardType: 'default',
    autoCapitalize: 'sentences',
    autoComplete: 'family-name',
  },
  {
    label: '📧 Email Address',
    field: 'email',
    placeholder: 'your@email.com',
    keyboardType: 'email-address',
    autoCapitalize: 'none',
    autoComplete: 'email',
  },
  {
    label: '📱 Phone (optional)',
    field: 'phone',
    placeholder: '+1 (555) 000-0000',
    keyboardType: 'phone-pad',
    autoCapitalize: 'none',
    autoComplete: 'tel',
  },
  {
    label: '🔒 Password',
    field: 'password',
    placeholder: 'At least 8 characters',
    keyboardType: 'default',
    autoCapitalize: 'none',
    secure: true,
    autoComplete: 'new-password',
  },
  {
    label: '🔒 Confirm Password',
    field: 'confirm_password',
    placeholder: 'Re-enter your password',
    keyboardType: 'default',
    autoCapitalize: 'none',
    secure: true,
    autoComplete: 'new-password',
  },
];

export default function RegisterScreen({ navigation }: any) {
  const dispatch = useDispatch();
  const [form, setForm] = useState<Record<string, string>>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const refs = useRef<Record<string, TextInput | null>>({});

  const update = (key: string, val: string) =>
    setForm(f => ({ ...f, [key]: val }));

  const handleRegister = async () => {
    const { first_name, last_name, email, password, confirm_password, phone } = form;

    if (!first_name.trim()) {
      Alert.alert('Missing Info', 'Please enter your first name.'); return;
    }
    if (!last_name.trim()) {
      Alert.alert('Missing Info', 'Please enter your last name.'); return;
    }
    if (!email.trim()) {
      Alert.alert('Missing Info', 'Please enter your email address.'); return;
    }
    if (!password) {
      Alert.alert('Missing Info', 'Please create a password.'); return;
    }
    if (password.length < 8) {
      Alert.alert('Weak Password', 'Password must be at least 8 characters.'); return;
    }
    if (password !== confirm_password) {
      Alert.alert('Passwords Do Not Match', 'Please make sure both passwords match.'); return;
    }

    setLoading(true);
    try {
      const result = await authService.register({
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        password,
      });
      dispatch(loginSuccess({
        userId: result.user_id,
        firstName: result.first_name,
        token: result.access_token,
      }));
      const profile = await userService.getProfile();
      dispatch(setProfile(profile));
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Registration failed. Please try again.';
      Alert.alert('Registration Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const fieldOrder = FIELDS.map(f => f.field);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back button */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color={Colors.primary} />
          <Text style={styles.backText}>Back to Sign In</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Create Your Account</Text>
        <Text style={styles.subtitle}>
          Join thousands of seniors living healthier, easier lives.
        </Text>

        <View style={styles.card}>
          {FIELDS.map((config, idx) => (
            <View key={config.field} style={styles.fieldWrap}>
              <Text style={styles.label}>{config.label}</Text>
              <View style={config.secure ? styles.passwordRow : undefined}>
                <TextInput
                  ref={r => { refs.current[config.field] = r; }}
                  style={[
                    styles.input,
                    config.secure && styles.passwordInput,
                  ]}
                  value={form[config.field]}
                  onChangeText={v => update(config.field, v)}
                  placeholder={config.placeholder}
                  placeholderTextColor={Colors.textMuted}
                  keyboardType={config.keyboardType}
                  autoCapitalize={config.autoCapitalize}
                  autoCorrect={false}
                  autoComplete={config.autoComplete}
                  secureTextEntry={config.secure && !showPass}
                  returnKeyType={idx < FIELDS.length - 1 ? 'next' : 'done'}
                  onSubmitEditing={() => {
                    const nextField = fieldOrder[idx + 1];
                    if (nextField) refs.current[nextField]?.focus();
                    else handleRegister();
                  }}
                  blurOnSubmit={false}
                  textContentType={
                    config.field === 'password' ? 'newPassword'
                    : config.field === 'confirm_password' ? 'newPassword'
                    : config.field === 'email' ? 'emailAddress'
                    : config.field === 'first_name' ? 'givenName'
                    : config.field === 'last_name' ? 'familyName'
                    : 'none'
                  }
                />
                {config.secure && (
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowPass(p => !p)}
                  >
                    <Ionicons
                      name={showPass ? 'eye-off' : 'eye'}
                      size={24}
                      color={Colors.textSecondary}
                    />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}

          <View style={styles.privacyBox}>
            <Ionicons name="shield-checkmark" size={20} color={Colors.success} />
            <Text style={styles.privacyText}>
              Your information is encrypted and secure. We never sell or share your data.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.registerBtn, loading && { opacity: 0.7 }]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} size="large" />
            ) : (
              <Text style={styles.registerBtnText}>Create My Account →</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  container: { flexGrow: 1, padding: Spacing.lg, paddingTop: 56 },

  backBtn: {
    flexDirection: 'row', alignItems: 'center',
    gap: 6, marginBottom: Spacing.lg,
  },
  backText: {
    fontSize: Typography.body,
    color: Colors.primary,
    fontWeight: Typography.medium,
  },

  title: {
    fontSize: Typography.displayM,
    fontWeight: Typography.extraBold,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    lineHeight: 24,
  },

  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    ...Shadows.card,
  },

  fieldWrap: { marginBottom: 4 },

  label: {
    fontSize: Typography.body,
    fontWeight: Typography.semiBold,
    color: Colors.textPrimary,
    marginBottom: 8,
    marginTop: Spacing.md,
  },
  input: {
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: Typography.body,
    color: Colors.textPrimary,
    backgroundColor: Colors.offWhite,
    minHeight: 56,
  },
  passwordRow: { position: 'relative' },
  passwordInput: { paddingRight: 56 },
  eyeBtn: {
    position: 'absolute', right: 14,
    top: 0, bottom: 0, justifyContent: 'center',
  },

  privacyBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: Colors.successLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.lg,
  },
  privacyText: {
    flex: 1,
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 20,
  },

  registerBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    padding: 18,
    alignItems: 'center',
    marginTop: Spacing.lg,
    minHeight: 60,
    ...Shadows.card,
  },
  registerBtnText: {
    color: Colors.white,
    fontSize: Typography.button,
    fontWeight: Typography.bold,
  },
});
