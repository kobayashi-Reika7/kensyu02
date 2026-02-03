# Day4 ToDoアプリ ドキュメント

データモデル・画面仕様（Day2準拠）・動作確認手順をまとめています。

---

## 1. 概要・アーキテクチャ

- **構成**: React (Vite) + Firebase Firestore。フロントから Firestore へ直接アクセス。
- **バックエンド**: FastAPI は補助用途（`GET /health` 等）。ToDo の正は Firestore。

```
[ブラウザ]
    │  HTTPS (Firebase SDK)
    ▼
[React フロントエンド]  ←  Vite 開発サーバ (localhost:5100)
    │  Firestore 呼び出し（firestore.js）
    ▼
[Firebase Firestore]  ←  コレクション: lists, todos
```

---

## 2. データモデル（Firestore）

### lists コレクション

| フィールド | 型     | 説明     |
|------------|--------|----------|
| name       | string | リスト名 |

- ドキュメント ID は Firestore の自動採番（他で `list_id` として参照）。
- **デフォルトリスト**: 名前は「マイリスト」。リストが 0 件または「マイリスト」が無いときに 1 件自動作成され、削除不可。

### todos コレクション（タスク）

| フィールド   | 型        | 説明                     |
|--------------|------------|--------------------------|
| title        | string     | タイトル                 |
| list_id      | string     | 所属リストのドキュメント ID |
| is_completed | boolean    | 完了フラグ               |
| is_favorite  | boolean    | お気に入り               |
| due_date     | string \| null | 期限（YYYY-MM-DD）   |
| memo         | string     | メモ                     |
| time         | number     | タイマー経過秒数         |
| createdAt    | Timestamp  | 作成日時                 |

- `list_id` が無い既存ドキュメントは取得時にデフォルトリスト ID で補う。
- **表示順**: 新規追加は先頭。Firestore 取得後、クライアント側でソート。

---

## 3. ディレクトリ・コンポーネント・API

### 3.1 ディレクトリ構成

```
Day4/
├── docs/
│   └── README.md          # 本ドキュメント
├── frontend/
│   ├── src/
│   │   ├── firebase/firebase.js
│   │   ├── services/firestore.js   # lists / todos の CRUD
│   │   ├── api.js                  # 任意・バックエンド連携用
│   │   ├── utils/taskUtils.js
│   │   ├── constants/messages.js
│   │   ├── components/     # ListSelector, TaskForm, TaskList, TaskItem, Counter, Timer, Memo
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── vite.config.js      # port 5100
│   └── .env.example
├── backend/                # 任意（FastAPI 参考用）
└── README.md
```

### 3.2 主要コンポーネント

| コンポーネント | 責務 |
|----------------|------|
| App | 状態（tasks, lists, currentListId, runningTimerTaskId 等）の保持。Firestore 取得・更新。 |
| ListSelector | リスト選択・リスト追加・削除。名前が「マイリスト」のリストをデフォルトとして削除不可。 |
| TaskForm | タスク入力と追加。 |
| TaskList | 現在リストに属するタスクのみ表示。 |
| TaskItem | 1 タスクの表示・完了・編集・削除・お気に入り・期限・タイマー・メモ。 |
| Counter | 未完了・完了・お気に入り・期限切れの件数表示。 |
| Timer | 経過表示・開始/停止/リセット。停止時に親経由で Firestore に time 保存。 |
| Memo | テキストエリア。Blur 時に親経由で Firestore に memo 保存。 |

### 3.3 Firestore API（firestore.js）

| 関数 | 説明 |
|------|------|
| getLists() | リスト一覧取得 |
| addList(name) | リスト追加 |
| deleteList(id, defaultListId) | リスト削除（属するタスクは defaultListId に移動） |
| getTasks(defaultListId) | タスク一覧取得（list_id 欠損時は defaultListId で補う） |
| addTask({ title, list_id, ... }) | タスク追加 |
| updateTask(id, data) | タスク更新（部分更新可） |
| deleteTask(id) | タスク削除 |

---

## 4. 起動・画面構成

### 4.1 起動

```bash
cd Day4/frontend
npm install
npm run dev
```

- ブラウザで **http://localhost:5100** を開く。
- `.env` に Firebase 設定（`VITE_FIREBASE_*`）が入っていること。詳細は **`frontend/SETUP_FIREBASE.md`** を参照。

### 4.2 画面構成（Day2 準拠）

- 見出し「ToDoアプリ」
- カウンター行: 未完了／完了／お気に入り／期限切れ
- リストセクション: セレクト、リスト追加、リスト削除
- タスク入力欄と「追加」ボタン
- タスク一覧（各タスクにチェック／編集／削除／★／期限／メモ／タイマー UI）

---

## 5. 動作確認チェックリスト

### 5.1 確認項目一覧

| # | 確認内容 | 期待する結果 |
|---|----------|--------------|
| 1 | 初回表示 | デフォルトで「マイリスト」が 1 件ある |
| 2 | タスク追加 | 入力→追加で一覧にタスクが増える。**新規タスクは先頭**に出る |
| 3 | タスク完了 | チェックで完了／未完了が切り替わる |
| 4 | タスク編集 | 編集でタイトルを変更できる |
| 5 | お気に入り | ★でお気に入り ON/OFF できる |
| 6 | 期限 | 日付を選ぶと「期限内／期限切れ」が変わる |
| 7 | タイマー | 開始・停止・リセットで経過が変わる（停止後は Firestore に保存されリロード後も残る） |
| 8 | メモ | メモ欄の入力が保持される（リロード後も残る） |
| 9 | タスク削除 | 削除で一覧から消える |
| 10 | リスト追加 | 新しいリストがセレクトに増える |
| 11 | リスト切り替え | セレクトで切り替えると、そのリストのタスクだけ表示される |
| 12 | リスト削除 | デフォルト以外のリストを削除できる。削除時は属するタスクをデフォルトへ移動 |
| 13 | デフォルト削除不可 | デフォルトリストは削除ボタンが無効 |
| 14 | リロード | 再読み込み後もタスク・リスト・メモ等が残る |
| 15 | Firestore | Firebase Console で `lists` / `todos` にデータがある |

