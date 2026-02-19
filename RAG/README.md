# OnsenRAG - 温泉情報RAGシステム

RAG（Retrieval-Augmented Generation）の学習用プロジェクトです。  
温泉データを使って、テキスト検索→回答生成の流れを段階的に学べます。

## 前提条件

- Python 3.9+
- pip
- VS Code推奨

## セットアップ

### 1. 仮想環境の作成

```bash
# 仮想環境の作成（推奨）
python -m venv venv

# 有効化
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate
```

### 2. ライブラリのインストール

```bash
pip install -r requirements.txt
```

### 3. 環境変数の設定

```bash
# .env.exampleをコピー
cp .env.example .env

# .envファイルを編集してAPIキーを設定
# 以下のいずれか1つ以上を設定（フォールバック: Gemini → Groq → OpenAI）
# GOOGLE_API_KEY=your-google-api-key
# GROQ_API_KEY=your-groq-api-key
# OPENAI_API_KEY=sk-your-api-key-here
```

## ディレクトリ構成

```
RAG/
├── README.md                   # このファイル
├── .env.example                # 環境変数テンプレート
├── requirements.txt            # 依存ライブラリ一覧
├── main.py                     # メインエントリポイント（デモ・評価実行用）
│
├── src/                        # ソースコード
│   ├── onsen_rag.py                # 温泉特化RAG（本番メイン）
│   ├── llm_factory.py              # LLMファクトリ（Gemini→Groq→OpenAI）
│   ├── text_splitter_utils.py      # チャンキング戦略（プリセット付き）
│   ├── support_bot.py              # カスタマーサポートボット
│   ├── simple_rag.py               # 基本RAG（学習用）
│   ├── pdf_rag_system.py           # PDF対応RAG
│   ├── hybrid_search_rag.py        # ハイブリッド検索RAG（学習用）
│   ├── reranking_rag.py            # Re-ranking付きRAG（学習用）
│   ├── paper_rag.py                # 研究論文アシスタント
│   ├── corporate_doc_rag.py        # 社内ドキュメント検索
│   └── onsen_guide_rag.py          # 温泉ガイドRAG（旧バージョン）
│
├── api/                        # Web API（FastAPI）
│   └── main.py                     # チャットAPIエンドポイント
│
├── frontend/                   # チャットUI
│   └── index.html                  # 温泉相談チャット画面（質問例付き）
│
├── data/                       # データ格納用
│   ├── kusatsu_chunks.json         # 草津温泉チャンク（104件）
│   ├── hakone_chunks.json          # 箱根温泉チャンク（45件）
│   ├── beppu_chunks.json           # 別府温泉チャンク（20件）
│   ├── arima_chunks.json           # 有馬温泉チャンク（19件）
│   ├── onsen_knowledge_chunks.json # 温泉基礎知識チャンク（11件）
│   ├── onsen_knowledge.txt         # 温泉テキストデータ（元データ）
│   └── sample_questions.json       # 評価用サンプル質問（14問）
│
├── docs/                       # ドキュメント
│   ├── evaluation.md               # RAG精度評価ガイド
│   ├── chunking.md                 # チャンキング戦略
│   ├── hybrid_search.md            # ハイブリッド検索
│   ├── reranking.md                # Re-ranking
│   ├── search_strategy.md          # 検索パイプライン構成
│   ├── prompt_optimization.md      # プロンプト最適化
│   ├── improvements.md             # 改善点リスト
│   ├── implementation_status.md    # 実装状況
│   └── advanced_rag_status.md      # 高度なRAG技術の状況
│
├── ai_query_logs/              # AI指示ログ
├── chroma_onsen_db/            # ChromaDB永続化（自動生成）
└── chroma_pdf_db/              # PDF用ChromaDB（自動生成）
```

## 使用できるRAGシステム

### 1. SimpleRAG（基本・学習用）

テキストデータからRAGを構築する最もシンプルな実装。

| 項目 | 内容 |
|------|------|
| Embedding | all-MiniLM-L6-v2（無料・ローカル） |
| VectorDB | Chroma |
| LLM | OpenAI GPT |
| 検索方式 | ベクトル類似度のみ |

