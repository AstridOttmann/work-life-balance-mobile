import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';

export default function ProfileScreen() {
  const { email, logout } = useAuth();

  return (
    <View style={styles.container}>
      <Text variant="bodyLarge" style={styles.email}>{email}</Text>
      <Button mode="outlined" onPress={logout} style={styles.button}>
        Log out
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F7',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  email: {
    marginBottom: 24,
    color: '#5C3D2E',
  },
  button: {
    width: '100%',
  },
});
