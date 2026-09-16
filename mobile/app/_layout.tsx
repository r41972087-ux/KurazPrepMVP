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
    // Synchronously ensure tables are created on boot
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
        <ActivityIndicator size="large" color="#38BDF8" />
        <Text style={styles.loadingText}>Initializing KurazPrep Offline Engine...</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#0F172A' },
          headerTintColor: '#F8FAFC',
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: '#0B0F19' },
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
    backgroundColor: '#0B0F19',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 8,
  },
  loadingText: {
    marginTop: 16,
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '500',
  },
  errorText: {
    color: '#F87171',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  fallbackNotice: {
    color: '#34D399',
    fontSize: 13,
  },
});