### 2. PDFRagSystem（PDF対応）

PDF文書を読み込んで日本語に最適化されたRAGを構築。

| 項目 | 内容 |
|------|------|
| Embedding | multilingual-e5-base（日本語対応） |
| VectorDB | Chroma（ディスク永続化） |
| チャンキング | トークンベース（generalプリセット: 600 tokens） |
| 特徴 | 日本語セパレータ対応、カスタムプロンプト |

### 3. HybridSearchRAG（ハイブリッド検索・学習用）

セマンティック検索 + キーワード検索（BM25）を組み合わせた検索。

| 項目 | 内容 |
|------|------|
| 検索方式 | ベクトル類似度 + BM25 |
| 統合方式 | EnsembleRetriever |
| 重み | カスタマイズ可能（デフォルト50:50） |

### 4. ReRankingRAG（Re-ranking・学習用）

初期検索後にCrossEncoderで再ランキングして精度向上。

| 項目 | 内容 |
|------|------|
| CrossEncoder | ms-marco-MiniLM-L-6-v2 |
| 初期検索件数 | 20件 |
| 最終採用件数 | 4件 |

### 5. OnsenRAG（温泉特化・本番メイン）

全技術を統合した本番用RAGシステム。3段階検索パイプラインで高精度な回答を生成。

| 項目 | 内容 |
|------|------|
| Embedding | multilingual-e5-base（日本語対応） |
| VectorDB | Chroma（ディスク永続化・ハッシュベース差分検出） |
| チャンキング | トークンベース（600 tokens / 75 overlap） |
| 検索方式 | ハイブリッド検索（セマンティック + BM25） + RRF統合 |
| Re-ranking | CrossEncoder（mmarco-mMiniLMv2-L12-H384-v1・日本語対応） |
| LLM候補抽出 | LLMが各候補の関連度を0〜10で評価 |
| 信頼度フィルタ | CrossEncoderスコア閾値による低品質候補の除外 |
| クエリキャッシュ | LRU + TTL（128件・5分） |
| 会話コンテキスト | 直前の温泉地を保持し文脈継続（「有馬」→「カフェ」） |
| LLM | Gemini → Groq → OpenAI フォールバック |
| データ | 5ファイル・約200チャンク（草津/箱根/別府/有馬/基礎知識） |

### 6. SupportBot（カスタマーサポート）

OnsenRAGをラップし、FAQ対応・エスカレーション提案を追加。

| 項目 | 内容 |
|------|------|
| FAQ | パターンマッチで即回答 |
| エスカレーション | 低信頼度回答時に担当者への接続を提案 |
| エラーハンドリング | LLMエラー時もユーザーに親切なメッセージ |

### 7. CorporateDocRAG（社内ドキュメント検索）

フォルダ内のPDF・TXTを一括読み込みする汎用RAG。

### 8. PaperRAG（研究論文アシスタント）

論文PDFを読み込み、引用番号付きで回答する学術向けRAG。

## 実行方法

### チャットUI起動（推奨）

```bash
# APIサーバー起動（フロントエンドも自動配信）
cd RAG
python -m uvicorn api.main:app --port 8000

# ブラウザで開く
# http://localhost:8000
```

### デモ実行（コマンドライン）

```bash
python main.py
```

### その他のスクリプト

| スクリプト | 用途 |
|------------|------|
| `run_corporate_doc.py [フォルダ]` | 社内ドキュメント検索 |
| `run_paper_rag.py [PDF] [質問]` | 研究論文アシスタント |
| `run_pdf_rag.py` | PDF RAG実行 |
| `run_data_rag.py` | データフォルダRAG実行 |

## アーキテクチャ

