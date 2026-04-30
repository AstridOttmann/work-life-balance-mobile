import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { DailyEntry, DailyEntryInput } from '../types/entry';

interface Props {
  initial?: DailyEntry;
  onSave: (data: DailyEntryInput) => Promise<void>;
  onCancel: () => void;
}

export default function EntryForm({ initial, onSave, onCancel }: Props) {
  const [date, setDate] = useState<Date>(initial ? new Date(initial.date) : new Date());
  const [workHours, setWorkHours] = useState(initial?.workHours != null ? String(initial.workHours) : '');
  const [freeTimeHours, setFreeTimeHours] = useState(initial?.freeTimeHours != null ? String(initial.freeTimeHours) : '');
  const [sleepingHours, setSleepingHours] = useState(initial?.sleepingHours != null ? String(initial.sleepingHours) : '');
  const [mood, setMood] = useState(String(initial?.mood ?? 5));
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      await onSave({
        date: `${yyyy}-${mm}-${dd}`,
        workHours: workHours ? parseFloat(workHours) : null,
        freeTimeHours: freeTimeHours ? parseFloat(freeTimeHours) : null,
        sleepingHours: sleepingHours ? parseFloat(sleepingHours) : null,
        mood: Math.min(10, Math.max(1, parseInt(mood) || 5)),
        notes: notes.trim() || null,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {!initial && (
        <>
          <Text variant="labelMedium" style={styles.label}>Date</Text>
          <DateTimePicker
            value={date}
            mode="date"
            display="spinner"
            onChange={(_, d) => { if (d) setDate(d); }}
          />
        </>
      )}
      <TextInput label="Work hours" keyboardType="numeric" value={workHours} onChangeText={setWorkHours} style={styles.input} />
      <TextInput label="Free time hours" keyboardType="numeric" value={freeTimeHours} onChangeText={setFreeTimeHours} style={styles.input} />
      <TextInput label="Sleeping hours" keyboardType="numeric" value={sleepingHours} onChangeText={setSleepingHours} style={styles.input} />
      <TextInput label="Mood (1–10)" keyboardType="numeric" value={mood} onChangeText={setMood} style={styles.input} />
      <TextInput label="Notes" multiline numberOfLines={3} value={notes} onChangeText={setNotes} style={styles.input} />
      <View style={styles.buttons}>
        <Button onPress={onCancel} disabled={saving}>Cancel</Button>
        <Button mode="contained" onPress={handleSubmit} disabled={saving}>
          {initial ? 'Update' : 'Save'}
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12, paddingBottom: 8 },
  label: { opacity: 0.7 },
  input: { backgroundColor: 'transparent' },
  buttons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
});
