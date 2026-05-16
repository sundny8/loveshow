'use client';

import posthog from 'posthog-js';

// Initialize Posthog only on client side
const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';

export function initAnalytics() {
  if (typeof window === 'undefined') return;
  if (!posthogKey) return;
  
  posthog.init(posthogKey, {
    api_host: posthogHost,
    capture_pageview: false, // We'll capture manually for better control
    persistence: 'localStorage',
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function identifyUser(userId: string, properties?: Record<string, any>) {
  if (!posthogKey) return;
  posthog.identify(userId, properties);
}

export function resetUser() {
  if (!posthogKey) return;
  posthog.reset();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function trackEvent(eventName: string, properties?: Record<string, any>) {
  if (!posthogKey) return;
  posthog.capture(eventName, properties);
}

export function trackPageView(pagePath?: string) {
  if (!posthogKey) return;
  posthog.capture('$pageview', {
    $current_url: pagePath || window.location.href,
  });
}

// Pre-defined event trackers
export const analytics = {
  // User events
  signUp: (method: 'email' | 'google' | 'github') => {
    trackEvent('user_signed_up', { method });
  },
  signIn: (method: 'email' | 'google' | 'github') => {
    trackEvent('user_signed_in', { method });
  },
  signOut: () => {
    trackEvent('user_signed_out');
    resetUser();
  },

  // Subscription events
  subscriptionStarted: (plan: string, price: number) => {
    trackEvent('subscription_started', { plan, price });
  },
  subscriptionCancelled: (plan: string) => {
    trackEvent('subscription_cancelled', { plan });
  },
  subscriptionUpgraded: (fromPlan: string, toPlan: string) => {
    trackEvent('subscription_upgraded', { from_plan: fromPlan, to_plan: toPlan });
  },

  // Team/Organization events
  organizationCreated: (orgId: string) => {
    trackEvent('organization_created', { organization_id: orgId });
  },
  memberInvited: (role: string) => {
    trackEvent('member_invited', { role });
  },
  invitationAccepted: (orgId: string) => {
    trackEvent('invitation_accepted', { organization_id: orgId });
  },

  // Feature usage events
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  featureUsed: (featureName: string, properties?: Record<string, any>) => {
    trackEvent('feature_used', { feature: featureName, ...properties });
  },
  buttonClicked: (buttonName: string, location: string) => {
    trackEvent('button_clicked', { button: buttonName, location });
  },

  // Blog events
  blogPostViewed: (slug: string, category?: string) => {
    trackEvent('blog_post_viewed', { slug, category });
  },

  // Error tracking
  errorOccurred: (errorType: string, errorMessage: string) => {
    trackEvent('error_occurred', { error_type: errorType, error_message: errorMessage });
  },

  // Custom event
  track: trackEvent,
};

export default posthog;
