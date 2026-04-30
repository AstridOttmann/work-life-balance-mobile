import { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Dialog, FAB, Portal, Text } from 'react-native-paper';
import type { DailyEntry, DailyEntryInput } from '../../types/entry';
import { entriesApi } from '../../services/api';
import EntryCard from '../../components/EntryCard';
import EntryForm from '../../components/EntryForm';
import { useToast } from '../../context/ToastContext';

export default function DailyLogScreen() {
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<DailyEntry | null>(null);
  const { toast } = useToast();

  const load = useCallback(async () => {
    try {
      const data = await entriesApi.getAll();
      setEntries([...data].sort((a, b) => b.date.localeCompare(a.date)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (data: DailyEntryInput) => {
    await entriesApi.create(data);
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

      <Portal>
        <Dialog visible={addOpen} onDismiss={() => setAddOpen(false)}>
          <Dialog.Title>New Day Entry</Dialog.Title>
          <Dialog.ScrollArea>
            <EntryForm onSave={handleCreate} onCancel={() => setAddOpen(false)} />
          </Dialog.ScrollArea>
        </Dialog>

        <Dialog visible={!!editTarget} onDismiss={() => setEditTarget(null)}>
          <Dialog.Title>Edit Entry</Dialog.Title>
          <Dialog.ScrollArea>
            {editTarget && (
              <EntryForm
                initial={editTarget}
                onSave={handleUpdate}
                onCancel={() => setEditTarget(null)}
              />
            )}
          </Dialog.ScrollArea>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16 },
  empty: { textAlign: 'center', opacity: 0.6, marginTop: 48 },
  fab: { position: 'absolute', right: 16, bottom: 16 },
});
