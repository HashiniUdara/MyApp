import { useState } from 'react';
import TodoListScreen from './TodoListScreen';
import TodoFormScreen from './TodoFormScreen';
import ConfirmDialog from '../common/ConfirmDialog';
import { useTodos } from '../../store/todoStore/TodoContext';
import { WORDINGS } from '../../config/wordings';

export default function TodoScreen() {
  const { addTodo, updateTodo, removeTodo } = useTodos();

  const [formVisible, setFormVisible] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  const [defaultDate, setDefaultDate] = useState(null);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  const openAdd = (dateStr) => {
    setEditingTodo(null);
    setDefaultDate(dateStr);
    setFormVisible(true);
  };

  const openEdit = (todo) => {
    setEditingTodo(todo);
    setFormVisible(true);
  };

  const closeForm = () => setFormVisible(false);

  const handleSave = (payload) => {
    if (payload.id) {
      updateTodo(payload.id, payload);
    } else {
      addTodo(payload);
    }
    setFormVisible(false);
  };

  // Alert.alert() is a no-op on web, so deletion confirmed that way never
  // actually fired its callback in a browser. ConfirmDialog works everywhere.
  const requestDeleteFromForm = (id) => setPendingDeleteId(id);

  const confirmDeleteFromForm = () => {
    if (pendingDeleteId) {
      removeTodo(pendingDeleteId);
      setPendingDeleteId(null);
      setFormVisible(false);
    }
  };

  return (
    <>
      <TodoListScreen onAdd={openAdd} onEdit={openEdit} />
      <TodoFormScreen
        visible={formVisible}
        todo={editingTodo}
        defaultDate={defaultDate}
        onClose={closeForm}
        onSave={handleSave}
        onDelete={requestDeleteFromForm}
      />
      <ConfirmDialog
        visible={!!pendingDeleteId}
        title={WORDINGS.todo.confirmDelete}
        message={WORDINGS.todo.deleteMessage2}
        confirmLabel={WORDINGS.common.delete}
        destructive
        onConfirm={confirmDeleteFromForm}
        onCancel={() => setPendingDeleteId(null)}
      />
    </>
  );
}
