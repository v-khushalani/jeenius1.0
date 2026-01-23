import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, Shield, User, Gift, Crown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';


interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  joined_at: string;
  grade?: number;
  target_exam?: string;
  role?: 'user' | 'admin';
  is_premium?: boolean;
  subscription_end_date?: string | null;
}

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter]);

const fetchUsers = async () => {
  try {
    setLoading(true);
    
    // Fetch users with their profiles
    const { data: profilesData, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name, created_at, grade, target_exam, is_premium, subscription_end_date')
      .order('created_at', { ascending: false });

    if (profileError) throw profileError;

    // Fetch all user roles
    const { data: rolesData, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id, role');

    if (rolesError) throw rolesError;

    // Create a map of user roles
    const rolesMap = new Map(rolesData?.map(r => [r.user_id, r.role]) || []);

    const formattedUsers: UserProfile[] = (profilesData || []).map(profile => ({
      id: profile.id,
      user_id: profile.id,
      email: profile.email || 'No email',
      full_name: profile.full_name || 'No name',
      joined_at: profile.created_at,
      grade: profile.grade,
      target_exam: profile.target_exam,
      role: (rolesMap.get(profile.id) || 'user') as 'user' | 'admin',
      is_premium: profile.is_premium || false,
      subscription_end_date: profile.subscription_end_date
    }));
    
    setUsers(formattedUsers);
  } catch (error) {
    logger.error('Error fetching users:', error);
    toast({
      title: "Error",
      description: "Failed to fetch users",
      variant: "destructive"
    });
  } finally {
    setLoading(false);
  }
};

  const filterUsers = () => {
    let filtered = users;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
  };

  const updateUserRole = async (userId: string, newRole: 'user' | 'admin') => {
  try {
    // Delete existing roles for this user
    await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    // Insert new role
    const { error } = await supabase
      .from('user_roles')
      .insert({ user_id: userId, role: newRole });

    if (error) throw error;

    // Update local state
    const updatedUsers = users.map(user => 
      user.user_id === userId ? { ...user, role: newRole } : user
    );
    
    setUsers(updatedUsers);

    toast({
      title: "Success",
      description: `User role updated to ${newRole}`,
    });
  } catch (error) {
    logger.error('Error updating user role:', error);
    toast({
      title: "Error",
      description: "Failed to update user role",
      variant: "destructive"
    });
  }
};

const grantProMembership = async (userId: string, durationMonths: number = 1) => {
  try {
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + durationMonths);

    const { error } = await supabase
      .from('profiles')
      .update({ 
        is_premium: true,
        subscription_end_date: expiryDate.toISOString()
      })
      .eq('id', userId);

    if (error) throw error;

    // Update local state
    const updatedUsers = users.map(user => 
      user.user_id === userId ? { 
        ...user, 
        is_premium: true, 
        subscription_end_date: expiryDate.toISOString() 
      } : user
    );
    
    setUsers(updatedUsers);

    toast({
      title: "Success",
      description: `Pro membership granted for ${durationMonths} month(s)`,
    });
  } catch (error) {
    logger.error('Error granting pro membership:', error);
    toast({
      title: "Error",
      description: "Failed to grant pro membership",
      variant: "destructive"
    });
  }
};
  
  const getRoleIcon = (role?: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleBadgeVariant = (role?: string) => {
    switch (role) {
      case 'admin':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            Manage users and their roles. Total users: {users.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search users by email or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="user">Users</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Users Table */}
          <div className="rounded-md border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Target Exam</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.user_id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getRoleIcon(user.role)}
                          <span className="font-medium">
                            {user.full_name || 'No name'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {user.target_exam || 'Not set'}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.grade || 'Not set'}</TableCell>
                      <TableCell>
                        {new Date(user.joined_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {user.is_premium ? (
                            <Badge variant="default" className="bg-gradient-to-r from-purple-600 to-blue-600">
                              <Crown className="h-3 w-3 mr-1" />
                              Pro
                            </Badge>
                          ) : (
                            <Badge variant="outline">Free</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {user.role || 'user'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Select
                            value={user.role || 'user'}
                            onValueChange={(value) => {
                              const role: 'user' | 'admin' = value === 'admin' ? 'admin' : 'user';
                              updateUserRole(user.user_id, role);
                            }}
                          >
                            <SelectTrigger className="w-[110px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                          {!user.is_premium && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => grantProMembership(user.user_id, 1)}
                              className="whitespace-nowrap"
                            >
                              <Gift className="h-4 w-4 mr-1" />
                              Grant Pro
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No users found matching your search criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
