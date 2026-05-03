import { forwardRef, useImperativeHandle, useState } from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { Appointment, AppointmentInput } from '../types/entry';

export interface AppointmentFormHandle {
  submit: () => Promise<void>;
}

interface Props {
  dailyEntryId: number;
  initial?: Appointment;
  onSave: (data: AppointmentInput) => Promise<void>;
}

const fmt = (d: Date) =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

const AppointmentForm = forwardRef<AppointmentFormHandle, Props>(({ dailyEntryId, initial, onSave }, ref) => {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [timeDate, setTimeDate] = useState<Date>(
    initial?.time ? new Date(`2000-01-01T${initial.time}`) : new Date()
  );
  const [durationHours, setDurationHours] = useState(
    initial?.durationHours != null ? String(initial.durationHours) : ''
  );
  const [showTimePicker, setShowTimePicker] = useState(false);

  useImperativeHandle(ref, () => ({
    submit: async () => {
      if (!title.trim()) return;
      await onSave({
        dailyEntryId,
        title: title.trim(),
        time: `${fmt(timeDate)}:00`,
        durationHours: durationHours ? parseFloat(durationHours) : null,
      });
    },
  }));

  return (
    <View style={styles.container}>
      <TextInput
        label="Title"
        value={title}
        onChangeText={setTitle}
        style={styles.input}
      />
      <View style={styles.timeField}>
        <Text style={styles.timeLabel}>Time</Text>
        <View style={styles.timeContent}>
          {Platform.OS === 'android' ? (
            <>
              <TouchableOpacity onPress={() => setShowTimePicker(true)}>
                <Text>{fmt(timeDate)}</Text>
              </TouchableOpacity>
              {showTimePicker && (
                <DateTimePicker
                  value={timeDate}
                  mode="time"
                  display="default"
                  // @ts-ignore — is24Hour is a valid Android prop not in the shared TS types
                  is24Hour
                  onChange={(_, d) => { setShowTimePicker(false); if (d) setTimeDate(d); }}
                />
              )}
            </>
          ) : (
            <DateTimePicker
              value={timeDate}
              mode="time"
              display="compact"
              // @ts-ignore — is24Hour is a valid Android prop not in the shared TS types
              is24Hour={true}
              onChange={(_, d) => { if (d) setTimeDate(d); }}
            />
          )}
        </View>
      </View>
      <TextInput
        label="Duration (hours)"
        value={durationHours}
        onChangeText={setDurationHours}
        keyboardType="numeric"
        style={styles.input}
      />
    </View>
  );
});

AppointmentForm.displayName = 'AppointmentForm';
export default AppointmentForm;

const styles = StyleSheet.create({
  container: { gap: 4 },
  input: { backgroundColor: 'transparent' },
  timeField: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.38)',
    minHeight: 56,
    justifyContent: 'center',
  },
  timeLabel: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.6)',
    marginBottom: 6,
  },
  timeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
