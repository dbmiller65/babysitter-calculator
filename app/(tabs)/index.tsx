// hero.png is required in assets for splash/header.
import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Modal, Text, LogBox } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Image } from 'expo-image';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { HelloWave } from '@/components/HelloWave';
import BabysitterManager from '@/components/BabysitterManager';

interface Babysitter {
  id: string;
  firstName: string;
  lastName: string;
  mobile: string;
  rate: string;
}

interface SessionRow {
  id: string;
  babysitterId?: string;
  start: string;
  stop: string;
  rate: string;
}

// Suppress VirtualizedLists warning
LogBox.ignoreLogs([
  'VirtualizedLists should never be nested',
]);

export default function HomeScreen() {
  const [rows, setRows] = useState<SessionRow[]>([
    { id: '1', babysitterId: undefined, start: '', stop: '', rate: '' },
  ]);
  const [gasTip, setGasTip] = useState('');
  const [babysitters, setBabysitters] = useState<Babysitter[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [timePicker, setTimePicker] = useState<{ rowId: string; field: 'start' | 'stop' } | null>(null);
  const [pickerValue, setPickerValue] = useState<Date>(new Date());
  const [pendingValue, setPendingValue] = useState<Date | null>(null);
  const flatListRef = useRef<FlatList>(null);

  // Helper to format to HH:MM AM/PM
  const formatTime = (date: Date) => {
    let h = date.getHours();
    const m = date.getMinutes();
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    return `${h}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  const openPicker = (rowId: string, field: 'start' | 'stop', index?: number) => {
    // Try to parse current value, otherwise default to now
    const row = rows.find(r => r.id === rowId);
    let date = new Date();
    const value = row && row[field];
    if (value) {
      const match = value.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (match) {
        let hour = parseInt(match[1], 10);
        const min = parseInt(match[2], 10);
        const ampm = match[3].toUpperCase();
        if (ampm === 'PM' && hour < 12) hour += 12;
        if (ampm === 'AM' && hour === 12) hour = 0;
        date.setHours(hour, min, 0, 0);
      }
    }
    setPickerValue(date);
    setPendingValue(date);
    setTimePicker({ rowId, field });
    if (typeof index === 'number' && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({ index: index, viewPosition: 0 });
      }, 100);
    }
  };

  // Only update pendingValue, don't close picker
  const onTimeChange = (event: any, selectedDate?: Date) => {
    if (!timePicker) return;
    if (event.type === 'dismissed') {
      setTimePicker(null);
      setPendingValue(null);
      return;
    }
    if (selectedDate) {
      setPendingValue(selectedDate);
    }
  };

  const onTimeSet = () => {
    if (!timePicker || !pendingValue) return;
    setRows(prev => prev.map(row =>
      row.id === timePicker.rowId
        ? { ...row, [timePicker.field]: formatTime(pendingValue) }
        : row
    ));
    setTimePicker(null);
    setPendingValue(null);
  };

  const onTimeCancel = () => {
    setTimePicker(null);
    setPendingValue(null);
  };

  const handleRowChange = (id: string, key: keyof SessionRow, value: string) => {
    setRows(prev => prev.map(row => row.id === id ? { ...row, [key]: value } : row));
  };

  const addRow = () => {
    setRows(prev => [
      ...prev,
      { id: (prev.length + 1).toString(), start: '', stop: '', rate: '' },
    ]);
  };

  const parseTime = (time: string) => {
    // Accepts HH:MM (24hr or 12hr with am/pm)
    if (!time) return null;
    let t = time.trim().toLowerCase();
    
    // Check if time contains AM or PM
    const isPM = t.includes('pm');
    const isAM = t.includes('am');
    
    // Remove AM/PM from the string
    t = t.replace(/am|pm/g, '').trim();
    
    // Split hours and minutes
    const [h, m] = t.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return null;
    
    let hour = h;
    // Adjust for PM (add 12 hours except for 12 PM)
    if (isPM && hour < 12) hour += 12;
    // Adjust for 12 AM (should be 0 hours)
    if (isAM && hour === 12) hour = 0;
    
    return hour + m / 60;
  };

  const rowTotal = (row: SessionRow) => {
    const start = parseTime(row.start);
    const stop = parseTime(row.stop);
    const rate = parseFloat(row.rate);
    if (start === null || stop === null || isNaN(rate)) return 0;
    // Only allow positive, non-overnight
    if (stop <= start) return 0;
    let hours = stop - start;
    return Math.max(0, hours * rate);
  };

  const total = rows.reduce((sum, row) => sum + rowTotal(row), 0) + (parseFloat(gasTip) || 0);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#F8D9FF', dark: '#3C1A4B' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <HelloWave />
        <ThemedText type="title" style={{ marginLeft: 8 }}>Babysitter Calculator</ThemedText>
        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.manageBtn}>
          <ThemedText style={{ color: '#fff' }}>Manage Babysitters</ThemedText>
        </TouchableOpacity>
      </ThemedView>
      <Modal visible={modalVisible} animationType="slide">
        <BabysitterManager
          babysitters={babysitters}
          onSave={bs => {
            setBabysitters(bs);
            setModalVisible(false);
          }}
        />
        <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
          <ThemedText style={{ color: '#fff' }}>Close</ThemedText>
        </TouchableOpacity>
      </Modal>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <FlatList
          ref={flatListRef}
          data={rows}
          keyExtractor={row => row.id}
          renderItem={({ item, index }) => {
            return (
              <View>
                {timePicker && timePicker.rowId === item.id && (
                  <View style={styles.pickerCard}>
                    <View style={styles.pickerSpinnerBg}>
                      <DateTimePicker
                        mode="time"
                        value={pendingValue || pickerValue}
                        onChange={onTimeChange}
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        style={{ alignSelf: 'center', width: '100%' }}
                        textColor={Platform.OS === 'ios' ? '#222' : undefined}
                      />
                    </View>
                    <View style={styles.pickerButtonRow}>
                      <TouchableOpacity onPress={onTimeCancel} style={styles.pickerCancelBtn}>
                        <Text style={styles.pickerCancelText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={onTimeSet} style={styles.pickerSetBtn}>
                        <Text style={styles.pickerSetText}>Set</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
                <View
                  style={[
                    styles.rowBox,
                    item.stop && item.start && parseTime(item.stop) !== null && parseTime(item.start) !== null && parseTime(item.stop)! <= parseTime(item.start)! ? styles.cardError : null
                  ]}
                >
                  {/* Babysitter selection dropdown will go here in next step */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
                    <View style={{ flex: 1 }}>
                      <TouchableOpacity style={{ width: '100%' }} onPress={() => openPicker(item.id, 'start', index)}>
                        <TextInput
                          style={[styles.input, { marginBottom: 8 }]}
                          placeholder="Start (e.g. 6:00 pm)"
                          placeholderTextColor="#333"
                          value={item.start}
                          editable={false}
                          pointerEvents="none"
                        />
                      </TouchableOpacity>
                      <TouchableOpacity style={{ width: '100%' }} onPress={() => openPicker(item.id, 'stop', index)}>
                        <TextInput
                          style={[styles.input, { marginBottom: 8 }]}
                          placeholder="Stop (e.g. 10:30 pm)"
                          placeholderTextColor="#333"
                          value={item.stop}
                          editable={false}
                          pointerEvents="none"
                        />
                      </TouchableOpacity>
                      <TextInput
                        style={[styles.input, { marginBottom: 8 }]}
                        placeholder="Rate ($/hr)"
                        placeholderTextColor="#333"
                        value={item.rate}
                        onChangeText={text => handleRowChange(item.id, 'rate', text)}
                        keyboardType="decimal-pad"
                      />
                    </View>
                    <View style={{ justifyContent: 'center', paddingLeft: 10 }}>
                      <ThemedText type="defaultSemiBold" style={styles.rowTotal}>
                        ${rowTotal(item).toFixed(2)}
                      </ThemedText>
                    </View>
                  </View>
                </View>
              </View>
            );
          }}
          ListFooterComponent={
            <View>
              <TouchableOpacity onPress={addRow} style={styles.addButton}>
                <ThemedText type="defaultSemiBold" style={{ color: '#fff' }}>+ Add Row</ThemedText>
              </TouchableOpacity>
              <View style={styles.gasTipCard}>
                <TextInput
                  style={styles.input}
                  placeholder="Gas/Tip ($)"
                  placeholderTextColor="#333"
                  value={gasTip}
                  onChangeText={setGasTip}
                  keyboardType="decimal-pad"
                />
                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                  <ThemedText type="defaultSemiBold" style={styles.rowTotal}>
                    ${parseFloat(gasTip || '0').toFixed(2)}
                  </ThemedText>
                </View>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <ThemedText type="title" style={[styles.totalText, { textAlign: 'left', marginTop: 0, marginBottom: 0 }]}>Total</ThemedText>
                <ThemedText type="title" style={[styles.totalText, { textAlign: 'right', marginTop: 0, marginBottom: 0 }]}>${total.toFixed(2)}</ThemedText>
              </View>
            </View>
          }
        />
      </KeyboardAvoidingView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  pickerCard: {
    width: '95%',
    marginVertical: 8,
    padding: 18,
    backgroundColor: '#fff',
    borderRadius: 16,
    alignSelf: 'center',
    shadowColor: '#C38DFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#C38DFF',
    zIndex: 1000,
    minHeight: 180,
    justifyContent: 'center',
  },
  pickerSpinnerBg: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    marginBottom: 2,
    alignItems: 'center',
    width: '100%',
  },
  cardError: {
    borderColor: 'red',
    borderWidth: 2,
  },
  pickerButtonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    gap: 12,
  },
  pickerCancelBtn: {
    backgroundColor: '#eee',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 22,
    marginRight: 8,
  },
  pickerSetBtn: {
    backgroundColor: '#C38DFF',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 22,
  },
  pickerCancelText: {
    color: '#8B2D8B',
    fontWeight: 'bold',
    fontSize: 16,
  },
  pickerSetText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  titleContainer: { 
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  rowBox: {
    flexDirection: 'column',
    alignItems: 'stretch',
    backgroundColor: '#FFE4FA',
    borderRadius: 14,
    padding: 10,
    marginBottom: 10,
    shadowColor: '#C38DFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    width: '100%',
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginHorizontal: 4,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#C38DFF',
  },
  rowTotal: {
    marginLeft: 8,
    color: '#8B2D8B',
    fontSize: 16,
    flex: 1,
    textAlign: 'right',
  },
  addButton: {
    backgroundColor: '#C38DFF',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 10,
  },
  gasTipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFE4FA',
    borderRadius: 14,
    padding: 10,
    marginBottom: 12,
    shadowColor: '#C38DFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    width: '100%',
  },
  totalText: {
    color: '#8B2D8B',
    fontSize: 24,
    textAlign: 'center',
    marginTop: 14,
    marginBottom: 24,
  },
  timeBtn: {
    marginLeft: 4,
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#F8D9FF',
  },
  manageBtn: {
    backgroundColor: '#C38DFF',
    padding: 10,
    borderRadius: 10,
    marginLeft: 10,
  },
  closeBtn: {
    backgroundColor: '#8B2D8B',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    margin: 16,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});