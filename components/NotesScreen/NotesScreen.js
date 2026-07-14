import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, Alert, Modal, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ConfirmDialog from '../common/ConfirmDialog';
import { useAuth } from '../../store/authStore/AuthContext';
import { fetchNotes, createNote, updateNote, deleteNote as removeNoteFromDb } from '../../store/noteApi';
import styles from './NotesScreen.styles';
import { themeColor } from '../../config/theme';

function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString();
}

export default function NotesScreen() {
  const { user } = useAuth();
  const [notes,   setNotes]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [modal,   setModal]   = useState(false);
  const [editing, setEditing] = useState(null);
  const [title,   setTitle]   = useState('');
  const [body,    setBody]    = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);

  const loadNotes = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    try {
      setLoading(true);
      setNotes(await fetchNotes(user.id) ?? []);
    } catch (e) {
      Alert.alert('Notes Error', e.message || 'Unable to load notes.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { loadNotes(); }, [loadNotes]);

  const openNew = () => { setEditing(null); setTitle(''); setBody(''); setModal(true); };
  const openEdit = (note) => { setEditing(note); setTitle(note.title ?? ''); setBody(note.body ?? ''); setModal(true); };

  const save = async () => {
    const cleanTitle = title.trim();
    const cleanBody = body.trim();
    if (!cleanTitle && !cleanBody) { setModal(false); return; }

    try {
      setSaving(true);
      if (editing) {
        const saved = await updateNote(editing.id, { title: cleanTitle, body: cleanBody });
        setNotes(prev => prev.map(n => n.id === editing.id ? saved : n));
      } else {
        const saved = await createNote(user.id, { title: cleanTitle, body: cleanBody });
        setNotes(prev => [saved, ...prev]);
      }
      setModal(false);
    } catch (e) {
      Alert.alert('Save Failed', e.message || 'Unable to save note.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;

    try {
      await removeNoteFromDb(pendingDelete.id);
      setNotes(prev => prev.filter(n => n.id !== pendingDelete.id));
    } catch (e) {
      Alert.alert('Delete Failed', e.message || 'Unable to delete note.');
    } finally {
      setPendingDelete(null);
    }
  };

  const renderNote = ({ item }) => (
    <TouchableOpacity style={styles.noteCard} onPress={() => openEdit(item)} activeOpacity={0.8}>
      {!!item.title && <Text style={styles.noteTitle} numberOfLines={1}>{item.title}</Text>}
      {!!item.body  && <Text style={styles.noteBody}  numberOfLines={3}>{item.body}</Text>}
      <View style={styles.noteFoot}>
        <Text style={styles.noteDate}>{formatDate(item.updated_at ?? item.created_at)}</Text>
        <TouchableOpacity onPress={() => setPendingDelete(item)} hitSlop={{ top:8,bottom:8,left:8,right:8 }}>
          <Ionicons name="trash-outline" size={15} color={themeColor('danger')} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notes</Text>

      {loading ? (
        <View style={styles.empty}><ActivityIndicator color={themeColor('primary')} /></View>
      ) : notes.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="document-text-outline" size={40} color={themeColor('surfaceAlt')} />
          <Text style={styles.emptyText}>No notes yet. Tap + to add one.</Text>
        </View>
      ) : (
        <FlatList
          data={notes}
          keyExtractor={n => n.id}
          renderItem={renderNote}
          numColumns={2}
          columnWrapperStyle={styles.columns}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={openNew}>
        <Ionicons name="add" size={28} color={themeColor('textPrimary')} />
      </TouchableOpacity>

      <ConfirmDialog
        visible={!!pendingDelete}
        title="Delete Note"
        message={pendingDelete ? `Delete "${pendingDelete.title || 'this note'}"? This can't be undone.` : ''}
        confirmLabel="Delete"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />

      <Modal visible={modal} transparent animationType="slide" onRequestClose={() => setModal(false)}>
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setModal(false)} />
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>{editing ? 'Edit Note' : 'New Note'}</Text>
            <TextInput
              style={styles.inputTitle}
              placeholder="Title (optional)"
              placeholderTextColor={themeColor('mutedText')}
              value={title}
              onChangeText={setTitle}
              maxLength={80}
            />
            <TextInput
              style={styles.inputBody}
              placeholder="Write your note..."
              placeholderTextColor={themeColor('mutedText')}
              value={body}
              onChangeText={setBody}
              multiline
              textAlignVertical="top"
              maxLength={2000}
            />
            <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={save} disabled={saving}>
              <Text style={styles.saveBtnText}>{saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Note'}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}