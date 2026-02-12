# チャンキング戦略 - 精度向上ガイド

## ドキュメントタイプ別プリセット

| タイプ | chunk_size | chunk_overlap | 説明 |
|--------|------------|---------------|------|
| **general** | 600 | 75 | 一般的な文書・バランス重視 |
| **technical** | 900 | 120 | 技術文書・文脈保持重視 |
| **faq** | 350 | 40 | 短い情報(FAQ)・簡潔さ重視 |
| **long** | 1000 | 150 | 長文(論文等)・詳細保持重視 |

## 使い方

```python
from src.text_splitter_utils import create_token_text_splitter, get_chunk_preset

# プリセットを使用
splitter = create_token_text_splitter(document_type="general")

# 手動指定
splitter = create_token_text_splitter(chunk_size=600, chunk_overlap=75)

# プリセット値を取得
size, overlap = get_chunk_preset("technical")
```

## チャンキングのヒント

### 意味的な分割を優先
- 段落、文末、句読点など自然な区切りを使用
- 単語の途中で分割されないよう注意

### 適切な長さのバランス
- 短すぎると文脈が失われる
- 長すぎるとノイズが増える

### 重複で文脈を保持
- 文章の継続性を維持するため適切な overlap を設定
- 質問の文脈が複数チャンクにまたがる場合を考慮

### メタデータの活用
- ページ番号、ソース名、前後のチャンク情報を付与
- 検索・取得時の文脈理解に役立つ

## RAG での指定

```python
# OnsenRAG（JSONチャンク）
from src.onsen_rag import OnsenRAG
rag = OnsenRAG()
rag.load_json_chunks(["data/kusatsu_chunks.json"])

# CorporateDocRAG（TXT/PDF）
from src.corporate_doc_rag import CorporateDocRAG
rag = CorporateDocRAG()
rag.load_from_folder("data/", document_type="general")
```
