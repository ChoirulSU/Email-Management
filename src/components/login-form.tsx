import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

interface LoginFormProps {
    onLogin: () => void;
}

interface LoginResponse {
    success?: boolean;
    error?: string;
}

export function LoginForm({ onLogin }: LoginFormProps) {
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch("/api/admin/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
                credentials: "include",
            });

            const data: LoginResponse = await response.json();

            if (response.ok && data.success) {
                toast({ title: "登录成功" });
                onLogin();
            } else {
                toast({
                    title: "登录失败",
                    description: data.error || "密码错误",
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "登录失败",
                description: "网络错误，请稍后重试",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold">邮箱管理系统</h1>
                <p className="text-balance text-muted-foreground">
                    请输入管理员密钥登录
                </p>
            </div>
            <div className="grid gap-6">
                <div className="grid gap-2">
                    <Label htmlFor="password">密钥</Label>
                    <Input
                        id="password"
                        type="password"
                        placeholder="请输入管理员密钥"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "登录中..." : "登录"}
                </Button>
            </div>
        </form>
    );
}
