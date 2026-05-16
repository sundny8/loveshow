'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslations } from 'next-intl';
import { 
  Search, 
  RefreshCw,
  Loader2,
  TrendingDown,
  Calendar,
  Zap,
  Image as ImageIcon,
  Music,
  ChevronLeft,
  ChevronRight,
  Eye,
} from 'lucide-react';

interface UsageRecord {
  id: string;
  userId: string;
  amount: number;
  type: string;
  description: string | null;
  relatedTaskId: string | null;
  createdAt: string | null;
  userName: string | null;
  userEmail: string | null;
  taskType: string | null;
  platform: string | null;
  promptPayload: any;
  costPoints: number | null;
  taskStatus: string | null;
  taskCreatedAt: string | null;
  musicPrompt: string | null;
  musicTitle: string | null;
  musicStyle: string | null;
  generatedCount: number;
}

interface Stats {
  totalUsage: number;
  totalPointsUsed: number;
  todayPointsUsed: number;
  todayUsage: number;
  averageCostPerTask: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const statusColors: Record<string, string> = {
  COMPLETED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  SUCCESS: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  PROCESSING: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  GENERATING: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  FAILED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function AdminPointUsagePage() {
  const t = useTranslations('admin');
  const [usageRecords, setUsageRecords] = useState<UsageRecord[]>([]);
  const [stats, setStats] = useState<Stats>({ 
    totalUsage: 0, 
    totalPointsUsed: 0, 
    todayPointsUsed: 0,
    todayUsage: 0,
    averageCostPerTask: 0,
  });
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  
  const [selectedRecord, setSelectedRecord] = useState<UsageRecord | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const fetchUsageRecords = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        search: searchQuery,
        type: selectedType,
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      
      const res = await fetch(`/api/admin/point-usage?${params}`);
      if (res.ok) {
        const data = await res.json();
        setUsageRecords(data.usageRecords);
        setStats(data.stats);
        setPagination(prev => ({ ...prev, total: data.pagination.total, totalPages: data.pagination.totalPages }));
      }
    } catch (error) {
      console.error('Failed to fetch usage records:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsageRecords();
  }, [selectedType, pagination.page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPagination(prev => ({ ...prev, page: 1 }));
      fetchUsageRecords();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const parsePrompt = (payload: any) => {
    if (!payload) return { prompt: '-', quantity: 1 };
    return {
      prompt: payload.prompt || payload.raw || '-',
      quantity: payload.quantity || 1,
    };
  };

  const taskTypeLabel = (type: string | null) => {
    if (type === 'music') return t('taskTypes.music') as string;
    if (type === 'photo') return t('taskTypes.photo') as string;
    return type || '-';
  };

  const taskStatusLabel = (status: string | null) => {
    if (!status) return '-';
    const map: Record<string, string> = {
      COMPLETED: t('taskStatus.completed'),
      SUCCESS: t('taskStatus.completed'),
      PROCESSING: t('taskStatus.processing'),
      GENERATING: t('taskStatus.processing'),
      PENDING: t('taskStatus.pending'),
      FAILED: t('taskStatus.failed'),
    };
    return map[status] || status;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t('pointsTitle')}</h1>
          <p className="text-slate-500">{t('pointsDesc')}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchUsageRecords} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {t('refresh')}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{t('totalDeductions')}</p>
                <p className="text-2xl font-bold">{stats.totalUsage}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Zap className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{t('totalPointsUsed')}</p>
                <p className="text-2xl font-bold text-red-600">{stats.totalPointsUsed}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{t('todayUsed')}</p>
                <p className="text-2xl font-bold text-orange-600">{stats.todayPointsUsed}</p>
                <p className="text-xs text-slate-400">{t('todayGenerations', { count: stats.todayUsage })}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{t('avgCost')}</p>
                <p className="text-2xl font-bold text-purple-600">{stats.averageCostPerTask.toFixed(1)}</p>
                <p className="text-xs text-slate-400">{t('avgCostUnit')}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <ImageIcon className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder={t('searchPointsPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100"
            >
              <option value="all">{t('tableType')}: {t('allStatus')}</option>
              <option value="photo">{t('taskTypes.photo')}</option>
              <option value="music">{t('taskTypes.music')}</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Usage Records Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          ) : usageRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Zap className="h-12 w-12 text-slate-300 mb-4" />
              <p className="text-slate-500 mb-2">{t('noRecords')}</p>
              <p className="text-sm text-slate-400">{t('noRecordsDesc')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left p-4 text-sm font-medium text-slate-500">{t('tableTime')}</th>
                    <th className="text-left p-4 text-sm font-medium text-slate-500">{t('tableUser')}</th>
                    <th className="text-left p-4 text-sm font-medium text-slate-500">{t('tableType')}</th>
                    <th className="text-left p-4 text-sm font-medium text-slate-500">{t('tablePrompt')}</th>
                    <th className="text-left p-4 text-sm font-medium text-slate-500">{t('tableCost')}</th>
                    <th className="text-left p-4 text-sm font-medium text-slate-500">{t('tableStatus')}</th>
                    <th className="text-left p-4 text-sm font-medium text-slate-500">{t('tableActions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {usageRecords.map((record) => {
                    const promptText = record.taskType === 'music'
                      ? (record.musicTitle || record.musicPrompt || '-')
                      : parsePrompt(record.promptPayload).prompt;
                    return (
                      <tr key={record.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-4">
                          <div className="text-sm">
                            <p>{formatDate(record.createdAt)}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-100 to-secondary-100 dark:from-primary-900/30 dark:to-secondary-900/30 flex items-center justify-center text-xs font-semibold text-primary-600">
                              {record.userName?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{record.userName || 'Unknown'}</p>
                              <p className="text-xs text-slate-500">{record.userEmail}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                            record.taskType === 'music' 
                              ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                              : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                          }`}>
                            {record.taskType === 'music' ? <Music className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />}
                            {taskTypeLabel(record.taskType)}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-slate-600 max-w-[200px] truncate block">
                            {promptText.length > 30 ? promptText.slice(0, 30) + '...' : promptText}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="font-semibold text-red-600">
                            -{Math.abs(record.amount)}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`text-xs px-2 py-1 rounded-full ${statusColors[record.taskStatus || ''] || 'bg-slate-100 text-slate-700'}`}>
                            {taskStatusLabel(record.taskStatus)}
                          </span>
                        </td>
                        <td className="p-4">
                          <button 
                            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700" 
                            title={t('viewTask')}
                            onClick={() => { setSelectedRecord(record); setShowDetailModal(true); }}
                          >
                            <Eye className="h-4 w-4 text-slate-500" />
                          </button>
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
                {t('showingUsers', { count: usageRecords.length, total: pagination.total, page: pagination.page, totalPages: pagination.totalPages })}
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

      {/* Detail Modal */}
      {showDetailModal && selectedRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{t('pointDetail')}</h2>
              <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">{t('taskId')}</p>
                  <p className="font-mono text-sm">{selectedRecord.relatedTaskId || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">{t('tableUser')}</p>
                  <p className="text-sm">{selectedRecord.userName} ({selectedRecord.userEmail})</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">{t('deductionTime')}</p>
                  <p className="text-sm">{formatDate(selectedRecord.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">{t('actualCost')}</p>
                  <p className="text-lg font-bold text-red-600">-{Math.abs(selectedRecord.amount)}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-bold mb-3">{t('taskDetail')}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">{t('tableType')}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      selectedRecord.taskType === 'music'
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {taskTypeLabel(selectedRecord.taskType)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">{t('tableStatus')}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${statusColors[selectedRecord.taskStatus || ''] || 'bg-slate-100'}`}>
                      {taskStatusLabel(selectedRecord.taskStatus)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">{t('tableCost')}</p>
                    <p className="text-sm font-medium">{selectedRecord.costPoints ?? Math.abs(selectedRecord.amount)} {t('avgCostUnit')?.split('/')[0] || 'pts'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">{t('generatedImages')}</p>
                    <p className="text-sm font-medium text-green-600">{selectedRecord.generatedCount}</p>
                  </div>
                </div>
              </div>

              {/* Prompt / Details */}
              <div className="border-t pt-4">
                <h3 className="font-bold mb-3">{t('tablePrompt')}</h3>
                <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg">
                  {selectedRecord.taskType === 'music' ? (
                    <div className="space-y-2">
                      {selectedRecord.musicTitle && (
                        <p><span className="text-sm text-slate-500">Title: </span>{selectedRecord.musicTitle}</p>
                      )}
                      {selectedRecord.musicStyle && (
                        <p><span className="text-sm text-slate-500">Style: </span>{selectedRecord.musicStyle}</p>
                      )}
                      <p className="text-sm">{selectedRecord.musicPrompt || '-'}</p>
                    </div>
                  ) : (
                    <p className="text-sm font-mono">
                      {parsePrompt(selectedRecord.promptPayload).prompt}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <Button variant="outline" onClick={() => setShowDetailModal(false)}>
                {t('close')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
