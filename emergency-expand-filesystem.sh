#!/bin/bash

# ディスク容量不足の緊急対応とファイルシステム拡張スクリプト
# このスクリプトは、ディスクが100%使用されている場合に実行します

echo "🚨 ディスク容量不足の緊急対応を開始します..."
echo ""

# 現在のディスク使用量を表示
echo "📊 現在のディスク使用量:"
df -h
echo ""

# ============================================
# ステップ1: 緊急クリーンアップ
# ============================================
echo "🧹 ステップ1: 緊急クリーンアップを実行中..."
echo ""

# クリーンアップ中はエラーを無視（set -eを一時的に無効化）
set +e

# 1. Mavenのtargetディレクトリを削除
if [ -d "target" ]; then
    echo "📦 Maven targetディレクトリを削除中..."
    rm -rf target
    echo "✅ targetディレクトリを削除しました"
fi

# 2. フロントエンドのnode_modulesとdistを削除
if [ -d "frontend/node_modules" ]; then
    echo "📦 フロントエンドのnode_modulesを削除中..."
    rm -rf frontend/node_modules
    echo "✅ node_modulesを削除しました"
fi

if [ -d "frontend/dist" ]; then
    echo "📦 フロントエンドのdistディレクトリを削除中..."
    rm -rf frontend/dist
    echo "✅ distディレクトリを削除しました"
fi

# 3. Maven依存関係キャッシュの古いアーティファクトを削除
if [ -d "$HOME/.m2/repository" ]; then
    echo "📦 Maven依存関係キャッシュをクリーンアップ中..."
    # 古いスナップショットを削除
    find $HOME/.m2/repository -type d -name "*-SNAPSHOT" -mtime +7 -exec rm -rf {} + 2>/dev/null || true
    # 空のディレクトリを削除
    find $HOME/.m2/repository -type d -empty -delete 2>/dev/null || true
    echo "✅ Mavenキャッシュをクリーンアップしました"
fi

# 4. 一時ファイルとログファイルを削除
echo "📦 一時ファイルとログファイルを削除中..."
find . -type f -name "*.log" -not -path "./.git/*" -delete 2>/dev/null || true
find . -type f -name "*.tmp" -not -path "./.git/*" -delete 2>/dev/null || true
find . -type d -name ".DS_Store" -exec rm -rf {} + 2>/dev/null || true

