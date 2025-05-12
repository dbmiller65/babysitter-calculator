import React, { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, FlatList, StyleSheet, Platform, KeyboardAvoidingView, Linking, Modal, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { HelloWave } from '@/components/HelloWave';

interface Babysitter {
  id: string;
  firstName: string;
  lastName: string;
  mobile: string;
  rate: string;
}

const STORAGE_KEY = 'babysitter-calculator-babysitters';

export default function BabysitterManagerScreen() {
  const [babysitters, setBabysitters] = useState<Babysitter[]>([]);
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newMobile, setNewMobile] = useState('');
  const [newRate, setNewRate] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<Partial<Babysitter>>({});
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);
  const [babysitterToDelete, setBabysitterToDelete] = useState<Babysitter | null>(null);

  // Load babysitters from storage on mount
  useEffect(() => {
    const loadBabysitters = async () => {
      try {
        const data = await AsyncStorage.getItem(STORAGE_KEY);
        if (data) {
          setBabysitters(JSON.parse(data));
        }
      } catch (error) {
        console.error('Error loading babysitters:', error);
      }
    };
    
    loadBabysitters();
  }, []);

  // Save babysitters to storage whenever they change
  useEffect(() => {
    const saveBabysitters = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(babysitters));
      } catch (error) {
        console.error('Error saving babysitters:', error);
      }
    };
    
    saveBabysitters();
  }, [babysitters]);

  const addBabysitter = () => {
    if (!newFirstName.trim() || !newLastName.trim() || !newRate.trim()) return;
    
    setBabysitters(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        firstName: newFirstName.trim(),
        lastName: newLastName.trim(),
        mobile: newMobile.trim(),
        rate: newRate.trim(),
      },
    ]);
    
    // Clear form fields
    setNewFirstName('');
    setNewLastName('');
    setNewMobile('');
    setNewRate('');
  };

  const confirmDelete = (babysitter: Babysitter) => {
    setBabysitterToDelete(babysitter);
    setDeleteConfirmation(`Are you sure you want to delete ${babysitter.firstName} ${babysitter.lastName}?`);
  };

  const removeBabysitter = (id: string) => {
    setBabysitters(prev => prev.filter(b => b.id !== id));
    setDeleteConfirmation(null);
    setBabysitterToDelete(null);
  };

  const cancelDelete = () => {
    setDeleteConfirmation(null);
    setBabysitterToDelete(null);
  };

  const startEdit = (babysitter: Babysitter) => {
    setEditId(babysitter.id);
    setEditFields({
      firstName: babysitter.firstName,
      lastName: babysitter.lastName,
      mobile: babysitter.mobile,
      rate: babysitter.rate,
    });
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditFields({});
  };

  const saveEdit = () => {
    if (!editId) return;
    
    setBabysitters(prev =>
      prev.map(b =>
        b.id === editId
          ? {
              ...b,
              firstName: editFields.firstName?.trim() || b.firstName,
              lastName: editFields.lastName?.trim() || b.lastName,
              mobile: editFields.mobile?.trim() || b.mobile,
              rate: editFields.rate?.trim() || b.rate,
            }
          : b
      )
    );
    
    setEditId(null);
    setEditFields({});
  };

  const updateEditField = (field: keyof Babysitter, value: string) => {
    setEditFields(prev => ({ ...prev, [field]: value }));
  };

  const renderItem = ({ item }: { item: Babysitter }) => {
    if (editId === item.id) {
      return (
        <View style={styles.editCard}>
          <TextInput
            style={styles.input}
            placeholder="First Name"
            placeholderTextColor="#333"
            value={editFields.firstName}
            onChangeText={text => updateEditField('firstName', text)}
          />
          <TextInput
            style={styles.input}
            placeholder="Last Name"
            placeholderTextColor="#333"
            value={editFields.lastName}
            onChangeText={text => updateEditField('lastName', text)}
          />
          <TextInput
            style={styles.input}
            placeholder="Mobile"
            placeholderTextColor="#333"
            value={editFields.mobile}
            onChangeText={text => updateEditField('mobile', text)}
            keyboardType="phone-pad"
          />
          <TextInput
            style={styles.input}
            placeholder="Rate ($/hr)"
            placeholderTextColor="#333"
            value={editFields.rate}
            onChangeText={text => updateEditField('rate', text)}
            keyboardType="decimal-pad"
          />
          <View style={styles.buttonRow}>
            <TouchableOpacity onPress={cancelEdit} style={[styles.button, styles.cancelButton]}>
              <ThemedText style={{ color: '#8B2D8B' }}>Cancel</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity onPress={saveEdit} style={[styles.button, styles.saveButton]}>
              <ThemedText style={{ color: '#fff' }}>Save</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.babysitterCard}>
        <View style={styles.babysitterInfo}>
          <ThemedText type="defaultSemiBold" style={styles.name}>
            {item.firstName} {item.lastName}
          </ThemedText>
          <TouchableOpacity 
            onPress={() => Linking.openURL(`tel:${item.mobile}`)}
            style={styles.phoneButton}
          >
            <ThemedText style={styles.mobile}>📞 {item.mobile}</ThemedText>
          </TouchableOpacity>
          <ThemedText style={styles.rate}>${item.rate}/hr</ThemedText>
        </View>
        <View style={styles.buttonRow}>
          <TouchableOpacity onPress={() => startEdit(item)} style={[styles.button, styles.editButton]}>
            <ThemedText style={{ color: '#8B2D8B' }}>Edit</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => confirmDelete(item)} style={[styles.button, styles.deleteButton]}>
            <ThemedText style={{ color: '#fff' }}>Delete</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <>
      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteConfirmation !== null}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>Confirm Delete</ThemedText>
            <ThemedText style={styles.modalText}>{deleteConfirmation}</ThemedText>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]}
                onPress={cancelDelete}
              >
                <ThemedText style={{ color: '#8B2D8B' }}>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.deleteButton]}
                onPress={() => babysitterToDelete && removeBabysitter(babysitterToDelete.id)}
              >
                <ThemedText style={{ color: '#fff' }}>Delete</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
        <ThemedText type="title" style={{ marginLeft: 8 }}>Manage Babysitters</ThemedText>
      </ThemedView>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.addCard}>
          <ThemedText type="defaultSemiBold" style={styles.addTitle}>Add New Babysitter</ThemedText>
          <TextInput
            style={styles.input}
            placeholder="First Name"
            placeholderTextColor="#333"
            value={newFirstName}
            onChangeText={setNewFirstName}
          />
          <TextInput
            style={styles.input}
            placeholder="Last Name"
            placeholderTextColor="#333"
            value={newLastName}
            onChangeText={setNewLastName}
          />
          <TextInput
            style={styles.input}
            placeholder="Mobile"
            placeholderTextColor="#333"
            value={newMobile}
            onChangeText={setNewMobile}
            keyboardType="phone-pad"
          />
          <TextInput
            style={styles.input}
            placeholder="Rate ($/hr)"
            placeholderTextColor="#333"
            value={newRate}
            onChangeText={setNewRate}
            keyboardType="decimal-pad"
          />
          <TouchableOpacity onPress={addBabysitter} style={styles.addButton}>
            <ThemedText type="defaultSemiBold" style={{ color: '#fff' }}>Add Babysitter</ThemedText>
          </TouchableOpacity>
        </View>

        <ThemedText type="defaultSemiBold" style={styles.listTitle}>Your Babysitters</ThemedText>
        
        {babysitters.length === 0 ? (
          <ThemedView style={styles.emptyState}>
            <ThemedText style={{ 
              textAlign: 'center',
              color: '#000000',
              fontSize: 16,
              fontWeight: 'bold'
            }}>
              No babysitters yet. Add your first babysitter above!
            </ThemedText>
          </ThemedView>
        ) : (
          <FlatList
            data={babysitters}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            style={styles.list}
          />
        )}
      </KeyboardAvoidingView>
    </ParallaxScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  reactLogo: {
    width: 300,
    height: 300,
    position: 'absolute',
    right: -80,
    bottom: -50,
    opacity: 0.5,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  addCard: {
    backgroundColor: '#FFE4FA',
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#C38DFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    width: '100%',
  },
  addTitle: {
    fontSize: 18,
    marginBottom: 12,
    color: '#8B2D8B',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#C38DFF',
  },
  addButton: {
    backgroundColor: '#C38DFF',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  listTitle: {
    fontSize: 20,
    marginBottom: 12,
    color: '#8B2D8B',
  },
  list: {
    width: '100%',
  },
  babysitterCard: {
    backgroundColor: '#FFE4FA',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#C38DFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    width: '100%',
  },
  editCard: {
    backgroundColor: '#FFE4FA',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#C38DFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    width: '100%',
  },
  babysitterInfo: {
    marginBottom: 12,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#8B2D8B',
  },
  mobile: {
    color: '#0066CC',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  phoneButton: {
    marginBottom: 4,
  },
  rate: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#8B2D8B',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#8B2D8B',
  },
  deleteButton: {
    backgroundColor: '#FF6B6B',
  },
  saveButton: {
    backgroundColor: '#C38DFF',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#8B2D8B',
  },
  emptyState: {
    padding: 24,
    backgroundColor: '#FFE4FA',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFE4FA',
    borderRadius: 14,
    padding: 20,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B2D8B',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#000000',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
});
