import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { LayoutDashboard, Mail, Settings, LogOut } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await fetch("/api/admin/logout", {
            method: "POST",
            credentials: "include",
        });
        navigate("/login");
    };

    const navItems = [
        { path: "/dashboard", label: "仪表板", icon: LayoutDashboard },
        { path: "/emails", label: "邮箱管理", icon: Mail },
        { path: "/platforms", label: "平台管理", icon: Settings },
    ];

    return (
        <div className='min-h-screen '>
            <div className='flex'>
                {/* 侧边栏 */}
                <aside className='w-64  shadow-sm h-screen sticky top-0'>
                    <div className='p-6'>
                        <h1 className='text-2xl font-bold'>邮箱管理系统</h1>
                    </div>
                    <nav className='px-4 space-y-2'>
                        {navItems.map(item => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            return (
                                <Link key={item.path} to={item.path}>
                                    <div
                                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                                            isActive ? "bg-primary text-primary-foreground" : ""
                                        }`}
                                    >
                                        <Icon className='w-5 h-5' />
                                        <span>{item.label}</span>
                                    </div>
                                </Link>
                            );
                        })}
                    </nav>
                    <div className='absolute bottom-6 left-4 right-4'>
                        <Button
                            variant='outline'
                            className='w-full justify-start'
                            onClick={handleLogout}
                        >
                            <LogOut className='w-5 h-5 mr-3' />
                            退出登录
                        </Button>
                    </div>
                </aside>

                {/* 主内容区 */}
                <main className='flex-1 p-8'>{children}</main>
            </div>
        </div>
    );
}
