#!/bin/bash

# エラーが出たら止まる設定
set -e

echo "💾 EBSボリューム拡張後のファイルシステム拡張スクリプト"
echo ""

# 現在のディスク使用量を表示
echo "📊 現在のディスク使用量:"
df -h
echo ""

# パーティション情報を表示
echo "📊 パーティション情報:"
lsblk
echo ""

# ルートファイルシステムのデバイスを確認
ROOT_DEVICE_DISPLAY=$(df / | tail -1 | awk '{print $1}')
echo "📊 ルートファイルシステム（表示）: $ROOT_DEVICE_DISPLAY"

# /dev/rootの場合は実際のデバイスをlsblkから取得
if [ "$ROOT_DEVICE_DISPLAY" == "/dev/root" ]; then
    # lsblkから実際のデバイスを取得（ルートにマウントされているパーティション）
    ACTUAL_DEVICE=$(lsblk -n -o NAME,MOUNTPOINT | grep -E " /$| / " | head -1 | awk '{print $1}')
    if [ -z "$ACTUAL_DEVICE" ]; then
        # 別の方法で取得
        ACTUAL_DEVICE=$(lsblk -n -o PKNAME,MOUNTPOINT | grep " /$" | awk '{print $1}')
        if [ ! -z "$ACTUAL_DEVICE" ]; then
            # パーティション番号も取得
            PART_NAME=$(lsblk -n -o NAME,MOUNTPOINT | grep " /$" | awk '{print $1}')
            ACTUAL_DEVICE="/dev/$PART_NAME"
        fi
    else
        ACTUAL_DEVICE="/dev/$ACTUAL_DEVICE"
    fi
    echo "📊 実際のデバイス（lsblkから）: $ACTUAL_DEVICE"
    ROOT_DEVICE=$ACTUAL_DEVICE
else
    ROOT_DEVICE=$ROOT_DEVICE_DISPLAY
    ACTUAL_DEVICE=$ROOT_DEVICE
fi

# デバイスが見つからない場合のフォールバック
if [ -z "$ROOT_DEVICE" ] || [ "$ROOT_DEVICE" == "/dev/" ]; then
    echo "⚠️  lsblkからデバイスを取得できませんでした。手動で指定します..."
    # lsblkの出力から推測
    ROOT_PART=$(lsblk -n -o NAME,MOUNTPOINT | grep " /$" | awk '{print $1}')
    if [ ! -z "$ROOT_PART" ]; then
        ROOT_DEVICE="/dev/$ROOT_PART"
        echo "📊 推測されたデバイス: $ROOT_DEVICE"
    else
        echo "❌ デバイスを特定できませんでした。手動で実行してください。"
        echo "   lsblk の出力を確認し、ルートパーティション（/）のデバイス名を使用してください"
        exit 1
    fi
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

# growpartがインストールされているか確認
if ! command -v growpart &> /dev/null; then
    echo "📦 growpartをインストール中..."
    sudo apt-get update
    sudo apt-get install -y cloud-guest-utils
fi

# パーティションを拡張
echo "🔧 パーティションを拡張中..."
echo "   デバイス: $BASE_DEVICE"
echo "   パーティション: $PARTITION_NUM"
echo ""

sudo growpart $BASE_DEVICE $PARTITION_NUM

echo "✅ パーティションの拡張が完了しました"
echo ""

# ファイルシステムのタイプを確認
FS_TYPE=$(df -T / | tail -1 | awk '{print $2}')
echo "📊 ファイルシステムタイプ: $FS_TYPE"
echo ""

# ファイルシステムを拡張
echo "🔧 ファイルシステムを拡張中..."
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

# 拡張後のディスク使用量を表示
echo "📊 拡張後のディスク使用量:"
df -h
echo ""

echo "✅ すべての拡張処理が完了しました！"
