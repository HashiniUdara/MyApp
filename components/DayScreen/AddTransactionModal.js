import { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import styles from './AddTransactionModal.styles';
import { useCategories } from '../../store/categoryStore/CategoryContext';
import { themeColor } from '../../config/theme';
import { WORDINGS } from '../../config/wordings';


const pad = (n) => String(n).padStart(2, '0');

const formatDisplay = (date) => {
  const days   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}  ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const toStorageString = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;

const parseDateString = (str) => {
  // "2026-06-26 14:30" → Date
  const [datePart, timePart] = str.split(' ');
  const [year, month, day]   = datePart.split('-').map(Number);
  const [hour, minute]       = timePart.split(':').map(Number);
  return new Date(year, month - 1, day, hour, minute);
};

export default function AddTransactionModal({
  visible,
  onClose,
  onAddExpense,
  onAddIncome,
  onUpdateExpense,
  onUpdateIncome,
  editingTransaction,   // null = add mode, object = edit mode
  expenseCategories: expenseCatsProp,
  incomeCategories:  incomeCatsProp,
}) {
  const isEditing = !!editingTransaction;

  // Get categories from DB via context (falls back to hardcoded if DB unavailable)
  const { expenseCategories, incomeCategories } = useCategories();
  const EXPENSE_CATS = expenseCategories;
  const INCOME_CATS  = incomeCategories;
  const [type, setType]               = useState('expense');
  const [category, setCategory]       = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount]           = useState('');
  const [date, setDate]               = useState(new Date());
  const [pickerMode, setPickerMode]   = useState('date');
  const [showPicker, setShowPicker]   = useState(false);

  // Populate fields when opening in edit mode
  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setCategory(editingTransaction.category);
      setSubcategory(editingTransaction.subcategory);
      setDescription(editingTransaction.description ?? '');
      setAmount(String(editingTransaction.amount));
      setDate(parseDateString(editingTransaction.date));
    } else {
      reset();
    }
  }, [editingTransaction]);

  const categories    = type === 'expense' ? EXPENSE_CATS : INCOME_CATS;
  const subcategories = category ? categories[category] ?? [] : [];

  const reset = () => {
    setType('expense');
    setCategory('');
    setSubcategory('');
    setDescription('');
    setAmount('');
    setDate(new Date());
    setShowPicker(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const onChangeDate = (event, selectedDate) => {
    if (event.type === 'dismissed') { setShowPicker(false); return; }
    const picked = selectedDate ?? date;
    if (Platform.OS === 'android') {
      setShowPicker(false);
      if (pickerMode === 'date') {
        setDate(picked);
        setPickerMode('time');
        setShowPicker(true);
      } else {
        setDate(picked);
        setPickerMode('date');
      }
    } else {
      setDate(picked);
    }
  };

  const openDatePicker = () => {
    setPickerMode('date');
    setShowPicker(true);
  };

  const handleSubmit = () => {
    if (!category || !subcategory || !amount.trim() || isNaN(amount)) return;

    const entry = {
      description: description.trim(),
      category,
      subcategory,
      amount: parseFloat(amount),
      date: toStorageString(date),
    };

    if (isEditing) {
      // Pass the server id through so the store can call PUT /transactions/:id
      const id = editingTransaction.id;
      if (type === 'expense') onUpdateExpense(id, entry);
      else                    onUpdateIncome(id, entry);
    } else {
      if (type === 'expense') onAddExpense(entry);
      else                    onAddIncome(entry);
    }

    reset();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />

        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>
            {isEditing ? 'Edit Transaction' : 'Add Transaction'}
          </Text>

          <ScrollView showsVerticalScrollIndicator={false}>

            {/* Type toggle — locked in edit mode since type shouldn't change */}
            <View style={styles.toggle}>
              {['expense', 'income'].map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.toggleBtn,
                    type === t && (t === 'expense' ? styles.toggleExpenseActive : styles.toggleIncomeActive),
                    isEditing && styles.toggleDisabled,
                  ]}
                  onPress={() => {
                    if (isEditing) return;
                    setType(t);
                    setCategory('');
                    setSubcategory('');
                  }}
                >
                  <Text style={[styles.toggleText, type === t && styles.toggleTextActive]}>
                    {t === 'expense' ? 'Expense' : 'Income'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Date & Time */}
            <Text style={styles.label}>Date & Time</Text>
            <TouchableOpacity style={styles.dateButton} onPress={openDatePicker}>
              {/* <Text style={styles.dateIcon}>📅</Text> */}
              <Text style={styles.dateText}>{formatDisplay(date)}</Text>
            </TouchableOpacity>

            {showPicker && Platform.OS === 'ios' && (
              <DateTimePicker
                value={date}
                mode="datetime"
                display="spinner"
                onChange={onChangeDate}
                style={styles.iosPicker}
                textColor={themeColor('textPrimary')}
              />
            )}
            {showPicker && Platform.OS === 'android' && (
              <DateTimePicker
                value={date}
                mode={pickerMode}
                display="default"
                onChange={onChangeDate}
              />
            )}

            {/* Category pills */}
            <Text style={styles.label}>{WORDINGS.addTransaction.category}</Text>
            <View style={styles.pills}>
              {Object.keys(categories).map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.pill, category === cat && styles.pillActive]}
                  onPress={() => { setCategory(cat); setSubcategory(''); }}
                >
                  <Text style={[styles.pillText, category === cat && styles.pillTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Subcategory pills */}
            {subcategories.length > 0 && (
              <>
                <Text style={styles.label}>{WORDINGS.addTransaction.subcategory}</Text>
                <View style={styles.pills}>
                  {subcategories.map((sub) => (
                    <TouchableOpacity
                      key={sub}
                      style={[styles.pill, subcategory === sub && styles.pillActive]}
                      onPress={() => setSubcategory(sub)}
                    >
                      <Text style={[styles.pillText, subcategory === sub && styles.pillTextActive]}>{sub}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* Description */}
            <TextInput
              style={styles.input}
              placeholder="Description (optional)"
              placeholderTextColor={themeColor('mutedText')}
              value={description}
              onChangeText={setDescription}
            />

            {/* Amount */}
            <TextInput
              style={styles.input}
              placeholder={WORDINGS.addTransaction.amount}
              placeholderTextColor={themeColor('mutedText')}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />

            {/* Submit */}
            <TouchableOpacity
              style={[styles.addBtn, (!category || !subcategory || !amount) && styles.addBtnDisabled]}
              onPress={handleSubmit}
            >
              <Text style={styles.addBtnText}>{isEditing ? WORDINGS.common.saveChanges : WORDINGS.common.add}</Text>
            </TouchableOpacity>

          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}






// import { useState } from 'react';
// import {
//   Modal,
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   KeyboardAvoidingView,
//   Platform,
//   ScrollView,
// } from 'react-native';
// import DateTimePicker from '@react-native-community/datetimepicker';
// import styles from './AddTransactionModal.styles';
// import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../../constants/categories';

// const pad = (n) => String(n).padStart(2, '0');

// const formatDisplay = (date) => {
//   const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
//   const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
//   return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}  ${pad(date.getHours())}:${pad(date.getMinutes())}`;
// };

// const toStorageString = (date) =>
//   `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;

// export default function AddTransactionModal({ visible, onClose, onAddExpense, onAddIncome }) {
//   const [type, setType]               = useState('expense');
//   const [category, setCategory]       = useState('');
//   const [subcategory, setSubcategory] = useState('');
//   const [description, setDescription] = useState('');
//   const [amount, setAmount]           = useState('');
//   const [date, setDate]               = useState(new Date());

//   // Android needs separate date/time pickers shown sequentially
//   const [pickerMode, setPickerMode]   = useState('date');   // 'date' | 'time'
//   const [showPicker, setShowPicker]   = useState(false);

//   const categories    = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
//   const subcategories = category ? categories[category] ?? [] : [];

//   const reset = () => {
//     setCategory('');
//     setSubcategory('');
//     setDescription('');
//     setAmount('');
//     setDate(new Date());
//     setShowPicker(false);
//   };

//   const handleClose = () => { reset(); onClose(); };

//   // On Android: after picking date, immediately open time picker
//   const onChangeDate = (event, selectedDate) => {
//     if (event.type === 'dismissed') { setShowPicker(false); return; }
//     const picked = selectedDate ?? date;

//     if (Platform.OS === 'android') {
//       setShowPicker(false);
//       if (pickerMode === 'date') {
//         setDate(picked);
//         // Now open time picker
//         setPickerMode('time');
//         setShowPicker(true);
//       } else {
//         setDate(picked);
//         setPickerMode('date'); // reset for next open
//       }
//     } else {
//       // iOS: inline picker updates live
//       setDate(picked);
//     }
//   };

//   const openDatePicker = () => {
//     setPickerMode('date');
//     setShowPicker(true);
//   };

//   const handleAdd = () => {
//     if (!category || !subcategory || !amount.trim() || isNaN(amount)) return;

//     const entry = {
//       description: description.trim(),
//       category,
//       subcategory,
//       amount: parseFloat(amount),
//       date: toStorageString(date),
//     };

//     if (type === 'expense') onAddExpense(entry);
//     else onAddIncome(entry);

//     reset();
//     onClose();
//   };

//   return (
//     <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
//       <KeyboardAvoidingView
//         style={styles.overlay}
//         behavior={Platform.OS === 'ios' ? 'padding' : undefined}
//       >
//         <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />

//         <View style={styles.sheet}>
//           <View style={styles.handle} />
//           <Text style={styles.sheetTitle}>Add Transaction</Text>

//           <ScrollView showsVerticalScrollIndicator={false}>

//             {/* Type toggle */}
//             <View style={styles.toggle}>
//               {['expense', 'income'].map((t) => (
//                 <TouchableOpacity
//                   key={t}
//                   style={[styles.toggleBtn, type === t && (t === 'expense' ? styles.toggleExpenseActive : styles.toggleIncomeActive)]}
//                   onPress={() => { setType(t); setCategory(''); setSubcategory(''); }}
//                 >
//                   <Text style={[styles.toggleText, type === t && styles.toggleTextActive]}>
//                     {t === 'expense' ? '💸 Expense' : '💰 Income'}
//                   </Text>
//                 </TouchableOpacity>
//               ))}
//             </View>

//             {/* Date & Time */}
//             <Text style={styles.label}>Date & Time</Text>
//             <TouchableOpacity style={styles.dateButton} onPress={openDatePicker}>
//               <Text style={styles.dateIcon}>📅</Text>
//               <Text style={styles.dateText}>{formatDisplay(date)}</Text>
//             </TouchableOpacity>

//             {/* iOS shows an inline picker inside the sheet */}
//             {showPicker && Platform.OS === 'ios' && (
//               <DateTimePicker
//                 value={date}
//                 mode="datetime"
//                 display="spinner"
//                 onChange={onChangeDate}
//                 style={styles.iosPicker}
//                 textColor={themeColor('textPrimary')}
//               />
//             )}

//             {/* Android shows a native dialog (rendered outside sheet) */}
//             {showPicker && Platform.OS === 'android' && (
//               <DateTimePicker
//                 value={date}
//                 mode={pickerMode}
//                 display="default"
//                 onChange={onChangeDate}
//               />
//             )}

//             {/* Category pills */}
//             <Text style={styles.label}>Category</Text>
//             <View style={styles.pills}>
//               {Object.keys(categories).map((cat) => (
//                 <TouchableOpacity
//                   key={cat}
//                   style={[styles.pill, category === cat && styles.pillActive]}
//                   onPress={() => { setCategory(cat); setSubcategory(''); }}
//                 >
//                   <Text style={[styles.pillText, category === cat && styles.pillTextActive]}>{cat}</Text>
//                 </TouchableOpacity>
//               ))}
//             </View>

//             {/* Subcategory pills */}
//             {subcategories.length > 0 && (
//               <>
//                 <Text style={styles.label}>Subcategory</Text>
//                 <View style={styles.pills}>
//                   {subcategories.map((sub) => (
//                     <TouchableOpacity
//                       key={sub}
//                       style={[styles.pill, subcategory === sub && styles.pillActive]}
//                       onPress={() => setSubcategory(sub)}
//                     >
//                       <Text style={[styles.pillText, subcategory === sub && styles.pillTextActive]}>{sub}</Text>
//                     </TouchableOpacity>
//                   ))}
//                 </View>
//               </>
//             )}

//             {/* Description */}
//             <TextInput
//               style={styles.input}
//               placeholder="Description (optional)"
//               placeholderTextColor={themeColor('mutedText')}
//               value={description}
//               onChangeText={setDescription}
//             />

//             {/* Amount */}
//             <TextInput
//               style={styles.input}
//               placeholder="Amount (LKR)"
//               placeholderTextColor={themeColor('mutedText')}
//               keyboardType="numeric"
//               value={amount}
//               onChangeText={setAmount}
//             />

//             {/* Submit */}
//             <TouchableOpacity
//               style={[styles.addBtn, (!category || !subcategory || !amount) && styles.addBtnDisabled]}
//               onPress={handleAdd}
//             >
//               <Text style={styles.addBtnText}>Add</Text>
//             </TouchableOpacity>

//           </ScrollView>
//         </View>
//       </KeyboardAvoidingView>
//     </Modal>
//   );
// }