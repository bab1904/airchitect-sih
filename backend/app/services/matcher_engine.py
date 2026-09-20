import re
import uuid
import numpy as np
from datetime import datetime
from typing import List, Tuple, Dict, Any, Optional
from app.models.schemas import ExtractedEntities, MatchCandidate, IngestResponse
from app.services.database import DatabaseManager

# Load sentence_transformers
try:
    from sentence_transformers import SentenceTransformer
    _transformer_model = SentenceTransformer('all-MiniLM-L6-v2')
except Exception as e:
    print(f"Warning: SentenceTransformer loading exception ({e}). Fallback vectorizer will be used.")
    _transformer_model = None

class MatcherEngine:
    @staticmethod
    def extract_entities(text: str) -> ExtractedEntities:
        lower_text = text.lower()
        
        # 1. Discipline Extraction
        discipline = "General"
        if any(w in lower_text for w in ["civil", "concrete", "raft", "foundation", "shuttering", "trench", "excavation", "rebar", "pedestal", "sewer", "backfill"]):
            discipline = "Civil"
        elif any(w in lower_text for w in ["piping", "pipe", "spool", "hydrotest", "flange", "bolting", "valve", "crossover", "header", "weld", "joint"]):
            discipline = "Piping"
        elif any(w in lower_text for w in ["electrical", "cable", "switchgear", "megger", "substation", "generator", "edg", "mcc", "earthing", "busbar", "ht cable"]):
            discipline = "Electrical"
        elif any(w in lower_text for w in ["instrument", "dcs", "transmitter", "loop check", "calibration", "scada", "sensor"]):
            discipline = "Instrumentation"
        elif any(w in lower_text for w in ["mechanical", "crane", "heavy lift", "erection", "fractionator", "tray", "bubble cap", "column", "c-401"]):
            discipline = "Mechanical"

        # 2. Timestamp Extraction
        extracted_date = datetime.now().strftime("%Y-%m-%d")
        date_match = re.search(r'(\d{4}-\d{2}-\d{2})|(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})', text)
        if date_match:
            extracted_date = date_match.group(0)
        elif "yesterday" in lower_text:
            extracted_date = "Yesterday"
        elif "today" in lower_text:
            extracted_date = datetime.now().strftime("%Y-%m-%d")

        # 3. Action Extraction
        action = "IN_PROGRESS"
        if any(w in lower_text for w in ["completed", "finished", "cleared", "passed", "handed over", "100%", "done", "concluded"]):
            action = "FINISH"
        elif any(w in lower_text for w in ["commenced", "started", "initiated", "began", "mobilized", "pour started", "unloaded", "kickoff"]):
            action = "START"
        elif any(w in lower_text for w in ["halted", "delayed", "waterlogged", "stopped", "stand down", "hold", "breakdown", "burst"]):
            action = "DELAY"

        # 4. Progress % Extraction
        progress = None
        pct_match = re.search(r'(\d{1,3})\s*%', text)
        if pct_match:
            progress = min(100, int(pct_match.group(1)))
        elif action == "FINISH":
            progress = 100
        elif action == "START":
            progress = 25

        # 5. Delay Reason Extraction
        delay_reason = None
        if any(w in lower_text for w in ["waterlog", "rain", "monsoon"]):
            delay_reason = "Weather - Rain / Waterlogging"
        elif any(w in lower_text for w in ["crane", "breakdown", "equipment", "burst", "generator failure"]):
            delay_reason = "Equipment Failure / Breakdown"
        elif any(w in lower_text for w in ["ptw", "permit", "safety cell", "clearance"]):
            delay_reason = "Permit to Work (PTW) Regulatory Hold"
        elif any(w in lower_text for w in ["vendor", "material", "delivery", "spool delay", "fittings"]):
            delay_reason = "Supply Chain - Material & Equipment Delivery"
        elif any(w in lower_text for w in ["hard rock", "geotechnical", "subsurface", "utility clash"]):
            delay_reason = "Subsurface Anomaly / Geotechnical Encounter"

        # 6. Location / Sub-area extraction
        location = None
        loc_match = re.search(r'(substation[-\s]?\d+|bay[-\s]?\d+|cdu[-\s]?\d+|c-401|grid\s+[a-z]-[a-z])', lower_text)
        if loc_match:
            location = loc_match.group(0).upper()

        return ExtractedEntities(
            discipline=discipline,
            timestamp=extracted_date,
            action=action,
            progress_percent=progress,
            delay_reason=delay_reason,
            location=location
        )

    @classmethod
    def get_text_embedding(cls, text: str) -> np.ndarray:
        if _transformer_model is not None:
            return _transformer_model.encode(text, convert_to_numpy=True)
        
        words = text.lower().split()
        vec = np.zeros(64)
        for word in words:
            hash_val = abs(hash(word)) % 64
            vec[hash_val] += 1.0
        norm = np.linalg.norm(vec)
        return vec / norm if norm > 0 else vec

    @classmethod
    def cosine_similarity(cls, vec_a: np.ndarray, vec_b: np.ndarray) -> float:
        norm_a = np.linalg.norm(vec_a)
        norm_b = np.linalg.norm(vec_b)
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return float(np.dot(vec_a, vec_b) / (norm_a * norm_b))

    @classmethod
    def match_tasks(cls, raw_text: str, discipline: str) -> List[MatchCandidate]:
        db = DatabaseManager.get_instance()
        tasks = db.get_all_tasks()
        if not tasks:
            return []

        text_embed = cls.get_text_embedding(raw_text)
        candidates = []

        for task in tasks:
            task_desc = f"{task['discipline']} {task['id']} {task['activity_name']} {task['wbs_code']}"
            task_embed = cls.get_text_embedding(task_desc)
            
            raw_sim = cls.cosine_similarity(text_embed, task_embed)
            
            # Explicit Task ID match boost (e.g. PIP-2015 -> PIP-L5-2015)
            task_id_numeric = re.sub(r'[^0-9]', '', task['id'])
            raw_text_numeric = re.findall(r'\b\d{4}\b', raw_text)
            
            if task['id'].lower() in raw_text.lower():
                raw_sim = max(raw_sim, 0.95)
            elif task_id_numeric and any(num in raw_text_numeric for num in [task_id_numeric]):
                raw_sim = max(raw_sim, 0.92)

            # Keyword direct overlaps (hydrotesting, raft foundation, switchgear)
            task_words = [w for w in re.findall(r'\b\w{4,}\b', task['activity_name'].lower()) if w not in ["with", "from", "into", "area", "unit"]]
            text_words = set(re.findall(r'\b\w{4,}\b', raw_text.lower()))
            common_words = set(task_words).intersection(text_words)
            
            if len(common_words) >= 3:
                raw_sim += 0.15
            elif len(common_words) >= 2:
                raw_sim += 0.09
            elif len(common_words) == 1:
                raw_sim += 0.04

            # Discipline synergy boost
            if discipline.lower() == task['discipline'].lower():
                raw_sim += 0.05
            elif discipline != "General" and discipline.lower() != task['discipline'].lower():
                raw_sim -= 0.20

            # Scale to 0 - 100 percentage with boundaries
            scaled_score = round(max(0.0, min(99.5, raw_sim * 100)), 1)
            
            candidates.append(MatchCandidate(
                task_id=task['id'],
                activity_name=task['activity_name'],
                discipline=task['discipline'],
                wbs_level=task['wbs_level'],
                similarity_score=scaled_score
            ))

        # Sort descending by similarity score
        candidates.sort(key=lambda x: x.similarity_score, reverse=True)
        return candidates[:5]

    @classmethod
    def process_ingestion(cls, raw_text: str, source_type: str = "text", reported_by: str = "Field Engineer") -> IngestResponse:
        db = DatabaseManager.get_instance()
        ingest_id = f"ING-{uuid.uuid4().hex[:6].upper()}"
        
        # 1. Entity Extraction
        entities = cls.extract_entities(raw_text)
        
        # 2. Semantic Matching & Cosine Similarity
        candidates = cls.match_tasks(raw_text, entities.discipline)
        best_candidate = candidates[0] if candidates else None
        best_confidence = best_candidate.similarity_score if best_candidate else 0.0

        # 3. Threshold Routing
        # Rule 1: Confidence >= 85% -> Auto-update schedule and add audit record
        # Rule 2: 50% <= Confidence < 85% -> Send to HITL review queue
        # Rule 3: Confidence < 50% -> Unlinked field activity
        if best_candidate and best_confidence >= 85.0:
            routing_decision = "AUTO_APPLIED"
            
            audit_entry = {
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "source_dpr": raw_text,
                "action_detected": entities.action,
                "confidence_score": best_confidence,
                "auto_applied": True,
                "author": f"TimeAgent AI ({source_type.title()} Ingestion)",
                "details": f"Discipline: {entities.discipline} | Progress: {entities.progress_percent or 'Auto'}%"
            }
            
            db.update_task_actuals(
                task_id=best_candidate.task_id,
                action=entities.action,
                timestamp=entities.timestamp,
                progress=entities.progress_percent,
                audit_entry=audit_entry
            )

            # Also log to institutional memory if delay reason detected
            if entities.delay_reason or entities.action == "DELAY":
                db.add_institutional_memory({
                    "task_id": best_candidate.task_id,
                    "task_name": best_candidate.activity_name,
                    "discipline": entities.discipline,
                    "log_text": raw_text,
                    "delay_category": entities.delay_reason or "Field Execution Delay",
                    "variance_days": 2
                })
                try:
                    from app.services.institutional_memory import InstitutionalMemoryService
                    InstitutionalMemoryService.append_memory_log({
                        "log_id": f"MEM-{uuid.uuid4().hex[:5].upper()}",
                        "task_id": best_candidate.task_id,
                        "task_name": best_candidate.activity_name,
                        "discipline": entities.discipline,
                        "supervisor_quote": raw_text,
                        "root_cause": entities.delay_reason or "Field Execution Delay",
                        "planned_duration_days": 14,
                        "actual_duration_days": 17,
                        "variance_days": 3,
                        "logged_at": datetime.now().strftime("%Y-%m-%d %H:%M")
                    })
                except Exception as mem_err:
                    print(f"Memory append notice: {mem_err}")

            message = f"Matched to {best_candidate.task_id} with {best_confidence}% confidence. Schedule actual dates and progress auto-updated."
            matched_id = best_candidate.task_id
            matched_name = best_candidate.activity_name

        elif best_candidate and best_confidence >= 50.0:
            routing_decision = "HITL_REVIEW_REQUIRED"
            queue_item = {
                "raw_text": raw_text,
                "source_type": source_type,
                "reported_by": reported_by,
                "discipline": entities.discipline,
                "timestamp": entities.timestamp,
                "action": entities.action,
                "progress_percent": entities.progress_percent,
                "delay_reason": entities.delay_reason,
                "confidence_score": best_confidence,
                "suggested_task_id": best_candidate.task_id,
                "suggested_task_name": best_candidate.activity_name,
                "top_candidates": [c.dict() for c in candidates[:3]],
                "status": "PENDING_REVIEW"
            }
            db.add_to_review_queue(queue_item)
            message = f"Moderate match confidence ({best_confidence}%). Routed to Human-in-the-Loop (HITL) review queue for planner approval."
            matched_id = best_candidate.task_id
            matched_name = best_candidate.activity_name

        else:
            routing_decision = "UNLINKED_ACTIVITY"
            queue_item = {
                "raw_text": raw_text,
                "source_type": source_type,
                "reported_by": reported_by,
                "discipline": entities.discipline,
                "timestamp": entities.timestamp,
                "action": entities.action,
                "progress_percent": entities.progress_percent,
                "delay_reason": entities.delay_reason,
                "confidence_score": best_confidence,
                "suggested_task_id": None,
                "suggested_task_name": None,
                "top_candidates": [c.dict() for c in candidates[:3]],
                "status": "UNLINKED_ACTIVITY"
            }
            db.add_to_review_queue(queue_item)
            message = "Unmatched field activity (< 50% confidence). Flagged for planner classification or new L6 task creation."
            matched_id = None
            matched_name = None

        return IngestResponse(
            ingest_id=ingest_id,
            raw_text=raw_text,
            extracted_entities=entities,
            top_matches=candidates[:3],
            best_confidence=best_confidence,
            routing_decision=routing_decision,
            matched_task_id=matched_id,
            matched_task_name=matched_name,
            message=message
        )
