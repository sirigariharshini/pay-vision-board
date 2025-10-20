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
    <div className="group relative p-5 rounded-2xl border-2 border-border bg-card hover:border-primary/60 transition-all duration-500 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:scale-105 overflow-hidden">
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
      
      <div className="relative flex flex-col items-center text-center space-y-3">
        <div className="text-5xl group-hover:scale-110 transition-transform duration-300 group-hover:animate-float">
          {getCategoryIcon(item.category)}
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-1 group-hover:text-primary transition-colors duration-300">
            {item.name}
          </h3>
          <p className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            ${item.price.toFixed(2)}
          </p>
        </div>

        <Button
          onClick={() => onAdd(item)}
          size="sm"
          className="w-full bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/50 transition-all duration-300"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add to Cart
        </Button>
      </div>
    </div>
  );
}
