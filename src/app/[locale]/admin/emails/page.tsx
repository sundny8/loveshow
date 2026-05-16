'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Mail,
  Plus,
  Edit,
  Eye,
  Copy,
  Send,
  CheckCircle,
  FileText,
  UserPlus,
  Key,
  CreditCard,
  Bell,
  Shield,
  X,
  Save,
  Loader2,
  Code,
} from 'lucide-react';

interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  subject: string;
  body: string;
  icon: typeof Mail;
  category: string;
  lastUpdated: string;
  status: 'active' | 'draft';
  variables: string[];
}

// Email templates configuration
const initialTemplates: EmailTemplate[] = [
  {
    id: 'welcome',
    name: 'Welcome Email',
    description: 'Sent when a new user signs up',
    subject: 'Welcome to StartFast Pro, {{name}}!',
    body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #3B82F6;">Welcome to StartFast Pro!</h1>
  <p>Hi {{name}},</p>
  <p>Thank you for signing up. We're excited to have you on board!</p>
  <p>Get started by exploring your dashboard:</p>
  <a href="{{dashboardUrl}}" style="display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">Go to Dashboard</a>
  <p>If you have any questions, feel free to reach out to our support team.</p>
  <p>Best regards,<br>The StartFast Pro Team</p>
</div>`,
    icon: UserPlus,
    category: 'Onboarding',
    lastUpdated: '2024-03-10',
    status: 'active',
    variables: ['name', 'email', 'dashboardUrl'],
  },
  {
    id: 'verify-email',
    name: 'Email Verification',
    description: 'Sent to verify email address',
    subject: 'Verify your email address',
    body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #3B82F6;">Verify Your Email</h1>
  <p>Hi {{name}},</p>
  <p>Please click the button below to verify your email address:</p>
  <a href="{{verificationUrl}}" style="display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">Verify Email</a>
  <p>This link will expire in 24 hours.</p>
  <p>If you didn't create an account, you can safely ignore this email.</p>
</div>`,
    icon: CheckCircle,
    category: 'Authentication',
    lastUpdated: '2024-03-08',
    status: 'active',
    variables: ['name', 'verificationUrl'],
  },
  {
    id: 'reset-password',
    name: 'Password Reset',
    description: 'Sent when user requests password reset',
    subject: 'Reset your password',
    body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #3B82F6;">Reset Your Password</h1>
  <p>Hi {{name}},</p>
  <p>We received a request to reset your password. Click the button below to create a new password:</p>
  <a href="{{resetUrl}}" style="display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">Reset Password</a>
  <p>This link will expire in 1 hour.</p>
  <p>If you didn't request this, please ignore this email.</p>
</div>`,
    icon: Key,
    category: 'Authentication',
    lastUpdated: '2024-03-05',
    status: 'active',
    variables: ['name', 'resetUrl'],
  },
  {
    id: 'subscription-created',
    name: 'Subscription Confirmation',
    description: 'Sent when user subscribes to a plan',
    subject: 'Your subscription is confirmed',
    body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #10B981;">Subscription Confirmed!</h1>
  <p>Hi {{name}},</p>
  <p>Thank you for subscribing to the <strong>{{planName}}</strong> plan!</p>
  <div style="background: #F3F4F6; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p style="margin: 0;"><strong>Plan:</strong> {{planName}}</p>
    <p style="margin: 8px 0 0;"><strong>Amount:</strong> {{amount}}/month</p>
  </div>
  <p>You now have access to all premium features.</p>
  <a href="{{dashboardUrl}}" style="display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">Go to Dashboard</a>
</div>`,
    icon: CreditCard,
    category: 'Billing',
    lastUpdated: '2024-03-01',
    status: 'active',
    variables: ['name', 'planName', 'amount', 'dashboardUrl'],
  },
  {
    id: 'subscription-canceled',
    name: 'Subscription Canceled',
    description: 'Sent when subscription is canceled',
    subject: 'Your subscription has been canceled',
    body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #EF4444;">Subscription Canceled</h1>
  <p>Hi {{name}},</p>
  <p>Your subscription has been canceled. You will continue to have access until {{endDate}}.</p>
  <p>We're sorry to see you go! If you change your mind, you can resubscribe anytime.</p>
  <a href="{{pricingUrl}}" style="display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">View Plans</a>
</div>`,
    icon: CreditCard,
    category: 'Billing',
    lastUpdated: '2024-02-28',
    status: 'active',
    variables: ['name', 'endDate', 'pricingUrl'],
  },
  {
    id: 'invoice',
    name: 'Invoice',
    description: 'Sent with invoice after payment',
    subject: 'Your invoice from StartFast Pro',
    body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #3B82F6;">Invoice</h1>
  <p>Hi {{name}},</p>
  <p>Thank you for your payment. Here are the details:</p>
  <div style="background: #F3F4F6; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p style="margin: 0;"><strong>Invoice #:</strong> {{invoiceNumber}}</p>
    <p style="margin: 8px 0 0;"><strong>Amount:</strong> {{amount}}</p>
    <p style="margin: 8px 0 0;"><strong>Date:</strong> {{date}}</p>
  </div>
  <a href="{{invoiceUrl}}" style="display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">Download Invoice</a>
</div>`,
    icon: FileText,
    category: 'Billing',
    lastUpdated: '2024-02-25',
    status: 'active',
    variables: ['name', 'invoiceNumber', 'amount', 'date', 'invoiceUrl'],
  },
  {
    id: 'team-invite',
    name: 'Team Invitation',
    description: 'Sent when inviting team members',
    subject: "You've been invited to join {{teamName}}",
    body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #3B82F6;">Team Invitation</h1>
  <p>Hi,</p>
  <p><strong>{{inviterName}}</strong> has invited you to join <strong>{{teamName}}</strong> on StartFast Pro.</p>
  <a href="{{inviteUrl}}" style="display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">Accept Invitation</a>
  <p>This invitation will expire in 7 days.</p>
</div>`,
    icon: UserPlus,
    category: 'Team',
    lastUpdated: '2024-02-20',
    status: 'active',
    variables: ['inviterName', 'teamName', 'inviteUrl'],
  },
  {
    id: 'security-alert',
    name: 'Security Alert',
    description: 'Sent for security-related events',
    subject: 'Security alert for your account',
    body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #EF4444;">Security Alert</h1>
  <p>Hi {{name}},</p>
  <p>We detected {{alertType}} on your account:</p>
  <div style="background: #FEF2F2; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #EF4444;">
    <p style="margin: 0;"><strong>Event:</strong> {{alertType}}</p>
    <p style="margin: 8px 0 0;"><strong>Time:</strong> {{timestamp}}</p>
    <p style="margin: 8px 0 0;"><strong>Location:</strong> {{location}}</p>
  </div>
  <p>If this wasn't you, please secure your account immediately.</p>
  <a href="{{securityUrl}}" style="display: inline-block; background: #EF4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">Secure Account</a>
</div>`,
    icon: Shield,
    category: 'Security',
    lastUpdated: '2024-02-15',
    status: 'active',
    variables: ['name', 'alertType', 'timestamp', 'location', 'securityUrl'],
  },
  {
    id: 'notification',
    name: 'Notification',
    description: 'General notification emails',
    subject: 'New notification from StartFast Pro',
    body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #3B82F6;">{{title}}</h1>
  <p>Hi {{name}},</p>
  <p>{{message}}</p>
  <a href="{{actionUrl}}" style="display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">{{actionText}}</a>
</div>`,
    icon: Bell,
    category: 'Notifications',
    lastUpdated: '2024-02-10',
    status: 'draft',
    variables: ['name', 'title', 'message', 'actionUrl', 'actionText'],
  },
];

const categories = ['All', 'Onboarding', 'Authentication', 'Billing', 'Team', 'Security', 'Notifications'];

export default function AdminEmailsPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>(initialTemplates);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showCode, setShowCode] = useState(false);

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          template.subject.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Email Templates</h1>
          <p className="text-slate-500">Manage transactional email templates</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-slate-500">Total Templates</p>
            <p className="text-2xl font-bold">{templates.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-slate-500">Active</p>
            <p className="text-2xl font-bold text-green-600">
              {templates.filter(t => t.status === 'active').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-slate-500">Draft</p>
            <p className="text-2xl font-bold text-yellow-600">
              {templates.filter(t => t.status === 'draft').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-slate-500">Categories</p>
            <p className="text-2xl font-bold">{categories.length - 1}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
                  <template.icon className="h-5 w-5 text-primary-600" />
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  template.status === 'active'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                }`}>
                  {template.status}
                </span>
              </div>
              
              <h3 className="font-semibold mb-1">{template.name}</h3>
              <p className="text-sm text-slate-500 mb-3">{template.description}</p>
              
              <div className="p-2 rounded bg-slate-50 dark:bg-slate-800 mb-4">
                <p className="text-xs text-slate-500">Subject:</p>
                <p className="text-sm font-medium truncate">{template.subject}</p>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Updated {template.lastUpdated}
                </span>
                <div className="flex gap-1">
                  <button 
                    className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700" 
                    title="Preview"
                    onClick={() => setPreviewTemplate(template)}
                  >
                    <Eye className="h-4 w-4 text-slate-500" />
                  </button>
                  <button 
                    className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700" 
                    title="Edit"
                    onClick={() => setEditingTemplate(template)}
                  >
                    <Edit className="h-4 w-4 text-slate-500" />
                  </button>
                  <button className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700" title="Duplicate">
                    <Copy className="h-4 w-4 text-slate-500" />
                  </button>
                  <button className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700" title="Send Test">
                    <Send className="h-4 w-4 text-slate-500" />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Email Provider Info */}
      <Card className="mt-6">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Email Provider: Resend</h3>
              <p className="text-sm text-slate-500 mb-3">
                Emails are sent using Resend. Make sure your API key is configured in the environment variables.
              </p>
              <div className="flex gap-4 text-sm">
                <div>
                  <span className="text-slate-500">API Key:</span>
                  <span className="ml-2 font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                    RESEND_API_KEY
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">From:</span>
                  <span className="ml-2 font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                    EMAIL_FROM
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      {editingTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold">Edit Template: {editingTemplate.name}</h2>
              <button 
                onClick={() => setEditingTemplate(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Template Name</label>
                  <Input
                    value={editingTemplate.name}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <select
                    value={editingTemplate.status}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, status: e.target.value as 'active' | 'draft' })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <Input
                  value={editingTemplate.description}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Subject Line</label>
                <Input
                  value={editingTemplate.subject}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Email Body (HTML)</label>
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
                    value={editingTemplate.body}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, body: e.target.value })}
                    className="w-full h-64 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-sm"
                  />
                ) : (
                  <div 
                    className="w-full h-64 p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white overflow-auto"
                    dangerouslySetInnerHTML={{ __html: editingTemplate.body }}
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Available Variables</label>
                <div className="flex flex-wrap gap-2">
                  {editingTemplate.variables.map(v => (
                    <code key={v} className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs">
                      {`{{${v}}}`}
                    </code>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-200 dark:border-slate-700">
              <Button variant="outline" onClick={() => setEditingTemplate(null)}>
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  setIsSaving(true);
                  await new Promise(r => setTimeout(r, 500));
                  setTemplates(templates.map(t => 
                    t.id === editingTemplate.id 
                      ? { ...editingTemplate, lastUpdated: new Date().toISOString().split('T')[0] }
                      : t
                  ));
                  setIsSaving(false);
                  setEditingTemplate(null);
                }}
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold">Preview: {previewTemplate.name}</h2>
              <button 
                onClick={() => setPreviewTemplate(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
              <p className="text-sm"><strong>Subject:</strong> {previewTemplate.subject}</p>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-white">
              <div dangerouslySetInnerHTML={{ __html: previewTemplate.body }} />
            </div>
            <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-200 dark:border-slate-700">
              <Button variant="outline" onClick={() => setPreviewTemplate(null)}>
                Close
              </Button>
              <Button onClick={() => {
                setPreviewTemplate(null);
                setEditingTemplate(previewTemplate);
              }}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Template
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
