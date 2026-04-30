import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Card, Text } from 'react-native-paper';
import dayjs from 'dayjs';
import type { Summary } from '../../types/entry';
import { entriesApi } from '../../services/api';

export default function SummaryScreen() {
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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.periodRow}>
        <Button mode={period === 'weekly' ? 'contained' : 'outlined'} onPress={() => setPeriod('weekly')} compact>
          Weekly
        </Button>
        <Button mode={period === 'monthly' ? 'contained' : 'outlined'} onPress={() => setPeriod('monthly')} compact>
          Monthly
        </Button>
      </View>

      <View style={styles.navRow}>
        <Button icon="chevron-left" onPress={() => navigate(-1)} compact>Prev</Button>
        <Text variant="titleSmall">
          {summary ? `${summary.startDate} – ${summary.endDate}` : '...'}
        </Text>
        <Button icon="chevron-right" onPress={() => navigate(1)} compact>Next</Button>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.spinner} />
      ) : summary ? (
        <Card>
          <Card.Content style={styles.stats}>
            <StatRow label="Avg work hours" value={summary.avgWorkHours} />
            <StatRow label="Avg free time" value={summary.avgFreeTimeHours} />
            <StatRow label="Avg sleep" value={summary.avgSleepingHours} />
            <StatRow label="Avg mood" value={summary.avgMood} suffix="/10" />
            <StatRow label="Entries" value={summary.entryCount} suffix="" />
          </Card.Content>
        </Card>
      ) : null}
    </ScrollView>
  );
}

function StatRow({ label, value, suffix = 'h' }: { label: string; value: number | null; suffix?: string }) {
  return (
    <View style={styles.statRow}>
      <Text variant="bodyMedium">{label}</Text>
      <Text variant="bodyMedium" style={styles.statValue}>
        {value != null ? `${value}${suffix}` : '—'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  periodRow: { flexDirection: 'row', gap: 8 },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  spinner: { marginTop: 48 },
  stats: { gap: 12 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statValue: { fontWeight: '600' },
});
