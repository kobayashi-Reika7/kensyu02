# 検索戦略のおすすめ構成（温泉ガイド向け）

## 4フェーズパイプライン

| フェーズ | 手法 | 説明 |
|----------|------|------|
| ① 初期検索 | キーワード + セマンティック | ハイブリッドで幅広く候補を取得 |
| ② 候補抽出 | 上位20件 | 多めに取得して再ランクに渡す |
| ③ 再ランク | CrossEncoder | クエリ-文書の関連度を精密にスコアリング |
| ④ 最終選択 | スコア統合 | 上位4件をLLMのコンテキストに使用 |

## 実装: OnsenGuideRAG

```python
from src.onsen_guide_rag import OnsenGuideRAG

rag = OnsenGuideRAG()
rag.load_json_chunks()  # 草津温泉ガイド等

result = rag.query(
    "冬におすすめの温泉地は？",
    initial_k=20,   # ①② ハイブリッドで20件取得
    final_k=4,      # ③④ 再ランク後4件を採用
    semantic_weight=0.5,  # キーワードとセマンティックを同等に
)

print(result["result"])
# 再ランク後の文書も確認可能
for doc, score in result["reranked_docs"]:
    print(f"スコア: {score:.4f} | {doc.page_content[:80]}...")
```

## なぜこの構成か

- **ハイブリッド**: 固有名詞（温泉名）と意味的類似（「おすすめ」→「お勧め」）の両方に強い
- **20件候補**: 初期検索は高速だが精度にばらつきがあるため多めに取得
- **再ランク**: CrossEncoderでクエリと文書の関連度を精密に評価
- **4件採用**: コンテキスト長を抑えつつ、十分な根拠を確保
