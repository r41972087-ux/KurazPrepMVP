import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';
import { useSyncStore } from '../../stores/syncStore';
import { SyncManager } from '../../services/syncManager';

export default function SettingsScreen() {
  const { isGuest, user, selectedStream, setStream, selectedGrade, setGrade, logout } = useAuthStore();
  const { isSyncing, lastSyncedAt, pendingAttemptsCount, syncError } = useSyncStore();

  const handleSyncAll = async () => {
    const result = await SyncManager.syncAll();
    if (result.errors.length > 0) {
      Alert.alert('Sync Result', `Synced ${result.syncedAttempts} attempts. Errors:\n` + result.errors.join('\n'));
    } else {
      Alert.alert(
        'Sync Successful',
        `Curriculum updated (${result.updatedSubjects} subjects). Synced ${result.syncedAttempts} quiz attempt(s).`
      );
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Student Account / Guest Mode Section */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Profile & Mode</Text>
        <View style={styles.card}>
          <View style={styles.profileRow}>
            <View style={styles.avatarBox}>
              <Ionicons name="person-outline" size={24} color="#2563EB" />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {isGuest ? 'Guest Student Mode' : user?.name || 'Registered Student'}
              </Text>
              <Text style={styles.profileStatus}>
                {isGuest
                  ? 'All notes and quizzes work 100% offline'
                  : `Signed in as ${user?.email}`}
              </Text>
            </View>
          </View>

          {isGuest ? (
            <View style={styles.guestNote}>
              <Ionicons name="information-circle-outline" size={16} color="#2563EB" />
              <Text style={styles.guestNoteText}>
                No account required to study or take tests. You can sync quiz scores whenever you go online.
              </Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.logoutButton} onPress={logout}>
              <Text style={styles.logoutText}>Switch to Guest Mode</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Target Curriculum Section */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Target Stream & Grade</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Selected Stream</Text>
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.segmentBtn, selectedStream === 'NATURAL' && styles.segmentBtnActive]}
              onPress={() => setStream('NATURAL')}
            >
              <Text
                style={[
                  styles.segmentBtnText,
                  selectedStream === 'NATURAL' && styles.segmentBtnTextActive,
                ]}
              >
                Natural Science
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segmentBtn, selectedStream === 'SOCIAL' && styles.segmentBtnActive]}
              onPress={() => setStream('SOCIAL')}
            >
              <Text
                style={[
                  styles.segmentBtnText,
                  selectedStream === 'SOCIAL' && styles.segmentBtnTextActive,
                ]}
              >
                Social Science
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.label, { marginTop: 16 }]}>Grade Level</Text>
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.segmentBtn, selectedGrade === 11 && styles.segmentBtnActive]}
              onPress={() => setGrade(11)}
            >
              <Text
                style={[styles.segmentBtnText, selectedGrade === 11 && styles.segmentBtnTextActive]}
              >
                Grade 11
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segmentBtn, selectedGrade === 12 && styles.segmentBtnActive]}
              onPress={() => setGrade(12)}
            >
              <Text
                style={[styles.segmentBtnText, selectedGrade === 12 && styles.segmentBtnTextActive]}
              >
                Grade 12 (ESSLCE Target)
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Delta Sync & Offline Storage Engine */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Offline & Delta Sync Engine</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Offline Database</Text>
            <Text style={styles.infoValue}>SQLite + Drizzle ORM</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Unsynced Quiz Attempts</Text>
            <Text style={[styles.infoValue, { color: pendingAttemptsCount > 0 ? '#D97706' : '#059669' }]}>
              {pendingAttemptsCount} pending
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Last Delta Sync</Text>
            <Text style={styles.infoValue}>
              {lastSyncedAt ? new Date(lastSyncedAt).toLocaleString() : 'Never synced'}
            </Text>
          </View>

          {syncError && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>Sync Warning: {syncError}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.syncActionBtn, isSyncing && styles.syncActionBtnDisabled]}
            disabled={isSyncing}
            onPress={handleSyncAll}
          >
            <Ionicons name="cloud-download-outline" size={18} color="#FFFFFF" />
            <Text style={styles.syncActionBtnText}>
              {isSyncing ? 'Syncing with Server...' : 'Trigger Delta Sync Now'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>KurazPrep MVP • Offline-First Ethiopian ESSLCE Prep</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  profileStatus: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  guestNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    padding: 10,
    borderRadius: 8,
    marginTop: 14,
  },
  guestNoteText: {
    flex: 1,
    fontSize: 12,
    color: '#1E40AF',
    lineHeight: 16,
  },
  logoutButton: {
    marginTop: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  segmentBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  segmentBtnActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  segmentBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  segmentBtnTextActive: {
    color: '#FFFFFF',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  infoLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  errorBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
  },
  syncActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 16,
  },
  syncActionBtnDisabled: {
    backgroundColor: '#CBD5E1',
  },
  syncActionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    color: '#94A3B8',
    fontSize: 12,
  },
});
