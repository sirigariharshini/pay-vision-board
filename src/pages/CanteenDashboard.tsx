import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import ItemCard from "@/components/canteen/ItemCard";
import CartSidebar, { CartItem } from "@/components/canteen/CartSidebar";
import RecentTransactions from "@/components/canteen/RecentTransactions";

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

  // Separate useEffect for RFID scans to avoid re-subscribing on cart changes
  useEffect(() => {
    console.log("Setting up RFID scan subscription...");
    
    const rfidChannel = supabase
      .channel("rfid-scan-listener")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "rfid_scan" },
        (payload) => {
          console.log("✅ RFID scan detected from database:", payload.new);
          const rfidTag = payload.new.rfid_tag;
          
          if (!rfidTag) {
            console.error("❌ No RFID tag in payload");
            toast.error("Invalid RFID scan - no tag found");
            return;
          }

          console.log("📦 Current cart items:", cart.length);
          
          if (cart.length === 0) {
            toast.warning("Please add items to cart before scanning", {
              description: `RFID: ${rfidTag}`
            });
            return;
          }

          toast.info(`🔍 Processing RFID: ${rfidTag}`, {
            description: `Cart items: ${cart.length}`
          });
          
          handleCheckout(rfidTag);
        }
      )
      .subscribe((status) => {
        console.log("RFID channel status:", status);
      });

    return () => {
      console.log("Cleaning up RFID subscription");
      supabase.removeChannel(rfidChannel);
    };
  }, [cart]);

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
    console.log("🛒 Starting checkout process for RFID:", rfidInput);
    
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    if (!rfidInput.trim()) {
      toast.error("Please scan your RFID card");
      return;
    }

    setIsProcessing(true);
    toast.info("Processing payment...", { duration: 1000 });

    try {
      console.log("👤 Fetching user data...");
      // Fetch user by RFID
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", rfidInput.trim())
        .maybeSingle();

      if (userError) {
        console.error("❌ User fetch error:", userError);
        throw userError;
      }

      if (!user) {
        console.error("❌ User not found for RFID:", rfidInput);
        toast.error(`RFID card not found: ${rfidInput}`, {
          description: "Please register first"
        });
        setIsProcessing(false);
        return;
      }

      console.log("✅ User found:", user.name, "Balance:", user.balance);

      // Calculate total
      const totalPrice = cart.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      console.log("💰 Total price:", totalPrice);

      // Check balance
      if (user.balance < totalPrice) {
        console.error("❌ Insufficient balance");
        toast.error(`Insufficient Balance - ${user.name}`, {
          description: `Need $${totalPrice.toFixed(2)}, Available: $${user.balance.toFixed(2)}`
        });
        setIsProcessing(false);
        return;
      }

      // Deduct balance
      const newBalance = user.balance - totalPrice;
      console.log("💳 Updating balance to:", newBalance);
      
      const { error: updateError } = await supabase
        .from("users")
        .update({ balance: newBalance })
        .eq("id", user.id);

      if (updateError) {
        console.error("❌ Balance update error:", updateError);
        throw updateError;
      }

      console.log("📝 Creating purchase records...");
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

      console.log("✅ Payment complete!");

      // Success with detailed info
      toast.success(`✅ Payment Successful - ${user.name}`, {
        description: `Paid: $${totalPrice.toFixed(2)} | New Balance: $${newBalance.toFixed(2)}`,
        duration: 6000
      });

      setCart([]);
    } catch (error) {
      console.error("❌ Purchase error:", error);
      toast.error("Payment Failed", {
        description: "Please try again or contact support"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredItems =
    selectedCategory === "all"
      ? items
      : items.filter((item) => item.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
      
      {/* Header with back button */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center gap-4">
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="hover:bg-primary/10"
          >
            <Link to="/">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Canteen Menu
            </h1>
            <p className="text-sm text-muted-foreground">
              Add items to cart and scan your RFID card
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 pb-24 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main menu section */}
          <div className="lg:col-span-3">
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="animate-fade-in">
              <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto p-2 bg-card/50 backdrop-blur-sm shadow-lg rounded-xl border">
                {categories.map((category) => (
                  <TabsTrigger 
                    key={category.id} 
                    value={category.id}
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-primary-foreground transition-all duration-300 rounded-lg"
                  >
                    {category.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value={selectedCategory} className="mt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredItems.map((item, index) => (
                    <div 
                      key={item.id}
                      className="animate-scale-in"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <ItemCard
                        item={item}
                        onAdd={handleAddToCart}
                      />
                    </div>
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

          {/* Recent transactions sidebar */}
          <div className="lg:col-span-1 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <RecentTransactions />
          </div>
        </div>
      </div>

      <CartSidebar
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemove={handleRemoveFromCart}
        isProcessing={isProcessing}
      />
    </div>
  );
}
