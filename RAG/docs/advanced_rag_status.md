# 高度なRAG技術 - 実装状況

## Advanced Retrieval

| 技術 | 説明 | 状態 |
|------|------|------|
| **Multi-Query Retrieval** | 複数の視点からクエリを生成し検索 | ⬜ 未実装 |
| **Parent Document Retrieval** | 小さいチャンクで検索、大きいチャンクを返す | ⬜ 未実装 |
| **Self-Query Retrieval** | メタデータを使ったフィルタリング | ✅ 一部実装 |

**実装済みの関連機能**:
- ハイブリッド検索（セマンティック + BM25 + RRF統合）
- Re-ranking（CrossEncoder + LLM候補抽出の2段階）
- メタデータ付きJSONチャンク（温泉地別location、category、area、tags）
- 温泉地フィルタリング（質問から地名検出 → locationメタデータで絞り込み）
- 会話コンテキスト（直前の温泉地を保持し、文脈継続的な検索を実現）

---

## Agent-based RAG

| 技術 | 説明 | 状態 |
|------|------|------|
| **LangChain Agents** | ツールを使い分けるエージェント | ⬜ 未実装 |
| **ReAct Pattern** | 推論と行動を繰り返すパターン | ⬜ 未実装 |
| **Multi-Agent System** | 複数のエージェントが協調 | ⬜ 未実装 |

---

## Fine-tuning

| 技術 | 説明 | 状態 |
|------|------|------|
| **Embedding Fine-tuning** | ドメイン固有のEmbedding | ⬜ 未実装 |
| **LLM Fine-tuning** | 特定タスクに特化したLLM | ⬜ 未実装 |
| **RLHF** | 人間のフィードバックで改善 | ⬜ 未実装 |

**現状**: 事前学習済みモデル（multilingual-e5-base, mmarco-mMiniLMv2, Gemini/Groq/OpenAI）をそのまま使用

---

## Production Engineering

| 技術 | 説明 | 状態 |
|------|------|------|
| **Caching** | 重複クエリの高速化 | ✅ 実装済み |
| **Rate Limiting** | API使用量の制御 | ⬜ 未実装 |
| **Monitoring** | ログとメトリクス | ✅ 実装済み |
| **Security** | CORS・入力サニタイズ | ✅ 実装済み |

**実装済み詳細**:
- クエリキャッシュ: LRU 128件 + TTL 5分（`OrderedDict`ベース）
- リトライ: 最大3回 + 遅延1秒
- タイムアウト: LLM呼び出し60秒制限
- ログ出力: `logging` モジュールによる構造化ログ
- 応答時間計測: `response_time_ms` をAPI応答に含む
- CORS: 環境変数 `CORS_ORIGINS` で許可オリジン制御
- 入力サニタイズ: Pydantic `field_validator` で制御文字除去・500文字制限
- エラーメッセージ隠蔽: 内部エラー詳細をユーザーに露出しない
- FastAPI lifespan: 起動・終了のリソース管理

---

## Multimodal RAG

| 技術 | 説明 | 状態 |
|------|------|------|
| **Image Search** | 画像からの情報収集 | ⬜ 未実装 |
| **Table Understanding** | 表データの理解 | ⬜ 未実装 |
| **Audio Transcription** | 音声→テキスト | ⬜ 未実装 |

**現状**: テキスト・PDF・JSONチャンクのみ対応

---

## サマリー

| カテゴリ | 実装済み | 一部実装 | 未実装 |
|----------|----------|----------|--------|
| Advanced Retrieval | 0 | 1 | 2 |
| Agent-based RAG | 0 | 0 | 3 |
| Fine-tuning | 0 | 0 | 3 |
| Production Engineering | 3 | 0 | 1 |
| Multimodal RAG | 0 | 0 | 3 |
| **合計** | **3** | **1** | **12** |

---

## 実装済みの基本・中級技術（参考）

- 基本RAG、ハイブリッド検索（RRF統合）、Re-ranking（CrossEncoder + LLM 2段階）
- チャンキング戦略（4プリセット）、プロンプト最適化（文脈ベース・チャンクID非表示）
- サポートボット（FAQ・エスカレーション）、社内文書/論文RAG
- LLMファクトリ（Gemini → Groq → OpenAI フォールバック）
- クエリキャッシュ、ChromaDB永続化、信頼度閾値フィルタ
- 会話コンテキスト継続、温泉地メタデータフィルタリング
- リトライ・タイムアウト・エラー処理・CORS・入力サニタイズ
- FastAPI lifespan、応答時間計測
