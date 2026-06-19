import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ScreenContainer, ThemedText, Button, Card, SectionLabel } from '@/components/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { supabase } from '@/services/supabase';
import { isSupabaseConfigured } from '@/lib/env';

type Mode = 'sign-in' | 'sign-up';

export default function SignInScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const inputStyle = {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    color: theme.colors.text,
    fontSize: 16,
  };

  async function submit() {
    setError(null);
    setNotice(null);
    if (!isSupabaseConfigured) {
      setError('Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.');
      return;
    }
    if (!email.trim() || !password) {
      setError('Enter an email and password.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'sign-up') {
        const { error } = await supabase.auth.signUp({ email: email.trim(), password });
        if (error) throw error;
        setNotice('Account created. If email confirmation is on, check your inbox, then sign in.');
        setMode('sign-in');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        router.replace('/(tabs)');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, justifyContent: 'center', padding: theme.spacing.xl }}
      >
        <View style={{ marginBottom: theme.spacing.xl }}>
          <ThemedText variant="title">Read more,{'\n'}a little at a time.</ThemedText>
          <ThemedText muted style={{ marginTop: theme.spacing.sm }}>
            Turn finishing a book into small daily wins.
          </ThemedText>
        </View>

        <Card>
          <SectionLabel>Email</SectionLabel>
          <TextInput
            style={inputStyle}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            placeholder="you@example.com"
            placeholderTextColor={theme.colors.textMuted}
          />
          <View style={{ height: theme.spacing.md }} />
          <SectionLabel>Password</SectionLabel>
          <TextInput
            style={inputStyle}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor={theme.colors.textMuted}
          />

          {error ? (
            <ThemedText color={theme.colors.danger} style={{ marginTop: theme.spacing.md }}>
              {error}
            </ThemedText>
          ) : null}
          {notice ? (
            <ThemedText color={theme.colors.success} style={{ marginTop: theme.spacing.md }}>
              {notice}
            </ThemedText>
          ) : null}

          <View style={{ height: theme.spacing.lg }} />
          <Button
            title={mode === 'sign-in' ? 'Sign in' : 'Create account'}
            loading={loading}
            onPress={submit}
          />
          <Button
            title={mode === 'sign-in' ? "I'm new — create an account" : 'I already have an account'}
            variant="ghost"
            style={{ marginTop: theme.spacing.sm }}
            onPress={() => {
              setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in');
              setError(null);
              setNotice(null);
            }}
          />
        </Card>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
