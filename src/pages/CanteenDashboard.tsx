import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ItemCard from "@/components/canteen/ItemCard";
import CartSidebar, { CartItem } from "@/components/canteen/CartSidebar";

interface Item {
  id: string;
  name: string;
  price: number;
  category: string;
  image_url?: string;
}

interface User {
  id: string;
  name: string;
  balance: number;
}

export default function CanteenDashboard() {
  const [items, setItems] = useState<Item[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = [
    { id: "all", label: "All Items" },
    { id: "breakfast", label: "Breakfast" },
    { id: "meals", label: "Meals" },
    { id: "snacks", label: "Snacks" },
    { id: "drinks", label: "Drinks" },
    { id: "desserts", label: "Desserts" },
  ];

  useEffect(() => {
    fetchItems();

    // Real-time subscription for items
    const itemsChannel = supabase
      .channel("drinks-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "drinks" },
        () => fetchItems()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(itemsChannel);
    };
  }, []);

  const fetchItems = async () => {
    const { data } = await supabase
      .from("drinks")
      .select("*")
      .order("category")
      .order("name");
    if (data) setItems(data);
  };

  const handleAddToCart = (item: Item) => {
    setCart((prev) => {
      const existingItem = prev.find((i) => i.id === item.id);
      if (existingItem) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    toast.success(`Added ${item.name} to cart`);
  };

  const handleUpdateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) return;
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const handleRemoveFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
    toast.info("Item removed from cart");
  };

  const handleCheckout = async (rfidInput: string) => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    if (!rfidInput.trim()) {
      toast.error("Please scan your RFID card");
      return;
    }

    setIsProcessing(true);

    try {
      // Fetch user by RFID
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", rfidInput.trim())
        .single();

      if (userError || !user) {
        toast.error("RFID card not found. Please register first.");
        setIsProcessing(false);
        return;
      }

      // Calculate total
      const totalPrice = cart.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      // Check balance
      if (user.balance < totalPrice) {
        toast.error(
          `Insufficient balance. Total: $${totalPrice.toFixed(2)}, Balance: $${user.balance.toFixed(2)}`
        );
        setIsProcessing(false);
        return;
      }

      // Deduct balance
      const newBalance = user.balance - totalPrice;
      const { error: updateError } = await supabase
        .from("users")
        .update({ balance: newBalance })
        .eq("id", user.id);

      if (updateError) throw updateError;

      // Insert purchase records for each item
      const purchasePromises = cart.map((item) =>
        supabase.from("purchases").insert({
          user_id: user.id,
          drink_id: item.id,
          quantity: item.quantity,
          total_price: item.price * item.quantity,
        })
      );

      await Promise.all(purchasePromises);

      // Log RFID scan
      await supabase.from("rfid_scans").insert({
        rfid_tag: user.id,
        balance: newBalance,
      });

      // Success
      toast.success(
        `Purchase complete! Total: $${totalPrice.toFixed(2)}. New balance: $${newBalance.toFixed(2)}`,
        { duration: 5000 }
      );

      setCart([]);
    } catch (error) {
      console.error("Purchase error:", error);
      toast.error("Purchase failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredItems =
    selectedCategory === "all"
      ? items
      : items.filter((item) => item.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 md:p-8 pb-24">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Canteen Menu
          </h1>
          <p className="text-muted-foreground">
            Add items to cart and scan your RFID card at checkout
          </p>
        </div>

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-8">
          <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto">
            {categories.map((category) => (
              <TabsTrigger key={category.id} value={category.id}>
                {category.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedCategory} className="mt-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredItems.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onAdd={handleAddToCart}
                />
              ))}
            </div>

            {filteredItems.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No items found in this category
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <CartSidebar
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemove={handleRemoveFromCart}
        onCheckout={handleCheckout}
        isProcessing={isProcessing}
      />
    </div>
  );
}
