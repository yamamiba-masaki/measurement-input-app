# 建付け測定入力アプリ

デジタルノギス無線測定システムを用いた、建付け測定値の自動入力・判定・管理アプリケーション。

## 機能概要

### 1. 測定値の自動判定
- マスターデータ（基準値・許容範囲）から測定値を自動判定
- OK/NG の即座な判定結果表示
- 基準値：25.00mm、許容範囲：±0.10mm

### 2. 測定結果管理
- 測定結果をPostgreSQLデータベースに自動保存
- 再測定機能（NG時の再測定対応）
- 測定履歴の参照・検索

### 3. 日報出力
- 日次測定結果の統計情報生成
- PDF形式での日報出力
- 集計統計（合計、OK件数、NG件数、再測定件数）

## システム構成

```
measurement-input-app/
├── backend/
│   ├── server.js              # Express サーバー
│   ├── package.json           # 依存パッケージ
│   ├── Dockerfile             # Docker イメージ定義
│   ├── config/
│   │   └── database.js        # DB接続設定
│   ├── services/
│   │   ├── measurementService.js   # 測定ロジック
│   │   └── pdfService.js           # PDF生成
│   └── routes/
│       ├── measurements.js    # 測定API
│       ├── masterData.js      # マスターデータAPI
│       └── reports.js         # レポートAPI
├── frontend/
│   ├── public/
│   │   ├── index.html         # UI
│   │   ├── styles.css         # スタイル
│   │   └── script.js          # クライアント処理
├── database/
│   └── schema.sql             # DBスキーマ
└── docker-compose.yml         # Docker Compose 設定
```

## 技術スタック

- **フロントエンド**: HTML5, CSS3, JavaScript
- **バックエンド**: Node.js, Express.js
- **データベース**: PostgreSQL 15
- **コンテナ化**: Docker, Docker Compose
- **PDF生成**: PDFKit

## インストール・実行方法

### 前提条件
- Docker & Docker Compose がインストール済み
- Git がインストール済み

### セットアップ

1. リポジトリをクローン
```bash
git clone https://github.com/yamamiba-masaki/measurement-input-app.git
cd measurement-input-app
```

2. Docker Compose で起動
```bash
docker-compose up -d
```

3. アプリケーションにアクセス
```
http://localhost:3000
```

4. PostgreSQL に接続確認
```bash
docker-compose exec postgres psql -U admin -d measurement_db
```

## API エンドポイント

### マスターデータ取得
```
GET /api/master-data
GET /api/master-data/:id
```

### 測定値記録
```
POST /api/measurements/record
Body: {
  "masterDataId": 1,
  "measuredValue": 25.05
}
```

### 再測定記録
```
POST /api/measurements/retake
Body: {
  "masterDataId": 1,
  "measuredValue": 25.02,
  "originalMeasurementId": 1
}
```

### 測定履歴取得
```
GET /api/measurements
GET /api/measurements/date/:date (YYYY-MM-DD)
```

### 統計情報取得
```
GET /api/reports/stats/:date (YYYY-MM-DD)
```

### 日報PDF出力
```
GET /api/reports/daily/:date (YYYY-MM-DD)
```

## データベーススキーマ

### master_data テーブル
| カラム | 型 | 説明 |
|--------|----|----|
| id | SERIAL | 主キー |
| item_name | VARCHAR | 部品名 |
| standard_value | DECIMAL | 基準値 |
| tolerance_plus | DECIMAL | 上限許容範囲 |
| tolerance_minus | DECIMAL | 下限許容範囲 |
| unit | VARCHAR | 単位（mm等） |
| created_at | TIMESTAMP | 作成日時 |
| updated_at | TIMESTAMP | 更新日時 |

### measurements テーブル
| カラム | 型 | 説明 |
|--------|----|----|
| id | SERIAL | 主キー |
| master_data_id | INTEGER | マスターデータID |
| measured_value | DECIMAL | 測定値 |
| judgment | VARCHAR | OK/NG判定 |
| is_retake | BOOLEAN | 再測定フラグ |
| original_measurement_id | INTEGER | 元測定ID |
| measurement_date | TIMESTAMP | 測定日時 |

## 使用方法

### 1. 測定値入力画面

1. 「測定入力」タブを選択
2. 部品をドロップダウンから選択
3. 基準値と許容範囲が表示される
4. デジタルノギスから測定値を入力
5. 「測定値を記録」ボタンをクリック
6. OK/NG 判定が即座に表示される

### 2. NG時の再測定

1. NG判定が表示された場合、「再測定」ボタンをクリック
2. 再測定値を入力
3. 「再測定を記録」ボタンをクリック
4. 結果が更新される

### 3. 測定履歴確認

1. 「測定履歴」タブを選択
2. 日付を選択
3. 「検索」ボタンをクリック
4. その日の統計情報と詳細な測定記録が表示される

### 4. 日報出力

1. 「日報出力」タブを選択
2. 報告日を選択
3. 「PDFをダウンロード」をクリックして PDF を取得
4. または「プレビュー」で画面上に表示

## トラブルシューティング

### データベース接続エラー
```bash
# ログ確認
docker-compose logs postgres

# DB コンテナ再起動
docker-compose restart postgres
```

### ポート競合エラー
```bash
# ポート確認
lsof -i :3000
lsof -i :5432

# docker-compose.yml のポート番号を変更してから再起動
docker-compose down
docker-compose up -d
```

### テーブル存在しないエラー
```bash
# スキーマの再実行
docker-compose exec postgres psql -U admin -d measurement_db -f /docker-entrypoint-initdb.d/schema.sql
```

## 環境変数

`.env` ファイルで以下を設定可能：

```
DB_HOST=postgres
DB_PORT=5432
DB_USER=admin
DB_PASSWORD=password123
DB_NAME=measurement_db
NODE_ENV=development
PORT=3000
```

## ライセンス

MIT License

## 作成者

yamamiba-masaki

## 更新履歴

- v1.0.0 (2024-07) - 初版リリース
  - 基本測定機能
  - 自動判定機能
  - 再測定機能
  - 日報PDF出力機能
