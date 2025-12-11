import { useOrganization, useUser } from '@clerk/nextjs';

interface Workspace {
  id: string;
  name: string;
  subscriptionTier: 'starter' | 'professional' | 'enterprise';
}

export function useWorkspace() {
  const { organization } = useOrganization();
  const { user } = useUser();

  // If in an organization, use organization workspace
  if (organization) {
    return {
      workspace: {
        id: organization.id,
        name: organization.name,
        subscriptionTier: (organization.publicMetadata?.subscriptionTier as Workspace['subscriptionTier']) || 'starter',
      },
      loading: false,
    };
  }

  // Otherwise, use personal workspace
  if (user) {
    return {
      workspace: {
        id: user.id,
        name: `${user.firstName || 'User'}'s Workspace`,
        subscriptionTier: (user.publicMetadata?.subscriptionTier as Workspace['subscriptionTier']) || 'starter',
      },
      loading: false,
    };
  }

  return {
    workspace: null,
    loading: true,
  };
}
