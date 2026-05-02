import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { ActivityIndicator, Button, Text } from 'react-native-paper';
import { BarChart, LineChart } from 'react-native-gifted-charts';
import dayjs from 'dayjs';
import type { Summary } from '../../types/entry';
import { entriesApi } from '../../services/api';

const COLORS = {
  work: '#1976d2',
  free: '#4caf50',
  sleep: '#9c27b0',
  appt: '#ff9800',
  mood: '#e91e63',
};

function formatHM(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

const STATS = (s: Summary) => [
  { label: 'Work',         value: formatHM(s.totalWorkHours),          color: COLORS.work },
  { label: 'Free time',    value: formatHM(s.totalFreeTimeHours),       color: COLORS.free },
  { label: 'Sleep',        value: formatHM(s.totalSleepingHours),       color: COLORS.sleep },
  { label: 'Appointments', value: formatHM(s.totalAppointmentHours),    color: COLORS.appt },
  { label: 'Avg Mood',     value: `${s.avgMood.toFixed(1)}/10`,         color: COLORS.mood },
  { label: 'Avg Health',   value: `${s.avgHealth.toFixed(1)}/10`,       color: '#00897b' },
];

const LEGEND = [
  { color: COLORS.work,  label: 'Work' },
  { color: COLORS.free,  label: 'Free' },
  { color: COLORS.sleep, label: 'Sleep' },
  { color: COLORS.appt,  label: 'Appts' },
];

export default function SummaryScreen() {
  const { width } = useWindowDimensions();
  const chartWidth = width - 48;

  const [period, setPeriod] = useState<'weekly' | 'monthly'>('weekly');
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await entriesApi.getSummary(period, date);
      setSummary(data);
    } finally {
      setLoading(false);
    }
  }, [period, date]);

  useEffect(() => { load(); }, [load]);

  const navigate = (dir: 1 | -1) => {
    setDate(prev =>
      dayjs(prev)
        .add(dir * (period === 'weekly' ? 7 : 1), period === 'weekly' ? 'day' : 'month')
        .format('YYYY-MM-DD')
    );
  };

  const stackData = (summary?.entries ?? []).map(e => ({
    stacks: [
      { value: e.workHours ?? 0,       color: COLORS.work  },
      { value: e.freeTimeHours ?? 0,   color: COLORS.free  },
      { value: e.sleepingHours ?? 0,   color: COLORS.sleep },
      { value: e.appointments.reduce((s, a) => s + (a.durationHours ?? 0), 0), color: COLORS.appt },
    ],
    label: e.date.substring(5),
  }));

  const moodData = (summary?.entries ?? [])
    .filter(e => e.mood != null)
    .map(e => ({ value: e.mood, label: e.date.substring(5) }));

  const healthData = (summary?.entries ?? [])
    .filter(e => e.health != null)
    .map(e => ({ value: e.health as number, label: e.date.substring(5) }));

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Period toggle */}
      <View style={styles.periodRow}>
        <Button
          mode={period === 'weekly' ? 'contained' : 'outlined'}
          onPress={() => setPeriod('weekly')}
          compact
        >
          Weekly
        </Button>
        <Button
          mode={period === 'monthly' ? 'contained' : 'outlined'}
          onPress={() => setPeriod('monthly')}
          compact
        >
          Monthly
        </Button>
      </View>

      {/* Date navigation */}
      <View style={styles.navRow}>
        <Button icon="chevron-left" onPress={() => navigate(-1)} compact>Prev</Button>
        <Text variant="bodySmall" style={styles.dateRange}>
          {summary ? `${summary.startDate} – ${summary.endDate}` : '…'}
        </Text>
        <Button icon="chevron-right" onPress={() => navigate(1)} compact>Next</Button>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.spinner} />
      ) : !summary ? null : (
        <>
          {/* Stat cards */}
          <View style={styles.statsGrid}>
            {STATS(summary).map(stat => (
              <View key={stat.label} style={styles.statCard}>
                <Text variant="headlineSmall" style={[styles.statValue, { color: stat.color }]}>
                  {stat.value}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {summary.entries.length === 0 ? (
            <Text style={styles.empty}>No entries for this period.</Text>
          ) : (
            <>
              {/* Bar chart */}
              <Text variant="titleSmall" style={styles.chartTitle}>Time distribution (hours)</Text>
              <BarChart
                stackData={stackData}
                width={chartWidth}
                height={200}
                barWidth={22}
                spacing={Math.max(6, (chartWidth - stackData.length * 22) / Math.max(stackData.length + 1, 1))}
                noOfSections={4}
                yAxisThickness={0}
                xAxisThickness={1}
                xAxisColor="#e0e0e0"
                yAxisTextStyle={styles.axisText}
                xAxisLabelTextStyle={styles.axisText}
                hideRules={false}
                rulesColor="#f0f0f0"
              />

              {/* Legend */}
              <View style={styles.legend}>
                {LEGEND.map(l => (
                  <View key={l.label} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: l.color }]} />
                    <Text variant="bodySmall">{l.label}</Text>
                  </View>
                ))}
              </View>

              {/* Mood line chart */}
              {moodData.length > 0 && (
                <>
                  <Text variant="titleSmall" style={styles.chartTitle}>Mood &amp; Health trend</Text>
                  <LineChart
                    data={moodData}
                    data2={healthData.length > 0 ? healthData : undefined}
                    width={chartWidth}
                    height={160}
                    maxValue={10}
                    noOfSections={5}
                    color={COLORS.mood}
                    color2="#00897b"
                    thickness={2}
                    thickness2={2}
                    dataPointsColor={COLORS.mood}
                    dataPointsColor2="#00897b"
                    dataPointsRadius={4}
                    yAxisThickness={0}
                    xAxisThickness={1}
                    xAxisColor="#e0e0e0"
                    yAxisTextStyle={styles.axisText}
                    xAxisLabelTextStyle={styles.axisText}
                    hideRules={false}
                    rulesColor="#f0f0f0"
                    curved
                  />
                  <View style={styles.legend}>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: COLORS.mood }]} />
                      <Text variant="bodySmall">Mood</Text>
                    </View>
                    {healthData.length > 0 && (
                      <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: '#00897b' }]} />
                        <Text variant="bodySmall">Health</Text>
                      </View>
                    )}
                  </View>
                </>
              )}
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:   { padding: 16, gap: 16 },
  periodRow:   { flexDirection: 'row', gap: 8 },
  navRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateRange:   { flex: 1, textAlign: 'center' },
  spinner:     { marginTop: 48 },
  statsGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    flex: 1,
    minWidth: '44%',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 12,
    alignItems: 'center',
  },
  statValue:   { fontWeight: '700' },
  statLabel:   { color: '#666', marginTop: 2 },
  chartTitle:  { fontWeight: '700', marginTop: 8 },
  legend:      { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  legendItem:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot:   { width: 10, height: 10, borderRadius: 5 },
  empty:       { textAlign: 'center', opacity: 0.6, marginTop: 24 },
  axisText:    { fontSize: 9, color: '#999' },
});
