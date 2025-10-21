import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { TransactionList } from "@/components/dashboard/TransactionList";
import { PaymentChart } from "@/components/dashboard/PaymentChart";
import { TagStats } from "@/components/dashboard/TagStats";
import { Button } from "@/components/ui/button";
import { CreditCard, TrendingUp, Users, Wallet, Coffee } from "lucide-react";
import { format, subDays } from "date-fns";
import { useEffect } from "react";

interface Purchase {
  id: string;
  user_id: string;
  total_price: number;
  timestamp: string;
  quantity: number;
}

interface User {
  id: string;
  name: string;
  balance: number;
}

const Index = () => {
  // Fetch purchases data
  const { data: purchases = [], isLoading: purchasesLoading, refetch: refetchPurchases } = useQuery<Purchase[]>({
    queryKey: ['purchases'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchases')
        .select('*')
        .order('timestamp', { ascending: false });
      
      if (error) throw error;
      return data as Purchase[];
    },
  });

  // Fetch users data
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*');
      
      if (error) throw error;
      return data as User[];
    },
  });

  // Real-time subscription for purchases
  useEffect(() => {
    const channel = supabase
      .channel('purchases-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'purchases' },
        () => refetchPurchases()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetchPurchases]);

  const isLoading = purchasesLoading || usersLoading;

  // Calculate metrics
  const totalTransactions = purchases.length;
  const totalBalance = users.reduce((sum, u) => sum + (Number(u.balance) || 0), 0);
  const activeTags = users.length;
  const avgTransaction = totalTransactions > 0 
    ? purchases.reduce((sum, p) => sum + (Number(p.total_price) || 0), 0) / totalTransactions 
    : 0;

  // Prepare chart data (last 7 days)
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = format(date, 'MMM dd');
    const dayPurchases = purchases.filter(p => 
      format(new Date(p.timestamp), 'MMM dd') === dateStr
    );
    const amount = dayPurchases.reduce((sum, p) => sum + (Number(p.total_price) || 0), 0);
    return { date: dateStr, amount };
  });

  // Tag statistics - top 5 users by spending
  const userSpending = purchases.reduce((acc, p) => {
    if (!acc[p.user_id]) {
      acc[p.user_id] = { count: 0, total: 0 };
    }
    acc[p.user_id].count++;
    acc[p.user_id].total += Number(p.total_price) || 0;
    return acc;
  }, {} as Record<string, { count: number; total: number }>);

  const totalSpent = Object.values(userSpending).reduce((sum, u) => sum + u.total, 0);

  const tagStats = Object.entries(userSpending)
    .map(([userId, stats]) => {
      const user = users.find(u => u.id === userId);
      return {
        tag: user?.name || userId,
        count: stats.count,
        totalAmount: stats.total,
        percentage: (stats.total / totalSpent) * 100 || 0,
      };
    })
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, 5);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
      
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm relative z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 animate-fade-in">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg">
                <Wallet className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Smart Payment Dashboard
                </h1>
                <p className="text-sm text-muted-foreground">Real-time RFID transaction monitoring</p>
              </div>
            </div>
            <Link to="/canteen">
              <Button size="lg" className="gap-2 bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/50 transition-all duration-300 animate-fade-in">
                <Coffee className="w-5 h-5" />
                Open Canteen
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 relative z-10">
        {/* Metrics Grid */}
        <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 animate-fade-in">
          <MetricCard
            title="Total Transactions"
            value={totalTransactions}
            icon={CreditCard}
            subtitle="All time"
          />
          <MetricCard
            title="Total Balance"
            value={`$${totalBalance.toFixed(2)}`}
            icon={TrendingUp}
            trend={{ value: 12.5, isPositive: true }}
          />
          <MetricCard
            title="Active Tags"
            value={activeTags}
            icon={Users}
            subtitle="Unique RFID tags"
          />
          <MetricCard
            title="Avg Transaction"
            value={`$${avgTransaction.toFixed(2)}`}
            icon={Wallet}
            subtitle="Per transaction"
          />
        </div>

        {/* Charts and Lists */}
        <div className="grid gap-6 lg:grid-cols-3 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="lg:col-span-2 space-y-6">
            <PaymentChart data={chartData} />
            <TransactionList />
          </div>
          <div>
            <TagStats stats={tagStats} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
