import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Search, Shield, User, Gift, Crown, XCircle, Trash2 } from 'lucide-react';
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
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [deleting, setDeleting] = useState(false);
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
      .insert([{ user_id: userId, role: newRole as 'admin' | 'student' | 'super_admin' }]);

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

const revokeProMembership = async (userId: string) => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ 
        is_premium: false,
        subscription_end_date: null
      })
      .eq('id', userId);

    if (error) throw error;

    // Update local state
    const updatedUsers = users.map(user => 
      user.user_id === userId ? { 
        ...user, 
        is_premium: false, 
        subscription_end_date: null 
      } : user
    );
    
    setUsers(updatedUsers);

    toast({
      title: "Success",
      description: "Pro membership revoked",
    });
  } catch (error) {
    logger.error('Error revoking pro membership:', error);
    toast({
      title: "Error",
      description: "Failed to revoke pro membership",
      variant: "destructive"
    });
  }
};

const deleteUser = async (userId: string) => {
  try {
    setDeleting(true);
    
    // Delete from auth
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);
    if (authError) logger.warn('Auth deletion warning:', authError);

    // Delete from user_roles
    await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    // Delete from question_attempts
    await supabase
      .from('question_attempts')
      .delete()
      .eq('user_id', userId);

    // Delete from profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileError) throw profileError;

    // Update local state
    const updatedUsers = users.filter(user => user.user_id !== userId);
    setUsers(updatedUsers);

    toast({
      title: "Success",
      description: "User deleted successfully from all systems",
    });
  } catch (error) {
    logger.error('Error deleting user:', error);
    toast({
      title: "Error",
      description: "Failed to delete user",
      variant: "destructive"
    });
  } finally {
    setDeleting(false);
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  }
};

const deleteBulkUsers = async () => {
  try {
    setDeleting(true);
    
    for (const userId of selectedUsers) {
      // Delete from auth
      await supabase.auth.admin.deleteUser(userId).catch(() => {});

      // Delete from user_roles
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      // Delete from question_attempts
      await supabase
        .from('question_attempts')
        .delete()
        .eq('user_id', userId);

      // Delete from profiles
      await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
    }

    // Update local state
    const updatedUsers = users.filter(user => !selectedUsers.has(user.user_id));
    setUsers(updatedUsers);
    setSelectedUsers(new Set());

    toast({
      title: "Success",
      description: `${selectedUsers.size} user(s) deleted successfully`,
    });
  } catch (error) {
    logger.error('Error bulk deleting users:', error);
    toast({
      title: "Error",
      description: "Failed to delete users",
      variant: "destructive"
    });
  } finally {
    setDeleting(false);
    setDeleteDialogOpen(false);
  }
};

const toggleSelectUser = (userId: string) => {
  const newSelected = new Set(selectedUsers);
  if (newSelected.has(userId)) {
    newSelected.delete(userId);
  } else {
    newSelected.add(userId);
  }
  setSelectedUsers(newSelected);
};

const toggleSelectAll = () => {
  if (selectedUsers.size === filteredUsers.length) {
    setSelectedUsers(new Set());
  } else {
    setSelectedUsers(new Set(filteredUsers.map(u => u.user_id)));
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
            {selectedUsers.size > 0 && ` | ${selectedUsers.size} selected`}
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

          {/* Bulk Delete Bar */}
          {selectedUsers.size > 0 && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
              <span className="text-sm font-medium text-red-900">
                {selectedUsers.size} user(s) selected
              </span>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={deleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected
              </Button>
            </div>
          )}

          {/* Users Table */}
          <div className="rounded-md border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
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
                    <TableRow key={user.user_id} className={selectedUsers.has(user.user_id) ? 'bg-red-50' : ''}>
                      <TableCell>
                        <Checkbox
                          checked={selectedUsers.has(user.user_id)}
                          onCheckedChange={() => toggleSelectUser(user.user_id)}
                        />
                      </TableCell>
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
                          {!user.is_premium ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => grantProMembership(user.user_id, 1)}
                              className="whitespace-nowrap"
                            >
                              <Gift className="h-4 w-4 mr-1" />
                              Grant Pro
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => revokeProMembership(user.user_id)}
                              className="whitespace-nowrap text-destructive hover:text-destructive"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Revoke Pro
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setUserToDelete(user);
                              setDeleteDialogOpen(true);
                            }}
                            disabled={deleting}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">Delete User(s)?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <div>
                {userToDelete ? (
                  <>
                    <p>Are you sure you want to delete this user?</p>
                    <p className="font-semibold">{userToDelete.full_name} ({userToDelete.email})</p>
                  </>
                ) : (
                  <p>Are you sure you want to delete {selectedUsers.size} user(s)?</p>
                )}
              </div>
              <div className="bg-red-50 border border-red-200 rounded p-3 mt-4">
                <p className="text-sm font-medium text-red-900">⚠️ This action cannot be undone.</p>
                <p className="text-sm text-red-800 mt-2">The user will be deleted from:</p>
                <ul className="text-sm text-red-800 list-disc list-inside ml-2">
                  <li>Authentication system</li>
                  <li>User profiles</li>
                  <li>All activity records</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (userToDelete) {
                  deleteUser(userToDelete.user_id);
                } else {
                  deleteBulkUsers();
                }
              }}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
