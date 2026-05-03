import { forwardRef, useImperativeHandle, useState } from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
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

const fmt = (d: Date) =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

const TimeBlockForm = forwardRef<TimeBlockFormHandle, Props>(({ dailyEntryId, type, initial, onSave }, ref) => {
  const parseTime = (t?: string) => t ? new Date(`2000-01-01T${t}`) : new Date();

  const [startDate, setStartDate] = useState<Date>(parseTime(initial?.startTime));
  const [endDate, setEndDate] = useState<Date>(parseTime(initial?.endTime));
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);

  useImperativeHandle(ref, () => ({
    submit: async () => {
      await onSave({ dailyEntryId, type, startTime: `${fmt(startDate)}:00`, endTime: `${fmt(endDate)}:00` });
    },
  }));

  return (
    <View style={styles.container}>
      <View style={styles.field}>
        <Text style={styles.label}>Start</Text>
        <View style={styles.pickerRow}>
          {Platform.OS === 'android' ? (
            <>
              <TouchableOpacity onPress={() => setShowStart(true)}>
                <Text>{fmt(startDate)}</Text>
              </TouchableOpacity>
              {showStart && (
                <DateTimePicker
                  value={startDate}
                  mode="time"
                  display="default"
                  // @ts-ignore — is24Hour is a valid Android prop not in the shared TS types
                  is24Hour
                  onChange={(_, d) => { setShowStart(false); if (d) setStartDate(d); }}
                />
              )}
            </>
          ) : (
            <DateTimePicker
              value={startDate}
              mode="time"
              display="compact"
              onChange={(_, d) => { if (d) setStartDate(d); }}
            />
          )}
        </View>
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>End</Text>
        <View style={styles.pickerRow}>
          {Platform.OS === 'android' ? (
            <>
              <TouchableOpacity onPress={() => setShowEnd(true)}>
                <Text>{fmt(endDate)}</Text>
              </TouchableOpacity>
              {showEnd && (
                <DateTimePicker
                  value={endDate}
                  mode="time"
                  display="default"
                  // @ts-ignore — is24Hour is a valid Android prop not in the shared TS types
                  is24Hour
                  onChange={(_, d) => { setShowEnd(false); if (d) setEndDate(d); }}
                />
              )}
            </>
          ) : (
            <DateTimePicker
              value={endDate}
              mode="time"
              display="compact"
              onChange={(_, d) => { if (d) setEndDate(d); }}
            />
          )}
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
