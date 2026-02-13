# 精度向上: Re-ranking

## 目的

- 初期検索結果を CrossEncoder でより正確に再スコアリングして上位のみ採用
- クエリと文書のペアを直接比較し、意味的な関連度を高精度に計算

## OnsenRAG の Re-ranking（本番構成）

OnsenRAG では、CrossEncoder + LLM の**2段階 Re-ranking**を採用しています。

### 使用モデル

| 用途 | モデル | 特徴 |
|------|--------|------|
| CrossEncoder | `mmarco-mMiniLMv2-L12-H384-v1` | 多言語対応（14言語）、日本語Re-ranking高精度 |
| LLM候補抽出 | Gemini / Groq / OpenAI | 質問の意図を理解した関連度評価（0〜10） |

旧モデル `ms-marco-MiniLM-L-6-v2`（英語専用）から日本語対応モデルに変更し、精度が向上。

### 2段階パイプライン

```
初期検索結果（ハイブリッド検索 + RRF統合）
        ↓
  [Stage 1] CrossEncoder スコアリング
    - 全候補をスコアリング（logit: 約-10〜+10）
        ↓
  [Stage 2] LLM 候補抽出（候補が6件以上の場合）
    - LLMが各候補の関連度を0〜10で評価
    - 上位5件を抽出
        ↓
  [Stage 3] スコア統合 + 信頼度フィルタ
    - final_score = CE × 0.4 + LLM × 0.6
    - 信頼度閾値（CE < -3.0）未満の候補を除外
    - 上位3件を最終選定
```

### 信頼度閾値

mMARCOモデルはlogitを出力するため、スコア範囲は約-10〜+10です。
閾値 `-3.0` 未満の候補は「ほぼ無関連」と判断して除外します。

全候補が閾値以下の場合は空リストを返し、回答は「該当情報なし」になります。

## 実装例（基本）

```python
from sentence_transformers import CrossEncoder

class ReRankingRAG:
    def __init__(self, model_name="cross-encoder/mmarco-mMiniLMv2-L12-H384-v1"):
        self.cross_encoder = CrossEncoder(model_name)

    def rerank_documents(self, query, documents, top_k=3):
        # 質問と各文書のペアを作成
        pairs = [[query, doc.page_content] for doc in documents]
        # CrossEncoderでスコアリング
        scores = self.cross_encoder.predict(pairs)
        # スコアと文書を紐付け、降順ソート
        doc_score_pairs = sorted(
            zip(documents, scores),
            key=lambda x: x[1],
            reverse=True,
        )
        return doc_score_pairs[:top_k]
```

## 使用例

```python
from src.onsen_rag import OnsenRAG

rag = OnsenRAG()
rag.load_from_data_folder()

# 3段階パイプラインで回答（内部でRe-ranking実行）
result = rag.query("草津温泉のカフェは？", k=3)
print(result["result"])
```

## メリット

| 項目 | 説明 |
|------|------|
| 関連度の高い文書を優先 | CrossEncoder + LLMの二重評価で上位を選択 |
| 日本語精度の向上 | 多言語モデルにより日本語クエリの精度が大幅向上 |
| 低品質候補の排除 | 信頼度閾値により無関連な候補を自動除外 |
| 質問意図の理解 | LLMが「本当に回答に使える情報か」を判断 |

## Bi-Encoder vs CrossEncoder

| 方式 | 特徴 | 用途 |
|------|------|------|
| 初期検索（Bi-Encoder） | クエリと文書を別々にベクトル化 → 高速 | 候補の絞り込み |
| Re-ranking（CrossEncoder） | クエリと文書のペアを一緒に処理 → 高精度 | 候補の精密な順位付け |
| Re-ranking（LLM） | クエリの意図を理解して評価 → 最高精度 | 質問意図に基づく最終選定 |

CrossEncoder は計算コストが高いため、初期検索で絞った後に適用する。
LLM評価はさらに高コストのため、候補が少ない場合はスキップして高速化する。
