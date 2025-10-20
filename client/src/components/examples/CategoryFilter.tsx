import { useState } from 'react';
import { CategoryFilter } from '../CategoryFilter';

export default function CategoryFilterExample() {
  const [selected, setSelected] = useState<string[]>(['Rechnung']);
  const categories = ['Alle', 'Rechnung', 'Vertrag', 'Versicherung', 'Brief', 'Sonstiges'];

  const handleToggle = (category: string) => {
    setSelected(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  return (
    <div className="p-4">
      <CategoryFilter 
        categories={categories}
        selectedCategories={selected}
        onCategoryToggle={handleToggle}
      />
    </div>
  );
}
