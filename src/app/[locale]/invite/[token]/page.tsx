'use client';

import { useState, useEffect, use } from 'react';
import { useSession } from '@/lib/auth-client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Building2, 
  Users, 
  Crown, 
  Shield,
  Eye,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  LogIn,
} from 'lucide-react';

interface InvitationData {
  invitation: {
    email: string;
    role: string;
    expiresAt: string;
  };
  organization: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
  } | null;
  invitedBy: {
    name: string;
    email: string;
  } | null;
}

export default function AcceptInvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const resolvedParams = use(params);
  const { data: session } = useSession();
  const [data, setData] = useState<InvitationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [declined, setDeclined] = useState(false);

  useEffect(() => {
    const fetchInvitation = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/invitations/${resolvedParams.token}`);
        if (res.ok) {
          const invData = await res.json();
          setData(invData);
        } else {
          const errData = await res.json();
          setError(errData.error || 'Failed to load invitation');
        }
      } catch {
        setError('Failed to load invitation');
      } finally {
        setIsLoading(false);
      }
    };
    fetchInvitation();
  }, [resolvedParams.token]);

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      const res = await fetch(`/api/invitations/${resolvedParams.token}`, {
        method: 'POST',
      });
      if (res.ok) {
        setAccepted(true);
      } else {
        const errData = await res.json();
        setError(errData.error || 'Failed to accept invitation');
      }
    } catch {
      setError('Failed to accept invitation');
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDecline = async () => {
    setIsDeclining(true);
    try {
      const res = await fetch(`/api/invitations/${resolvedParams.token}/decline`, {
        method: 'POST',
      });
      if (res.ok) {
        setDeclined(true);
      } else {
        const errData = await res.json();
        setError(errData.error || 'Failed to decline invitation');
      }
    } catch {
      setError('Failed to decline invitation');
    } finally {
      setIsDeclining(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="h-5 w-5 text-purple-600" />;
      case 'admin': return <Shield className="h-5 w-5 text-blue-600" />;
      case 'viewer': return <Eye className="h-5 w-5 text-slate-600" />;
      default: return <Users className="h-5 w-5 text-green-600" />;
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'admin': return 'Can manage team members and organization settings';
      case 'member': return 'Can access all organization features';
      case 'viewer': return 'Can view but not modify organization content';
      default: return '';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <div className="p-4 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Invalid Invitation</h2>
            <p className="text-slate-500 mb-6">{error}</p>
            <Link href="/">
              <Button variant="outline">Go to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <div className="p-4 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Welcome to {data?.organization?.name}!</h2>
            <p className="text-slate-500 mb-6">
              You have successfully joined the organization.
            </p>
            <Link href="/dashboard/organizations">
              <Button>Go to Organizations</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (declined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
              <XCircle className="h-8 w-8 text-slate-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Invitation Declined</h2>
            <p className="text-slate-500 mb-6">
              You have declined the invitation to join {data?.organization?.name}.
            </p>
            <Link href="/">
              <Button variant="outline">Go to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="py-8">
          {/* Organization Logo & Name */}
          <div className="flex flex-col items-center text-center mb-8">
            {data?.organization?.logo ? (
              <Image 
                src={data.organization.logo} 
                alt={data.organization.name} 
                width={64} 
                height={64} 
                className="rounded-xl mb-4"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center mb-4">
                <Building2 className="h-8 w-8 text-white" />
              </div>
            )}
            <p className="text-sm text-slate-500 mb-1">You have been invited to join</p>
            <h1 className="text-2xl font-bold">{data?.organization?.name}</h1>
          </div>

          {/* Invitation Details */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 mb-6 space-y-3">
            {data?.invitedBy && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Invited by</span>
                <span className="text-sm font-medium">{data.invitedBy.name}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Your role</span>
              <span className="flex items-center gap-2 text-sm font-medium capitalize">
                {getRoleIcon(data?.invitation.role || 'member')}
                {data?.invitation.role}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Expires</span>
              <span className="flex items-center gap-2 text-sm font-medium">
                <Clock className="h-4 w-4 text-slate-400" />
                {data?.invitation.expiresAt 
                  ? new Date(data.invitation.expiresAt).toLocaleDateString()
                  : 'N/A'
                }
              </span>
            </div>
          </div>

          {/* Role Description */}
          <p className="text-sm text-slate-500 text-center mb-6">
            {getRoleDescription(data?.invitation.role || 'member')}
          </p>

          {/* Action Buttons */}
          {!session ? (
            <div className="space-y-4">
              <p className="text-sm text-center text-slate-500">
                Please sign in to accept this invitation
              </p>
              <Link href={`/auth/signin?redirect=/invite/${resolvedParams.token}`} className="block">
                <Button className="w-full">
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In to Accept
                </Button>
              </Link>
              <p className="text-xs text-center text-slate-400">
                New here?{' '}
                <Link href={`/auth/signup?redirect=/invite/${resolvedParams.token}`} className="text-primary-600 hover:underline">
                  Create an account
                </Link>
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 text-sm text-center">
                  {error}
                </div>
              )}
              <Button 
                className="w-full" 
                onClick={handleAccept}
                disabled={isAccepting || isDeclining}
              >
                {isAccepting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                Accept Invitation
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleDecline}
                disabled={isAccepting || isDeclining}
              >
                {isDeclining ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Decline
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
