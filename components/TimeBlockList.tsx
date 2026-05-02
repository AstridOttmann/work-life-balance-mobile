import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Divider, IconButton, List, Text } from 'react-native-paper';
import type { TimeBlock, TimeBlockInput } from '../types/entry';
import TimeBlockForm, { type TimeBlockFormHandle } from './TimeBlockForm';
import { timeBlocksApi } from '../services/api';
import { useToast } from '../context/ToastContext';

export interface TimeBlockListHandle {
  openAdd: () => void;
}

interface Props {
  dailyEntryId: number;
  type: 'WORK' | 'FREE';
  blocks: TimeBlock[];
  onChange: () => void;
}

function blockDuration(b: TimeBlock): string {
  const [sh, sm] = b.startTime.split(':').map(Number);
  const [eh, em] = b.endTime.split(':').map(Number);
  let mins = (eh * 60 + em) - (sh * 60 + sm);
  if (mins < 0) mins += 1440;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

const TimeBlockList = forwardRef<TimeBlockListHandle, Props>(function TimeBlockList(
  { dailyEntryId, type, blocks, onChange }, ref
) {
  const [localBlocks, setLocalBlocks] = useState<TimeBlock[]>(blocks);
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TimeBlock | null>(null);
  const [saving, setSaving] = useState(false);
  const addFormRef = useRef<TimeBlockFormHandle>(null);
  const editFormRef = useRef<TimeBlockFormHandle>(null);
  const { toast } = useToast();
  const insets = useSafeAreaInsets();

  useImperativeHandle(ref, () => ({ openAdd: () => setAddOpen(true) }));

  const handleCreate = async (data: TimeBlockInput) => {
    const created = await timeBlocksApi.create(data);
    setAddOpen(false);
    setLocalBlocks(prev => [...prev, created]);
    toast.success('Block added');
    onChange();
  };

  const handleUpdate = async (data: TimeBlockInput) => {
    if (!editTarget) return;
    const updated = await timeBlocksApi.update(editTarget.id, data);
    setEditTarget(null);
    setLocalBlocks(prev => prev.map(b => b.id === updated.id ? updated : b));
    toast.success('Updated');
    onChange();
  };

  const handleDelete = async (id: number) => {
    await timeBlocksApi.delete(id);
    setLocalBlocks(prev => prev.filter(b => b.id !== id));
    toast.success('Deleted');
    onChange();
  };

  const submitAdd  = async () => { setSaving(true); try { await addFormRef.current?.submit();  } finally { setSaving(false); } };
  const submitEdit = async () => { setSaving(true); try { await editFormRef.current?.submit(); } finally { setSaving(false); } };

  const label = type === 'WORK' ? 'Work' : 'Free time';

  return (
    <View>
      {localBlocks.length === 0 ? (
        <Text variant="bodySmall" style={styles.empty}>No {label.toLowerCase()} blocks</Text>
      ) : (
        localBlocks.map((b, i) => (
          <View key={b.id}>
            {i > 0 && <Divider />}
            <List.Item
              title={`${b.startTime.substring(0, 5)} – ${b.endTime.substring(0, 5)}`}
              description={blockDuration(b)}
              right={() => (
                <View style={styles.actions}>
                  <IconButton icon="pencil" size={16} onPress={() => setEditTarget(b)} />
                  <IconButton icon="delete" size={16} onPress={() => handleDelete(b.id)} />
                </View>
              )}
            />
          </View>
        ))
      )}

      <Button icon="plus" compact onPress={() => setAddOpen(true)} style={styles.addBtn}>Add</Button>

      <Modal visible={addOpen} animationType="slide" onRequestClose={() => setAddOpen(false)}>
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kav}>
            <View style={styles.modalHeader}>
              <IconButton icon="close" onPress={() => setAddOpen(false)} />
              <Text variant="titleMedium">Add {label}</Text>
              <Button mode="contained" onPress={submitAdd} loading={saving} disabled={saving}>Save</Button>
            </View>
            <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">
              <TimeBlockForm ref={addFormRef} dailyEntryId={dailyEntryId} type={type} onSave={handleCreate} />
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <Modal visible={!!editTarget} animationType="slide" onRequestClose={() => setEditTarget(null)}>
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kav}>
            <View style={styles.modalHeader}>
              <IconButton icon="close" onPress={() => setEditTarget(null)} />
              <Text variant="titleMedium">Edit {label}</Text>
              <Button mode="contained" onPress={submitEdit} loading={saving} disabled={saving}>Update</Button>
            </View>
            <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">
              {editTarget && (
                <TimeBlockForm ref={editFormRef} dailyEntryId={dailyEntryId} type={type} initial={editTarget} onSave={handleUpdate} />
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
});

export default TimeBlockList;

const styles = StyleSheet.create({
  empty: { opacity: 0.6, marginTop: 4 },
  addBtn: { alignSelf: 'flex-start', marginTop: 4 },
  actions: { flexDirection: 'row', alignItems: 'center' },
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
