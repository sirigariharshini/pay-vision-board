import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Receipt, Clock, DollarSign, Package, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface PurchaseTransaction {
  id: string;
  timestamp: string;
  quantity: number;
  total_price: number;
  user_id: string;
  drink_id: string;
  user_name?: string;
  item_name?: string;
}

interface TransactionListProps {
  transactions?: any[];
}

export const TransactionList = ({ transactions: _unused }: TransactionListProps) => {
  const [purchases, setPurchases] = useState<PurchaseTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPurchases();

    // Real-time subscription for new purchases
    const channel = supabase
      .channel("purchases-dashboard")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "purchases" },
        () => fetchPurchases()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPurchases = async () => {
    try {
      const { data: purchaseData, error } = await supabase
        .from("purchases")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(15);

      if (error) throw error;

      if (purchaseData) {
        // Fetch related data
        const enrichedPurchases = await Promise.all(
          purchaseData.map(async (purchase) => {
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

        setPurchases(enrichedPurchases);
      }
    } catch (error) {
      console.error("Error fetching purchases:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm border-2 shadow-lg">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          <Receipt className="w-5 h-5 text-primary" />
          Recent Purchase Transactions
        </h3>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-muted/50 rounded-xl animate-pulse" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm border-2 shadow-lg hover:shadow-xl transition-shadow duration-300">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
        <Receipt className="w-5 h-5 text-primary" />
        Recent Purchase Transactions
      </h3>
      <ScrollArea className="h-[400px] pr-4">
        {purchases.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Receipt className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No purchases yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {purchases.map((purchase, index) => (
              <div
                key={purchase.id}
                className="p-4 rounded-xl border-2 bg-gradient-to-r from-card to-card/50 hover:border-primary/50 transition-all duration-300 hover:shadow-md animate-scale-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 space-y-1">
                    <h4 className="font-semibold text-foreground flex items-center gap-2">
                      <Package className="w-4 h-4 text-primary" />
                      {purchase.item_name}
                    </h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="w-3 h-3" />
                      <span>{purchase.user_name}</span>
                      <Badge variant="outline" className="text-xs">
                        Qty: {purchase.quantity}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent flex items-center gap-1">
                      <DollarSign className="w-4 h-4 text-primary" />
                      {purchase.total_price.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground pt-2 border-t border-border">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(new Date(purchase.timestamp), {
                    addSuffix: true,
                  })}
                  <span className="mx-2">•</span>
                  {new Date(purchase.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </Card>
  );
};
