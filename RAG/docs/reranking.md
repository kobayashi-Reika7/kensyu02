# 精度向上: Re-ranking

## 目的

- 初期検索結果を CrossEncoder でより正確に再スコアリングして上位のみ採用
- クエリと文書のペアを直接比較し、意味的な関連度を高精度に計算

## 実装例

```python
from sentence_transformers import CrossEncoder
from typing import List, Tuple

class ReRankingRAG:
    def __init__(self, model_name="cross-encoder/ms-marco-MiniLM-L-6-v2"):
        self.cross_encoder = CrossEncoder(model_name)

    def rerank_documents(
        self, query: str, documents: List, top_k: int = 4
    ) -> List[Tuple]:
        # 質問と各文書のペアを作成
        pairs = [[query, doc.page_content] for doc in documents]
        # CrossEncoderでスコアリング
        scores = self.cross_encoder.predict(pairs)
        # スコアと文書を紐付け
        doc_score_pairs = list(zip(documents, scores))
        # スコアの降順でソート
        doc_score_pairs.sort(key=lambda x: x[1], reverse=True)
        # 上位top_kを返す
        return doc_score_pairs[:top_k]
```

## 使用例

```python
from src.reranking_rag import ReRankingRAG

rag = ReRankingRAG()
rag.load_documents(["テキスト1", "テキスト2"])

# 初期検索で多めに取得 → Re-ranking後、上位のみ採用
result = rag.query(
    "質問内容",
    initial_k=20,   # 初期検索で20件取得
    final_k=4,      # 再ランク後4件を採用
)
```

## メリット

| 項目 | 説明 |
|------|------|
| 関連度の高い文書を優先 | 精度の高いスコアで上位を選択 |
| 取りこぼしを救出 | ベクトル検索で上位に来なかった文書を拾い上げる可能性 |

## Bi-Encoder vs CrossEncoder

| 方式 | 特徴 | 用途 |
|------|------|------|
| 初期検索（Bi-Encoder） | クエリと文書を別々にベクトル化 → 高速 | 候補の絞り込み |
| Re-ranking（CrossEncoder） | クエリと文書のペアを一緒に処理 → 高精度 | 候補の精密な順位付け |

※ CrossEncoder は計算コストが高いため、初期検索で絞った後に適用する。
