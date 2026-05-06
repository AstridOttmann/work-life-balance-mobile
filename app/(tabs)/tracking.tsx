import { useCallback, useEffect, useState } from 'react';
import { AppState, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Chip, Text } from 'react-native-paper';
import { Svg, Circle } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { entriesApi, timeBlocksApi } from '../../services/api';
import { API_ERROR } from '../../services/apiRequest';
import { useToast } from '../../context/ToastContext';
import type { DailyEntry } from '../../types/entry';

const PRIMARY = '#D97757';
const SECONDARY = '#6B6B6B';

const RING_SIZE = 220;
const RING_RADIUS = 96;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const MAX_MS = 8 * 3600 * 1000;

interface TrackerState {
  status: 'idle' | 'running' | 'paused';
  blockId: number | null;
  dailyEntryId: number | null;
  startTime: string | null;
  startTimestamp: number | null;
  accumulatedMs: number;
}

const IDLE: TrackerState = {
  status: 'idle',
  blockId: null,
  dailyEntryId: null,
  startTime: null,
  startTimestamp: null,
  accumulatedMs: 0,
};

function elapsedMs(t: TrackerState): number {
  const running = t.status === 'running' && t.startTimestamp != null
    ? Date.now() - t.startTimestamp : 0;
  return t.accumulatedMs + running;
}

