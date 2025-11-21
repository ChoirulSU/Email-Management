# API 测试脚本 (Python 版本)
# 使用方法: python test-api.py
# 需要安装: pip install requests

import requests
import json

BASE_URL = 'https://mail-manager.pages.dev'
API_KEY = 'your-api-key-here'  # 替换为你的 API_SECRET_KEY

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    RESET = '\033[0m'

def test_api(name, method, endpoint, data=None, expected_status=200, api_key=API_KEY):
    """测试 API 接口"""
    print(f"{Colors.YELLOW}{name}{Colors.RESET}")

    headers = {
        'Content-Type': 'application/json',
        'X-API-Key': api_key
    }

    url = f"{BASE_URL}{endpoint}"

    try:
        if method == 'POST':
            response = requests.post(url, json=data, headers=headers)
        elif method == 'GET':
            response = requests.get(url, headers=headers)
        else:
            print(f"{Colors.RED}✗ 不支持的 HTTP 方法{Colors.RESET}\n")
            return {'success': False}

        print(f"HTTP 状态码: {response.status_code}")

        try:
            result = response.json()
            print(f"响应: {json.dumps(result, ensure_ascii=False, indent=2)}")
        except:
            print(f"响应: {response.text}")
            result = None

        if response.status_code == expected_status:
            print(f"{Colors.GREEN}✓ 测试通过{Colors.RESET}")
            return {'success': True, 'data': result}
        else:
            print(f"{Colors.RED}✗ 测试失败 (期望 {expected_status}, 实际 {response.status_code}){Colors.RESET}")
            return {'success': False, 'data': result}

    except Exception as e:
        print(f"{Colors.RED}✗ 测试异常: {str(e)}{Colors.RESET}")
        return {'success': False, 'error': str(e)}
    finally:
        print()

def main():
    print("==================================")
    print("邮箱管理系统 API 测试脚本")
    print("==================================")
    print()

    test_email = None

    # 测试 1: 获取 1 个邮箱
    test1 = test_api(
        '测试 1: 获取 1 个邮箱',
        'POST',
        '/api/v1/emails/fetch',
        {'count': 1}
    )

    if test1['success'] and test1['data'] and test1['data'].get('data'):
        emails = test1['data']['data']
        if len(emails) > 0:
            test_email = emails[0]['email']
            print(f"提取到的邮箱: {test_email}\n")

    # 测试 2: 获取指定平台的邮箱
    test_api(
        '测试 2: 获取 Google 平台的邮箱',
        'POST',
        '/api/v1/emails/fetch',
        {'platform': 'google', 'count': 2}
    )

    # 测试 3: 设置邮箱状态
    if test_email:
        test_api(
            '测试 3: 设置邮箱状态',
            'POST',
            '/api/v1/emails/status',
            {
                'email': test_email,
                'isUsed': True,
                'usedPlatforms': ['google']
            }
        )

    # 测试 4: 批量获取邮箱
    test4 = test_api(
        '测试 4: 批量获取 5 个邮箱',
        'POST',
        '/api/v1/emails/fetch',
        {'count': 5, 'isUsed': False}
    )

    if test4['success'] and test4['data'] and test4['data'].get('data'):
        count = len(test4['data']['data'])
        print(f"获取到 {count} 个邮箱\n")

    # 测试 5: 错误的 API Key
    test_api(
        '测试 5: 使用错误的 API Key (应该返回 401)',
        'POST',
        '/api/v1/emails/fetch',
        {'count': 1},
        expected_status=401,
        api_key='wrong-api-key'
    )

    # 测试 6: 缺少必填参数
    test_api(
        '测试 6: 设置状态但缺少邮箱参数 (应该返回错误)',
        'POST',
        '/api/v1/emails/status',
        {'isUsed': True}
    )

    # 测试 7: 删除邮箱 (谨慎使用)
    # if test_email:
    #     test_api(
    #         '测试 7: 删除邮箱',
    #         'POST',
    #         '/api/v1/emails/delete',
    #         {'email': test_email}
    #     )

    # 测试 8: 获取包含已使用的邮箱
    test_api(
        '测试 8: 获取包含已使用的邮箱',
        'POST',
        '/api/v1/emails/fetch',
        {'count': 3, 'isUsed': True}
    )

    # 测试 9: 获取不存在的平台
    test_api(
        '测试 9: 获取不存在的平台',
        'POST',
        '/api/v1/emails/fetch',
        {'platform': 'nonexistent', 'count': 1}
    )

    print("==================================")
    print("测试完成")
    print("==================================")

if __name__ == '__main__':
    main()
