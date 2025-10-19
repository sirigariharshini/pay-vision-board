import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Coffee, CheckCircle2 } from "lucide-react";

interface Drink {
  id: string;
  name: string;
  price: number;
  image_url?: string;
}

interface User {
  id: string;
  name: string;
  balance: number;
}

interface Purchase {
  id: string;
  user_id: string;
  drink_id: string;
  timestamp: string;
}

export default function CanteenDashboard() {
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [selectedDrink, setSelectedDrink] = useState<Drink | null>(null);
  const [rfidInput, setRfidInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [recentPurchases, setRecentPurchases] = useState<string[]>([]);

  useEffect(() => {
    fetchDrinks();

    // Real-time subscriptions
    const drinksChannel = supabase
      .channel("drinks-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "drinks" },
        () => fetchDrinks()
      )
      .subscribe();

    const purchasesChannel = supabase
      .channel("purchases-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "purchases" },
        (payload) => {
          const newPurchase = payload.new as Purchase;
          setRecentPurchases((prev) => [newPurchase.drink_id, ...prev.slice(0, 4)]);
          setTimeout(() => {
            setRecentPurchases((prev) => prev.filter((id) => id !== newPurchase.drink_id));
          }, 3000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(drinksChannel);
      supabase.removeChannel(purchasesChannel);
    };
  }, []);

  const fetchDrinks = async () => {
    const { data } = await supabase.from("drinks").select("*").order("name");
    if (data) setDrinks(data);
  };

  const handleDrinkClick = (drink: Drink) => {
    setSelectedDrink(drink);
    setRfidInput("");
  };

  const handlePurchase = async () => {
    if (!selectedDrink || !rfidInput.trim()) {
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

      // Check balance
      if (user.balance < selectedDrink.price) {
        toast.error(`Insufficient balance. Current balance: $${user.balance.toFixed(2)}`);
        setIsProcessing(false);
        return;
      }

      // Deduct balance
      const newBalance = user.balance - selectedDrink.price;
      const { error: updateError } = await supabase
        .from("users")
        .update({ balance: newBalance })
        .eq("id", user.id);

      if (updateError) throw updateError;

      // Insert purchase record
      const { error: purchaseError } = await supabase
        .from("purchases")
        .insert({
          user_id: user.id,
          drink_id: selectedDrink.id,
        });

      if (purchaseError) throw purchaseError;

      // Success
      toast.success(
        `Purchased ${selectedDrink.name} for $${selectedDrink.price.toFixed(2)}. New balance: $${newBalance.toFixed(2)}`,
        { duration: 4000 }
      );

      setSelectedDrink(null);
      setRfidInput("");
    } catch (error) {
      console.error("Purchase error:", error);
      toast.error("Purchase failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Canteen Dashboard</h1>
          <p className="text-muted-foreground">Select a drink and scan your RFID card</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {drinks.map((drink) => (
            <button
              key={drink.id}
              onClick={() => handleDrinkClick(drink)}
              className={`relative group p-6 rounded-xl border-2 transition-all duration-300 hover:scale-105 hover:shadow-xl ${
                recentPurchases.includes(drink.id)
                  ? "border-green-500 bg-green-500/10"
                  : "border-border bg-card hover:border-primary"
              }`}
            >
              {recentPurchases.includes(drink.id) && (
                <div className="absolute -top-2 -right-2 animate-scale-in">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
              )}

              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Coffee className="w-10 h-10 text-primary" />
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-1">
                    {drink.name}
                  </h3>
                  <p className="text-2xl font-bold text-primary">
                    ${drink.price.toFixed(2)}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

        <Dialog open={!!selectedDrink} onOpenChange={() => setSelectedDrink(null)}>
          <DialogContent className="sm:max-w-md animate-scale-in">
            <DialogHeader>
              <DialogTitle className="text-2xl">
                Purchase {selectedDrink?.name}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="text-center p-6 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm text-muted-foreground mb-2">Amount to pay</p>
                <p className="text-4xl font-bold text-primary">
                  ${selectedDrink?.price.toFixed(2)}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Scan RFID Card
                </label>
                <Input
                  type="text"
                  placeholder="Enter RFID UID"
                  value={rfidInput}
                  onChange={(e) => setRfidInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handlePurchase()}
                  autoFocus
                  className="text-lg"
                />
                <p className="text-xs text-muted-foreground">
                  Scan your card or enter UID manually
                </p>
              </div>

              <Button
                onClick={handlePurchase}
                disabled={isProcessing || !rfidInput.trim()}
                className="w-full"
                size="lg"
              >
                {isProcessing ? "Processing..." : "Confirm Purchase"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
