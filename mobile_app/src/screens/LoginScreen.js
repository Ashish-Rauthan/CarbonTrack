// src/screens/LoginScreen.js
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Input, Button, ErrorBox } from '../components/UI';
import { Colors, Spacing, Radius, Typography } from '../utils/theme';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    if (!form.email.trim() || !form.password) {
      setError('Please enter both email and password.');
      return;
    }
    setLoading(true);
    try {
      await login(form.email.trim(), form.password);
      // Navigation handled by AppNavigator watching auth state
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Brand */}
        <View style={styles.brand}>
          <Text style={styles.brandIcon}>🌍</Text>
          <Text style={styles.brandName}>Carbon Tracker</Text>
          <Text style={styles.brandSub}>The Digital Arboreal</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome back</Text>
          <Text style={styles.cardSub}>Log in to your dashboard.</Text>

          <ErrorBox message={error} />

          <Input
            label="Email Address"
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={form.email}
            onChangeText={(v) => setForm({ ...form, email: v })}
          />
          <Input
            label="Password"
            placeholder="••••••••"
            secureTextEntry
            value={form.password}
            onChangeText={(v) => setForm({ ...form, password: v })}
          />

          <Button
            title="Login"
            onPress={handleLogin}
            loading={loading}
            style={{ marginTop: Spacing.sm }}
          />

          <TouchableOpacity
            style={styles.switchRow}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.switchText}>
              Don't have an account?{' '}
              <Text style={styles.switchLink}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>© 2024 Carbon Tracker — Towards a permanent digital forest.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: Colors.primary },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: Spacing.lg },

  brand: { alignItems: 'center', marginBottom: Spacing.xl },
  brandIcon: { fontSize: 48, marginBottom: Spacing.sm },
  brandName: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  brandSub:  { fontSize: 12, fontWeight: '500', color: 'rgba(193,236,212,0.75)', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 4 },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: Spacing.xl,
  },
  cardTitle: { ...Typography.h2, marginBottom: 4 },
  cardSub:   { ...Typography.body, color: Colors.textMuted, marginBottom: Spacing.lg },

  switchRow: { alignItems: 'center', marginTop: Spacing.lg },
  switchText: { ...Typography.body, color: Colors.textMuted },
  switchLink: { color: Colors.primary, fontWeight: '700' },

  footer: {
    textAlign: 'center',
    marginTop: Spacing.xl,
    fontSize: 11,
    color: 'rgba(193,236,212,0.45)',
    letterSpacing: 0.3,
  },
});
