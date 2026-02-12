# 高度なRAG技術 - 実装状況

## Advanced Retrieval

| 技術 | 説明 | 状態 |
|------|------|------|
| **Multi-Query Retrieval** | 複数の視点からクエリを生成し検索 | ⬜ 未実装 |
| **Parent Document Retrieval** | 小さいチャンクで検索、大きいチャンクを返す | ⬜ 未実装 |
| **Self-Query Retrieval** | メタデータを使ったフィルタリング | ⬜ 未実装 |

**実装済みの関連機能**: ハイブリッド検索、Re-ranking、メタデータ付きJSONチャンク（OnsenRAG）

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

**現状**: 事前学習済みモデル（ multilingual-e5-base, Gemini/Groq/OpenAI）をそのまま使用

---

## Production Engineering

| 技術 | 説明 | 状態 |
|------|------|------|
| **Caching** | 重複クエリの高速化 | ⬜ 未実装 |
| **Rate Limiting** | API使用量の制御 | ⬜ 未実装 |
| **Monitoring** | ログとメトリクス | 🟡 一部（logging） |

**実装済み**: リトライ、タイムアウト、ログ出力（api/main.py）

---

## Multimodal RAG

| 技術 | 説明 | 状態 |
|------|------|------|
| **Image Search** | 画像からの情報収集 | ⬜ 未実装 |
| **Table Understanding** | 表データの理解 | ⬜ 未実装 |
| **Audio Transcription** | 音声→テキスト | ⬜ 未実装 |

**現状**: テキスト・PDFのみ対応

---

## サマリー

| カテゴリ | 実装済み | 未実装 |
|----------|----------|--------|
| Advanced Retrieval | 0 | 3 |
| Agent-based RAG | 0 | 3 |
| Fine-tuning | 0 | 3 |
| Production Engineering | 1（ログ） | 2 |
| Multimodal RAG | 0 | 3 |
| **合計** | **1** | **14** |

---

## 実装済みの基本・中級技術（参考）

- 基本RAG、ハイブリッド検索、Re-ranking、チャンキング戦略
- プロンプト最適化、サポートボット、社内文書/論文RAG
- リトライ・タイムアウト・エラー処理
