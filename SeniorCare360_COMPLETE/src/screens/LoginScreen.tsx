import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { loginSuccess, setProfile } from '../store';
import { authService, userService } from '../services/api';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../theme';

export default function LoginScreen({ navigation }: any) {
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert('Missing Info', 'Please enter your email address.'); return;
    }
    if (!password) {
      Alert.alert('Missing Info', 'Please enter your password.'); return;
    }
    setLoading(true);
    try {
      const result = await authService.login(email.trim().toLowerCase(), password);
      dispatch(loginSuccess({
        userId: result.user_id,
        firstName: result.first_name,
        token: result.access_token,
      }));
      const profile = await userService.getProfile();
      dispatch(setProfile(profile));
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Incorrect email or password.';
      Alert.alert('Login Failed', msg);
    } finally {
      setLoading(false);
    }
  };

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
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Ionicons name="heart" size={48} color={Colors.white} />
          </View>
          <Text style={styles.appName}>SeniorCare360</Text>
          <Text style={styles.tagline}>Your Trusted Health Companion</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.welcomeText}>Welcome Back!</Text>
          <Text style={styles.subText}>Please sign in to continue</Text>

          {/* Email */}
          <Text style={styles.label}>📧 Email Address</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            placeholderTextColor={Colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            blurOnSubmit={false}
          />

          {/* Password */}
          <Text style={styles.label}>🔒 Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
              ref={passwordRef}
              style={[styles.input, styles.passwordInput]}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry={!showPass}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="password"
              textContentType="password"
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowPass(!showPass)}
            >
              <Ionicons
                name={showPass ? 'eye-off' : 'eye'}
                size={24}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.loginBtn, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} size="large" />
            ) : (
              <Text style={styles.loginBtnText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.registerLink}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.registerText}>
              New here?{' '}
              <Text style={styles.registerTextBold}>Create an Account</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.helpBtn}>
          <Ionicons name="call" size={20} color={Colors.primary} />
          <Text style={styles.helpText}>Need Help? Call 1-800-736-4671</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  container: { flexGrow: 1, padding: Spacing.lg, paddingTop: 60 },

  header: { alignItems: 'center', marginBottom: Spacing.xl },
  logoCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.md,
    ...Shadows.heavy,
  },
  appName: {
    fontSize: Typography.displayM,
    fontWeight: Typography.extraBold,
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  tagline: { fontSize: Typography.body, color: Colors.textSecondary, marginTop: 4 },

  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    ...Shadows.card,
  },
  welcomeText: {
    fontSize: Typography.heading1,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  subText: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: Typography.body,
    fontWeight: Typography.semiBold,
    color: Colors.textPrimary,
    marginBottom: 8,
    marginTop: Spacing.sm,
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
    position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center',
  },
  loginBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    padding: 18, alignItems: 'center',
    marginTop: Spacing.lg, minHeight: 60,
    ...Shadows.card,
  },
  loginBtnText: {
    color: Colors.white,
    fontSize: Typography.button,
    fontWeight: Typography.bold,
  },
  registerLink: { alignItems: 'center', marginTop: Spacing.lg, padding: Spacing.sm },
  registerText: { fontSize: Typography.body, color: Colors.textSecondary },
  registerTextBold: { color: Colors.primary, fontWeight: Typography.bold },
  helpBtn: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', marginTop: Spacing.xl, gap: 8,
  },
  helpText: {
    fontSize: Typography.bodySmall,
    color: Colors.primary,
    fontWeight: Typography.medium,
  },
});
