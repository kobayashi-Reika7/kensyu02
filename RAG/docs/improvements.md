# RAG プロジェクト改善点

このドキュメントは、RAG プロジェクトの品質向上・堅牢化・拡張のための改善案をまとめています。

---

## 目次

1. [クイックウィン（即着手）](#1-クイックウィン即着手)
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

## 1. クイックウィン（即着手）

| # | 改善項目 | 手順 | 参照ファイル |
|---|----------|------|--------------|
| 1 | requirements.txt の cp932 対応 | コメントを英語化し UTF-8 で保存 | `requirements.txt` |
| 2 | LLM の共通化 | `src/llm_utils.py` を作成し `get_llm()` を実装 | `run_pdf_rag.py`, `onsen_rag.py` |
| 3 | README の更新 | 新 RAG クラス・実行スクリプト・チャンク表を追記 | `README.md` |
| 4 | API の k を環境変数化 | `RAG_TOP_K` で制御可能にする | `api/main.py` |

---

## 2. コード品質・保守性

### 2.1 重複コードの集約

| 重複箇所 | 現状 | 改善案 |
|----------|------|--------|
| **LLM初期化** | `_load_llm()`, `_init_llm()`, `_get_llm()` が各ファイルに分散 | `src/llm_utils.py` に `get_llm()` を定義し、Gemini→Groq→OpenAI のフォールバックを一元化 |
| **Embedding初期化** | 全 RAG で `HuggingFaceEmbeddings(model_name="intfloat/multilingual-e5-base")` を個別定義 | `src/embedding_utils.py` に `get_embeddings()` を定義 |
| **プロンプト** | 各 RAG で類似プロンプトを個別定義 | `src/prompts.py` に集約し、`general`, `onsen`, `paper`, `corporate` 等のプリセットを用意 |

### 2.2 非推奨 API の解消

| 現状 | 対応 |
|------|------|
| `langchain_community.embeddings.HuggingFaceEmbeddings` | `langchain_huggingface.HuggingFaceEmbeddings` へ移行（LangChain 1.0 対応） |
| `Chain.__call__(payload)` | `chain.invoke(payload)` へ移行 |
| `RetrievalQA.from_chain_type` | LCEL ベースの `create_retrieval_chain` 等への移行を検討 |

---

## 3. エンコーディング・Windows対応

### 3.1 requirements.txt

- **問題**: 日本語コメントが cp932 で読めず `pip install -r requirements.txt` が失敗する（Windows）
- **対応**:
  - コメントを英語化する
  - または UTF-8 BOM 付きで保存し、README に記載

### 3.2 コンソール出力

- **問題**: 絵文字（✅等）や日本語が cp932 で `UnicodeEncodeError` になる環境がある
- **対応**:
  - 環境変数 `PYTHONIOENCODING=utf-8` の利用を README に記載
  - または print を ASCII 表記に統一（例: `[OK]` で `✅` の代わり）

---

## 4. Production 向け堅牢性

### 4.1 未実装・強化項目

| 項目 | 概要 | 実装例 |
|------|------|--------|
| **Caching** | 同一クエリのキャッシュで LLM 呼び出し削減 | `cachetools`, Redis または LangChain の `InMemoryCache` |
| **Rate Limiting** | API 使用量の制限 | `slowapi` の `Limiter` を FastAPI に追加 |
| **Monitoring** | レスポンス時間・エラー率・トークン使用量 | ログ出力の標準化、Prometheus メトリクス（任意） |
| **構成の外部化** | タイムアウト・リトライ・k を環境変数で変更 | `RAG_TOP_K`, `LLM_TIMEOUT_SEC`, `MAX_RETRIES` |

### 4.2 セキュリティ

| 項目 | 推奨 |
|------|------|
| CORS | 本番では `allow_origins` を許可ドメインに限る |
| エラーメッセージ | API キー等の機密情報を露出しない |
| 入力検証 | 質問の最大文字数・長さ制限（例: 2000 文字） |

---

## 5. 検索・精度の向上

### 5.1 Advanced Retrieval の導入

`docs/advanced_rag_status.md` 参照。

| 技術 | 効果 | 難易度 |
|------|------|--------|
| **Multi-Query** | 複数クエリで検索し再ランク → 取りこぼし削減 | 低 |
| **Parent Document** | 小チャンクで検索し親チャンクを返す → 文脈の保持 | 中 |
| **Self-Query** | メタデータでフィルタ（例: 地域=草津） | 中 |

### 5.2 検索パラメータの最適化

- `k` を質問タイプに応じて動的に変更
- 類似度スコアの閾値フィルタ（低スコアのチャンクを除外）

---

## 6. テスト・品質保証

### 6.1 現状

- `test_search.py` はあるが、`pytest` ベースのテストスイートが未整備

### 6.2 推奨テスト

| 種別 | 内容 |
|------|------|
| 単体テスト | 各 RAG クラスの `query()` をモックでテスト |
| 精度評価 | `docs/evaluation.md` に沿ったサンプル質問の自動評価 |
| 回帰テスト | 既存回答のスナップショット比較 |

---

## 7. ドキュメント

### 7.1 README の更新

- チャンクサイズ表を最新（600/75 等）に合わせる
- `CorporateDocRAG`, `PaperRAG`, `SupportBot`, `OnsenGuideRAG` の利用例を追記
- `run_data_rag.py`, `run_corporate_doc.py` の実行方法を記載
- ディレクトリ構成を最新の `src/` 構成に更新

### 7.2 関連ドキュメント

| ドキュメント | 内容 |
|--------------|------|
| [evaluation.md](evaluation.md) | RAG 精度評価の基準と方法 |
| [chunking.md](chunking.md) | チャンキング戦略とプリセット |
| [hybrid_search.md](hybrid_search.md) | ハイブリッド検索の使い方 |
| [search_strategy.md](search_strategy.md) | 温泉ガイド向け検索パイプライン |
| [advanced_rag_status.md](advanced_rag_status.md) | 高度な RAG 技術の実装状況 |

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
| 高 | requirements.txt の cp932 対応 | 小 | セットアップ成功率向上 |
| 高 | LLM / Embedding の共通化 | 中 | 保守性向上 |
| 中 | Caching の導入 | 中 | レスポンス高速化 |
| 中 | Multi-Query Retrieval | 小 | 検索精度向上 |
| 中 | README の更新 | 小 | 利用しやすさ向上 |
| 低 | Rate Limiting | 小 | 本番運用の安定化 |
| 低 | pytest テストの追加 | 中 | 品質・リファクタの容易さ |

---

## 10. 実装ロードマップ

### Phase 1: 基盤整備（1〜2日）

1. requirements.txt の cp932 対応
2. `src/llm_utils.py` 作成
3. `src/embedding_utils.py` 作成
4. README の更新

### Phase 2: 品質向上（3〜5日）

1. 各 RAG クラスで llm_utils / embedding_utils を利用するようリファクタ
2. プロンプトの `src/prompts.py` への集約
3. pytest による基本テストの追加

### Phase 3: 本番向け（1〜2週間）

1. Caching の導入
2. Rate Limiting の導入
3. 構成の環境変数化
4. Multi-Query Retrieval の実装

---

## チェックリスト（進捗管理用）

- [ ] requirements.txt cp932 対応
- [ ] src/llm_utils.py 作成
- [ ] src/embedding_utils.py 作成
- [ ] README 更新
- [ ] API の k を環境変数化
- [ ] プロンプトの prompts.py 集約
- [ ] 非推奨 API の移行
- [ ] Caching 導入
- [ ] Rate Limiting 導入
- [ ] pytest テスト追加
