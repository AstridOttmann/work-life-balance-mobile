import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, TextInput } from 'react-native-paper';
import type { Appointment, AppointmentInput } from '../types/entry';

interface Props {
  dailyEntryId: number;
  initial?: Appointment;
  onSave: (data: AppointmentInput) => Promise<void>;
  onCancel: () => void;
}

export default function AppointmentForm({ dailyEntryId, initial, onSave, onCancel }: Props) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [time, setTime] = useState(initial?.time?.substring(0, 5) ?? '');
  const [durationHours, setDurationHours] = useState(
    initial?.durationHours != null ? String(initial.durationHours) : ''
  );
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onSave({
        dailyEntryId,
        title: title.trim(),
        time: time || null,
        durationHours: durationHours ? parseFloat(durationHours) : null,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput label="Title" value={title} onChangeText={setTitle} style={styles.input} />
      <TextInput label="Time (HH:mm)" value={time} onChangeText={setTime} placeholder="e.g. 09:30" style={styles.input} />
      <TextInput label="Duration (hours)" value={durationHours} onChangeText={setDurationHours} keyboardType="numeric" style={styles.input} />
      <View style={styles.buttons}>
        <Button onPress={onCancel} disabled={saving}>Cancel</Button>
        <Button mode="contained" onPress={handleSubmit} disabled={saving || !title.trim()}>
          {initial ? 'Update' : 'Save'}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  input: { backgroundColor: 'transparent' },
  buttons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 4 },
});
