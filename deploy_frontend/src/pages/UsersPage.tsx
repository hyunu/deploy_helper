import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getUsers, createUser, updateUser, deleteUser } from '../api/users'
import { UserCreate, UserResponse, UserUpdate } from '../types/api'
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '../components/ui/table' // Assuming you have shadcn-ui table components
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '../components/ui/dialog' // Assuming shadcn-ui dialog components
import { Button } from '../components/ui/button' // Assuming shadcn-ui button component
import { Input } from '../components/ui/input' // Assuming shadcn-ui input component
import { Label } from '../components/ui/label'
import { Switch } from '../components/ui/switch' // Assuming shadcn-ui switch component
import { PlusCircle, Edit, Trash2, CheckCircle, XCircle, Shield, Loader2 } from 'lucide-react'
import { format } from 'date-fns'

export default function UsersPage() {
  const queryClient = useQueryClient()
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingUser, setEditingUser] = useState<UserResponse | null>(null)
  const [newUserData, setNewUserData] = useState<UserCreate>({ email: '', password: '' })
  const [editUserData, setEditUserData] = useState<UserUpdate>({})
  const [editPassword, setEditPassword] = useState('')
  const [error, setError] = useState('')

  const { data: users, isLoading, isError } = useQuery<UserResponse[]>({ 
    queryKey: ['users'], 
    queryFn: getUsers 
  })

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setShowCreateDialog(false)
      setNewUserData({ email: '', password: '' })
      setError('')
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail || '사용자 생성 실패')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: number; data: UserUpdate }) =>
      updateUser(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setShowEditDialog(false)
      setEditingUser(null)
      setEditUserData({})
      setEditPassword('')
      setError('')
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail || '사용자 업데이트 실패')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setError('')
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail || '사용자 삭제 실패')
    },
  })

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    createMutation.mutate({ ...newUserData, is_admin: newUserData.is_admin ?? false })
  }

  const handleEditUser = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const dataToUpdate: UserUpdate = { ...editUserData }
    if (editPassword) {
      dataToUpdate.password = editPassword
    }
    if (editingUser) {
      updateMutation.mutate({ userId: editingUser.id, data: dataToUpdate })
    }
  }

  const openEditDialog = (user: UserResponse) => {
    setEditingUser(user)
    setEditUserData({ email: user.email, is_active: user.is_active, is_admin: user.is_admin })
    setEditPassword('')
    setShowEditDialog(true)
  }

  if (isLoading) {
    return <div className="p-6 text-center">사용자 정보를 불러오는 중...</div>
  }

  if (isError) {
    return <div className="p-6 text-center text-red-600">사용자 정보를 불러오지 못했습니다.</div>
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">사용자 관리</h1>
        <Button onClick={() => setShowCreateDialog(true)}>
          <PlusCircle className="mr-2 h-5 w-5" /> 새 사용자
        </Button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>이메일</TableHead>
              <TableHead>활성</TableHead>
              <TableHead>관리자</TableHead>
              <TableHead>등록일</TableHead>
              <TableHead className="text-right">액션</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.id}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  {user.is_active ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </TableCell>
                <TableCell>
                  {user.is_admin ? (
                    <Shield className="h-5 w-5 text-blue-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-gray-400" />
                  )}
                </TableCell>
                <TableCell>{format(new Date(user.created_at), 'yyyy-MM-dd HH:mm')}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => openEditDialog(user)} className="mr-2">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(user.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* 새 사용자 추가 다이얼로그 */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>새 사용자 추가</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <Label htmlFor="new-email">이메일</Label>
              <Input
                id="new-email"
                type="email"
                value={newUserData.email}
                onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="new-password">비밀번호</Label>
              <Input
                id="new-password"
                type="password"
                value={newUserData.password}
                onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="new-is-admin"
                checked={newUserData.is_admin || false}
                onCheckedChange={(checked) => setNewUserData({ ...newUserData, is_admin: checked })}
              />
              <Label htmlFor="new-is-admin">관리자 권한</Label>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                생성
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 사용자 편집 다이얼로그 */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>사용자 편집</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <form onSubmit={handleEditUser} className="space-y-4">
              <div>
                <Label htmlFor="edit-email">이메일</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editUserData.email || ''}
                  onChange={(e) => setEditUserData({ ...editUserData, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-password">비밀번호 (변경 시 입력)</Label>
                <Input
                  id="edit-password"
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="새 비밀번호"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-is-active"
                  checked={editUserData.is_active || false}
                  onCheckedChange={(checked) => setEditUserData({ ...editUserData, is_active: checked })}
                />
                <Label htmlFor="edit-is-active">활성 사용자</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-is-admin"
                  checked={editUserData.is_admin || false}
                  onCheckedChange={(checked) => setEditUserData({ ...editUserData, is_admin: checked })}
                />
                <Label htmlFor="edit-is-admin">관리자 권한</Label>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  저장
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
