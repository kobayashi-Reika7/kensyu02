# ===========================================
# OnsenRAG - RAGシステムパッケージ
# ===========================================
# このパッケージには以下のRAG実装が含まれます：
# - SimpleRAG: 基本的なRAGシステム（テキスト入力）
# - PDFRagSystem: PDF対応RAGシステム（日本語最適化）
# - HybridSearchRAG: ハイブリッド検索（セマンティック+キーワード）
# - ReRankingRAG: Re-rankingによる精度向上
# - OnsenRAG: 温泉テキストデータ特化RAG

from src.simple_rag import SimpleRAG
from src.pdf_rag_system import PDFRagSystem
from src.hybrid_search_rag import HybridSearchRAG
from src.reranking_rag import ReRankingRAG
from src.onsen_rag import OnsenRAG
from src.onsen_guide_rag import OnsenGuideRAG
from src.corporate_doc_rag import CorporateDocRAG
from src.paper_rag import PaperRAG
from src.support_bot import SupportBot, SupportResponse

__all__ = [
    "SimpleRAG",
    "PDFRagSystem",
    "HybridSearchRAG",
    "ReRankingRAG",
    "OnsenRAG",
    "OnsenGuideRAG",
    "CorporateDocRAG",
    "PaperRAG",
    "SupportBot",
    "SupportResponse",
]
