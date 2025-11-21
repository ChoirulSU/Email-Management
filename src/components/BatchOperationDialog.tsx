import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { Platform } from "@/types/api";

interface BatchOperationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    platforms: Platform[];
    onSuccess: () => void;
}

interface ConflictInfo {
    hasConflicts: boolean;
    conflicts: Record<number, string[]>;
    message: string;
}

interface BatchOperationResponse {
    count?: number;
    hasConflicts?: boolean;
    conflicts?: Record<number, string[]>;
    message?: string;
    error?: string;
}

export function BatchOperationDialog({
    open,
    onOpenChange,
    platforms,
    onSuccess,
}: BatchOperationDialogProps) {
    const [emails, setEmails] = useState("");
    const [action, setAction] = useState<string>("setPlatforms");
    const [supportedPlatforms, setSupportedPlatforms] = useState<string[]>([]);
    const [usedPlatforms, setUsedPlatforms] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [conflictInfo, setConflictInfo] = useState<ConflictInfo | null>(null);
    const [showConflictDialog, setShowConflictDialog] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async () => {
        if (!emails.trim()) {
            toast({
                title: "邮箱列表不能为空",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);
        try {
            const response = await fetch("/api/admin/emails/batch", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    emails,
                    action,
                    supportedPlatforms:
                        supportedPlatforms.length > 0 ? supportedPlatforms : undefined,
                    usedPlatforms: usedPlatforms.length > 0 ? usedPlatforms : undefined,
                }),
                credentials: "include",
            });

            const data: BatchOperationResponse = await response.json();

            if (response.ok) {
                if (data.hasConflicts) {
                    setConflictInfo(data as ConflictInfo);
                    setShowConflictDialog(true);
                } else {
                    toast({
                        title: "操作成功",
                        description: `已处理 ${data.count} 条邮箱`,
                    });
                    setEmails("");
                    setAction("setPlatforms");
                    setSupportedPlatforms([]);
                    setUsedPlatforms([]);
                    onOpenChange(false);
                    onSuccess();
                }
            } else {
                toast({
                    title: "操作失败",
                    description: data.error,
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "操作失败",
                description: "网络错误",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const togglePlatform = (
        platformKey: string,
        list: string[],
        setter: (list: string[]) => void
    ) => {
        if (list.includes(platformKey)) {
            setter(list.filter(k => k !== platformKey));
        } else {
            setter([...list, platformKey]);
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className='max-w-2xl max-h-[80vh] overflow-y-auto'>
                    <DialogHeader>
                        <DialogTitle>批量操作</DialogTitle>
                        <DialogDescription>
                            输入邮箱地址列表，每行一个，然后选择要执行的操作
                        </DialogDescription>
                    </DialogHeader>

                    <div className='space-y-4 py-4'>
                        <div className='space-y-2'>
                            <Label htmlFor='emails'>邮箱列表</Label>
                            <Textarea
                                id='emails'
                                placeholder={`example1@email.com\nexample2@email.com\nexample3@email.com`}
                                value={emails}
                                onChange={e => setEmails(e.target.value)}
                                className='min-h-[200px] font-mono text-sm'
                            />
                        </div>

                        <div className='space-y-2'>
                            <Label htmlFor='action'>操作类型</Label>
                            <Select value={action} onValueChange={setAction}>
                                <SelectTrigger id='action'>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value='setPlatforms'>设置平台</SelectItem>
                                    <SelectItem value='delete'>删除邮箱</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {action === "setPlatforms" && (
                            <>
                                <div className='space-y-2'>
                                    <Label>添加到支持平台</Label>
                                    <div className='flex flex-wrap gap-4'>
                                        {platforms.map(platform => (
                                            <div
                                                key={platform.key}
                                                className='flex items-center space-x-2'
                                            >
                                                <Checkbox
                                                    id={`batch-supported-${platform.key}`}
                                                    checked={supportedPlatforms.includes(
                                                        platform.key
                                                    )}
                                                    onCheckedChange={() =>
                                                        togglePlatform(
                                                            platform.key,
                                                            supportedPlatforms,
                                                            setSupportedPlatforms
                                                        )
                                                    }
                                                />
                                                <Label
                                                    htmlFor={`batch-supported-${platform.key}`}
                                                    className='cursor-pointer'
                                                >
                                                    {platform.name}
                                                </Label>
                                            </div>
                                        ))}
                                        {platforms.length === 0 && (
                                            <div className='text-sm text-muted-foreground'>
                                                暂无平台，请先在平台管理中添加
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className='space-y-2'>
                                    <Label>标记为已使用平台</Label>
                                    <div className='flex flex-wrap gap-4'>
                                        {platforms.map(platform => (
                                            <div
                                                key={platform.key}
                                                className='flex items-center space-x-2'
                                            >
                                                <Checkbox
                                                    id={`batch-used-${platform.key}`}
                                                    checked={usedPlatforms.includes(platform.key)}
                                                    onCheckedChange={() =>
                                                        togglePlatform(
                                                            platform.key,
                                                            usedPlatforms,
                                                            setUsedPlatforms
                                                        )
                                                    }
                                                />
                                                <Label
                                                    htmlFor={`batch-used-${platform.key}`}
                                                    className='cursor-pointer'
                                                >
                                                    {platform.name}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        {action === "delete" && (
                            <div className='p-4 bg-red-50 border border-red-200 rounded-lg'>
                                <p className='text-sm text-red-800'>
                                    警告：此操作将永久删除这些邮箱，无法恢复！
                                </p>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant='outline' onClick={() => onOpenChange(false)}>
                            取消
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={loading}
                            variant={action === "delete" ? "destructive" : "default"}
                        >
                            {loading ? "处理中..." : action === "delete" ? "确认删除" : "执行操作"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 平台冲突提示弹窗 */}
            <Dialog open={showConflictDialog} onOpenChange={setShowConflictDialog}>
                <DialogContent className='max-w-2xl max-h-[60vh] overflow-y-auto'>
                    <DialogHeader>
                        <DialogTitle>检测到平台数量冲突</DialogTitle>
                        <DialogDescription>{conflictInfo?.message}</DialogDescription>
                    </DialogHeader>

                    <div className='space-y-4 py-4'>
                        {conflictInfo &&
                            Object.entries(conflictInfo.conflicts).map(([count, emailList]) => (
                                <div key={count} className='space-y-2'>
                                    <h4 className='font-medium'>支持 {count} 个平台的邮箱：</h4>
                                    <div className='p-3  rounded-lg max-h-32 overflow-y-auto'>
                                        <div className='text-sm font-mono space-y-1'>
                                            {emailList.map(email => (
                                                <div key={email}>{email}</div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                    </div>

                    <DialogFooter>
                        <Button onClick={() => setShowConflictDialog(false)}>关闭</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
