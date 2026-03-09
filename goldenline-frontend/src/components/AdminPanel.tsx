import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { bridge } from '../api/bridge';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { RefreshCw } from 'lucide-react';

type StatusMessage = {
  type: 'success' | 'error';
  text: string;
} | null;

type UserSummary = {
  userID: number;
  kullaniciAdi: string;
  rol: string;
};

const extractErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === 'string' && error.length > 0) {
    return error;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
};

const AdminPanel: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<StatusMessage>(null);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [passwordInputs, setPasswordInputs] = useState<Record<number, string>>({});
  const [roleSelections, setRoleSelections] = useState<Record<number, string>>({});
  const [loadingActions, setLoadingActions] = useState<Set<string>>(new Set());
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const currentUserId = currentUser?.userId ?? null;

  const setActionLoading = useCallback((userId: number, action: string, isLoading: boolean) => {
    setLoadingActions((prev) => {
      const next = new Set(prev);
      const key = `${userId}:${action}`;
      if (isLoading) {
        next.add(key);
      } else {
        next.delete(key);
      }
      return next;
    });
  }, []);

  const isActionLoading = useCallback(
    (userId: number, action: string) => loadingActions.has(`${userId}:${action}`),
    [loadingActions],
  );

  const loadUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    setUsersError(null);
    try {
      const response = await bridge.getUsers();
      setUsers(response as UserSummary[]);
    } catch (error: unknown) {
      setUsersError(extractErrorMessage(error, 'Kullanici listesi yuklenemedi.'));
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setConfirmPassword('');
  };

  const clearPerUserState = (userId: number) => {
    setPasswordInputs((prev) => {
      if (!(userId in prev)) {
        return prev;
      }
      const { [userId]: _removedPassword, ...rest } = prev;
      return rest;
    });
    setRoleSelections((prev) => {
      if (!(userId in prev)) {
        return prev;
      }
      const { [userId]: _removedRole, ...rest } = prev;
      return rest;
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      setStatusMessage({ type: 'error', text: 'Sifreler eslesmiyor.' });
      return;
    }

    if (!username.trim()) {
      setStatusMessage({ type: 'error', text: 'Kullanici adi gerekli.' });
      return;
    }

    setStatusMessage(null);
    setIsSubmitting(true);

    try {
      await bridge.register({
        kullaniciAdi: username.trim(),
        sifre: password,
      });

      setStatusMessage({
        type: 'success',
        text: 'Yeni kullanici basariyla olusturuldu.',
      });
      resetForm();
      await loadUsers();
    } catch (error: unknown) {
      setStatusMessage({
        type: 'error',
        text: extractErrorMessage(error, 'Kullanici olusturulamadi. Lutfen tekrar deneyin.'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (currentUserId === userId) {
      setStatusMessage({
        type: 'error',
        text: 'Kendi hesabiniz silinemez.',
      });
      return;
    }

    const userToDelete = users.find((item) => item.userID === userId);
    const confirmation = window.confirm(
      userToDelete
        ? `"${userToDelete.kullaniciAdi}" kullanicisini silmek istediginize emin misiniz?`
        : 'Bu kullaniciyi silmek istediginize emin misiniz?',
    );
    if (!confirmation) {
      return;
    }

    setStatusMessage(null);
    setActionLoading(userId, 'delete', true);
    try {
      await bridge.deleteUser(userId);
      setUsers((prev) => prev.filter((item) => item.userID !== userId));
      clearPerUserState(userId);
      setStatusMessage({
        type: 'success',
        text: 'Kullanici silindi.',
      });
    } catch (error: unknown) {
      setStatusMessage({
        type: 'error',
        text: extractErrorMessage(error, 'Kullanici silinemedi.'),
      });
    } finally {
      setActionLoading(userId, 'delete', false);
    }
  };

  const handleRoleUpdate = async (userId: number) => {
    const userRecord = users.find((item) => item.userID === userId);
    if (!userRecord) {
      setStatusMessage({
        type: 'error',
        text: 'Kullanici bulunamadi.',
      });
      return;
    }

    const selectedRole = (roleSelections[userId] ?? userRecord.rol).trim();
    if (selectedRole.length === 0) {
      setStatusMessage({
        type: 'error',
        text: 'Rol secilmelidir.',
      });
      return;
    }

    if (selectedRole === userRecord.rol) {
      setStatusMessage({
        type: 'error',
        text: 'Rol degistirilmedi.',
      });
      return;
    }

    setStatusMessage(null);
    setActionLoading(userId, 'role', true);
    try {
      await bridge.updateUserRole(userId, {
        rol: selectedRole,
      });
      setUsers((prev) =>
        prev.map((item) =>
          item.userID === userId
            ? {
              ...item,
              rol: selectedRole,
            }
            : item,
        ),
      );
      setRoleSelections((prev) => {
        const { [userId]: _removedRole, ...rest } = prev;
        return rest;
      });
      setStatusMessage({
        type: 'success',
        text: 'Rol guncellendi.',
      });
    } catch (error: unknown) {
      setStatusMessage({
        type: 'error',
        text: extractErrorMessage(error, 'Rol guncellenemedi.'),
      });
    } finally {
      setActionLoading(userId, 'role', false);
    }
  };

  const handlePasswordReset = async (userId: number) => {
    const trimmedPassword = (passwordInputs[userId] ?? '').trim();

    if (trimmedPassword.length === 0) {
      setStatusMessage({
        type: 'error',
        text: 'Yeni sifre bos olamaz.',
      });
      return;
    }

    setStatusMessage(null);
    setActionLoading(userId, 'password', true);
    try {
      await bridge.resetUserPassword(userId, {
        yeniSifre: trimmedPassword,
      });
      setPasswordInputs((prev) => {
        const { [userId]: _removedPassword, ...rest } = prev;
        return rest;
      });
      setStatusMessage({
        type: 'success',
        text: 'Sifre guncellendi.',
      });
    } catch (error: unknown) {
      setStatusMessage({
        type: 'error',
        text: extractErrorMessage(error, 'Sifre guncellenemedi.'),
      });
    } finally {
      setActionLoading(userId, 'password', false);
    }
  };



  return (
    <div className="min-h-screen w-full bg-slate-50/50 p-4 sm:p-6 lg:p-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold text-slate-900">Admin Panel</h1>
          <Button variant="default" onClick={() => navigate('/golden-line')}>
            Ana Sayfa
          </Button>
        </div>

        {statusMessage && (
          <Alert variant={statusMessage.type === 'success' ? 'default' : 'destructive'}>
            <AlertDescription>{statusMessage.text}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
          <Card>
            <CardHeader>
              <CardTitle>Yeni Kullanıcı Oluştur</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="username">Kullanıcı Adı</Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    autoComplete="off"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Şifre</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="new-password"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Şifre (Tekrar)</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    autoComplete="new-password"
                    required
                  />
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? 'Kaydediliyor...' : 'Kullanıcı Oluştur'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle>Kullanıcı Listesi</CardTitle>
                <Button
                  variant="default"
                  onClick={() => {
                    setStatusMessage(null);
                    void loadUsers();
                  }}
                  disabled={isLoadingUsers}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {isLoadingUsers ? 'Yükleniyor...' : 'Yenile'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>

              {usersError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{usersError}</AlertDescription>
                </Alert>
              )}

              {isLoadingUsers ? (
                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                  Kullanıcı listesi yükleniyor...
                </div>
              ) : users.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                  Kayıtlı kullanıcı bulunamadı.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="pl-6">KULLANICI</TableHead>
                        <TableHead>ROL</TableHead>
                        <TableHead>ŞİFRE YENİLE</TableHead>
                        <TableHead className="pr-6">İŞLEMLER</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((userItem) => {
                        const roleValue = roleSelections[userItem.userID] ?? userItem.rol;
                        const passwordValue = passwordInputs[userItem.userID] ?? '';
                        const deleting = isActionLoading(userItem.userID, 'delete');
                        const updatingRole = isActionLoading(userItem.userID, 'role');
                        const updatingPassword = isActionLoading(userItem.userID, 'password');
                        const isCurrentUser = currentUserId === userItem.userID;

                        return (
                          <TableRow key={userItem.userID} className="hover:bg-slate-50">
                            <TableCell className="pl-6">
                              <div className="font-semibold text-slate-900">{userItem.kullaniciAdi}</div>
                              {isCurrentUser && (
                                <Badge variant="secondary" className="mt-1 bg-amber-100 text-amber-700">
                                  Siz
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                <Select
                                  value={roleValue}
                                  onValueChange={(value) =>
                                    setRoleSelections((prev) => ({
                                      ...prev,
                                      [userItem.userID]: value,
                                    }))
                                  }
                                  disabled={updatingRole}
                                >
                                  <SelectTrigger className="w-full sm:w-[120px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="User">User</SelectItem>
                                    <SelectItem value="Admin">Admin</SelectItem>
                                    <SelectItem value="ToolUser">ToolUser</SelectItem>
                                    <SelectItem value="GoldenLineUser">GoldenLineUser</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleRoleUpdate(userItem.userID)}
                                  disabled={updatingRole}
                                  className="whitespace-nowrap bg-slate-800 hover:bg-slate-900"
                                >
                                  {updatingRole ? 'Kaydediliyor...' : 'Güncelle'}
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                <Input
                                  type="password"
                                  value={passwordValue}
                                  placeholder="Yeni şifre"
                                  onChange={(event) =>
                                    setPasswordInputs((prev) => ({
                                      ...prev,
                                      [userItem.userID]: event.target.value,
                                    }))
                                  }
                                  disabled={updatingPassword}
                                  className="w-full sm:w-[150px]"
                                />
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handlePasswordReset(userItem.userID)}
                                  disabled={updatingPassword}
                                  className="whitespace-nowrap bg-slate-800 hover:bg-slate-900"
                                >
                                  {updatingPassword ? 'Kaydediliyor...' : 'Şifreyi Kaydet'}
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell className="pr-6">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => void handleDeleteUser(userItem.userID)}
                                disabled={isCurrentUser || deleting}
                              >
                                {deleting ? 'Siliniyor...' : 'Sil'}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
