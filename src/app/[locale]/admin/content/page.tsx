'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { 
  Search, 
  Plus,
  RefreshCw,
  Loader2,
  FileText,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  Globe,
  ExternalLink,
  Database,
  X,
  Save,
  Code,
} from 'lucide-react';
import Link from 'next/link';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content?: string;
  coverImage: string | null;
  published: boolean;
  publishedAt: string | null;
  locale: string;
  category: string | null;
  tags: string[] | null;
  createdAt: string;
  updatedAt: string;
  authorName: string | null;
  authorEmail: string | null;
}

interface Stats {
  total: number;
  published: number;
  draft: number;
}

export default function AdminContentPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, published: 0, draft: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isSeeding, setIsSeeding] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [previewPost, setPreviewPost] = useState<BlogPost | null>(null);
  const [deletePost, setDeletePost] = useState<BlogPost | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newPost, setNewPost] = useState<Partial<BlogPost> | null>(null);

  const emptyPost: Partial<BlogPost> = {
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    coverImage: '',
    locale: 'en',
    category: '',
    tags: [],
    published: false,
  };

  const handleCreate = async () => {
    if (!newPost) return;
    if (!newPost.title || !newPost.slug) {
      alert('Title and Slug are required');
      return;
    }
    setIsCreating(true);
    try {
      const res = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPost),
      });
      if (res.ok) {
        setNewPost(null);
        fetchPosts();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to create post');
      }
    } catch {
      alert('Failed to create post');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEdit = async (post: BlogPost) => {
    // Fetch full post content
    try {
      const res = await fetch(`/api/admin/content/${post.id}`);
      if (res.ok) {
        const data = await res.json();
        setEditingPost(data.post);
      } else {
        setEditingPost(post);
      }
    } catch {
      setEditingPost(post);
    }
  };

  const handlePreview = async (post: BlogPost) => {
    try {
      const res = await fetch(`/api/admin/content/${post.id}`);
      if (res.ok) {
        const data = await res.json();
        setPreviewPost(data.post);
      } else {
        setPreviewPost(post);
      }
    } catch {
      setPreviewPost(post);
    }
  };

  const handleSave = async () => {
    if (!editingPost) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/content/${editingPost.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingPost),
      });
      if (res.ok) {
        setEditingPost(null);
        fetchPosts();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to save');
      }
    } catch {
      alert('Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletePost) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/content/${deletePost.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setDeletePost(null);
        fetchPosts();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to delete');
      }
    } catch {
      alert('Failed to delete');
    } finally {
      setIsDeleting(false);
    }
  };

  const seedMockData = async () => {
    setIsSeeding(true);
    try {
      const res = await fetch('/api/admin/content/seed', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        alert(data.message);
        fetchPosts();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to seed data');
      }
    } catch (error) {
      console.error('Failed to seed data:', error);
      alert('Failed to seed data');
    } finally {
      setIsSeeding(false);
    }
  };

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        search: searchQuery,
        status: selectedStatus,
      });
      
      const res = await fetch(`/api/admin/content?${params}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatus]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPosts();
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Content</h1>
          <p className="text-slate-500">Manage blog posts and articles</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={seedMockData} disabled={isSeeding}>
            {isSeeding ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Database className="h-4 w-4 mr-2" />
            )}
            Seed Mock Data
          </Button>
          <Button variant="outline" onClick={fetchPosts} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setNewPost(emptyPost)}>
            <Plus className="h-4 w-4 mr-2" />
            New Post
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-slate-500">Total Posts</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-slate-500">Published</p>
            <p className="text-2xl font-bold text-green-600">{stats.published}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-slate-500">Drafts</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.draft}</p>
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
                placeholder="Search posts by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Posts Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-slate-300 mb-4" />
              <p className="text-slate-500 mb-2">No posts found</p>
              <p className="text-sm text-slate-400 mb-4">Create your first blog post to get started</p>
              <Button onClick={() => setNewPost(emptyPost)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Post
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left p-4 text-sm font-medium text-slate-500">Post</th>
                    <th className="text-left p-4 text-sm font-medium text-slate-500">Author</th>
                    <th className="text-left p-4 text-sm font-medium text-slate-500">Status</th>
                    <th className="text-left p-4 text-sm font-medium text-slate-500">Category</th>
                    <th className="text-left p-4 text-sm font-medium text-slate-500">Language</th>
                    <th className="text-left p-4 text-sm font-medium text-slate-500">Updated</th>
                    <th className="text-left p-4 text-sm font-medium text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((post) => (
                    <tr key={post.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {post.coverImage ? (
                            <Image 
                              src={post.coverImage} 
                              alt={post.title}
                              width={48}
                              height={48}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                              <FileText className="h-6 w-6 text-slate-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium line-clamp-1">{post.title}</p>
                            <p className="text-sm text-slate-500 line-clamp-1">/blog/{post.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm">{post.authorName || 'Unknown'}</span>
                      </td>
                      <td className="p-4">
                        {post.published ? (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            <CheckCircle className="h-3 w-3" />
                            Published
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                            <Clock className="h-3 w-3" />
                            Draft
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-slate-500">{post.category || '-'}</span>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800">
                          <Globe className="h-3 w-3" />
                          {post.locale.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-slate-500">{formatDate(post.updatedAt)}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {post.published && (
                            <Link href={`/blog/${post.slug}`} target="_blank">
                              <button className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700" title="View Live">
                                <ExternalLink className="h-4 w-4 text-slate-500" />
                              </button>
                            </Link>
                          )}
                          <button 
                            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700" 
                            title="Preview"
                            onClick={() => handlePreview(post)}
                          >
                            <Eye className="h-4 w-4 text-slate-500" />
                          </button>
                          <button 
                            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700" 
                            title="Edit"
                            onClick={() => handleEdit(post)}
                          >
                            <Edit className="h-4 w-4 text-slate-500" />
                          </button>
                          <button 
                            className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20" 
                            title="Delete"
                            onClick={() => setDeletePost(post)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      {editingPost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold">Edit Post</h2>
              <button 
                onClick={() => setEditingPost(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Title</label>
                  <Input
                    value={editingPost.title}
                    onChange={(e) => setEditingPost({ ...editingPost, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Slug</label>
                  <Input
                    value={editingPost.slug}
                    onChange={(e) => setEditingPost({ ...editingPost, slug: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <Input
                    value={editingPost.category || ''}
                    onChange={(e) => setEditingPost({ ...editingPost, category: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Locale</label>
                  <select
                    value={editingPost.locale}
                    onChange={(e) => setEditingPost({ ...editingPost, locale: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="en">English</option>
                    <option value="zh">中文</option>
                    <option value="ja">日本語</option>
                    <option value="ko">한국어</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <select
                    value={editingPost.published ? 'published' : 'draft'}
                    onChange={(e) => setEditingPost({ ...editingPost, published: e.target.value === 'published' })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Excerpt</label>
                <textarea
                  value={editingPost.excerpt || ''}
                  onChange={(e) => setEditingPost({ ...editingPost, excerpt: e.target.value })}
                  className="w-full h-20 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Cover Image URL</label>
                <Input
                  value={editingPost.coverImage || ''}
                  onChange={(e) => setEditingPost({ ...editingPost, coverImage: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Content (Markdown)</label>
                  <button
                    onClick={() => setShowCode(!showCode)}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${showCode ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-600'}`}
                  >
                    <Code className="h-3 w-3" />
                    {showCode ? 'Preview' : 'Code'}
                  </button>
                </div>
                {showCode ? (
                  <textarea
                    value={editingPost.content || ''}
                    onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })}
                    className="w-full h-64 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-sm text-slate-900 dark:text-slate-100"
                  />
                ) : (
                  <div 
                    className="w-full h-64 p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-auto"
                  >
                    <div className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200 leading-relaxed">{editingPost.content || 'No content'}</div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-200 dark:border-slate-700">
              <Button variant="outline" onClick={() => setEditingPost(null)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewPost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold">Preview: {previewPost.title}</h2>
              <button 
                onClick={() => setPreviewPost(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              {/* Cover Image */}
              {previewPost.coverImage && (
                <div className="relative h-48 bg-slate-100">
                  <Image
                    src={previewPost.coverImage}
                    alt={previewPost.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  {previewPost.category && (
                    <span className="text-xs px-2 py-1 rounded-full bg-primary-100 text-primary-700">{previewPost.category}</span>
                  )}
                  <span className={`text-xs px-2 py-1 rounded-full ${previewPost.published ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {previewPost.published ? 'Published' : 'Draft'}
                  </span>
                </div>
                <h1 className="text-2xl font-bold mb-2">{previewPost.title}</h1>
                {previewPost.excerpt && (
                  <p className="text-slate-600 dark:text-slate-300 mb-4">{previewPost.excerpt}</p>
                )}
                <div className="text-sm text-slate-500 mb-6">
                  By {previewPost.authorName || 'Unknown'} • {formatDate(previewPost.updatedAt)}
                </div>
                <hr className="my-4" />
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 p-4 rounded-lg leading-relaxed">{previewPost.content || 'No content'}</div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-200 dark:border-slate-700">
              <Button variant="outline" onClick={() => setPreviewPost(null)}>
                Close
              </Button>
              <Button onClick={() => { setPreviewPost(null); handleEdit(previewPost); }}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Post
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletePost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Delete Post</h2>
                <p className="text-sm text-slate-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              Are you sure you want to delete <strong>&quot;{deletePost.title}&quot;</strong>?
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button variant="outline" onClick={() => setDeletePost(null)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* New Post Modal */}
      {newPost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold">Create New Post</h2>
              <button 
                onClick={() => setNewPost(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Title <span className="text-red-500">*</span></label>
                  <Input
                    value={newPost.title || ''}
                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                    placeholder="Enter post title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Slug <span className="text-red-500">*</span></label>
                  <Input
                    value={newPost.slug || ''}
                    onChange={(e) => setNewPost({ ...newPost, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') })}
                    placeholder="post-url-slug"
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <Input
                    value={newPost.category || ''}
                    onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                    placeholder="e.g. Tutorial"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Locale</label>
                  <select
                    value={newPost.locale || 'en'}
                    onChange={(e) => setNewPost({ ...newPost, locale: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="en">English</option>
                    <option value="zh">中文</option>
                    <option value="ja">日本語</option>
                    <option value="ko">한국어</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <select
                    value={newPost.published ? 'published' : 'draft'}
                    onChange={(e) => setNewPost({ ...newPost, published: e.target.value === 'published' })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Excerpt</label>
                <textarea
                  value={newPost.excerpt || ''}
                  onChange={(e) => setNewPost({ ...newPost, excerpt: e.target.value })}
                  className="w-full h-20 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  placeholder="Brief description of the post"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Cover Image URL</label>
                <Input
                  value={newPost.coverImage || ''}
                  onChange={(e) => setNewPost({ ...newPost, coverImage: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Content (Markdown)</label>
                <textarea
                  value={newPost.content || ''}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  className="w-full h-64 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-sm text-slate-900 dark:text-slate-100"
                  placeholder="Write your post content in Markdown..."
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-200 dark:border-slate-700">
              <Button variant="outline" onClick={() => setNewPost(null)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={isCreating}>
                {isCreating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                Create Post
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
