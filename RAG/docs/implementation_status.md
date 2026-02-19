# 実装状況 - RAG学習カリキュラム

## 初級編（1-2日）✅ 完了

| 項目 | 状態 | 実装 |
|------|------|------|
| 1. 基本的なRAGシステム構築 | ✅ | `SimpleRAG`, `OnsenRAG` |
| 2. PDFからRAGシステムを作る | ✅ | `PDFRagSystem`, `run_pdf_rag.py` |
| 3. チャンキング戦略の比較 | ✅ | `text_splitter_utils.py`（プリセット: general/technical/faq/long） |

**評価ポイント:**
- ファイルの正確な読み込み: TXT / JSON / PDF 対応
- 適切なチャンクサイズ設定: トークンベース4プリセット（600/900/350/1000 tokens）
- 質問への関連性の高い回答: 日本語最適化プロンプト + 14問の自動評価

---

## 中級編（3-5日）✅ 完了

| 項目 | 状態 | 実装 |
|------|------|------|
| 1. ハイブリッド検索の実装 | ✅ | `HybridSearchRAG`（学習用）, `OnsenRAG`（本番: RRF統合） |
| 2. Re-rankingの導入 | ✅ | `ReRankingRAG`（学習用）, `OnsenRAG`（本番: CrossEncoder + LLM 2段階） |
| 3. プロンプトエンジニアリング | ✅ | `docs/prompt_optimization.md`, OnsenRAGの文脈ベースプロンプト |

**評価ポイント:**
- 検索精度の向上度: セマンティック + BM25 + RRF統合 + 温泉地フィルタリング
- Re-ranking前後の効果測定: CrossEncoder（日本語対応） + LLMスコアリング（0〜10） + 信頼度閾値
- プロンプト最適化の効果: 文脈限定・推測禁止・チャンクID非表示・簡潔な自由形式

---

## 上級編（1-2週間）✅ 完了

| 項目 | 状態 | 実装 |
|------|------|------|
| 1. 社内ドキュメント検索システム | ✅ | `CorporateDocRAG` - フォルダ内PDF・TXT一括読み込み |
| 2. カスタマーサポートボット | ✅ | `SupportBot` - FAQ・エスカレーション提案、API統合 |
| 3. 研究論文アシスタント | ✅ | `PaperRAG` - 引用形式、long プリセット |

**評価ポイント:**
- システムの完成度: 多様なRAG + FastAPI + チャットUI + 質問例ボタン
- ユーザー体験の品質: 参照ソース表示、エスカレーション提案、ローディング表示、レスポンシブ対応
- エラー処理と堅牢性: リトライ（3回）、タイムアウト（60秒）、CORS、入力サニタイズ、lifespan管理

---

## 実装一覧

| クラス/ファイル | 機能 | 種別 |
|-----------------|------|------|
| `OnsenRAG` | 温泉特化RAG（3段階パイプライン） | 本番 |
| `SupportBot` | カスタマーサポート（FAQ・エスカレーション） | 本番 |
| `llm_factory.py` | LLMファクトリ（Gemini→Groq→OpenAI） | 本番 |
| `text_splitter_utils.py` | チャンキング戦略（4プリセット） | 共通 |
| `api/main.py` | FastAPI チャットAPI | 本番 |
| `frontend/index.html` | チャットUI（質問例・参照ソース） | 本番 |
| `SimpleRAG` | 基本RAG（テキスト入力） | 学習用 |
| `PDFRagSystem` | PDF対応RAG | 学習用 |
| `HybridSearchRAG` | ハイブリッド検索 | 学習用 |
| `ReRankingRAG` | CrossEncoder再ランキング | 学習用 |
| `CorporateDocRAG` | 社内ドキュメント検索 | 汎用 |
| `PaperRAG` | 研究論文アシスタント | 汎用 |

---

## OnsenRAG 本番機能一覧

| カテゴリ | 機能 | 詳細 |
|----------|------|------|
| 検索 | ハイブリッド検索 | セマンティック（Chroma） + BM25（キャッシュ済み） |
| 検索 | RRF統合 | Reciprocal Rank Fusion で2種の検索結果を統合 |
| 検索 | 温泉地フィルタ | 質問から地名検出 → locationメタデータで絞り込み |
| 検索 | 会話コンテキスト | 直前の温泉地を保持し文脈継続（「有馬」→「カフェ」） |
| Re-ranking | CrossEncoder | mmarco-mMiniLMv2-L12-H384-v1（日本語対応） |
| Re-ranking | LLM候補抽出 | LLMが各候補の関連度を0〜10で評価 |
| Re-ranking | 信頼度閾値 | CEスコア -3.0 未満の候補を除外 |
| Re-ranking | スコア統合 | CE × 0.4 + LLM × 0.6 で最終選定 |
| キャッシュ | クエリキャッシュ | LRU 128件・TTL 5分 |
| キャッシュ | ChromaDB永続化 | ハッシュベース差分検出で起動高速化 |
| キャッシュ | BM25キャッシュ | 温泉地別BM25を事前構築 |
| プロンプト | 文脈ベース | チャンクID非表示・簡潔な自由形式 |
| LLM | フォールバック | Gemini → Groq → OpenAI |
| API | 入力サニタイズ | 制御文字除去・500文字制限 |
| API | CORS | 環境変数で許可オリジン制御 |
| API | リトライ/タイムアウト | 3回リトライ・60秒制限 |
| API | lifespan管理 | FastAPI lifespan でリソース管理 |
| UI | チャット画面 | 質問例ボタン5件・参照ソース表示（上位3件） |

---

## 実行スクリプト

| スクリプト | 用途 |
|------------|------|
| `python -m uvicorn api.main:app --port 8000` | チャットUI + API起動 |
| `python main.py` | デモ・評価実行 |
| `run_corporate_doc.py [フォルダ]` | 社内ドキュメント検索 |
| `run_paper_rag.py [PDF] [質問]` | 研究論文アシスタント |

---

## 高度なRAG技術の状況

詳細は `docs/advanced_rag_status.md` を参照。

| カテゴリ | 状態 |
|----------|------|
| Advanced Retrieval（Multi-Query, Parent Doc, Self-Query） | 🟡 Self-Query一部実装（温泉地フィルタ） |
| Agent-based RAG（LangChain Agents, ReAct, Multi-Agent） | ⬜ 未実装 |
| Fine-tuning（Embedding, LLM, RLHF） | ⬜ 未実装 |
| Production（Caching, Security, Monitoring） | ✅ キャッシュ・CORS・サニタイズ・ログ実装済み |
| Multimodal RAG（Image, Table, Audio） | ⬜ 未実装 |
