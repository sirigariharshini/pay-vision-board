import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Item {
  id: string;
  name: string;
  price: number;
  category: string;
}

interface ItemCardProps {
  item: Item;
  onAdd: (item: Item) => void;
}

export default function ItemCard({ item, onAdd }: ItemCardProps) {
  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      drinks: "☕",
      snacks: "🍪",
      meals: "🍔",
      breakfast: "🥞",
      desserts: "🍰",
    };
    return icons[category] || "🍴";
  };

  return (
    <div className="group p-4 rounded-xl border-2 border-border bg-card hover:border-primary transition-all duration-300 hover:shadow-lg">
      <div className="flex flex-col items-center text-center space-y-3">
        <div className="text-4xl">{getCategoryIcon(item.category)}</div>
        
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-1">
            {item.name}
          </h3>
          <p className="text-xl font-bold text-primary">
            ${item.price.toFixed(2)}
          </p>
        </div>

        <Button
          onClick={() => onAdd(item)}
          size="sm"
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add to Cart
        </Button>
      </div>
    </div>
  );
}
