import { useEffect, useRef, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import dayjs from 'dayjs';
import { Button, Card, Chip, IconButton, Text } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { DailyEntry } from '../types/entry';
import AppointmentList, { type AppointmentListHandle } from './AppointmentList';

interface Props {
  entry: DailyEntry;
  onEdit: (entry: DailyEntry) => void;
  onDelete: (id: number) => void;
  onRefresh: () => void;
}

function formatHM(hours: number | null | undefined): string {
  if (!hours) return '-';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

export default function EntryCard({ entry, onEdit, onDelete, onRefresh }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [pendingAppt, setPendingAppt] = useState(false);
  const apptListRef  = useRef<AppointmentListHandle>(null);

  const apptCount  = entry.appointments.length;

  const moodStyle = entry.mood >= 7
    ? { bg: '#e8f5e9', text: '#2e7d32' }
    : entry.mood >= 4
    ? { bg: '#fff3e0', text: '#e65100' }
    : { bg: '#ffebee', text: '#c62828' };

  const healthStyle = entry.health == null ? null
    : entry.health >= 7 ? { bg: '#e8f5e9', text: '#2e7d32' }
    : entry.health >= 4 ? { bg: '#fff3e0', text: '#e65100' }
    : { bg: '#ffebee', text: '#c62828' };

  useEffect(() => {
    if (!expanded) return;
    if (pendingAppt) { apptListRef.current?.openAdd(); setPendingAppt(false); }
  }, [expanded, pendingAppt]);

  const addAppt = () => { if (!expanded) { setExpanded(true); setPendingAppt(true); } else apptListRef.current?.openAdd(); };

  return (
    <Card style={styles.card}>
      <Card.Content>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.dateRow}>
              <Text variant="titleMedium" style={styles.date}>{entry.date}</Text>
              <Text variant="titleMedium" style={styles.dayName}>{dayjs(entry.date).format('ddd')}</Text>
            </View>
          <View style={styles.actions}>
            <IconButton icon="pencil" size={18} onPress={() => onEdit(entry)} />
            <IconButton icon="delete" size={18} onPress={() => onDelete(entry.id)} />
          </View>
        </View>

        {/* Chips */}
        <View style={styles.chips}>
          {(entry.workHours != null && entry.workHours > 0) && (
            <Chip compact icon="briefcase">{formatHM(entry.workHours)} work</Chip>
          )}
          {(entry.freeTimeHours != null && entry.freeTimeHours > 0) && (
            <Chip compact icon="heart">{formatHM(entry.freeTimeHours)} free</Chip>
          )}
          {entry.sleepingHours != null && (
            <Chip compact icon="sleep">{formatHM(entry.sleepingHours)} sleep</Chip>
          )}
          <Chip compact icon="emoticon" style={{ backgroundColor: moodStyle.bg }} textStyle={{ color: moodStyle.text }}>
            Mood {entry.mood}/10
          </Chip>
          {healthStyle && (
            <Chip compact icon="heart-pulse" style={{ backgroundColor: healthStyle.bg }} textStyle={{ color: healthStyle.text }}>
              Health {entry.health}/10
            </Chip>
          )}
        </View>

        {entry.notes && <Text variant="bodySmall" style={styles.notes}>Notes: {entry.notes}</Text>}

        {/* Appointments row */}
        <View style={styles.sectionRow}>
          <TouchableOpacity style={styles.sectionLeft} onPress={() => apptCount > 0 && setExpanded(v => !v)}>
            <MaterialCommunityIcons name="calendar-clock" size={15} color="#8B5E52" />
            <Text variant="bodySmall" style={styles.apptText}>
              {apptCount === 0 ? 'No appointments' : `${apptCount} appointment${apptCount > 1 ? 's' : ''}`}
            </Text>
            {apptCount > 0 && (
              <MaterialCommunityIcons name={expanded ? 'chevron-up' : 'chevron-down'} size={15} color="#8B5E52" />
            )}
          </TouchableOpacity>
          <Button icon="plus" compact onPress={addAppt}>Add</Button>
        </View>

        {/* Expanded drawer */}
        {expanded && (
          <View style={styles.drawer}>
            <AppointmentList ref={apptListRef} dailyEntryId={entry.id} appointments={entry.appointments} onChange={onRefresh} />
          </View>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  date: { fontWeight: '700' },
  dayName: { opacity: 0.55 },
  actions: { flexDirection: 'row' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 8 },
  notes: { opacity: 0.7, marginBottom: 4 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  sectionLeft: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  apptText: { color: '#8B5E52' },
  drawer: { marginTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#e0e0e0', paddingTop: 12 },
});