function formatElapsed(ms: number): string {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function formatHM(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function parseTimeAsToday(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.getTime();
}

function calcTodaySummary(entry: DailyEntry | null) {
  const blocks = entry?.timeBlocks.filter(b => b.endTime != null) ?? [];
  const sum = (type: 'WORK' | 'FREE') =>
    blocks.filter(b => b.type === type).reduce((acc, b) => {
      const [sh, sm] = b.startTime.split(':').map(Number);
      const [eh, em] = (b.endTime as string).split(':').map(Number);
      let mins = (eh * 60 + em) - (sh * 60 + sm);
      if (mins < 0) mins += 1440;
      return acc + mins / 60;
    }, 0);
  return { work: sum('WORK'), free: sum('FREE') };
}

export default function TrackingScreen() {
  const [work, setWork] = useState<TrackerState>(IDLE);
  const [free, setFree] = useState<TrackerState>(IDLE);
  const [todayEntry, setTodayEntry] = useState<DailyEntry | null>(null);
  const [displayWork, setDisplayWork] = useState(0);
  const [displayFree, setDisplayFree] = useState(0);
  const { toast } = useToast();

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const today = dayjs().format('YYYY-MM-DD');
        const entries = await entriesApi.getAll(today, today);
        if (entries === API_ERROR) return;
        const entry = entries[0] ?? null;
        setTodayEntry(entry);
        const now = Date.now();
        const open = entry?.timeBlocks.filter(b => b.endTime == null) ?? [];
        const workBlock = open.find(b => b.type === 'WORK');
        const freeBlock = open.find(b => b.type === 'FREE');
        if (workBlock) {
          const isPaused = workBlock.paused;
          const seg = workBlock.segmentStartTime ?? workBlock.startTime;
          setWork({
            status: isPaused ? 'paused' : 'running',
            blockId: workBlock.id, dailyEntryId: entry!.id,
            startTime: workBlock.startTime.substring(0, 5),
            startTimestamp: isPaused ? null : now,
            accumulatedMs: isPaused
              ? workBlock.elapsedMs
              : workBlock.elapsedMs + (now - parseTimeAsToday(seg)),
          });
        } else setWork(IDLE);
        if (freeBlock) {
          const isPaused = freeBlock.paused;
          const seg = freeBlock.segmentStartTime ?? freeBlock.startTime;
          setFree({
            status: isPaused ? 'paused' : 'running',
            blockId: freeBlock.id, dailyEntryId: entry!.id,
            startTime: freeBlock.startTime.substring(0, 5),
            startTimestamp: isPaused ? null : now,
            accumulatedMs: isPaused
              ? freeBlock.elapsedMs
              : freeBlock.elapsedMs + (now - parseTimeAsToday(seg)),
          });
        } else setFree(IDLE);
      })();
    }, [])
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state !== 'active') return;
      const today = dayjs().format('YYYY-MM-DD');
      entriesApi.getAll(today, today).then(entries => {
        if (entries !== API_ERROR) setTodayEntry(entries[0] ?? null);
      });
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const update = () => {
      setDisplayWork(elapsedMs(work));
      setDisplayFree(elapsedMs(free));
    };
    update();
    if (work.status !== 'running' && free.status !== 'running') return;
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [work, free]);

  const ensureTodayEntry = useCallback(async (): Promise<number | null> => {
    const today = dayjs().format('YYYY-MM-DD');
    const entries = await entriesApi.getAll(today, today);
    if (entries === API_ERROR) return null;
    if (entries.length > 0) { setTodayEntry(entries[0]); return entries[0].id; }
    const created = await entriesApi.create({ date: today, mood: 5, sleepingHours: null, health: null, notes: null });
    if (created === API_ERROR) return null;
    setTodayEntry(created);
    return created.id;
  }, []);

  const refreshToday = useCallback(async () => {
    const today = dayjs().format('YYYY-MM-DD');
    const entries = await entriesApi.getAll(today, today);
    if (entries !== API_ERROR) setTodayEntry(entries[0] ?? null);
  }, []);

  const handleStart = useCallback(async (type: 'WORK' | 'FREE') => {
    const dailyEntryId = await ensureTodayEntry();
    if (dailyEntryId === null) { toast.error('Failed to start tracker'); return; }
    const now = dayjs();
    const block = await timeBlocksApi.create({ dailyEntryId, type, startTime: now.format('HH:mm:ss'), segmentStartTime: now.format('HH:mm:ss') });
    if (block === API_ERROR) { toast.error('Failed to start tracker'); return; }
    const state: TrackerState = {
      status: 'running',
      blockId: block.id,
      dailyEntryId,
      startTime: now.format('HH:mm'),
      startTimestamp: Date.now(),
      accumulatedMs: 0,
    };
    if (type === 'WORK') setWork(state);
    else setFree(state);
  }, [ensureTodayEntry, toast]);

  const handlePause = useCallback(async (type: 'WORK' | 'FREE') => {
    const tracker = type === 'WORK' ? work : free;
    const setter = type === 'WORK' ? setWork : setFree;
    if (tracker.status === 'running') {
      if (tracker.blockId && tracker.dailyEntryId && tracker.startTime) {
        const newAcc = tracker.accumulatedMs + (tracker.startTimestamp != null ? Date.now() - tracker.startTimestamp : 0);
        const result = await timeBlocksApi.update(tracker.blockId, {
          dailyEntryId: tracker.dailyEntryId, type,
          startTime: tracker.startTime + ':00', paused: true, elapsedMs: newAcc,
        });
        if (result === API_ERROR) { toast.error('Failed to pause tracker'); return; }
        setter(prev => ({ ...prev, status: 'paused', startTimestamp: null, accumulatedMs: newAcc }));
      }
    } else if (tracker.status === 'paused') {
      if (!tracker.blockId || !tracker.dailyEntryId || !tracker.startTime) { toast.error('Failed to resume tracker'); return; }
      const now = dayjs();
      const result = await timeBlocksApi.update(tracker.blockId, {
        dailyEntryId: tracker.dailyEntryId, type,
        startTime: tracker.startTime + ':00', paused: false,
        segmentStartTime: now.format('HH:mm:ss'),
      });
      if (result === API_ERROR) { toast.error('Failed to resume tracker'); return; }
      setter(prev => ({ ...prev, status: 'running', startTimestamp: Date.now() }));
    }
  }, [work, free, toast]);

  const handleStop = useCallback(async (type: 'WORK' | 'FREE') => {
    const tracker = type === 'WORK' ? work : free;
    if (!tracker.blockId || !tracker.dailyEntryId || !tracker.startTime) return;
    const result = await timeBlocksApi.update(tracker.blockId, {
      dailyEntryId: tracker.dailyEntryId, type,
      startTime: tracker.startTime + ':00', paused: false, endTime: dayjs().format('HH:mm:ss'),
    });
    if (result === API_ERROR) { toast.error('Failed to stop tracker'); return; }
    if (type === 'WORK') setWork(IDLE); else setFree(IDLE);
    await refreshToday();
  }, [work, free, refreshToday, toast]);

  const summary = calcTodaySummary(todayEntry);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TrackerCard
        type="WORK"
        tracker={work}
        elapsed={displayWork}
        otherStatus={free.status}
        onStart={() => handleStart('WORK')}
        onPause={() => handlePause('WORK')}
        onStop={() => handleStop('WORK')}
      />
      <TrackerCard
        type="FREE"
        tracker={free}
        elapsed={displayFree}
        otherStatus={work.status}
        onStart={() => handleStart('FREE')}
        onPause={() => handlePause('FREE')}
        onStop={() => handleStop('FREE')}
      />

      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text variant="labelSmall" style={styles.summaryLabel}>Total Work</Text>
          <Text variant="titleMedium" style={[styles.summaryValue, { color: PRIMARY }]}>{formatHM(summary.work)}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text variant="labelSmall" style={styles.summaryLabel}>Total Free Time</Text>
          <Text variant="titleMedium" style={[styles.summaryValue, { color: SECONDARY }]}>{formatHM(summary.free)}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

