import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Chip, IconButton, Text } from 'react-native-paper';
import type { DailyEntry } from '../types/entry';
import AppointmentList from './AppointmentList';

interface Props {
  entry: DailyEntry;
  onEdit: (entry: DailyEntry) => void;
  onDelete: (id: number) => void;
  onRefresh: () => void;
}

export default function EntryCard({ entry, onEdit, onDelete, onRefresh }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <Text variant="titleMedium" style={styles.date}>{entry.date}</Text>
          <View style={styles.actions}>
            <IconButton icon="pencil" size={18} onPress={() => onEdit(entry)} />
            <IconButton icon="delete" size={18} onPress={() => onDelete(entry.id)} />
          </View>
        </View>

        <View style={styles.chips}>
          {entry.workHours != null && <Chip compact icon="briefcase">{entry.workHours}h work</Chip>}
          {entry.freeTimeHours != null && <Chip compact icon="heart">{entry.freeTimeHours}h free</Chip>}
          {entry.sleepingHours != null && <Chip compact icon="sleep">{entry.sleepingHours}h sleep</Chip>}
          <Chip compact icon="emoticon">Mood {entry.mood}/10</Chip>
        </View>

        {entry.notes && <Text variant="bodySmall" style={styles.notes}>{entry.notes}</Text>}

        <IconButton
          icon={expanded ? 'chevron-up' : 'chevron-down'}
          onPress={() => setExpanded(v => !v)}
          size={20}
          style={styles.toggle}
        />

        {expanded && (
          <AppointmentList
            dailyEntryId={entry.id}
            appointments={entry.appointments}
            onChange={onRefresh}
          />
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { fontWeight: '700' },
  actions: { flexDirection: 'row' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 8 },
  notes: { opacity: 0.7, marginBottom: 4 },
  toggle: { alignSelf: 'center' },
});
