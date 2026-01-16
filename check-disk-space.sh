#!/bin/bash

echo "💾 EC2インスタンスのディスク容量を確認します..."
echo ""

# 1. 全体のディスク使用量
echo "📊 全体のディスク使用量:"
df -h
echo ""

# 2. 現在のディレクトリのディスク使用量
echo "📊 現在のディレクトリのディスク使用量:"
df -h .
echo ""

# 3. 大きなディレクトリを特定
echo "📊 大きなディレクトリ（上位10個）:"
du -h --max-depth=1 . 2>/dev/null | sort -hr | head -10
echo ""

# 4. 特定のディレクトリのサイズ
echo "📊 ビルド関連ディレクトリのサイズ:"
if [ -d "target" ]; then
    echo "  target/: $(du -sh target 2>/dev/null | cut -f1)"
fi
if [ -d "frontend/node_modules" ]; then
    echo "  frontend/node_modules/: $(du -sh frontend/node_modules 2>/dev/null | cut -f1)"
fi
if [ -d "frontend/dist" ]; then
    echo "  frontend/dist/: $(du -sh frontend/dist 2>/dev/null | cut -f1)"
fi
if [ -d "$HOME/.m2/repository" ]; then
    echo "  ~/.m2/repository/: $(du -sh $HOME/.m2/repository 2>/dev/null | cut -f1)"
fi
echo ""

# 5. EBSボリュームの情報（AWS CLIがインストールされている場合）
if command -v aws &> /dev/null; then
    echo "📊 EBSボリューム情報:"
    aws ec2 describe-volumes --filters "Name=attachment.instance-id,Values=$(curl -s http://169.254.169.254/latest/meta-data/instance-id)" --query 'Volumes[*].[VolumeId,Size,VolumeType]' --output table 2>/dev/null || echo "  AWS CLIの設定が必要です"
    echo ""
fi

# 6. インスタンスタイプの情報（AWS CLIがインストールされている場合）
if command -v aws &> /dev/null; then
    echo "📊 EC2インスタンス情報:"
    INSTANCE_ID=$(curl -s http://169.254.169.254/latest/meta-data/instance-id)
    aws ec2 describe-instances --instance-ids $INSTANCE_ID --query 'Reservations[0].Instances[0].[InstanceType,InstanceId]' --output table 2>/dev/null || echo "  AWS CLIの設定が必要です"
    echo ""
fi

echo "✅ 確認完了"
