import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, FlatList, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActivityIndicator, Button, FAB, IconButton, Text } from 'react-native-paper';
import dayjs from 'dayjs';
import type { DailyEntry, DailyEntryInput } from '../../types/entry';
import { entriesApi, timeBlocksApi } from '../../services/api';
import EntryCard from '../../components/EntryCard';
import EntryForm, { type EntryFormHandle, type PendingBlock } from '../../components/EntryForm';
import { useToast } from '../../context/ToastContext';

export default function DailyLogScreen() {
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<DailyEntry | null>(null);
  const [saving, setSaving] = useState(false);
  const addFormRef = useRef<EntryFormHandle>(null);
  const editFormRef = useRef<EntryFormHandle>(null);
  const { toast } = useToast();
  const insets = useSafeAreaInsets();

  const load = useCallback(async () => {
    try {
      const data = await entriesApi.getAll();
      setEntries([...data].sort((a, b) => b.date.localeCompare(a.date)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', state => { if (state === 'active') load(); });
    return () => sub.remove();
  }, [load]);

  const handleCreate = async (data: DailyEntryInput, pendingBlocks?: PendingBlock[]) => {
    const created = await entriesApi.create(data);
    if (pendingBlocks && pendingBlocks.length > 0) {
      await Promise.all(pendingBlocks.map(b =>
        timeBlocksApi.create({ dailyEntryId: created.id, type: b.type, startTime: b.startTime, endTime: b.endTime })
      ));
    }
    setAddOpen(false);
    toast.success('Entry created');
    await load();
  };

  const handleUpdate = async (data: DailyEntryInput) => {
    if (!editTarget) return;
    await entriesApi.update(editTarget.id, data);
    setEditTarget(null);
    toast.success('Entry updated');
    await load();
  };

  const handleDelete = async (id: number) => {
    await entriesApi.delete(id);
    toast.success('Entry deleted');
    await load();
  };

  const submitAdd = async () => {
    setSaving(true);
    try { await addFormRef.current?.submit(); }
    finally { setSaving(false); }
  };

  const submitEdit = async () => {
    setSaving(true);
    try { await editFormRef.current?.submit(); }
    finally { setSaving(false); }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={entries}
        keyExtractor={e => String(e.id)}
        renderItem={({ item }) => (
          <EntryCard
            entry={item}
            onEdit={setEditTarget}
            onDelete={handleDelete}
            onRefresh={load}
          />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>No entries yet. Tap + to add your first day!</Text>
        }
      />

      <FAB icon="plus" style={styles.fab} onPress={() => setAddOpen(true)} />

      <Modal visible={addOpen} animationType="slide" onRequestClose={() => setAddOpen(false)}>
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kav}>
            <View style={styles.modalHeader}>
              <IconButton icon="close" onPress={() => setAddOpen(false)} />
              <Text variant="titleMedium">New Day Entry</Text>
              <Button mode="contained" onPress={submitAdd} loading={saving} disabled={saving}>Save</Button>
            </View>
            <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">
              <EntryForm ref={addFormRef} onSave={handleCreate} />
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <Modal visible={!!editTarget} animationType="slide" onRequestClose={() => setEditTarget(null)}>
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kav}>
            <View style={styles.modalHeader}>
              <IconButton icon="close" onPress={() => setEditTarget(null)} />
              <Text variant="titleMedium">
                {editTarget ? dayjs(editTarget.date).format('ddd, YYYY-MM-DD') : ''}
              </Text>
              <Button mode="contained" onPress={submitEdit} loading={saving} disabled={saving}>Update</Button>
            </View>
            <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">
              {editTarget && (
                <EntryForm ref={editFormRef} initial={editTarget} onSave={handleUpdate} onRefresh={load} />
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16 },
  empty: { textAlign: 'center', opacity: 0.6, marginTop: 48 },
  fab: { position: 'absolute', right: 16, bottom: 16 },
  modalContainer: { flex: 1, backgroundColor: '#FAF9F7' },
  kav: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  formScroll: { padding: 16, paddingBottom: 32 },
});
