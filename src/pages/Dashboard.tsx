import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { Mail, CheckCircle, XCircle, Activity } from "lucide-react";
import type { ApiLog, ApiFrequency } from "@/types/api";

interface Stats {
    totalEmails: number;
    usedEmails: number;
    unusedEmails: number;
    platformStats: Array<{
        key: string;
        name: string;
        usedCount: number;
        supportedCount: number;
    }>;
    recentLogs: ApiLog[];
    apiFrequency: ApiFrequency[];
}

export default function Dashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await fetch("/api/admin/stats", {
                credentials: "include",
            });
            const data: Stats = await response.json();
            setStats(data);
        } catch (error) {
            console.error("Failed to fetch stats:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Layout>
                <div>加载中...</div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className='space-y-6'>
                <h2 className='text-3xl font-bold'>仪表板</h2>

                {/* 统计卡片 */}
                <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                    <Card>
                        <CardHeader className='flex flex-row items-center justify-between pb-2'>
                            <CardTitle className='text-sm font-medium'>总邮箱数</CardTitle>
                            <Mail className='h-4 w-4 text-muted-foreground' />
                        </CardHeader>
                        <CardContent>
                            <div className='text-2xl font-bold'>{stats?.totalEmails || 0}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className='flex flex-row items-center justify-between pb-2'>
                            <CardTitle className='text-sm font-medium'>已使用邮箱</CardTitle>
                            <CheckCircle className='h-4 w-4 text-green-600' />
                        </CardHeader>
                        <CardContent>
                            <div className='text-2xl font-bold'>{stats?.usedEmails || 0}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className='flex flex-row items-center justify-between pb-2'>
                            <CardTitle className='text-sm font-medium'>未使用邮箱</CardTitle>
                            <XCircle className='h-4 w-4 text-red-600' />
                        </CardHeader>
                        <CardContent>
                            <div className='text-2xl font-bold'>{stats?.unusedEmails || 0}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* 平台统计 */}
                <Card>
                    <CardHeader>
                        <CardTitle>平台统计</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className='space-y-4'>
                            {stats?.platformStats?.map(platform => (
                                <div
                                    key={platform.key}
                                    className='flex items-center justify-between'
                                >
                                    <div>
                                        <div className='font-medium'>{platform.name}</div>
                                        <div className='text-sm text-muted-foreground'>
                                            {platform.key}
                                        </div>
                                    </div>
                                    <div className='text-right'>
                                        <div className='text-sm'>已使用: {platform.usedCount}</div>
                                        <div className='text-sm text-muted-foreground'>
                                            支持: {platform.supportedCount}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {(!stats?.platformStats || stats.platformStats.length === 0) && (
                                <div className='text-center text-muted-foreground py-4'>
                                    暂无平台数据
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* API调用频率 */}
                <Card>
                    <CardHeader>
                        <CardTitle className='flex items-center'>
                            <Activity className='h-5 w-5 mr-2' />
                            API调用频率（最近7天）
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {stats?.apiFrequency && stats.apiFrequency.length > 0 ? (
                            <ResponsiveContainer width='100%' height={300}>
                                <LineChart data={stats.apiFrequency}>
                                    <CartesianGrid strokeDasharray='3 3' />
                                    <XAxis dataKey='date' />
                                    <YAxis />
                                    <Tooltip />
                                    <Line
                                        type='monotone'
                                        dataKey='count'
                                        stroke='#8884d8'
                                        strokeWidth={2}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className='text-center text-muted-foreground py-8'>
                                暂无API调用数据
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* 最近日志 */}
                <Card>
                    <CardHeader>
                        <CardTitle>最近API调用日志</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className='space-y-2 max-h-96 overflow-auto'>
                            {stats?.recentLogs?.map(log => (
                                <div
                                    key={log.id}
                                    className='flex items-center justify-between p-3  rounded-lg text-sm'
                                >
                                    <div>
                                        <div className='font-medium'>
                                            {log.method} {log.endpoint}
                                        </div>
                                        <div className='text-muted-foreground text-xs'>
                                            {new Date(log.created_at).toLocaleString("zh-CN")}
                                        </div>
                                    </div>
                                    <div
                                        className={`px-2 py-1 rounded ${
                                            log.status_code === 200
                                                ? "bg-green-100 text-green-800"
                                                : "bg-red-100 text-red-800"
                                        }`}
                                    >
                                        {log.status_code}
                                    </div>
                                </div>
                            ))}
                            {(!stats?.recentLogs || stats.recentLogs.length === 0) && (
                                <div className='text-center text-muted-foreground py-4'>
                                    暂无日志数据
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
}
