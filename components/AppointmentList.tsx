import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Chip, Divider, IconButton, List, Text } from 'react-native-paper';
import type { Appointment, AppointmentInput } from '../types/entry';
import AppointmentForm, { type AppointmentFormHandle } from './AppointmentForm';
import { appointmentsApi } from '../services/api';
import { API_ERROR } from '../services/apiRequest';
import { useToast } from '../context/ToastContext';

export interface AppointmentListHandle {
  openAdd: () => void;
}

interface Props {
  dailyEntryId: number;
  appointments: Appointment[];
  onChange: () => void;
}

const AppointmentList = forwardRef<AppointmentListHandle, Props>(function AppointmentList({ dailyEntryId, appointments, onChange }: Props, ref) {
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Appointment | null>(null);
  const [saving, setSaving] = useState(false);
  const addFormRef = useRef<AppointmentFormHandle>(null);
  const editFormRef = useRef<AppointmentFormHandle>(null);
  const { toast } = useToast();
  const insets = useSafeAreaInsets();

  useImperativeHandle(ref, () => ({ openAdd: () => setAddOpen(true) }));

  const handleCreate = async (data: AppointmentInput) => {
    const result = await appointmentsApi.create(data);
    if (result === API_ERROR) { setAddOpen(false); return; }
    setAddOpen(false);
    toast.success('Appointment created');
    onChange();
  };

  const handleUpdate = async (data: AppointmentInput) => {
    if (!editTarget) return;
    const result = await appointmentsApi.update(editTarget.id, data);
    if (result === API_ERROR) { setEditTarget(null); return; }
    setEditTarget(null);
    toast.success('Appointment updated');
    onChange();
  };

  const handleDelete = async (id: number) => {
    const result = await appointmentsApi.delete(id);
    if (result === API_ERROR) return;
    toast.success('Appointment deleted');
    onChange();
  };

  const submitAdd = async () => {
    setSaving(true);
    try {
      await addFormRef.current?.submit();
    } finally {
      setSaving(false);
    }
  };

  const submitEdit = async () => {
    setSaving(true);
    try {
      await editFormRef.current?.submit();
    } finally {
      setSaving(false);
    }
  };

  return (
    <View>
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

      <Modal visible={addOpen} animationType="slide" onRequestClose={() => setAddOpen(false)}>
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kav}>
            <View style={styles.modalHeader}>
              <IconButton icon="close" onPress={() => setAddOpen(false)} />
              <Text variant="titleMedium">New Appointment</Text>
              <Button mode="contained" onPress={submitAdd} loading={saving} disabled={saving}>Save</Button>
            </View>
            <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">
              <AppointmentForm ref={addFormRef} dailyEntryId={dailyEntryId} onSave={handleCreate} />
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <Modal visible={!!editTarget} animationType="slide" onRequestClose={() => setEditTarget(null)}>
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kav}>
            <View style={styles.modalHeader}>
              <IconButton icon="close" onPress={() => setEditTarget(null)} />
              <Text variant="titleMedium">Edit Appointment</Text>
              <Button mode="contained" onPress={submitEdit} loading={saving} disabled={saving}>Update</Button>
            </View>
            <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">
              {editTarget && (
                <AppointmentForm ref={editFormRef} dailyEntryId={dailyEntryId} initial={editTarget} onSave={handleUpdate} />
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
});

export default AppointmentList;

const styles = StyleSheet.create({
  empty: { opacity: 0.6, marginTop: 4 },
  chips: { flexDirection: 'row', gap: 4, marginTop: 4 },
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
