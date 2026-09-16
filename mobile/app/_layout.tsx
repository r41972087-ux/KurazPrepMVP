import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { db, initializeTablesSync } from '../db/client';
import migrations from '../drizzle/migrations';

function useAppMigrations() {
  if (Platform.OS === 'web') {
    return { success: true, error: null };
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useMigrations(db, migrations);
}

export default function RootLayout() {
  const { success, error } = useAppMigrations();

  useEffect(() => {
    try {
      initializeTablesSync();
    } catch (e) {
      console.warn('Fallback table init warning:', e);
    }
  }, []);

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.title}>Database Setup</Text>
        <Text style={styles.errorText}>Migration notice: {error.message}</Text>
        <Text style={styles.fallbackNotice}>Using fallback offline storage...</Text>
      </View>
    );
  }

  if (!success) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Initializing KurazPrep Offline Engine...</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#FFFFFF' },
          headerTintColor: '#1E3A8A',
          headerTitleStyle: { fontWeight: '700', color: '#1E3A8A' },
          headerShadowVisible: true,
          contentStyle: { backgroundColor: '#F8FAFC' },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="subjects/[id]" options={{ title: 'Curriculum Units' }} />
        <Stack.Screen name="notes/[unitId]" options={{ title: 'Short Notes & Formulas' }} />
        <Stack.Screen name="quiz/[unitId]" options={{ title: 'MCQ Practice Quiz' }} />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E3A8A',
    marginBottom: 8,
  },
  loadingText: {
    marginTop: 16,
    color: '#64748B',
    fontSize: 15,
    fontWeight: '500',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  fallbackNotice: {
    color: '#059669',
    fontSize: 13,
  },
});
