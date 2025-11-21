#!/bin/bash

# API 测试脚本
# 使用方法: ./test-api.sh

# 配置
BASE_URL="https://mail-manager.pages.dev"
API_KEY="your-api-key-here"  # 替换为你的 API_SECRET_KEY

echo "=================================="
echo "邮箱管理系统 API 测试脚本"
echo "=================================="
echo ""

# 颜色输出
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试 1: 获取邮箱
echo -e "${YELLOW}测试 1: 获取 1 个邮箱${NC}"
response=$(curl -s -X POST "${BASE_URL}/api/v1/emails/fetch" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ${API_KEY}" \
  -d '{"count": 1}')

echo "响应: $response"

# 检查是否成功
if echo "$response" | grep -q '"status":"success"'; then
    echo -e "${GREEN}✓ 测试通过${NC}"
    # 提取邮箱地址用于后续测试
    TEST_EMAIL=$(echo "$response" | grep -o '"email":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo "提取到的邮箱: $TEST_EMAIL"
else
    echo -e "${RED}✗ 测试失败${NC}"
fi
echo ""

# 测试 2: 获取指定平台的邮箱
echo -e "${YELLOW}测试 2: 获取 Google 平台的邮箱${NC}"
response=$(curl -s -X POST "${BASE_URL}/api/v1/emails/fetch" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ${API_KEY}" \
  -d '{"platform": "google", "count": 2}')

echo "响应: $response"

if echo "$response" | grep -q '"status":"success"'; then
    echo -e "${GREEN}✓ 测试通过${NC}"
else
    echo -e "${RED}✗ 测试失败${NC}"
fi
echo ""

# 测试 3: 设置邮箱状态（需要先有邮箱）
if [ ! -z "$TEST_EMAIL" ]; then
    echo -e "${YELLOW}测试 3: 设置邮箱状态${NC}"
    response=$(curl -s -X POST "${BASE_URL}/api/v1/emails/status" \
      -H "Content-Type: application/json" \
      -H "X-API-Key: ${API_KEY}" \
      -d "{\"email\": \"${TEST_EMAIL}\", \"isUsed\": true, \"usedPlatforms\": [\"google\"]}")

    echo "响应: $response"

    if echo "$response" | grep -q '"status":"success"'; then
        echo -e "${GREEN}✓ 测试通过${NC}"
    else
        echo -e "${RED}✗ 测试失败${NC}"
    fi
    echo ""
fi

# 测试 4: 批量获取邮箱
echo -e "${YELLOW}测试 4: 批量获取 5 个邮箱${NC}"
response=$(curl -s -X POST "${BASE_URL}/api/v1/emails/fetch" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ${API_KEY}" \
  -d '{"count": 5, "isUsed": false}')

echo "响应: $response"

if echo "$response" | grep -q '"status":"success"'; then
    count=$(echo "$response" | grep -o '"email":' | wc -l)
    echo -e "${GREEN}✓ 测试通过 (获取到 ${count} 个邮箱)${NC}"
else
    echo -e "${RED}✗ 测试失败${NC}"
fi
echo ""

# 测试 5: 错误的 API Key
echo -e "${YELLOW}测试 5: 使用错误的 API Key (应该返回 401)${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/api/v1/emails/fetch" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: wrong-key" \
  -d '{"count": 1}')

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

echo "HTTP 状态码: $http_code"
echo "响应: $body"

if [ "$http_code" = "401" ]; then
    echo -e "${GREEN}✓ 测试通过 (正确返回 401)${NC}"
else
    echo -e "${RED}✗ 测试失败 (期望 401，实际 ${http_code})${NC}"
fi
echo ""

# 测试 6: 缺少必填参数
echo -e "${YELLOW}测试 6: 设置状态但缺少邮箱参数${NC}"
response=$(curl -s -X POST "${BASE_URL}/api/v1/emails/status" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ${API_KEY}" \
  -d '{"isUsed": true}')

echo "响应: $response"

if echo "$response" | grep -q '"status":"error"'; then
    echo -e "${GREEN}✓ 测试通过 (正确返回错误)${NC}"
else
    echo -e "${RED}✗ 测试失败${NC}"
fi
echo ""

echo "=================================="
echo "测试完成"
echo "=================================="
