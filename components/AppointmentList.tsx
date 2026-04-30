import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Chip, Dialog, Divider, IconButton, List, Portal, Text } from 'react-native-paper';
import type { Appointment, AppointmentInput } from '../types/entry';
import AppointmentForm from './AppointmentForm';
import { appointmentsApi } from '../services/api';
import { useToast } from '../context/ToastContext';

interface Props {
  dailyEntryId: number;
  appointments: Appointment[];
  onChange: () => void;
}

export default function AppointmentList({ dailyEntryId, appointments, onChange }: Props) {
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Appointment | null>(null);
  const { toast } = useToast();

  const handleCreate = async (data: AppointmentInput) => {
    await appointmentsApi.create(data);
    setAddOpen(false);
    toast.success('Appointment created');
    onChange();
  };

  const handleUpdate = async (data: AppointmentInput) => {
    if (!editTarget) return;
    await appointmentsApi.update(editTarget.id, data);
    setEditTarget(null);
    toast.success('Appointment updated');
    onChange();
  };

  const handleDelete = async (id: number) => {
    await appointmentsApi.delete(id);
    toast.success('Appointment deleted');
    onChange();
  };

  return (
    <View>
      <Button icon="plus" onPress={() => setAddOpen(true)} compact style={styles.addBtn}>
        Add appointment
      </Button>

      {appointments.length === 0 ? (
        <Text variant="bodySmall" style={styles.empty}>No appointments</Text>
      ) : (
        appointments.map((a, i) => (
          <View key={a.id}>
            {i > 0 && <Divider />}
            <List.Item
              title={a.title}
              description={() => (
                <View style={styles.chips}>
                  {a.time && <Chip compact>{a.time.substring(0, 5)}</Chip>}
                  {a.durationHours != null && <Chip compact>{a.durationHours}h</Chip>}
                </View>
              )}
              right={() => (
                <View style={styles.actions}>
                  <IconButton icon="pencil" size={16} onPress={() => setEditTarget(a)} />
                  <IconButton icon="delete" size={16} onPress={() => handleDelete(a.id)} />
                </View>
              )}
            />
          </View>
        ))
      )}

      <Portal>
        <Dialog visible={addOpen} onDismiss={() => setAddOpen(false)}>
          <Dialog.Title>New Appointment</Dialog.Title>
          <Dialog.Content>
            <AppointmentForm
              dailyEntryId={dailyEntryId}
              onSave={handleCreate}
              onCancel={() => setAddOpen(false)}
            />
          </Dialog.Content>
        </Dialog>

        <Dialog visible={!!editTarget} onDismiss={() => setEditTarget(null)}>
          <Dialog.Title>Edit Appointment</Dialog.Title>
          <Dialog.Content>
            {editTarget && (
              <AppointmentForm
                dailyEntryId={dailyEntryId}
                initial={editTarget}
                onSave={handleUpdate}
                onCancel={() => setEditTarget(null)}
              />
            )}
          </Dialog.Content>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  addBtn: { alignSelf: 'flex-end' },
  empty: { opacity: 0.6, marginTop: 4 },
  chips: { flexDirection: 'row', gap: 4, marginTop: 4 },
  actions: { flexDirection: 'row', alignItems: 'center' },
});
