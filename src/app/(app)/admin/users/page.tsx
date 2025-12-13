import { Metadata } from 'next';
import { db } from '@/lib/db';
import { users, workspaces } from '@/db/schema';
import { desc, count, sql } from 'drizzle-orm';
import { 
  Users, 
  Mail, 
  Calendar,
  Building2,
  User,
  Key,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Users | Mission Control',
  description: 'Manage platform users',
};

interface UserWithClerkId {
  id: string;
  clerkUserId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  createdAt: Date | null;
}

async function getUsers(): Promise<UserWithClerkId[]> {
  try {
    const userList = await db
      .select({
        id: users.id,
        clerkUserId: users.clerkUserId,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        avatarUrl: users.avatarUrl,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(100);
    
    return userList;
  } catch {
    return [];
  }
}

async function getDuplicateStats() {
  try {
    // Find duplicate emails (potential issue indicator)
    const duplicateEmails = await db
      .select({
        email: users.email,
        count: sql<number>`count(*)::int`,
      })
      .from(users)
      .groupBy(users.email)
      .having(sql`count(*) > 1`);

    // Find duplicate clerkUserIds (shouldn't happen due to unique constraint)
    const duplicateClerkIds = await db
      .select({
        clerkUserId: users.clerkUserId,
        count: sql<number>`count(*)::int`,
      })
      .from(users)
      .groupBy(users.clerkUserId)
      .having(sql`count(*) > 1`);

    return {
      duplicateEmailCount: duplicateEmails.length,
      duplicateClerkIdCount: duplicateClerkIds.length,
      duplicateEmails: duplicateEmails.map(d => d.email),
    };
  } catch {
    return { duplicateEmailCount: 0, duplicateClerkIdCount: 0, duplicateEmails: [] };
  }
}

async function getUserStats() {
  try {
    const [totalUsers, totalWorkspaces] = await Promise.all([
      db.select({ count: count() }).from(users).then(r => r[0]?.count ?? 0),
      db.select({ count: count() }).from(workspaces).then(r => r[0]?.count ?? 0),
    ]);
    
    return { totalUsers, totalWorkspaces };
  } catch {
    return { totalUsers: 0, totalWorkspaces: 0 };
  }
}

function getInitials(firstName: string | null, lastName: string | null, email: string): string {
  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }
  if (firstName) {
    return firstName.slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

function formatDate(date: Date | null): string {
  if (!date) return 'Unknown';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
}

function truncateClerkId(clerkId: string): string {
  if (clerkId.length <= 16) return clerkId;
  return `${clerkId.slice(0, 8)}...${clerkId.slice(-6)}`;
}

export default async function UsersPage() {
  const [userList, stats, duplicateStats] = await Promise.all([
    getUsers(),
    getUserStats(),
    getDuplicateStats(),
  ]);

  // Identify users with duplicate emails for highlighting
  const duplicateEmailSet = new Set(duplicateStats.duplicateEmails);

  return (
    <TooltipProvider>
      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                Synced from Clerk
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Workspaces</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalWorkspaces}</div>
              <p className="text-xs text-muted-foreground">
                Active workspaces
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Users/Workspace</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalWorkspaces > 0 
                  ? (stats.totalUsers / stats.totalWorkspaces).toFixed(1) 
                  : '0'}
              </div>
              <p className="text-xs text-muted-foreground">
                Team size average
              </p>
            </CardContent>
          </Card>
          <Card className={duplicateStats.duplicateEmailCount > 0 ? 'border-amber-200 bg-amber-50/50' : 'border-green-200 bg-green-50/50'}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Data Health</CardTitle>
              {duplicateStats.duplicateEmailCount > 0 ? (
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {duplicateStats.duplicateEmailCount > 0 ? (
                  <span className="text-amber-600">{duplicateStats.duplicateEmailCount}</span>
                ) : (
                  <span className="text-green-600">Clean</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {duplicateStats.duplicateEmailCount > 0 
                  ? 'Duplicate emails found' 
                  : 'No duplicates detected'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Duplicate Warning Banner */}
        {duplicateStats.duplicateEmailCount > 0 && (
          <Card className="border-amber-300 bg-amber-50">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800">Duplicate Emails Detected</p>
                  <p className="text-sm text-amber-700 mt-1">
                    {duplicateStats.duplicateEmailCount} email{duplicateStats.duplicateEmailCount > 1 ? 's appear' : ' appears'} multiple times. 
                    This may indicate users signed up with multiple auth providers (email + Google).
                    Each Clerk account gets a unique ID, so this is often expected behavior.
                  </p>
                  <p className="text-xs text-amber-600 mt-2 font-mono">
                    Affected: {duplicateStats.duplicateEmails.slice(0, 3).join(', ')}
                    {duplicateStats.duplicateEmails.length > 3 && ` +${duplicateStats.duplicateEmails.length - 3} more`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Users</CardTitle>
            <CardDescription>
              All users synced from Clerk authentication. Each user has a unique Clerk ID.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {userList.length > 0 ? (
              <div className="space-y-3">
                {userList.map((user) => {
                  const isDuplicateEmail = duplicateEmailSet.has(user.email);
                  
                  return (
                    <div 
                      key={user.id} 
                      className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                        isDuplicateEmail 
                          ? 'border-amber-200 bg-amber-50/50 hover:bg-amber-50' 
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatarUrl || undefined} />
                          <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                            {getInitials(user.firstName, user.lastName, user.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">
                              {user.firstName && user.lastName 
                                ? `${user.firstName} ${user.lastName}`
                                : user.email.split('@')[0]}
                            </p>
                            {isDuplicateEmail && (
                              <Tooltip>
                                <TooltipTrigger>
                                  <Badge variant="outline" className="text-xs bg-amber-100 text-amber-700 border-amber-300">
                                    Duplicate Email
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>This email appears in multiple user accounts</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </span>
                            <Tooltip>
                              <TooltipTrigger>
                                <span className="flex items-center gap-1 font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                                  <Key className="h-3 w-3" />
                                  {truncateClerkId(user.clerkUserId)}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="font-mono text-xs">{user.clerkUserId}</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            Joined {formatDate(user.createdAt)}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          <User className="h-3 w-3 mr-1" />
                          User
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No users yet</p>
                <p className="text-sm">Users will appear here when they sign up via Clerk</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}

