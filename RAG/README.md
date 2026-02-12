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
# OPENAI_API_KEY=sk-your-api-key-here
```

## ディレクトリ構成

```
RAG/
├── .cursorrules         # Cursor AI用ルール設定
├── .env.example         # 環境変数テンプレート
├── .gitignore           # Git除外設定
├── requirements.txt     # 依存ライブラリ一覧
├── main.py              # メインエントリポイント（デモ実行用）
├── README.md            # このファイル
├── src/                 # ソースコード
│   ├── __init__.py          # パッケージ初期化
│   ├── onsen_rag.py         # 温泉特化RAG（メイン）
│   ├── simple_rag.py        # 基本RAG（テキスト入力）
│   ├── pdf_rag_system.py    # PDF対応RAG（日本語最適化）
│   ├── hybrid_search_rag.py # ハイブリッド検索RAG
│   └── reranking_rag.py     # Re-ranking付きRAG
├── api/                 # Web API（FastAPI）
│   └── main.py              # チャットAPIエンドポイント
├── frontend/            # チャットUI
│   └── index.html           # 温泉相談チャット画面
├── data/                # データ格納用
│   ├── onsen_knowledge.txt  # 温泉テキストデータ（RAGのソース）
│   └── sample_questions.json # 評価用サンプル質問
├── docs/                # ドキュメント
│   └── evaluation.md        # RAG精度評価ガイド
└── ai_query_logs/       # AI指示ログ
```

## 使用できるRAGシステム

### 1. SimpleRAG（基本）

テキストデータからRAGを構築する最もシンプルな実装。

| 項目 | 内容 |
|------|------|
| Embedding | all-MiniLM-L6-v2（無料・ローカル） |
| VectorDB | Chroma |
| LLM | OpenAI GPT |
| チャンクサイズ | 500文字 |

### 2. PDFRagSystem（PDF対応）

PDF文書を読み込んで日本語に最適化されたRAGを構築。

| 項目 | 内容 |
|------|------|
| Embedding | multilingual-e5-base（日本語対応） |
| VectorDB | Chroma（ディスク永続化） |
| チャンクサイズ | 1000文字 |
| 特徴 | 日本語セパレータ対応、カスタムプロンプト |

### 3. HybridSearchRAG（ハイブリッド検索）

セマンティック検索 + キーワード検索（BM25）を組み合わせ。

| 項目 | 内容 |
|------|------|
| 検索方式 | ベクトル類似度 + BM25 |
| 統合方式 | EnsembleRetriever |
| 重み | カスタマイズ可能（デフォルト50:50） |

### 4. ReRankingRAG（Re-ranking）

初期検索後にCrossEncoderで再ランキングして精度向上。

| 項目 | 内容 |
|------|------|
| CrossEncoder | ms-marco-MiniLM-L-6-v2 |
| 初期検索件数 | 20件 |
| 最終採用件数 | 4件 |

### 5. OnsenRAG（温泉特化・メイン）

温泉テキストデータに特化したRAGシステム。「■」見出し単位で意味的に分割。

| 項目 | 内容 |
|------|------|
| Embedding | multilingual-e5-base（日本語対応） |
| VectorDB | Chroma |
| チャンクサイズ | 300文字（温泉テキスト最適化） |
| 特徴 | 見出し分割、評価機能内蔵、14問のサンプル質問 |

## 実行方法

### デモ実行（コマンドライン）

```bash
# 温泉RAGデモの実行
python main.py
```

### チャットUI起動

```bash
# 1. APIサーバー起動
uvicorn api.main:app --reload --port 8000

# 2. ブラウザで開く
# frontend/index.html をブラウザで直接開く
```

### 構成イメージ

```
[React UI (frontend/index.html)]
       ↓ POST /api/ask
[FastAPI (api/main.py)]
       ↓
[OnsenRAG (src/onsen_rag.py)]
       ↓
[Embedding → Vector DB → 関連チャンク取得 → LLM回答生成]
```

## 無料で使えるリソース

### Embedding Model
- **all-MiniLM-L6-v2**: 完全無料・ローカル動作
- **multilingual-e5-base**: 日本語対応

### Vector Database
- **Chroma**: 完全無料、ローカル
- **FAISS**: Facebook製、高速

### LLM
- **OpenAI**: 無料枠$5（新規）
- **Groq**: 無料で高速推論
- **Ollama**: ローカルでLlama実行

## チャンキング戦略ガイド（トークンベース）

| ドキュメントタイプ | chunk_size (tokens) | chunk_overlap (tokens) | 説明 |
|-------------------|--------------------|------------------------|------|
| 一般的な文書 | 400-500 | 50-100 (10-20%) | バランス重視 |
| 技術文書 | 500-600 | 75-100 | 文脈保持重視 |
| 短い情報(FAQ) | 300-400 | 50-75 | 簡潔さ重視 |
| 長文(論文等) | 500-800 | 100-150 | 詳細保持重視 |

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

### OpenAI APIキーエラー
```bash
# .envファイルの確認
# OPENAI_API_KEY=sk-... が正しく設定されているか確認

# 環境変数が読み込まれているか確認
python -c "import os; from dotenv import load_dotenv; load_dotenv(); print(os.getenv('OPENAI_API_KEY'))"
```

### Chromaのインストールでエラー
```bash
# Windows: Visual Studio Build Toolsが必要な場合がある
# 代替: FAISSを使用
pip install faiss-cpu
```

## Git運用

- **リモートリポジトリ**: https://github.com/kobayashi-Reika7/OnsenRAG.git
- **mainブランチ**: 人間がレビュー・承認したコード
- **ai-generatedブランチ**: AIが生成したコード

## ライセンス

学習用プロジェクト
