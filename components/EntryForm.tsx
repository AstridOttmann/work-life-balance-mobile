import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Divider, IconButton, Text, TextInput } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { DailyEntry, DailyEntryInput, TimeBlockInput } from '../types/entry';
import TimeBlockList from './TimeBlockList';
import TimeBlockForm, { type TimeBlockFormHandle } from './TimeBlockForm';

export interface EntryFormHandle {
  submit: () => Promise<void>;
}

export type PendingBlock = { type: 'WORK' | 'FREE'; startTime: string; endTime: string };

interface Props {
  initial?: DailyEntry;
  onSave: (data: DailyEntryInput, pendingBlocks?: PendingBlock[]) => Promise<void>;
  onRefresh?: () => void;
}

function toSleepParts(hours: number | null | undefined) {
  if (!hours) return { h: '', m: '' };
  return { h: String(Math.floor(hours)), m: String(Math.round((hours % 1) * 60)) };
}

function blockDuration(start: string, end: string): string {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let mins = (eh * 60 + em) - (sh * 60 + sm);
  if (mins < 0) mins += 1440;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

const EntryForm = forwardRef<EntryFormHandle, Props>(({ initial, onSave, onRefresh }, ref) => {
  const [date, setDate] = useState<Date>(initial ? new Date(initial.date) : new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const initSleep = toSleepParts(initial?.sleepingHours);
  const [sleepH, setSleepH] = useState(initSleep.h);
  const [sleepM, setSleepM] = useState(initSleep.m);
  const [mood, setMood] = useState(String(initial?.mood ?? 5));
  const [health, setHealth] = useState(initial?.health != null ? String(initial.health) : '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const insets = useSafeAreaInsets();

  // Pending blocks — create mode only
  const [pendingBlocks, setPendingBlocks] = useState<PendingBlock[]>([]);
  const [addingType, setAddingType] = useState<'WORK' | 'FREE' | null>(null);
  const [addBlockOpen, setAddBlockOpen] = useState(false);
  const [addBlockSaving, setAddBlockSaving] = useState(false);
  const addBlockFormRef = useRef<TimeBlockFormHandle>(null);

  useImperativeHandle(ref, () => ({
    submit: async () => {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      const sleepingHours = sleepH || sleepM
        ? (parseInt(sleepH || '0') + parseInt(sleepM.replace(',', '.') || '0') / 60)
        : null;
      await onSave({
        date: `${yyyy}-${mm}-${dd}`,
        sleepingHours,
        mood: Math.min(10, Math.max(1, parseFloat(mood.replace(',', '.')) || 5)),
        health: health ? Math.min(10, Math.max(1, parseFloat(health.replace(',', '.')))) : null,
        notes: notes.trim() || null,
      }, !initial ? pendingBlocks : undefined);
    },
  }));

  const handleAddPendingBlock = async (data: TimeBlockInput) => {
    setPendingBlocks(prev => [
      ...prev,
      { type: data.type as 'WORK' | 'FREE', startTime: data.startTime, endTime: data.endTime },
    ]);
    setAddBlockOpen(false);
  };

  const submitAddBlock = async () => {
    setAddBlockSaving(true);
    try { await addBlockFormRef.current?.submit(); }
    finally { setAddBlockSaving(false); }
  };

  return (
    <View style={styles.container}>
      {!initial && (
        <>
          <Text variant="labelMedium" style={styles.label}>Date</Text>
          {Platform.OS === 'android' ? (
            <>
              <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateButton}>
                <Text>{date.toLocaleDateString()}</Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="default"
                  onChange={(_, d) => { setShowDatePicker(false); if (d) setDate(d); }}
                />
              )}
            </>
          ) : (
            <DateTimePicker
              value={date}
              mode="date"
              display="compact"
              onChange={(_, d) => { if (d) setDate(d); }}
            />
          )}
        </>
      )}

      {/* Work & Free time blocks */}
      {initial ? (
        <>
          <Text variant="labelSmall" style={[styles.sectionLabel, { color: '#1976d2' }]}>WORK BLOCKS</Text>
          <TimeBlockList
            dailyEntryId={initial.id}
            type="WORK"
            blocks={initial.timeBlocks?.filter(b => b.type === 'WORK') ?? []}
            onChange={onRefresh ?? (() => {})}
          />
          <Divider style={styles.divider} />
          <Text variant="labelSmall" style={[styles.sectionLabel, { color: '#4caf50' }]}>FREE TIME BLOCKS</Text>
          <TimeBlockList
            dailyEntryId={initial.id}
            type="FREE"
            blocks={initial.timeBlocks?.filter(b => b.type === 'FREE') ?? []}
            onChange={onRefresh ?? (() => {})}
          />
        </>
      ) : (
        <>
          {(['WORK', 'FREE'] as const).map((type, ti) => {
            const color = type === 'WORK' ? '#1976d2' : '#4caf50';
            const label = type === 'WORK' ? 'WORK BLOCKS' : 'FREE TIME BLOCKS';
            const blocks = pendingBlocks.filter(b => b.type === type);
            return (
              <View key={type}>
                {ti > 0 && <Divider style={styles.divider} />}
                <View style={styles.sectionHeader}>
                  <Text variant="labelSmall" style={[styles.sectionLabel, { color }]}>{label}</Text>
                  <Button icon="plus" compact onPress={() => { setAddingType(type); setAddBlockOpen(true); }}>Add</Button>
                </View>
                {blocks.length === 0 ? (
                  <Text variant="bodySmall" style={styles.emptyBlock}>
                    No {type === 'WORK' ? 'work' : 'free time'} blocks
                  </Text>
                ) : (
                  blocks.map((b, i) => (
                    <View key={i} style={styles.pendingRow}>
                      <Text variant="bodySmall" style={styles.pendingTime}>
                        {b.startTime.substring(0, 5)} – {b.endTime.substring(0, 5)}
                        {'  '}<Text style={styles.pendingDur}>{blockDuration(b.startTime, b.endTime)}</Text>
                      </Text>
                      <IconButton
                        icon="delete"
                        size={16}
                        onPress={() => setPendingBlocks(prev => prev.filter(pb => pb !== blocks[i]))}
                      />
                    </View>
                  ))
                )}
              </View>
            );
          })}
        </>
      )}

      <Divider style={styles.divider} />

      <Text variant="labelMedium" style={styles.label}>Sleeping time</Text>
      <View style={styles.row}>
        <TextInput
          label="Hours"
          keyboardType="number-pad"
          value={sleepH}
          onChangeText={setSleepH}
          style={[styles.input, styles.half]}
        />
        <TextInput
          label="Minutes"
          keyboardType="number-pad"
          value={sleepM}
          onChangeText={setSleepM}
          style={[styles.input, styles.half]}
        />
      </View>

      <TextInput label="Mood (1–10)"   keyboardType="decimal-pad" value={mood}   onChangeText={setMood}   style={styles.input} />
      <TextInput label="Health (1–10)" keyboardType="decimal-pad" value={health} onChangeText={setHealth} style={styles.input} />
      <TextInput label="Notes" multiline numberOfLines={3} value={notes} onChangeText={setNotes} style={styles.input} />

      {/* Add block modal — nested inside EntryForm so it layers correctly over the outer modal */}
      <Modal visible={addBlockOpen} animationType="slide" onRequestClose={() => setAddBlockOpen(false)}>
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kav}>
            <View style={styles.modalHeader}>
              <IconButton icon="close" onPress={() => setAddBlockOpen(false)} />
              <Text variant="titleMedium">Add {addingType === 'WORK' ? 'Work' : 'Free time'}</Text>
              <Button mode="contained" onPress={submitAddBlock} loading={addBlockSaving} disabled={addBlockSaving}>Add</Button>
            </View>
            <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">
              {addingType && (
                <TimeBlockForm
                  ref={addBlockFormRef}
                  dailyEntryId={0}
                  type={addingType}
                  onSave={handleAddPendingBlock}
                />
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
});

EntryForm.displayName = 'EntryForm';
export default EntryForm;

const styles = StyleSheet.create({
  container: { gap: 12, paddingVertical: 8 },
  dateButton: { paddingVertical: 8, paddingHorizontal: 4 },
  label: { opacity: 0.7 },
  input: { backgroundColor: 'transparent' },
  row: { flexDirection: 'row', gap: 8 },
  half: { flex: 1 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionLabel: { fontWeight: '700', marginBottom: 4 },
  divider: { marginVertical: 12 },
  emptyBlock: { opacity: 0.6, marginTop: 4 },
  pendingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  pendingTime: { flex: 1 },
  pendingDur: { opacity: 0.6 },
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
