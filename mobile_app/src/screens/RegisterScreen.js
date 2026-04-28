// src/screens/RegisterScreen.js
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Input, Button, ErrorBox } from '../components/UI';
import { Colors, Spacing, Typography } from '../utils/theme';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [form, setForm]       = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError('');
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setError('All fields are required.');
      return;
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await register(form.name.trim(), form.email.trim(), form.password);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
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
        <View style={styles.brand}>
          <Text style={styles.brandIcon}>🌿</Text>
          <Text style={styles.brandName}>Create Account</Text>
          <Text style={styles.brandSub}>Start tracking your carbon footprint</Text>
        </View>

        <View style={styles.card}>
          <ErrorBox message={error} />

          <Input
            label="Full Name"
            placeholder="Jane Doe"
            autoCapitalize="words"
            value={form.name}
            onChangeText={(v) => setForm({ ...form, name: v })}
          />
          <Input
            label="Email Address"
            placeholder="jane@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={form.email}
            onChangeText={(v) => setForm({ ...form, email: v })}
          />
          <Input
            label="Password"
            placeholder="Min. 6 characters"
            secureTextEntry
            value={form.password}
            onChangeText={(v) => setForm({ ...form, password: v })}
          />
          <Input
            label="Confirm Password"
            placeholder="••••••••"
            secureTextEntry
            value={form.confirm}
            onChangeText={(v) => setForm({ ...form, confirm: v })}
          />

          <Button title="Sign Up" onPress={handleRegister} loading={loading} style={{ marginTop: Spacing.sm }} />

          <TouchableOpacity style={styles.switchRow} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.switchText}>
              Already have an account? <Text style={styles.switchLink}>Login</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: Colors.primary },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: Spacing.lg },
  brand:  { alignItems: 'center', marginBottom: Spacing.xl },
  brandIcon: { fontSize: 44, marginBottom: Spacing.sm },
  brandName: { fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  brandSub:  { fontSize: 13, color: 'rgba(193,236,212,0.75)', marginTop: 4 },
  card: { backgroundColor: Colors.surface, borderRadius: 20, padding: Spacing.xl },
  switchRow: { alignItems: 'center', marginTop: Spacing.lg },
  switchText: { ...Typography.body, color: Colors.textMuted },
  switchLink: { color: Colors.primary, fontWeight: '700' },
});
