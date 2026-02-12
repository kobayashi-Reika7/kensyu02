# 精度向上: ハイブリッド検索

## 考え方

2つの異なる検索手法を組み合わせて精度を向上させます：

```
セマンティック検索（ベクトル類似度）  キーワード検索（BM25）
  ✓ 意味的な類似性                      ✓ 単語の一致度
  「犬」→「ペット」もヒット              「犬」→「犬」を含む文書がヒット
                    ↓
         ハイブリッド検索（EnsembleRetriever）
              重み付けで各検索結果を統合
```

## 実装例

```python
from src.hybrid_search_rag import HybridSearchRAG

rag = HybridSearchRAG(semantic_weight=0.5)  # 両方を同じ重みで使用
rag.load_documents(["テキスト1", "テキスト2"])

# 質問
result = rag.query("草津温泉の泉質は？")
```

## 重みの調整

`weights=[0.7, 0.3]` のように調整して、どちらの検索手法を重視するか調整できます。

```python
# セマンティック検索を重視（意味的な類似性を優先）
rag = HybridSearchRAG(semantic_weight=0.7)

# キーワード検索を重視（固有名詞・完全一致を優先）
rag = HybridSearchRAG(semantic_weight=0.3)
```

## 精度の測定

「キーワード」「セマンティック」「ハイブリッド」で実行し、回収率を比較しましょう。

```python
results = rag.compare_search_modes("冬におすすめの温泉地は？", k=4)

print("キーワード検索:", len(results["keyword"]), "件")
for doc in results["keyword"]:
    print("  -", doc.page_content[:80] + "...")

print("セマンティック検索:", len(results["semantic"]), "件")
print("ハイブリッド検索:", len(results["hybrid"]), "件")
```

各手法の検索結果を比較して、期待されるチャンクがどれで回収されるか確認することで、最適な重みや検索手法を選べます。

## ヒント

| 検索手法 | 強い点 | 弱い点 |
|----------|--------|--------|
| セマンティック | 類義語・意味的類似 | 固有名詞に弱い |
| キーワード(BM25) | 固有名詞・完全一致 | 類義語に弱い |
| ハイブリッド | 両方の長所を補完 | 重み調整が必要 |