### 5.2 動作確認手順（手順書）

#### 準備

1. `Day4/frontend` で `npm install` を実行。
2. `.env.example` を `.env` にコピーし、Firebase 設定（`VITE_FIREBASE_*`）を記入。
3. `npm run dev` で起動し、http://localhost:5100 を開く。

#### 1. 初回表示

- [ ] 見出し「ToDoアプリ」が表示されている。
- [ ] カウンターが「未完了：0件」「完了：0件」「お気に入り：0件」「期限切れ：0件」となっている。
- [ ] リストに「マイリスト」が 1 件ある。
- [ ] タスク一覧は空。

#### 2. タスク操作

- [ ] タスク入力欄に「テストタスク」と入力し「追加」→ 一覧に表示される。
- [ ] チェックボックスをクリック → 完了状態になる（取り消しも可能）。
- [ ] 編集ボタンでタイトルを変更できる。
- [ ] ★ボタンでお気に入り ON/OFF できる。
- [ ] 期限を設定すると「期限内／期限切れ」が表示される。
- [ ] メモ欄に入力し他をクリック（Blur）→ リロード後もメモが残る。
- [ ] タイマーを開始 → 経過が進む。停止・リセットで挙動が変わる。
- [ ] ページをリロード → タイマー経過も残る（Day4 では time を Firestore に保存）。
- [ ] 削除ボタンでタスクが消える。

#### 3. リスト操作

- [ ] 「リスト追加」で新しいリストを追加 → セレクトに増える。
- [ ] セレクトで切り替えると、表示タスクが変わる。
- [ ] デフォルト以外のリストを選択して「リスト削除」→ 確認後、そのリストが消え、タスクはデフォルトへ移動する。
- [ ] デフォルトリスト選択時は「リスト削除」が無効または非表示。

#### 4. 永続化確認

- [ ] タスク・リスト・メモ等を操作したあと、ページをリロードする。
- [ ] データが保持されている。
- [ ] [Firebase Console](https://console.firebase.google.com/) → Firestore で `lists` / `todos` にドキュメントがある。

### 5.3 エラー時の確認

| 現象 | 確認内容 |
|------|----------|
| 画面が真っ白 | F12 の Console でエラー確認。`.env` 未設定・誤りが多い。 |
| 「読み込みに失敗しました」 | Firestore のルール・ネットワークを確認。 |
| タスクが増えない | Console のエラー確認。`.env` 変更後は `npm run dev` を再起動。 |
| ポート使用中 | vite.config.js で 5100 が使われているか確認。必要なら 5101 等に変更。 |

---

## 6. Day2 との比較

| 項目 | Day2 | Day4 |
|------|------|------|
| データ保存 | localStorage | Firestore |
| デフォルトリスト名 | デフォルトリスト | マイリスト |
| タスク表示順 | 新規は先頭 | 新規は先頭 |
| カウンター | 4項目 | 4項目 |
| タイマー永続化 | しない | する（time を Firestore に保存） |

---

## 7. クラウドデプロイ

### 7.1 構成

- **フロント**: React (Vite) + Firestore。Vercel / Netlify などにデプロイ可能。
- **バックエンド（任意）**: FastAPI。Day4 のメインは Firestore のみ。

### 7.2 フロントエンドのデプロイ

**環境変数（ビルド時に必要）**

| 変数 | 説明 | 必須 |
|------|------|------|
| VITE_FIREBASE_API_KEY | Firebase API キー | ○ |
| VITE_FIREBASE_AUTH_DOMAIN | Firebase Auth ドメイン | ○ |
| VITE_FIREBASE_PROJECT_ID | Firebase プロジェクト ID | ○ |
| VITE_FIREBASE_STORAGE_BUCKET | Storage バケット | ○ |
| VITE_FIREBASE_MESSAGING_SENDER_ID | メッセージング Sender ID | ○ |
| VITE_FIREBASE_APP_ID | Firebase アプリ ID | ○ |
| VITE_API_BASE | バックエンド API のベース URL（API を使う場合のみ） | 任意 |

**Vercel**: Root Directory `Day4/frontend`、Build `npm run build`、Output `dist`。環境変数を設定後、Firebase Console の認証ドメインにデプロイ URL を追加。

**Netlify**: Base directory `Day4/frontend`、Build `npm run build`、Publish `dist`。

### 7.3 本番時の注意

- Firebase の認証ドメインに本番 URL を登録する。
- `.env` はリポジトリに含めず、各クラウドの環境変数で設定する。

---

## 8. まとめ

- 本ドキュメントは Day4 のデータモデル・画面仕様・動作確認手順をまとめたものです。
- 起動・画面構成・動作確認（1～15）・エラー時・Day2 比較・クラウドデプロイは上記のとおりです。
- Day4 は Day2 相当の機能を Firestore で永続化した構成です。
