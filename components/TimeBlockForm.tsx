import { forwardRef, useImperativeHandle, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { TimeBlock, TimeBlockInput } from '../types/entry';

export interface TimeBlockFormHandle {
  submit: () => Promise<void>;
}

interface Props {
  dailyEntryId: number;
  type: 'WORK' | 'FREE';
  initial?: TimeBlock;
  onSave: (data: TimeBlockInput) => Promise<void>;
}

const TimeBlockForm = forwardRef<TimeBlockFormHandle, Props>(({ dailyEntryId, type, initial, onSave }, ref) => {
  const parseTime = (t?: string) => t ? new Date(`2000-01-01T${t}`) : new Date();

  const [startDate, setStartDate] = useState<Date>(parseTime(initial?.startTime));
  const [endDate, setEndDate] = useState<Date>(parseTime(initial?.endTime));

  useImperativeHandle(ref, () => ({
    submit: async () => {
      const fmt = (d: Date) =>
        `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:00`;
      await onSave({ dailyEntryId, type, startTime: fmt(startDate), endTime: fmt(endDate) });
    },
  }));

  return (
    <View style={styles.container}>
      <View style={styles.field}>
        <Text style={styles.label}>Start</Text>
        <View style={styles.pickerRow}>
          <DateTimePicker
            value={startDate}
            mode="time"
            display="compact"
            is24Hour
            onChange={(_, d) => { if (d) setStartDate(d); }}
          />
        </View>
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>End</Text>
        <View style={styles.pickerRow}>
          <DateTimePicker
            value={endDate}
            mode="time"
            display="compact"
            is24Hour
            onChange={(_, d) => { if (d) setEndDate(d); }}
          />
        </View>
      </View>
    </View>
  );
});

TimeBlockForm.displayName = 'TimeBlockForm';
export default TimeBlockForm;

const styles = StyleSheet.create({
  container: { gap: 4 },
  field: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.38)',
    minHeight: 56,
    justifyContent: 'center',
  },
  label: { fontSize: 12, color: 'rgba(0,0,0,0.6)', marginBottom: 6 },
  pickerRow: { flexDirection: 'row', alignItems: 'center' },
});
