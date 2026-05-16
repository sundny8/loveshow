'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslations } from 'next-intl';
import { 
  Search, 
  Download,
  RefreshCw,
  Loader2,
  CheckCircle,
  CreditCard,
  TrendingUp,
  Clock,
  User,
  Zap,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface Transaction {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  type: string;
  description: string | null;
  relatedOrderId: string | null;
  planType: string | null;
  code: string | null;
  orderStatus: string | null;
  createdAt: string;
}

interface Stats {
  total: number;
  totalAmount: number;
  todayOrders: number;
  todayAmount: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const planLabels: Record<string, string> = {
  creator: 'Creator',
  enthusiast: 'Enthusiast',
  studio: 'Studio',
};

export default function AdminOrdersPage() {
  const t = useTranslations('admin');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, totalAmount: 0, todayOrders: 0, todayAmount: 0 });
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        search: searchQuery,
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      
      const res = await fetch(`/api/admin/orders?${params}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions);
        setStats(data.stats);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [pagination.page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPagination(prev => ({ ...prev, page: 1 }));
      fetchOrders();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t('ordersTitle')}</h1>
          <p className="text-slate-500">{t('ordersDesc')}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchOrders} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {t('refresh')}
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            {t('export')}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{t('rechargeCount')}</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{t('totalPointsIssued')}</p>
                <p className="text-2xl font-bold text-green-600">{stats.totalAmount.toLocaleString()}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Zap className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{t('statusMonitor')}</p>
                <p className="text-2xl font-bold text-primary-600">{t('statusNormal')}</p>
                <p className="text-xs text-slate-400">{t('statusRunning')}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{t('pendingPlans')}</p>
                <p className="text-2xl font-bold text-yellow-600">0</p>
                <div className="flex gap-2 mt-1">
                  <span className="text-xs text-green-600">{t('autoIssue')}</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="pt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder={t('searchOrdersPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <CreditCard className="h-12 w-12 text-slate-300 mb-4" />
              <p className="text-slate-500 mb-2">{t('noOrders')}</p>
              <p className="text-sm text-slate-400">{t('noOrdersDesc')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left p-4 text-sm font-medium text-slate-500">{t('tableOrderInfo')}</th>
                    <th className="text-left p-4 text-sm font-medium text-slate-500">{t('tableUser')}</th>
                    <th className="text-left p-4 text-sm font-medium text-slate-500">{t('tablePlan')}</th>
                    <th className="text-left p-4 text-sm font-medium text-slate-500">{t('tableAmount')}</th>
                    <th className="text-left p-4 text-sm font-medium text-slate-500">{t('tableStatus')}</th>
                    <th className="text-left p-4 text-sm font-medium text-slate-500">{t('tableCreated')}</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => {
                    const planType = tx.planType || 'creator';
                    return (
                      <tr key={tx.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-4">
                          <div>
                            <p className="font-mono text-xs text-slate-400">ID: {tx.id.slice(0, 10)}...</p>
                            {tx.code && (
                              <p className="text-sm font-mono font-bold mt-1 text-primary-600">
                                {tx.code}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                              <User className="h-4 w-4 text-slate-500" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{tx.userName || 'Unknown'}</p>
                              <p className="text-xs text-slate-500">{tx.userEmail}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-xs px-2 py-1 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 capitalize">
                            {planLabels[planType] || planType}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-green-600">+{tx.amount}</span>
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            <CheckCircle className="h-3 w-3" />
                            {t('issued')}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-slate-500">{formatDate(tx.createdAt)}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-700">
              <p className="text-sm text-slate-500">
                {t('showingUsers', { count: transactions.length, total: pagination.total, page: pagination.page, totalPages: pagination.totalPages })}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