interface TrackerCardProps {
  type: 'WORK' | 'FREE';
  tracker: TrackerState;
  elapsed: number;
  otherStatus: TrackerState['status'];
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
}

function TrackerCard({ type, tracker, elapsed, otherStatus, onStart, onPause, onStop }: TrackerCardProps) {
  const isWork = type === 'WORK';
  const accentColor = isWork ? PRIMARY : SECONDARY;
  const trackColor = isWork ? '#ffdbd0' : '#e0e0e0';
  const progress = Math.min(elapsed / MAX_MS, 1);
  const strokeDashoffset = RING_CIRCUMFERENCE * (1 - progress);

  const startDisabled = tracker.status !== 'idle' || otherStatus === 'running';
  const pauseDisabled = tracker.status === 'idle' || (tracker.status === 'paused' && otherStatus === 'running');
  const stopDisabled  = tracker.status === 'idle';

  const chipBg   = tracker.status === 'running' ? '#e8f5e9' : '#fff3e0';
  const chipText = tracker.status === 'running' ? '#2e7d32' : '#e65100';

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <MaterialCommunityIcons name={isWork ? 'briefcase' : 'spa'} size={20} color={accentColor} />
        <Text variant="titleMedium" style={styles.cardTitle}>{isWork ? 'Work Time' : 'Free Time'}</Text>
        {tracker.status !== 'idle' && (
          <View style={[styles.statusChip, { backgroundColor: chipBg }]}>
            <Text style={{ color: chipText, fontSize: 13, fontWeight: '600' }}>
              {tracker.status === 'running' ? 'Running' : 'Paused'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.ringContainer}>
        <Svg width={RING_SIZE} height={RING_SIZE}>
          <Circle
            cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS}
            stroke={trackColor} strokeWidth={6} fill="transparent" strokeOpacity={0.6}
          />
          <Circle
            cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS}
            stroke={accentColor} strokeWidth={6} fill="transparent"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
          />
        </Svg>
        <View style={styles.timerOverlay}>
          <Text style={[styles.timerText, { color: tracker.status === 'idle' ? '#bbb' : '#1A1A1A' }]}>
            {formatElapsed(elapsed)}
          </Text>
        </View>
      </View>

      <View style={styles.buttons}>
        <View style={styles.btnCol}>
          <TouchableOpacity
            disabled={startDisabled}
            onPress={onStart}
            style={[styles.btn, { backgroundColor: startDisabled ? '#e0e0e0' : PRIMARY }]}
          >
            <MaterialCommunityIcons name="play" size={24} color={startDisabled ? '#9e9e9e' : '#fff'} />
          </TouchableOpacity>
          <Text variant="labelSmall" style={styles.btnLabel}>Start</Text>
        </View>
        <View style={styles.btnCol}>
          <TouchableOpacity
            disabled={pauseDisabled}
            onPress={onPause}
            style={[styles.btn, styles.btnOutlined, { borderColor: pauseDisabled ? '#e0e0e0' : '#1A1A1A', opacity: pauseDisabled ? 0.4 : 1 }]}
          >
            <MaterialCommunityIcons name="pause" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <Text variant="labelSmall" style={styles.btnLabel}>
            {tracker.status === 'paused' ? 'Resume' : 'Pause'}
          </Text>
        </View>
        <View style={styles.btnCol}>
          <TouchableOpacity
            disabled={stopDisabled}
            onPress={onStop}
            style={[styles.btn, styles.btnOutlined, { borderColor: stopDisabled ? '#e0e0e0' : '#ba1a1a', opacity: stopDisabled ? 0.4 : 1 }]}
          >
            <MaterialCommunityIcons name="stop" size={24} color={stopDisabled ? '#bbb' : '#ba1a1a'} />
          </TouchableOpacity>
          <Text variant="labelSmall" style={styles.btnLabel}>Stop</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16, paddingBottom: 32 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e8d6d2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4, paddingRight: 4 },
  cardTitle: { flex: 1, fontWeight: '700' },
  statusChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  ringContainer: { alignItems: 'center', justifyContent: 'center', marginVertical: 8 },
  timerOverlay: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  timerText: {
    fontSize: 40,
    fontWeight: '700',
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  buttons: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 12 },
  btnCol: { alignItems: 'center', gap: 4 },
  btn: { width: 56, height: 56, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnOutlined: { backgroundColor: 'transparent', borderWidth: 1.5 },
  btnLabel: { color: SECONDARY, marginTop: 2 },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e8d6d2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: { color: SECONDARY, marginBottom: 4 },
  summaryValue: { fontWeight: '700' },
  summaryDivider: { width: 1, height: 40, backgroundColor: '#e0e0e0', marginHorizontal: 8 },
});