# 5. Spring Bootのstaticディレクトリをクリーンアップ
if [ -d "src/main/resources/static" ]; then
    echo "📦 Spring Bootのstaticディレクトリをクリーンアップ中..."
    rm -rf src/main/resources/static/*
    echo "✅ staticディレクトリをクリーンアップしました"
fi

# 6. システム全体のクリーンアップ（aptキャッシュなど）
echo "📦 システムのaptキャッシュをクリーンアップ中..."
sudo apt-get clean 2>/dev/null || true
sudo apt-get autoclean 2>/dev/null || true
echo "✅ aptキャッシュをクリーンアップしました"

# 7. 古いカーネルを削除（容量が大きい場合がある）
echo "📦 未使用のカーネルを確認中..."
OLD_KERNELS=$(dpkg -l 2>/dev/null | grep -E 'linux-image-[0-9]' | grep -v $(uname -r) | awk '{print $2}' | head -2)
if [ ! -z "$OLD_KERNELS" ]; then
    echo "  未使用のカーネルが見つかりました: $OLD_KERNELS"
    echo "  削除を試行します..."
    sudo apt-get purge -y $OLD_KERNELS 2>/dev/null || true
fi

# 8. Dockerのクリーンアップ（Dockerがインストールされている場合）
if command -v docker &> /dev/null; then
    echo "📦 Dockerの未使用リソースをクリーンアップ中..."
    docker system prune -f 2>/dev/null || true
    echo "✅ Dockerリソースをクリーンアップしました"
fi

# エラー時に停止する設定に戻す
set -e

echo ""
echo "📊 クリーンアップ後のディスク使用量:"
df -h
echo ""

# ============================================
# ステップ2: dpkgの問題を修正
# ============================================
echo "🔧 ステップ2: dpkgの問題を修正中..."
sudo dpkg --configure -a
echo "✅ dpkgの問題を修正しました"
echo ""

# ============================================
# ステップ3: パーティション情報の確認
# ============================================
echo "📊 ステップ3: パーティション情報を確認中..."
lsblk
echo ""

# ルートファイルシステムのデバイスを確認
ROOT_DEVICE_DISPLAY=$(df / | tail -1 | awk '{print $1}')
echo "📊 ルートファイルシステム（表示）: $ROOT_DEVICE_DISPLAY"

# lsblkから実際のデバイスを取得（ルートにマウントされているパーティション）
ROOT_PART_NAME=$(lsblk -n -o NAME,MOUNTPOINT | awk '$2 == "/" {print $1; exit}')
if [ -z "$ROOT_PART_NAME" ]; then
    # 別の方法で取得（スペースを含む場合）
    ROOT_PART_NAME=$(lsblk -n -o NAME,MOUNTPOINT | grep -E '[[:space:]]+/$' | awk '{print $1; exit}')
fi

if [ ! -z "$ROOT_PART_NAME" ]; then
    ROOT_DEVICE="/dev/$ROOT_PART_NAME"
    echo "📊 実際のデバイス（lsblkから）: $ROOT_DEVICE"
else
    echo "❌ デバイスを特定できませんでした。"
    echo "   lsblk の出力を確認し、ルートパーティション（/）のデバイス名を使用してください"
    exit 1
fi

echo "📊 使用するデバイス: $ROOT_DEVICE"
echo ""

# デバイス名からパーティション番号を抽出
if [[ $ROOT_DEVICE == /dev/nvme* ]]; then
    # NVMeデバイスの場合（例: /dev/nvme0n1p1）
    if [[ $ROOT_DEVICE =~ p[0-9]+$ ]]; then
        BASE_DEVICE=$(echo $ROOT_DEVICE | sed 's/p[0-9]*$//')
        PARTITION_NUM=$(echo $ROOT_DEVICE | grep -o 'p[0-9]*$' | sed 's/p//')
    else
        # パーティション番号がない場合（例: /dev/nvme0n1）
        BASE_DEVICE=$ROOT_DEVICE
        PARTITION_NUM="1"
    fi
    PARTITION_DEVICE="${BASE_DEVICE}p${PARTITION_NUM}"
elif [[ $ROOT_DEVICE == /dev/xvda* ]] || [[ $ROOT_DEVICE == /dev/sda* ]]; then
    # 従来のデバイスの場合（例: /dev/xvda1, /dev/sda1）
    BASE_DEVICE=$(echo $ROOT_DEVICE | sed 's/[0-9]*$//')
    PARTITION_NUM=$(echo $ROOT_DEVICE | grep -o '[0-9]*$')
    PARTITION_DEVICE=$ROOT_DEVICE
else
    # その他のデバイス
    BASE_DEVICE=$(echo $ROOT_DEVICE | sed 's/[0-9]*$//')
    PARTITION_NUM=$(echo $ROOT_DEVICE | grep -o '[0-9]*$')
    PARTITION_DEVICE=$ROOT_DEVICE
fi

echo "📊 ベースデバイス: $BASE_DEVICE"
echo "📊 パーティション番号: $PARTITION_NUM"
echo ""

# ============================================
# ステップ4: growpartのインストール（必要な場合）
# ============================================
echo "🔧 ステップ4: growpartのインストールを確認中..."
if ! command -v growpart &> /dev/null; then
    echo "📦 growpartをインストール中..."
    # ディスク容量が不足している可能性があるため、apt-get updateはスキップ
    # 既存のパッケージリストを使用
    sudo apt-get install -y cloud-guest-utils || {
        echo "⚠️  apt-get installが失敗しました。手動でインストールしてください。"
        echo "   sudo apt-get update"
        echo "   sudo apt-get install -y cloud-guest-utils"
        exit 1
    }
fi
echo "✅ growpartが利用可能です"
echo ""

# ============================================
# ステップ5: パーティションを拡張（TMPDIRを設定）
# ============================================
echo "🔧 ステップ5: パーティションを拡張中..."
echo "   デバイス: $BASE_DEVICE"
echo "   パーティション: $PARTITION_NUM"
echo ""

# /tmpが使用できない場合に備えて、TMPDIRを別の場所に設定
# /var/tmpや/home/ubuntu/tmpなど、利用可能な場所を試す
TMP_DIRS=("/var/tmp" "$HOME/tmp" "/tmp")
TMPDIR_SET=""

for tmp_dir in "${TMP_DIRS[@]}"; do
    if [ -d "$tmp_dir" ] && [ -w "$tmp_dir" ]; then
        # ディレクトリが存在し、書き込み可能か確認
        AVAIL_SPACE=$(df "$tmp_dir" | tail -1 | awk '{print $4}')
        # 少なくとも10MBの空き容量が必要
        if [ "$AVAIL_SPACE" -gt 10240 ]; then
            TMPDIR_SET="$tmp_dir"
            break
        fi
    fi
done

if [ -z "$TMPDIR_SET" ]; then
    # 利用可能なディレクトリが見つからない場合、/home/ubuntu/tmpを作成
    mkdir -p "$HOME/tmp"
    TMPDIR_SET="$HOME/tmp"
fi

echo "📊 TMPDIRを設定: $TMPDIR_SET"
export TMPDIR="$TMPDIR_SET"

# growpartを実行
sudo TMPDIR="$TMPDIR_SET" growpart $BASE_DEVICE $PARTITION_NUM

echo "✅ パーティションの拡張が完了しました"
echo ""

# ============================================
# ステップ6: ファイルシステムを拡張
# ============================================
echo "🔧 ステップ6: ファイルシステムを拡張中..."

# ファイルシステムのタイプを確認
FS_TYPE=$(df -T / | tail -1 | awk '{print $2}')
echo "📊 ファイルシステムタイプ: $FS_TYPE"
echo ""

if [ "$FS_TYPE" == "xfs" ]; then
    sudo xfs_growfs /
elif [ "$FS_TYPE" == "ext4" ] || [ "$FS_TYPE" == "ext3" ] || [ "$FS_TYPE" == "ext2" ]; then
    # ext4の場合は、パーティションデバイスまたはマウントポイントを使用
    if [ -b "$PARTITION_DEVICE" ]; then
        sudo resize2fs $PARTITION_DEVICE
    else
        # デバイスが見つからない場合はマウントポイントから
        sudo resize2fs $ROOT_DEVICE
    fi
else
    echo "⚠️  不明なファイルシステムタイプ: $FS_TYPE"
    echo "   手動で拡張してください"
    exit 1
fi

echo "✅ ファイルシステムの拡張が完了しました"
echo ""

# ============================================
# ステップ7: 最終確認
# ============================================
echo "📊 拡張後のディスク使用量:"
df -h
echo ""

echo "✅ すべての処理が完了しました！"
echo ""
echo "📝 次のステップ:"
echo "   1. 必要に応じて、削除したファイルを再生成してください"
echo "   2. アプリケーションを再ビルドしてください"
