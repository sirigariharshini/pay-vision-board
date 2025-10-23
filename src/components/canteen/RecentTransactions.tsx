import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Receipt, Clock, IndianRupee, Package } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Transaction {
  id: string;
  timestamp: string;
  quantity: number;
  total_price: number;
  user_id: string;
  drink_id: string;
  user_name?: string;
  item_name?: string;
}

export default function RecentTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();

    // Real-time subscription for new purchases
    const channel = supabase
      .channel("purchases-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "purchases" },
        () => fetchTransactions()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchTransactions = async () => {
    try {
      const { data: purchases, error } = await supabase
        .from("purchases")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(10);

      if (error) throw error;

      if (purchases) {
        // Fetch related data
        const enrichedTransactions = await Promise.all(
          purchases.map(async (purchase) => {
            const [drinkData, userData] = await Promise.all([
              supabase
                .from("drinks")
                .select("name")
                .eq("id", purchase.drink_id)
                .single(),
              supabase
                .from("users")
                .select("name")
                .eq("id", purchase.user_id)
                .single(),
            ]);

            return {
              ...purchase,
              item_name: drinkData.data?.name || "Unknown Item",
              user_name: userData.data?.name || "Unknown User",
            };
          })
        );

        setTransactions(enrichedTransactions);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm border-2 shadow-lg">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          <Receipt className="w-6 h-6 text-primary" />
          Recent Transactions
        </h2>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-muted/50 rounded-xl animate-pulse" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm border-2 shadow-lg hover:shadow-xl transition-shadow duration-300">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
        <Receipt className="w-6 h-6 text-primary" />
        Recent Transactions
      </h2>

      <ScrollArea className="h-[400px] pr-4">
        {transactions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Receipt className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction, index) => (
              <div
                key={transaction.id}
                className="p-4 rounded-xl border-2 bg-gradient-to-r from-card to-card/50 hover:border-primary/50 transition-all duration-300 hover:shadow-md animate-scale-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      <Package className="w-4 h-4 text-primary" />
                      {transaction.item_name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {transaction.user_name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent flex items-center gap-1">
                      <IndianRupee className="w-4 h-4 text-primary" />
                      {transaction.total_price.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Qty: {transaction.quantity}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(new Date(transaction.timestamp), {
                    addSuffix: true,
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </Card>
  );
}
