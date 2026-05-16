'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { 
  Search, 
  Download,
  RefreshCw,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Image as ImageIcon,
  Eye,
  RotateCcw,
  AlertCircle,
  Music,
} from 'lucide-react';

interface TaskItem {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  taskType: 'photo' | 'portrait' | 'music' | 'love-column';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  platform: string;
  promptPayload: any;
  originalImageUrl: string | null;
  musicPrompt: string | null;
  musicTitle: string | null;
  musicStyle: string | null;
  loveColumnType: string | null;
  loveColumnTypeLabel: string | null;
  loveColumnImageUrls: string[] | null;
  costPoints: number;
  aiProvider: string;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
  duration: number | null;
}

interface Stats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  processing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="h-3 w-3" />,
  processing: <Loader2 className="h-3 w-3 animate-spin" />,
  completed: <CheckCircle className="h-3 w-3" />,
  failed: <XCircle className="h-3 w-3" />,
};

const typeColors: Record<string, string> = {
  photo: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  portrait: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  music: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  'love-column': 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
};

export default function AdminTasksPage() {
  const t = useTranslations('admin');
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, processing: 0, completed: 0, failed: 0 });
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search: searchQuery,
        status: selectedStatus,
        type: selectedType,
      });
      
      const res = await fetch(`/api/admin/tasks?${params}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks);
        setStats(data.stats);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetryTask = async (taskId: string, taskType: string) => {
    try {
      const endpoint = taskType === 'music' 
        ? `/api/music/retry`
        : `/api/admin/tasks/${taskId}/retry`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId }),
      });
      if (res.ok) {
        fetchTasks();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to retry task');
      }
    } catch {
      alert('Failed to retry task');
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [pagination.page, selectedStatus, selectedType]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (pagination.page === 1) {
        fetchTasks();
      } else {
        setPagination(prev => ({ ...prev, page: 1 }));
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return '-';
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const taskTypeLabel = (type: string) => {
    const keyMap: Record<string, string> = {
      photo: 'taskTypes.photo',
      portrait: 'taskTypes.portrait',
      music: 'taskTypes.music',
      'love-column': 'taskTypes.loveColumn',
    };
    return t((keyMap[type] || 'taskTypes.photo') as any);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t('tasksTitle')}</h1>
          <p className="text-slate-500">{t('tasksDesc')}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchTasks} disabled={isLoading}>
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
      <div className="grid sm:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-slate-500">{t('total')}</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-slate-500">{t('taskStatus.pending')}</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-slate-500">{t('taskStatus.processing')}</p>
            <p className="text-2xl font-bold text-blue-600">{stats.processing}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-slate-500">{t('taskStatus.completed')}</p>
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-slate-500">{t('taskStatus.failed')}</p>
            <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
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
                placeholder={t('searchUsersPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100"
            >
              <option value="all">{t('tableType')}: {t('allStatus')}</option>
              <option value="photo">{t('taskTypes.photo')}</option>
              <option value="portrait">{t('taskTypes.portrait')}</option>
              <option value="music">{t('taskTypes.music')}</option>
              <option value="love-column">{t('taskTypes.loveColumn')}</option>
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100"
            >
              <option value="all">{t('allStatus')}</option>
              <option value="pending">{t('taskStatus.pending')}</option>
              <option value="processing">{t('taskStatus.processing')}</option>
              <option value="completed">{t('taskStatus.completed')}</option>
              <option value="failed">{t('taskStatus.failed')}</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Tasks Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <ImageIcon className="h-12 w-12 text-slate-300 mb-4" />
              <p className="text-slate-500 mb-2">{t('noTasks')}</p>
              <p className="text-sm text-slate-400">{t('noTasksDesc')}</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left p-4 text-sm font-medium text-slate-500">{t('tableTask')}</th>
                      <th className="text-left p-4 text-sm font-medium text-slate-500">{t('tableType')}</th>
                      <th className="text-left p-4 text-sm font-medium text-slate-500">{t('tableStatus')}</th>
                      <th className="text-left p-4 text-sm font-medium text-slate-500">{t('tableCost')}</th>
                      <th className="text-left p-4 text-sm font-medium text-slate-500">{t('aiProvider')}</th>
                      <th className="text-left p-4 text-sm font-medium text-slate-500">{t('tableDuration')}</th>
                      <th className="text-left p-4 text-sm font-medium text-slate-500">{t('tableCompleted')}</th>
                      <th className="text-left p-4 text-sm font-medium text-slate-500">{t('tableActions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((task) => (
                      <tr key={task.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {(task.taskType === 'photo' || task.taskType === 'portrait') && task.originalImageUrl ? (
                              <Image 
                                src={task.originalImageUrl} 
                                alt="Original" 
                                width={48} 
                                height={48} 
                                className="rounded-lg object-cover"
                              />
                            ) : task.taskType === 'music' ? (
                              <div className="w-12 h-12 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                                <Music className="h-5 w-5 text-indigo-500" />
                              </div>
                            ) : task.taskType === 'love-column' ? (
                              <div className="w-12 h-12 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                                <span className="text-lg">💕</span>
                              </div>
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                <ImageIcon className="h-5 w-5 text-slate-400" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-sm truncate max-w-[150px]">
                                {task.taskType === 'music' && task.musicTitle 
                                  ? task.musicTitle 
                                  : task.taskType === 'love-column' && task.loveColumnTypeLabel
                                  ? task.loveColumnTypeLabel
                                  : task.id.slice(0, 8) + '...'}
                              </p>
                              <p className="text-xs text-slate-500">{task.userName || 'Unknown'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${typeColors[task.taskType] || typeColors.photo}`}>
                            {task.taskType === 'music' ? <Music className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />}
                            {taskTypeLabel(task.taskType)}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full capitalize ${statusColors[task.status]}`}>
                            {statusIcons[task.status]}
                            {t(`taskStatus.${task.status}` as any)}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm font-medium">{task.costPoints} pts</span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-slate-500">{task.aiProvider || '-'}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-slate-500">
                            {task.status === 'completed' ? formatDuration(task.duration) : '-'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-slate-500">
                            {task.completedAt ? formatDate(task.completedAt) : '-'}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <button 
                              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700" 
                              title={t('viewTask')}
                              onClick={() => setSelectedTask(task)}
                            >
                              <Eye className="h-4 w-4 text-slate-500" />
                            </button>
                            {task.status === 'failed' && (
                              <button 
                                className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700" 
                                title={t('retryTask')}
                                onClick={() => handleRetryTask(task.id, task.taskType)}
                              >
                                <RotateCcw className="h-4 w-4 text-slate-500" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-500">
                  {t('showingUsers', { count: tasks.length, total: pagination.total, page: pagination.page, totalPages: pagination.totalPages })}
                </p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={pagination.page <= 1}
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  >
                    {t('previous')}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  >
                    {t('next')}
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-slate-900 p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">{t('viewTask')}</h2>
                <p className="text-sm text-slate-500">Task ID: {selectedTask.id}</p>
              </div>
              <button 
                onClick={() => setSelectedTask(null)} 
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6">
              {/* Error Banner */}
              {selectedTask.status === 'failed' && selectedTask.errorMessage && (
                <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-800 dark:text-red-200">{t('taskStatus.failed')}</p>
                      <p className="text-sm text-red-600 dark:text-red-300 mt-1">{selectedTask.errorMessage}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Photo/Portrait: Original Image */}
              {(selectedTask.taskType === 'photo' || selectedTask.taskType === 'portrait') && selectedTask.originalImageUrl && (
                <div className="mb-6">
                  <h3 className="font-medium mb-2">{taskTypeLabel(selectedTask.taskType)}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="relative group">
                      <Image 
                        src={selectedTask.originalImageUrl} 
                        alt="Original" 
                        width={200} 
                        height={200} 
                        className="rounded-lg object-cover w-full aspect-square"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Music: Details */}
              {selectedTask.taskType === 'music' && (
                <div className="mb-6 p-4 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <Music className="h-4 w-4 text-indigo-500" />
                    {t('taskTypes.music')}
                  </h3>
                  <div className="space-y-2 text-sm">
                    {selectedTask.musicTitle && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Title:</span>
                        <span className="font-medium">{selectedTask.musicTitle}</span>
                      </div>
                    )}
                    {selectedTask.musicStyle && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Style:</span>
                        <span>{selectedTask.musicStyle}</span>
                      </div>
                    )}
                    {selectedTask.musicPrompt && (
                      <div>
                        <span className="text-slate-500 block mb-1">Prompt:</span>
                        <p className="text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 p-2 rounded">{selectedTask.musicPrompt}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Love Column: Details */}
              {selectedTask.taskType === 'love-column' && (
                <div className="mb-6 p-4 rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800">
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <span>💕</span>
                    {t('taskTypes.loveColumn')} - {selectedTask.loveColumnTypeLabel}
                  </h3>
                  {selectedTask.loveColumnImageUrls && selectedTask.loveColumnImageUrls.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
                      {selectedTask.loveColumnImageUrls.map((url, idx) => (
                        <Image
                          key={idx}
                          src={url}
                          alt={`Result ${idx + 1}`}
                          width={150}
                          height={150}
                          className="rounded-lg object-cover w-full aspect-square"
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Task Details */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-2">{t('viewTask')}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">{t('tableType')}:</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${typeColors[selectedTask.taskType]}`}>
                        {taskTypeLabel(selectedTask.taskType)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">{t('tableStatus')}:</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${statusColors[selectedTask.status]}`}>
                        {statusIcons[selectedTask.status]}
                        {t(`taskStatus.${selectedTask.status}` as any)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">{t('tableCost')}:</span>
                      <span className="font-medium">{selectedTask.costPoints} pts</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">{t('aiProvider')}:</span>
                      <span>{selectedTask.aiProvider || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">{t('tableDuration')}:</span>
                      <span>{formatDuration(selectedTask.duration)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">{t('tableCreated')}:</span>
                      <span>{formatDate(selectedTask.createdAt)}</span>
                    </div>
                    {selectedTask.completedAt && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">{t('tableCompleted')}:</span>
                        <span>{formatDate(selectedTask.completedAt)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Prompt Payload for Photo/Portrait Tasks */}
                {(selectedTask.taskType === 'photo' || selectedTask.taskType === 'portrait') && selectedTask.promptPayload && (
                  <div>
                    <h3 className="font-medium mb-2">{t('tablePrompt')}</h3>
                    <pre className="text-xs bg-slate-100 dark:bg-slate-800 p-3 rounded-lg overflow-x-auto max-h-48">
                      {typeof selectedTask.promptPayload === 'string'
                        ? selectedTask.promptPayload
                        : JSON.stringify(selectedTask.promptPayload, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                <h3 className="font-medium mb-2">{t('tableUser')}</h3>
                <div className="text-sm">
                  <p><span className="text-slate-500">{t('name')}:</span> {selectedTask.userName || 'Unknown'}</p>
                  <p><span className="text-slate-500">{t('email')}:</span> {selectedTask.userEmail || '-'}</p>
                  <p><span className="text-slate-500">User ID:</span> {selectedTask.userId}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex justify-end gap-3">
                {selectedTask.status === 'failed' && (
                  <Button onClick={() => { handleRetryTask(selectedTask.id, selectedTask.taskType); setSelectedTask(null); }}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    {t('retryTask')}
                  </Button>
                )}
                <Button variant="outline" onClick={() => setSelectedTask(null)}>
                  {t('cancel')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
