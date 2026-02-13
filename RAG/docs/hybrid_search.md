# 精度向上: ハイブリッド検索

## 考え方

2つの異なる検索手法を組み合わせて精度を向上させます：

```
セマンティック検索（ベクトル類似度）  キーワード検索（BM25）
  意味的な類似性                      単語の一致度
  「犬」→「ペット」もヒット          「犬」→「犬」を含む文書がヒット
                    ↓
         ハイブリッド検索（統合）
```

## 統合方式の比較

### 学習用: EnsembleRetriever

`HybridSearchRAG` では LangChain の `EnsembleRetriever` を使用:

```python
from src.hybrid_search_rag import HybridSearchRAG

rag = HybridSearchRAG(semantic_weight=0.5)
rag.load_documents(["テキスト1", "テキスト2"])
result = rag.query("草津温泉の泉質は？")
```

### 本番: RRF（Reciprocal Rank Fusion）

`OnsenRAG` では RRF で検索結果を統合:

```
RRF_score(doc) = Σ weight / (rank + K)
  - semantic_weight / (semantic_rank + 60) + keyword_weight / (keyword_rank + 60)
```

RRFの利点:
- スコアのスケールが異なる2つの検索結果を、ランク（順位）ベースで統合
- 両方の検索で上位に来た文書が高スコアになる
- パラメータ K=60 でランキングの安定性を確保

## 重みの調整

`weights` を調整して、どちらの検索手法を重視するか設定できます。

```python
# セマンティック検索を重視（意味的な類似性を優先）
rag = OnsenRAG(semantic_weight=0.7)

# キーワード検索を重視（固有名詞・完全一致を優先）
rag = OnsenRAG(semantic_weight=0.3)

# 同等の重み（デフォルト）
rag = OnsenRAG(semantic_weight=0.5)
```

## BM25キャッシュ

OnsenRAG では BM25 Retriever を起動時に事前構築してキャッシュします:

- **全文書BM25**: フィルタなし検索用
- **温泉地別BM25**: location別にキャッシュ（kusatsu, hakone, beppu, arima, onsen）

これにより、クエリ毎の BM25 再構築（数秒のオーバーヘッド）を回避します。

## 精度の測定

学習用の `HybridSearchRAG` では3方式を比較できます:

```python
results = rag.compare_search_modes("冬におすすめの温泉地は？", k=4)

print("キーワード検索:", len(results["keyword"]), "件")
print("セマンティック検索:", len(results["semantic"]), "件")
print("ハイブリッド検索:", len(results["hybrid"]), "件")
```

## ヒント

| 検索手法 | 強い点 | 弱い点 |
|----------|--------|--------|
| セマンティック | 類義語・意味的類似 | 固有名詞に弱い |
| キーワード(BM25) | 固有名詞・完全一致 | 類義語に弱い |
| ハイブリッド（RRF） | 両方の長所を補完、ランクベース統合 | 重み調整が必要 |
