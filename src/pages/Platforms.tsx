import { useEffect, useState } from 'react'
import { Layout } from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/components/ui/use-toast'
import { Plus, Trash2, Edit } from 'lucide-react'
import type { Platform } from '@/types/api'

interface PlatformResponse {
  success?: boolean
  error?: string
}

export default function Platforms() {
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPlatform, setEditingPlatform] = useState<Platform | null>(null)
  const [formData, setFormData] = useState({ key: '', name: '' })
  const { toast } = useToast()

  useEffect(() => {
    fetchPlatforms()
  }, [])

  const fetchPlatforms = async () => {
    try {
      const response = await fetch('/api/admin/platforms', {
        credentials: 'include',
      })
      const data: Platform[] = await response.json()
      setPlatforms(data)
    } catch (error) {
      console.error('Failed to fetch platforms:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingPlatform
        ? `/api/admin/platforms/${editingPlatform.id}`
        : '/api/admin/platforms'
      const method = editingPlatform ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include',
      })

      const data: PlatformResponse = await response.json()

      if (response.ok && data.success) {
        toast({
          title: editingPlatform ? '平台已更新' : '平台已添加',
        })
        setDialogOpen(false)
        setFormData({ key: '', name: '' })
        setEditingPlatform(null)
        fetchPlatforms()
      } else {
        toast({
          title: '操作失败',
          description: data.error,
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: '操作失败',
        description: '网络错误',
        variant: 'destructive',
      })
    }
  }

  const handleEdit = (platform: Platform) => {
    setEditingPlatform(platform)
    setFormData({ key: platform.key, name: platform.name })
    setDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个平台吗？')) return

    try {
      const response = await fetch(`/api/admin/platforms/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (response.ok) {
        toast({ title: '平台已删除' })
        fetchPlatforms()
      } else {
        toast({
          title: '删除失败',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: '删除失败',
        description: '网络错误',
        variant: 'destructive',
      })
    }
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setEditingPlatform(null)
    setFormData({ key: '', name: '' })
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold">平台管理</h2>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleDialogClose()}>
                <Plus className="w-4 h-4 mr-2" />
                添加平台
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingPlatform ? '编辑平台' : '添加平台'}
                </DialogTitle>
                <DialogDescription>
                  添加新的平台用于邮箱管理分类
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="key">平台Key</Label>
                    <Input
                      id="key"
                      placeholder="例如: google, facebook"
                      value={formData.key}
                      onChange={(e) =>
                        setFormData({ ...formData, key: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">平台名称</Label>
                    <Input
                      id="name"
                      placeholder="例如: Google, Facebook"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">
                    {editingPlatform ? '更新' : '添加'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>平台列表</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div>加载中...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Key</TableHead>
                    <TableHead>名称</TableHead>
                    <TableHead>创建时间</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {platforms.map((platform) => (
                    <TableRow key={platform.id}>
                      <TableCell>{platform.id}</TableCell>
                      <TableCell className="font-mono">{platform.key}</TableCell>
                      <TableCell>{platform.name}</TableCell>
                      <TableCell>
                        {new Date(platform.created_at).toLocaleString('zh-CN')}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(platform)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(platform.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {platforms.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        暂无平台数据，点击右上角按钮添加平台
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
