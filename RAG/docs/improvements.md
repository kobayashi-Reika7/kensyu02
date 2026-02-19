# RAG プロジェクト改善点

このドキュメントは、RAG プロジェクトの品質向上・堅牢化・拡張のための改善案をまとめています。

---

## 目次

1. [実装済みの改善](#1-実装済みの改善)
2. [コード品質・保守性](#2-コード品質保守性)
3. [エンコーディング・Windows対応](#3-エンコーディングwindows対応)
4. [Production 向け堅牢性](#4-production-向け堅牢性)
5. [検索・精度の向上](#5-検索精度の向上)
6. [テスト・品質保証](#6-テスト品質保証)
7. [ドキュメント](#7-ドキュメント)
8. [アーキテクチャ](#8-アーキテクチャ)
9. [優先度マトリクス](#9-優先度マトリクス)
10. [実装ロードマップ](#10-実装ロードマップ)

---

## 1. 実装済みの改善

以下は既に実装済みの改善項目です。

| # | 改善項目 | 実装内容 | 参照ファイル |
|---|----------|----------|--------------|
| 1 | LLM の共通化 | `llm_factory.py` で Gemini→Groq→OpenAI フォールバック | `src/llm_factory.py` |
| 2 | クエリキャッシュ | LRU 128件 + TTL 5分で同一クエリの重複LLM呼び出し回避 | `src/onsen_rag.py` |
| 3 | CORS制御 | 環境変数 `CORS_ORIGINS` で許可オリジン制御 | `api/main.py` |
| 4 | 入力サニタイズ | Pydantic `field_validator` で制御文字除去・500文字制限 | `api/main.py` |
| 5 | エラーメッセージ隠蔽 | 内部エラー詳細をユーザーに露出しない | `api/main.py` |
| 6 | FastAPI lifespan対応 | `@app.on_event("startup")` → lifespan に移行 | `api/main.py` |
| 7 | CrossEncoder日本語モデル | 英語専用 → mmarco-mMiniLMv2-L12-H384-v1（多言語対応） | `src/onsen_rag.py` |
| 8 | 信頼度閾値 | CrossEncoderスコア閾値で低品質候補を除外 | `src/onsen_rag.py` |
| 9 | メタデータ型統一 | arima_chunks.json の category/area/tags を文字列に統一 | `data/arima_chunks.json` |
| 10 | クラス分割（LLMファクトリ） | OnsenRAG から LLM初期化ロジックを分離 | `src/llm_factory.py` |
| 11 | 会話コンテキスト | 直前の温泉地を保持し文脈継続（「有馬」→「カフェ」） | `src/onsen_rag.py` |
| 12 | プロンプト最適化 | 文脈ベース・チャンクID非表示・簡潔な自由形式に改善 | `src/onsen_rag.py` |
| 13 | フロントエンド質問例 | ウェルカム画面に5件の質問例ボタンを追加 | `frontend/index.html` |
| 14 | 参照ソース上位3件制限 | フロントエンドで参照ソース表示を3件に制限 | `frontend/index.html` |

---

## 2. コード品質・保守性

### 2.1 重複コードの集約

| 重複箇所 | 現状 | 改善案 |
|----------|------|--------|
| **Embedding初期化** | 全 RAG で `HuggingFaceEmbeddings(model_name="intfloat/multilingual-e5-base")` を個別定義 | `src/embedding_utils.py` に `get_embeddings()` を定義 |
| **プロンプト** | 各 RAG で類似プロンプトを個別定義 | `src/prompts.py` に集約し、プリセットを用意 |

### 2.2 非推奨 API の解消

| 現状 | 対応 |
|------|------|
| `langchain_community.embeddings.HuggingFaceEmbeddings` | `langchain_huggingface.HuggingFaceEmbeddings` へ移行（LangChain 1.0 対応） |
| `RetrievalQA.from_chain_type`（学習用RAGクラスで使用） | LCEL ベースの `create_retrieval_chain` 等への移行を検討 |

---

## 3. エンコーディング・Windows対応

### 3.1 コンソール出力

- **問題**: 絵文字（✅等）や日本語が cp932 で `UnicodeEncodeError` になる環境がある
- **対応済み**: OnsenRAGではprint出力をASCII表記に統一（例: `[OK]`）
- **残対応**: 環境変数 `PYTHONIOENCODING=utf-8` の利用を README に記載

---

## 4. Production 向け堅牢性

### 4.1 実装済み項目

| 項目 | 状態 | 詳細 |
|------|------|------|
| **Caching** | ✅ | LRU 128件 + TTL 5分のクエリキャッシュ |
| **Security (CORS)** | ✅ | 環境変数で許可オリジン制御 |
| **Security (入力検証)** | ✅ | 制御文字除去・500文字制限 |
| **Security (エラー隠蔽)** | ✅ | 内部エラー詳細を非露出 |
| **Monitoring (ログ)** | ✅ | logging モジュール + 応答時間計測 |
| **Lifespan管理** | ✅ | FastAPI lifespan でリソース管理 |
| **リトライ/タイムアウト** | ✅ | 3回リトライ・60秒タイムアウト |

### 4.2 未実装の強化項目

| 項目 | 概要 | 実装例 |
|------|------|--------|
| **Rate Limiting** | API 使用量の制限 | `slowapi` の `Limiter` を FastAPI に追加 |
| **構成の外部化** | k を環境変数で変更 | `RAG_TOP_K` 等 |
| **ヘルスチェック強化** | LLM接続確認、レイテンシ計測 | `/api/health` に詳細情報追加 |

---

## 5. 検索・精度の向上

### 5.1 Advanced Retrieval の導入

`docs/advanced_rag_status.md` 参照。

| 技術 | 効果 | 難易度 |
|------|------|--------|
| **Multi-Query** | 複数クエリで検索し再ランク → 取りこぼし削減 | 低 |
| **Parent Document** | 小チャンクで検索し親チャンクを返す → 文脈の保持 | 中 |

### 5.2 検索パラメータの最適化

- `k` を質問タイプに応じて動的に変更
- ~~類似度スコアの閾値フィルタ~~ → ✅ 信頼度閾値として実装済み

---

## 6. テスト・品質保証

### 6.1 現状

- `test_search.py` はあるが、`pytest` ベースのテストスイートが未整備
- `sample_questions.json`（14問）による自動評価は `rag.evaluate()` で実行可能

### 6.2 推奨テスト

| 種別 | 内容 |
|------|------|
| 単体テスト | 各 RAG クラスの `query()` をモックでテスト |
| 精度評価 | `docs/evaluation.md` に沿ったサンプル質問の自動評価 |
| 回帰テスト | 既存回答のスナップショット比較 |

---

## 7. ドキュメント

### 7.1 ドキュメント一覧

| ドキュメント | 内容 | 状態 |
|--------------|------|------|
| [README.md](../README.md) | プロジェクト概要・セットアップ・アーキテクチャ | ✅ 最新 |
| [evaluation.md](evaluation.md) | RAG 精度評価の基準と方法 | ✅ 最新 |
| [chunking.md](chunking.md) | チャンキング戦略とプリセット | ✅ 最新 |
| [hybrid_search.md](hybrid_search.md) | ハイブリッド検索の使い方 | ✅ 最新 |
| [reranking.md](reranking.md) | Re-ranking（CrossEncoder + LLM 2段階） | ✅ 最新 |
| [search_strategy.md](search_strategy.md) | 検索パイプライン構成 | ✅ 最新 |
| [prompt_optimization.md](prompt_optimization.md) | プロンプト最適化 | ✅ 最新 |
| [improvements.md](improvements.md) | 改善点リスト（このファイル） | ✅ 最新 |
| [implementation_status.md](implementation_status.md) | カリキュラム実装状況 | ✅ 最新 |
| [advanced_rag_status.md](advanced_rag_status.md) | 高度な RAG 技術の実装状況 | ✅ 最新 |

---

## 8. アーキテクチャ

### 8.1 共通インターフェース

- 全 RAG クラスに共通の `load()`, `query()` 等のインターフェースを定義
- 設定（Embedding、LLM、チャンキング）を依存性注入で差し替え可能に

### 8.2 API の拡張

- RAG モードの切り替え（Onsen / Corporate / Paper）をエンドポイントで指定
- ストリーミング応答（`StreamingResponse`）で UX 向上

---

## 9. 優先度マトリクス

| 優先度 | 改善項目 | 工数 | 効果 |
|--------|----------|------|------|
| ~~高~~ | ~~LLM / Embedding の共通化~~ | ~~中~~ | ✅ LLMファクトリ実装済み |
| ~~高~~ | ~~Caching の導入~~ | ~~中~~ | ✅ クエリキャッシュ実装済み |
| 中 | Embedding の共通化 | 小 | 保守性向上 |
| 中 | Multi-Query Retrieval | 小 | 検索精度向上 |
| 中 | pytest テストの追加 | 中 | 品質・リファクタの容易さ |
| 低 | Rate Limiting | 小 | 本番運用の安定化 |
| 低 | プロンプトの prompts.py 集約 | 小 | 保守性向上 |

---

## 10. 実装ロードマップ

### Phase 1: 基盤整備 ✅ 完了

1. ~~requirements.txt の cp932 対応~~ → 対応済み
2. ~~`src/llm_factory.py` 作成~~ → ✅
3. ~~README の更新~~ → ✅
4. ~~FastAPI lifespan対応~~ → ✅
5. ~~CORS / 入力サニタイズ~~ → ✅

### Phase 2: 品質向上 ✅ 完了

1. ~~CrossEncoder日本語モデル変更~~ → ✅
2. ~~クエリキャッシュ導入~~ → ✅
3. ~~メタデータ型統一~~ → ✅
4. ~~信頼度閾値~~ → ✅
5. ~~会話コンテキスト~~ → ✅
6. ~~プロンプト最適化~~ → ✅

### Phase 3: 次のステップ

1. Embedding の共通化（`src/embedding_utils.py`）
2. pytest による基本テストの追加
3. Multi-Query Retrieval の実装
4. Rate Limiting の導入
5. ストリーミング応答の実装

---

## チェックリスト（進捗管理用）

- [x] LLM共通化（llm_factory.py）
- [x] CrossEncoder日本語モデル変更
- [x] クエリキャッシュ導入
- [x] メタデータ型統一
- [x] FastAPI lifespan対応
- [x] CORS制御
- [x] 入力サニタイズ
- [x] エラーメッセージ隠蔽
- [x] 信頼度閾値
- [x] 会話コンテキスト
- [x] プロンプト最適化
- [x] フロントエンド質問例
- [x] 参照ソース上位3件制限
- [x] README / docs 更新
- [ ] Embedding共通化（embedding_utils.py）
- [ ] プロンプトの prompts.py 集約
- [ ] 非推奨 API の移行
- [ ] Rate Limiting 導入
- [ ] pytest テスト追加
- [ ] Multi-Query Retrieval
