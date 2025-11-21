import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/components/ui/use-toast'
import type { Platform } from '@/types/api'

interface ImportResponse {
  successCount: number
  failCount: number
  errors?: string[]
  error?: string
}

interface ImportEmailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  platforms: Platform[]
  onSuccess: () => void
}

export function ImportEmailDialog({
  open,
  onOpenChange,
  platforms,
  onSuccess,
}: ImportEmailDialogProps) {
  const [content, setContent] = useState('')
  const [separator, setSeparator] = useState('|')
  const [supportedPlatforms, setSupportedPlatforms] = useState<string[]>([])
  const [usedPlatforms, setUsedPlatforms] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast({
        title: '内容不能为空',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/admin/emails/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          separator,
          supportedPlatforms,
          usedPlatforms,
        }),
        credentials: 'include',
      })

      const data: ImportResponse = await response.json()

      if (response.ok) {
        toast({
          title: '导入完成',
          description: `成功: ${data.successCount} 条，失败: ${data.failCount} 条`,
        })
        if (data.errors && data.errors.length > 0) {
          console.log('导入错误:', data.errors)
        }
        setContent('')
        setSeparator('|')
        setSupportedPlatforms([])
        setUsedPlatforms([])
        onOpenChange(false)
        onSuccess()
      } else {
        toast({
          title: '导入失败',
          description: data.error,
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: '导入失败',
        description: '网络错误',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const togglePlatform = (platformKey: string, list: string[], setter: (list: string[]) => void) => {
    if (list.includes(platformKey)) {
      setter(list.filter((k) => k !== platformKey))
    } else {
      setter([...list, platformKey])
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>批量导入邮箱</DialogTitle>
          <DialogDescription>
            每行一条数据，格式：邮箱{separator}密码{separator}备注（可选）
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="separator">分隔符</Label>
            <Input
              id="separator"
              placeholder="输入分隔符，例如: | 或 ---"
              value={separator}
              onChange={(e) => setSeparator(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">邮箱数据</Label>
            <Textarea
              id="content"
              placeholder={`example@email.com${separator}password123\ntest@email.com${separator}pass456${separator}备注信息`}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[200px] font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label>支持的平台（不选默认支持所有）</Label>
            <div className="flex flex-wrap gap-4">
              {platforms.map((platform) => (
                <div key={platform.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={`supported-${platform.key}`}
                    checked={supportedPlatforms.includes(platform.key)}
                    onCheckedChange={() =>
                      togglePlatform(platform.key, supportedPlatforms, setSupportedPlatforms)
                    }
                  />
                  <Label
                    htmlFor={`supported-${platform.key}`}
                    className="cursor-pointer"
                  >
                    {platform.name}
                  </Label>
                </div>
              ))}
              {platforms.length === 0 && (
                <div className="text-sm text-muted-foreground">
                  暂无平台，请先在平台管理中添加
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>已注册的平台（可选）</Label>
            <div className="flex flex-wrap gap-4">
              {platforms.map((platform) => (
                <div key={platform.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={`used-${platform.key}`}
                    checked={usedPlatforms.includes(platform.key)}
                    onCheckedChange={() =>
                      togglePlatform(platform.key, usedPlatforms, setUsedPlatforms)
                    }
                  />
                  <Label htmlFor={`used-${platform.key}`} className="cursor-pointer">
                    {platform.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? '导入中...' : '开始导入'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
