import { useState } from 'react';
import HabitListScreen   from './HabitListScreen';
import HabitDetailScreen from './HabitDetailScreen';

export default function HabitScreen() {
  const [selectedHabit, setSelectedHabit] = useState(null);

  if (selectedHabit) {
    return (
      <HabitDetailScreen
        habit={selectedHabit}
        onBack={() => setSelectedHabit(null)}
      />
    );
  }

  return <HabitListScreen onSelectHabit={setSelectedHabit} />;
}
