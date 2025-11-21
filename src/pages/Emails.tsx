import { useEffect, useState } from 'react'
import { Layout } from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Upload, Settings, Search, Download } from 'lucide-react'
import { ImportEmailDialog } from '@/components/ImportEmailDialog'
import { BatchOperationDialog } from '@/components/BatchOperationDialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Email, Platform, PaginatedResponse } from '@/types/api'
import { useToast } from '@/components/ui/use-toast'

interface EmailsResponse extends PaginatedResponse<Email> {}

export default function Emails() {
  const [emails, setEmails] = useState<Email[]>([])
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [pageSize] = useState(20)
  const [search, setSearch] = useState('')
  const [isUsedFilter, setIsUsedFilter] = useState<string>('')
  const [platformFilter, setPlatformFilter] = useState<string>('')
  const [importOpen, setImportOpen] = useState(false)
  const [batchOpen, setBatchOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchPlatforms()
  }, [])

  useEffect(() => {
    fetchEmails()
  }, [page, search, isUsedFilter, platformFilter])

  const fetchPlatforms = async () => {
    try {
      const response = await fetch('/api/admin/platforms', {
        credentials: 'include',
      })
      const data: Platform[] = await response.json()
      setPlatforms(data)
    } catch (error) {
      console.error('Failed to fetch platforms:', error)
    }
  }

  const fetchEmails = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      })
      if (search) params.append('search', search)
      if (isUsedFilter !== '') params.append('isUsed', isUsedFilter)
      if (platformFilter) params.append('platform', platformFilter)

      const response = await fetch(`/api/admin/emails?${params}`, {
        credentials: 'include',
      })
      const data: EmailsResponse = await response.json()
      setEmails(data.data)
      setTotal(data.total)
    } catch (error) {
      console.error('Failed to fetch emails:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (isUsedFilter !== '') params.append('isUsed', isUsedFilter)
      if (platformFilter) params.append('platform', platformFilter)

      const response = await fetch(`/api/admin/emails/export?${params}`, {
        credentials: 'include',
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `emails-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast({
          title: '导出成功',
          description: `已导出 ${total} 条邮箱数据`,
        })
      } else {
        toast({
          title: '导出失败',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Export failed:', error)
      toast({
        title: '导出失败',
        description: '网络错误',
        variant: 'destructive',
      })
    } finally {
      setExporting(false)
    }
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold">邮箱管理</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport} disabled={exporting}>
              <Download className="w-4 h-4 mr-2" />
              {exporting ? '导出中...' : '导出'}
            </Button>
            <Button onClick={() => setImportOpen(true)}>
              <Upload className="w-4 h-4 mr-2" />
              批量导入
            </Button>
            <Button variant="outline" onClick={() => setBatchOpen(true)}>
              <Settings className="w-4 h-4 mr-2" />
              批量操作
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>筛选与搜索</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索邮箱..."
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={isUsedFilter || "all"} onValueChange={(v) => setIsUsedFilter(v === "all" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="使用状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="0">未使用</SelectItem>
                  <SelectItem value="1">已使用</SelectItem>
                </SelectContent>
              </Select>
              <Select value={platformFilter || "all"} onValueChange={(v) => setPlatformFilter(v === "all" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="平台筛选" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部平台</SelectItem>
                  {platforms.map((platform) => (
                    <SelectItem key={platform.key} value={platform.key}>
                      {platform.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => {
                  setSearch('')
                  setIsUsedFilter('')
                  setPlatformFilter('')
                  setPage(1)
                }}
              >
                重置筛选
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              邮箱列表 ({total} 条记录)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div>加载中...</div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>邮箱</TableHead>
                      <TableHead>密码</TableHead>
                      <TableHead>备注</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>支持平台</TableHead>
                      <TableHead>已用平台</TableHead>
                      <TableHead>创建时间</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {emails.map((email) => {
                      const supportedPlatforms = JSON.parse(
                        email.supported_platforms || '[]'
                      )
                      const usedPlatforms = JSON.parse(
                        email.used_platforms || '[]'
                      )
                      return (
                        <TableRow key={email.id}>
                          <TableCell className="font-mono text-sm">
                            {email.email}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {email.password}
                          </TableCell>
                          <TableCell className="max-w-[150px] truncate">
                            {email.remark || '-'}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                email.is_used
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {email.is_used ? '已使用' : '未使用'}
                            </span>
                          </TableCell>
                          <TableCell>
                            {supportedPlatforms.length === 0
                              ? '全部'
                              : supportedPlatforms.join(', ')}
                          </TableCell>
                          <TableCell>
                            {usedPlatforms.length === 0
                              ? '-'
                              : usedPlatforms.join(', ')}
                          </TableCell>
                          <TableCell className="text-sm">
                            {new Date(email.created_at).toLocaleString('zh-CN')}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                    {emails.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center text-muted-foreground"
                        >
                          暂无邮箱数据
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>

                {/* 分页 */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      第 {page} 页，共 {totalPages} 页
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        上一页
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                      >
                        下一页
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <ImportEmailDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        platforms={platforms}
        onSuccess={fetchEmails}
      />

      <BatchOperationDialog
        open={batchOpen}
        onOpenChange={setBatchOpen}
        platforms={platforms}
        onSuccess={fetchEmails}
      />
    </Layout>
  )
}
