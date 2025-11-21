import { LoginForm } from "@/components/login-form";

export default function Login({ onLogin }: { onLogin: () => void }) {
    return (
        <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
            {/* 左侧登录表单 */}
            <div className="flex items-center justify-center py-12">
                <div className="mx-auto w-[350px]">
                    <LoginForm onLogin={onLogin} />
                </div>
            </div>

            {/* 右侧背景图片 */}
            <div className="hidden bg-muted lg:block">
                <img
                    src="/house.webp"
                    alt="Login background"
                    className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
                />
            </div>
        </div>
    );
}
