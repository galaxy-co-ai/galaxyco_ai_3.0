import { Metadata } from 'next';
import { db } from '@/lib/db';
import { users, workspaces, workspaceMembers } from '@/db/schema';
import { desc, count, eq } from 'drizzle-orm';
import { 
  Users, 
  Mail, 
  Calendar,
  Building2,
  Crown,
  Shield,
  User
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Users | Mission Control',
  description: 'Manage platform users',
};

async function getUsers() {
  try {
    const userList = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        avatarUrl: users.avatarUrl,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(50);
    
    return userList;
  } catch {
    return [];
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

export default async function UsersPage() {
  const [userList, stats] = await Promise.all([
    getUsers(),
    getUserStats(),
  ]);

  return (
    <div className="p-6 space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Registered accounts
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
      </div>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Users</CardTitle>
          <CardDescription>All registered users on the platform</CardDescription>
        </CardHeader>
        <CardContent>
          {userList.length > 0 ? (
            <div className="space-y-4">
              {userList.map((user) => (
                <div 
                  key={user.id} 
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatarUrl || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                        {getInitials(user.firstName, user.lastName, user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {user.firstName && user.lastName 
                          ? `${user.firstName} ${user.lastName}`
                          : user.email.split('@')[0]}
                      </p>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {user.email}
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
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No users yet</p>
              <p className="text-sm">Users will appear here when they sign up</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

