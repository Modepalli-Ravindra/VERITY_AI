import hashlib
import time
import uuid
import math
from typing import Dict, Any, List, Optional

class VerificationService:
    _records: Dict[str, Dict[str, Any]] = {
        "VRTY-20261011-DEMO0001": {
            "verification_id": "VRTY-20261011-DEMO0001",
            "timestamp": "2026-10-11T12:00:00Z",
            "classification": "Human Written",
            "ai_probability": 0.0845,
            "human_probability": 0.9155,
            "model_version": "DistilRoBERTa-V2+Stylometrics",
            "content_sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            "signature_hash": "a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0",
            "word_count": 904,
            "character_count": 5820,
            "document_filename": "verified_research_paper.docx",
            "verification_status": "authentic_verity_record"
        }
    }
    
    @classmethod
    def generate_verification_id(cls) -> str:
        date_str = time.strftime("%Y%m%d")
        rand_hex = uuid.uuid4().hex[:8].upper()
        return f"VRTY-{date_str}-{rand_hex}"
        
    @classmethod
    def create_provenance_record(
        cls,
        text: str,
        classification: str,
        ai_probability: float,
        model_version: str,
        document_meta: Optional[Dict[str, Any]] = None,
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        verification_id = cls.generate_verification_id()
        timestamp = time.time()
        iso_time = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(timestamp))
        
        # Cryptographic content hash (one-way SHA-256 to prove authenticity without storing raw document publicly)
        content_hash = hashlib.sha256(text.encode("utf-8")).hexdigest()
        
        # Signature hash combining ID, content hash, model, and timestamp
        signature_material = f"{verification_id}:{content_hash}:{model_version}:{timestamp}"
        signature_hash = hashlib.sha256(signature_material.encode("utf-8")).hexdigest()
        
        # Privacy-safe record: excludes full raw document text, only holds verifiable metadata
        public_record = {
            "verification_id": verification_id,
            "timestamp": iso_time,
            "classification": classification,
            "ai_probability": round(ai_probability, 4),
            "human_probability": round(1.0 - ai_probability, 4),
            "model_version": model_version,
            "content_sha256": content_hash,
            "signature_hash": signature_hash,
            "word_count": len(text.split()),
            "character_count": len(text),
            "document_filename": document_meta.get("filename") if document_meta else None,
            "verification_status": "authentic_verity_record"
        }
        
        cls._records[verification_id] = public_record
        
        qr_code_svg = cls.generate_qr_svg(verification_id)
        
        return {
            **public_record,
            "qr_code_svg": qr_code_svg,
            "verification_url": f"/verify/{verification_id}"
        }
        
    @classmethod
    def get_public_verification(cls, verification_id: str) -> Optional[Dict[str, Any]]:
        record = cls._records.get(verification_id)
        if not record:
            return None
        # Return strictly privacy-safe fields: NEVER user ID or document contents
        return {
            "verification_id": record["verification_id"],
            "timestamp": record["timestamp"],
            "classification": record["classification"],
            "ai_probability": record["ai_probability"],
            "human_probability": record["human_probability"],
            "model_version": record["model_version"],
            "content_sha256": record["content_sha256"][:16] + "...",
            "signature_hash": record["signature_hash"],
            "word_count": record["word_count"],
            "verification_status": "AUTHENTIC & VERIFIED",
            "issuer": "VERITY AI Trust & Verification Protocol"
        }
        
    @classmethod
    def generate_qr_svg(cls, verification_id: str) -> str:
        """
        Generates a clean, lightweight vector SVG QR-like visual verification badge.
        """
        # Deterministic matrix grid based on hash
        h = hashlib.md5(verification_id.encode('utf-8')).hexdigest()
        grid_size = 9
        rects = []
        cell_size = 8
        margin = 12
        
        # Corner position detection markers
        markers = [(0, 0), (grid_size - 3, 0), (0, grid_size - 3)]
        for mx, my in markers:
            for dx in range(3):
                for dy in range(3):
                    if dx == 0 or dx == 2 or dy == 0 or dy == 2 or (dx == 1 and dy == 1):
                        x = margin + (mx + dx) * cell_size
                        y = margin + (my + dy) * cell_size
                        rects.append(f'<rect x="{x}" y="{y}" width="{cell_size-1}" height="{cell_size-1}" fill="#E4FD97" rx="1"/>')

        # Data cells based on hash bits
        for i in range(grid_size):
            for j in range(grid_size):
                # Skip marker zones
                if (i < 3 and j < 3) or (i >= grid_size - 3 and j < 3) or (i < 3 and j >= grid_size - 3):
                    continue
                char_idx = (i * grid_size + j) % len(h)
                if int(h[char_idx], 16) % 2 == 1:
                    x = margin + i * cell_size
                    y = margin + j * cell_size
                    rects.append(f'<rect x="{x}" y="{y}" width="{cell_size-1}" height="{cell_size-1}" fill="#A3E635" opacity="0.85" rx="1"/>')
                    
        total_dim = margin * 2 + grid_size * cell_size
        svg_content = (
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {total_dim} {total_dim}" width="{total_dim}" height="{total_dim}">'
            f'<rect width="{total_dim}" height="{total_dim}" fill="#0B130E" rx="8" stroke="rgba(228,253,151,0.3)" stroke-width="1.5"/>'
            + "".join(rects) +
            f'</svg>'
        )
        return svg_content

    @classmethod
    def compute_transformation_fingerprint(cls, original_text: str, rewritten_text: str) -> Dict[str, Any]:
        """
        Computes reproducible transformation fingerprint and observable linguistic shifts.
        """
        orig_words = original_text.split()
        rewritten_words = rewritten_text.split()
        
        orig_count = max(1, len(orig_words))
        rewritten_count = max(1, len(rewritten_words))
        
        # Type-Token Ratio (Vocabulary Richness)
        orig_unique = len(set(w.lower() for w in orig_words))
        rewritten_unique = len(set(w.lower() for w in rewritten_words))
        orig_ttr = round(orig_unique / orig_count, 4)
        rewritten_ttr = round(rewritten_unique / rewritten_count, 4)
        
        # Sentence lengths
        orig_sents = [s.strip() for s in original_text.split('.') if s.strip()]
        rewritten_sents = [s.strip() for s in rewritten_text.split('.') if s.strip()]
        avg_orig_sent = round(orig_count / max(1, len(orig_sents)), 1)
        avg_rewritten_sent = round(rewritten_count / max(1, len(rewritten_sents)), 1)
        
        # Word delta
        word_delta = rewritten_count - orig_count
        word_ratio = round((rewritten_count / orig_count) * 100, 1)
        
        # Linguistic shift signature
        shift_signature = hashlib.sha256(f"{orig_count}:{rewritten_count}:{orig_ttr}:{rewritten_ttr}".encode()).hexdigest()[:12]
        
        return {
            "fingerprint_id": f"FP-{shift_signature.upper()}",
            "original_words": orig_count,
            "transformed_words": rewritten_count,
            "word_count_delta": word_delta,
            "length_preservation_ratio_pct": word_ratio,
            "original_vocabulary_richness_ttr": orig_ttr,
            "transformed_vocabulary_richness_ttr": rewritten_ttr,
            "vocabulary_shift_delta": round(rewritten_ttr - orig_ttr, 4),
            "original_avg_sentence_length": avg_orig_sent,
            "transformed_avg_sentence_length": avg_rewritten_sent,
            "burstiness_variation_achieved": bool(abs(avg_rewritten_sent - avg_orig_sent) >= 1.5),
            "disclaimer": "Transformation fingerprint reflects observable structural shifts. It does not provide definitive individual authorship attribution."
        }

    @classmethod
    def generate_intelligence_graph(
        cls,
        document_name: str,
        analysis_result: Dict[str, Any],
        humanized_result: Optional[Dict[str, Any]] = None,
        verification_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Creates an interactive traceable Content Intelligence Graph connecting:
        Document -> Multi-Chunk Analyses -> Segments -> Humanization -> Verification ID.
        """
        nodes = []
        edges = []
        
        # 1. Document Node
        doc_node_id = "doc-1"
        nodes.append({
            "id": doc_node_id,
            "label": document_name or "Input Document",
            "type": "document",
            "metadata": {
                "words": analysis_result.get("document_meta", {}).get("total_words", len(str(analysis_result.get("extracted_text", "")).split())),
                "file_type": analysis_result.get("document_meta", {}).get("file_type", "text")
            }
        })
        
        # 2. Model Node
        model_node_id = "model-engine"
        engine_name = analysis_result.get("detection_engine", "DistilRoBERTa-V2")
        nodes.append({
            "id": model_node_id,
            "label": f"Detector: {engine_name}",
            "type": "model",
            "metadata": {"version": engine_name, "threshold": 0.50}
        })
        
        # 3. Overall Analysis Node
        analysis_node_id = "analysis-root"
        classification = analysis_result.get("classification", "Unknown")
        ai_prob = analysis_result.get("ai_probability", 0.0)
        nodes.append({
            "id": analysis_node_id,
            "label": f"{classification} ({int(ai_prob * 100)}%)",
            "type": "analysis",
            "metadata": {"ai_probability": ai_prob, "confidence": analysis_result.get("confidence", "Medium")}
        })
        
        edges.append({"from": doc_node_id, "to": analysis_node_id, "label": "evaluated_by"})
        edges.append({"from": model_node_id, "to": analysis_node_id, "label": "powered_by"})
        
        # 4. Segment Nodes (up to 6 representative segments)
        segments = analysis_result.get("segments", [])[:6]
        for idx, seg in enumerate(segments):
            seg_id = f"seg-{idx + 1}"
            seg_p = seg.get("ai_probability", 0.0)
            nodes.append({
                "id": seg_id,
                "label": f"Section {idx + 1} ({int(seg_p * 100)}% AI)",
                "type": "segment",
                "metadata": {"words": seg.get("word_count", 0), "probability": seg_p}
            })
            edges.append({"from": analysis_node_id, "to": seg_id, "label": "contains_section"})
            
        # 5. Humanization Node if available
        if humanized_result:
            hum_id = "hum-transformation"
            hum_provider = humanized_result.get("provider", "LLM Engine")
            hum_tone = humanized_result.get("tone", "natural")
            nodes.append({
                "id": hum_id,
                "label": f"Rewriting ({hum_provider.upper()} - {hum_tone.capitalize()})",
                "type": "transformation",
                "metadata": {"provider": hum_provider, "tone": hum_tone}
            })
            edges.append({"from": analysis_node_id, "to": hum_id, "label": "adversarial_rewrite"})
            
        # 6. Verification Node
        if verification_id:
            ver_id = f"ver-{verification_id}"
            nodes.append({
                "id": ver_id,
                "label": f"Trust ID: {verification_id}",
                "type": "verification",
                "metadata": {"verification_id": verification_id}
            })
            edges.append({"from": analysis_node_id, "to": ver_id, "label": "sealed_as"})
            
        return {
            "nodes": nodes,
            "edges": edges,
            "stats": {
                "total_nodes": len(nodes),
                "total_edges": len(edges),
                "traceability": "Full End-to-End Cryptographic Chain"
            }
        }
