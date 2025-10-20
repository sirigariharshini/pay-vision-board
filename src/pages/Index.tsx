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

interface RfidScan {
  id: number;
  timestamp: string;
  balance: number;
  rfid_tag: string;
}

const Index = () => {
  const { data: transactions = [], isLoading } = useQuery<RfidScan[]>({
    queryKey: ['rfid-scans'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('rfid scans')
        .select('*')
        .order('timestamp', { ascending: false });
      
      if (error) throw error;
      return data as RfidScan[];
    },
  });

  // Calculate metrics
  const totalTransactions = transactions.length;
  const totalBalance = transactions.reduce((sum, t) => sum + (Number(t.balance) || 0), 0);
  const uniqueTags = new Set(transactions.map(t => t.rfid_tag)).size;
  const avgTransaction = totalTransactions > 0 ? totalBalance / totalTransactions : 0;

  // Prepare chart data (last 7 days)
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = format(date, 'MMM dd');
    const dayTransactions = transactions.filter(t => 
      format(new Date(t.timestamp), 'MMM dd') === dateStr
    );
    const amount = dayTransactions.reduce((sum, t) => sum + (Number(t.balance) || 0), 0);
    return { date: dateStr, amount };
  });

  // Tag statistics
  const tagStats = Object.entries(
    transactions.reduce((acc, t) => {
      if (!acc[t.rfid_tag]) {
        acc[t.rfid_tag] = { count: 0, total: 0 };
      }
      acc[t.rfid_tag].count++;
      acc[t.rfid_tag].total += Number(t.balance) || 0;
      return acc;
    }, {} as Record<string, { count: number; total: number }>)
  )
    .map(([tag, stats]) => ({
      tag,
      count: stats.count,
      totalAmount: stats.total,
      percentage: (stats.total / totalBalance) * 100 || 0,
    }))
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
            value={uniqueTags}
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
