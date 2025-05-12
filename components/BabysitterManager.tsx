import React, { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

interface Babysitter {
  id: string;
  firstName: string;
  lastName: string;
  mobile: string;
  rate: string;
}

interface Props {
  babysitters: Babysitter[];
  onSave: (babysitters: Babysitter[]) => void;
}

export default function BabysitterManager({ babysitters, onSave }: Props) {
  const [list, setList] = useState<Babysitter[]>(babysitters);
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newMobile, setNewMobile] = useState('');
  const [newRate, setNewRate] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<Partial<Babysitter>>({});

  useEffect(() => {
    setList(babysitters);
  }, [babysitters]);

  const addBabysitter = () => {
    if (!newFirstName.trim() || !newLastName.trim() || !newMobile.trim() || !newRate.trim()) return;
    setList(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        firstName: newFirstName.trim(),
        lastName: newLastName.trim(),
        mobile: newMobile.trim(),
        rate: newRate.trim(),
      },
    ]);
    setNewFirstName('');
    setNewLastName('');
    setNewMobile('');
    setNewRate('');
  };

  const removeBabysitter = (id: string) => {
    setList(prev => prev.filter(b => b.id !== id));
  };

  const startEdit = (b: Babysitter) => {
    setEditId(b.id);
    setEditFields({ ...b });
  };

  const saveEdit = (id: string) => {
    if (!editFields.firstName || !editFields.lastName || !editFields.mobile || !editFields.rate) return;
    setList(prev => prev.map(b => b.id === id ? { ...b, ...editFields } as Babysitter : b));
    setEditId(null);
    setEditFields({});
  };

  const saveList = () => {
    onSave(list);
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Babysitters</ThemedText>
      <View style={styles.addRow}>
        <TextInput
          style={styles.input}
          placeholder="First Name"
          placeholderTextColor="#555"
          value={newFirstName}
          onChangeText={setNewFirstName}
        />
        <TextInput
          style={styles.input}
          placeholder="Last Name"
          placeholderTextColor="#555"
          value={newLastName}
          onChangeText={setNewLastName}
        />
        <TextInput
          style={styles.input}
          placeholder="Mobile"
          placeholderTextColor="#555"
          value={newMobile}
          onChangeText={setNewMobile}
          keyboardType="phone-pad"
        />
        <TextInput
          style={styles.input}
          placeholder="Rate ($/hr)"
          placeholderTextColor="#555"
          value={newRate}
          onChangeText={setNewRate}
          keyboardType="decimal-pad"
        />
        <TouchableOpacity onPress={addBabysitter} style={styles.addBtn}>
          <ThemedText style={{ color: '#fff' }}>Add</ThemedText>
        </TouchableOpacity>
      </View>
      <FlatList
        data={list}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.babysitterRow}>
            {editId === item.id ? (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="First Name"
                  value={editFields.firstName || ''}
                  onChangeText={t => setEditFields(f => ({ ...f, firstName: t }))}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Last Name"
                  value={editFields.lastName || ''}
                  onChangeText={t => setEditFields(f => ({ ...f, lastName: t }))}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Mobile"
                  value={editFields.mobile || ''}
                  onChangeText={t => setEditFields(f => ({ ...f, mobile: t }))}
                  keyboardType="phone-pad"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Rate ($/hr)"
                  value={editFields.rate || ''}
                  onChangeText={t => setEditFields(f => ({ ...f, rate: t }))}
                  keyboardType="decimal-pad"
                />
                <TouchableOpacity onPress={() => saveEdit(item.id)} style={styles.addBtn}>
                  <ThemedText style={{ color: '#fff' }}>Save</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setEditId(null); setEditFields({}); }} style={[styles.addBtn, { backgroundColor: '#aaa' }] }>
                  <ThemedText style={{ color: '#fff' }}>Cancel</ThemedText>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <ThemedText>{item.firstName} {item.lastName}</ThemedText>
                <ThemedText>{item.mobile}</ThemedText>
                <ThemedText>${item.rate}/hr</ThemedText>
                <TouchableOpacity onPress={() => startEdit(item)}>
                  <ThemedText style={{ color: '#8B2D8B' }}>Edit</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => removeBabysitter(item.id)}>
                  <ThemedText style={{ color: '#C00' }}>Remove</ThemedText>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      />
      <TouchableOpacity onPress={saveList} style={styles.saveBtn}>
        <ThemedText style={{ color: '#fff' }}>Save</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#F8D9FF',
    borderRadius: 16,
    margin: 10,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
    color: '#222',
  },
  addBtn: {
    backgroundColor: '#8B2D8B',
    padding: 10,
    borderRadius: 8,
    marginLeft: 6,
  },
  babysitterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  saveBtn: {
    backgroundColor: '#8B2D8B',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
});