```
[ブラウザ (frontend/index.html)]
       ↓ POST /api/ask
[FastAPI (api/main.py)]
  ├─ Pydantic入力サニタイズ（制御文字除去・500文字制限）
  ├─ CORS制御（環境変数で許可オリジン設定）
  ├─ リトライ3回 / タイムアウト60秒
  └─ lifespan管理（起動時RAG初期化）
       ↓
[SupportBot (src/support_bot.py)]
  ├─ FAQパターンマッチ → 即回答
  └─ エスカレーション判定
       ↓
[OnsenRAG (src/onsen_rag.py)]
  ├─ クエリキャッシュ確認（LRU 128件・TTL 5分）
  └─ 3段階検索パイプライン:
       ↓
  Step 1: ハイブリッド検索 + CrossEncoderスコアリング
    ├─ 温泉地フィルタ（質問文から地名検出 + 会話コンテキスト）
    ├─ セマンティック検索（ChromaDB）
    ├─ キーワード検索（BM25・キャッシュ済み）
    ├─ RRF統合
    └─ CrossEncoder（mmarco-mMiniLMv2-L12-H384-v1）でスコアリング
       ↓
  Step 2: LLM候補抽出
    └─ LLMが各候補の関連度を0〜10で評価 → 上位5件
       ↓
  Step 3: 最終選択
    ├─ 信頼度フィルタ（閾値未満を除外）
    ├─ スコア統合（CE × 0.4 + LLM × 0.6）
    └─ 上位3件を文脈としてLLMに回答生成依頼
```

## API エンドポイント

| メソッド | パス | 説明 |
|----------|------|------|
| GET | `/` | フロントエンドHTML配信 |
| GET | `/api/health` | ヘルスチェック（RAG初期化状態） |
| POST | `/api/ask` | 質問→回答（SupportBot経由） |
| POST | `/api/search` | 検索結果のみ返却（評価・デバッグ用） |

## チャンキング戦略ガイド（トークンベース）

| プリセット | chunk_size (tokens) | chunk_overlap (tokens) | 用途 |
|-----------|--------------------|-----------------------|------|
| general | 600 | 75 | 一般的な文書・バランス重視 |
| technical | 900 | 120 | 技術文書・文脈保持重視 |
| faq | 350 | 40 | FAQ・簡潔さ重視 |
| long | 1000 | 150 | 長文（論文等）・詳細保持重視 |

## 無料で使えるリソース

### Embedding Model
- **all-MiniLM-L6-v2**: 完全無料・ローカル動作（英語向け）
- **multilingual-e5-base**: 日本語対応（本番使用）

### Vector Database
- **Chroma**: 完全無料、ローカル、ディスク永続化対応

### LLM（フォールバック順）
1. **Gemini** (google-generativeai): 無料枠あり（日次制限）
2. **Groq** (groq): 無料で高速推論
3. **OpenAI** (openai): 無料枠$5（新規）

### CrossEncoder（Re-ranking）
- **mmarco-mMiniLMv2-L12-H384-v1**: 多言語対応・日本語Re-ranking（本番使用）
- **ms-marco-MiniLM-L-6-v2**: 英語専用（学習用）

## トラブルシューティング

### pip installでエラーが出る
```bash
# Pythonバージョンの確認（3.9以上が必要）
python --version

# pipのアップグレード
pip install --upgrade pip

# キャッシュをクリア
pip cache purge
```

### APIキーエラー
```bash
# .envファイルの確認
# GOOGLE_API_KEY, GROQ_API_KEY, OPENAI_API_KEY のいずれかが設定されているか確認

# 環境変数が読み込まれているか確認
python -c "import os; from dotenv import load_dotenv; load_dotenv(); print(os.getenv('GOOGLE_API_KEY'))"
```

### Gemini 429エラー（RESOURCE_EXHAUSTED）
無料枠の日次制限に達した場合。対処法:
1. `.env` で `GOOGLE_API_KEY` を空にし、Groqにフォールバックさせる
2. 翌日まで待つ（日次リセット）

### ポートが使用中（Errno 10048）
```bash
# Windows: 使用中のプロセスを確認・終了
netstat -ano | findstr :8000
taskkill /PID <プロセスID> /F
```

## Git運用

- **リモートリポジトリ**: https://github.com/kobayashi-Reika7/OnsenRAG.git
- **mainブランチ**: 人間がレビュー・承認したコード
- **ai-generatedブランチ**: AIが生成したコード

## ライセンス

学習用プロジェクト
