import numpy as np
from datetime import datetime
from typing import List, Dict, Any, Optional
from app.models.schemas import MemoryQueryRequest, MemoryQueryResponse, DelayMemoryRecord, VarianceMatrixItem
from app.services.matcher_engine import MatcherEngine

# In-Memory Master Institutional Memory Logs
INSTITUTIONAL_MEMORY_LOGS: List[Dict[str, Any]] = [
    {
        "log_id": "MEM-101",
        "task_id": "CIV-L5-1041",
        "task_name": "CDU-4 Column Main Raft Foundation Concrete Pouring",
        "discipline": "Civil",
        "supervisor_quote": "Continuous monsoon downpour caused severe waterlogging in raft pit. RMC transit mixers halted for 48 hours.",
        "root_cause": "Weather - Severe Monsoon Rain & Pit Ingress",
        "planned_duration_days": 14,
        "actual_duration_days": 18,
        "variance_days": 4,
        "logged_at": "2026-08-15 14:00"
    },
    {
        "log_id": "MEM-102",
        "task_id": "PIP-L5-2017",
        "task_name": "Heavy Crude Furnace Crossover Piping Erection and Tie-in",
        "discipline": "Piping",
        "supervisor_quote": "600T crawler crane hydraulic boom hose burst during main 24-inch piping spool positioning; maintenance team required replacement part from Guwahati depot.",
        "root_cause": "Equipment Breakdown - Heavy Lift Crane Hydraulic Failure",
        "planned_duration_days": 17,
        "actual_duration_days": 23,
        "variance_days": 6,
        "logged_at": "2026-08-22 09:30"
    },
    {
        "log_id": "MEM-103",
        "task_id": "ELE-L5-3022",
        "task_name": "Substation-4 6.6kV Switchgear Panel Installation and Megger Testing",
        "discipline": "Electrical",
        "supervisor_quote": "Delayed Hot Work and Energization Permit to Work (PTW) clearance from refinery Safety Cell due to concurrent hydrotest in adjacent battery limit.",
        "root_cause": "Permit to Work (PTW) Regulatory Safety Cell Hold",
        "planned_duration_days": 12,
        "actual_duration_days": 15,
        "variance_days": 3,
        "logged_at": "2026-08-28 11:15"
    },
    {
        "log_id": "MEM-104",
        "task_id": "PIP-L6-2016",
        "task_name": "Spool Fabrication and Fit-up for Column Feed Preheater Line",
        "discipline": "Piping",
        "supervisor_quote": "Vendor shipment delayed for ASTM A335 P9 alloy steel seamless fittings with 3.1 mill test certificates, stopping yard fitters.",
        "root_cause": "Supply Chain - Material & Mill Test Certificate Delay",
        "planned_duration_days": 12,
        "actual_duration_days": 17,
        "variance_days": 5,
        "logged_at": "2026-09-02 16:45"
    },
    {
        "log_id": "MEM-105",
        "task_id": "CIV-L5-1043",
        "task_name": "Underground Oily Water Sewer (OWS) Trenching and Pipe Laying",
        "discipline": "Civil",
        "supervisor_quote": "Excavator struck unmapped legacy underground cooling water line at chainage 0+240; excavation stopped for utility rerouting survey.",
        "root_cause": "Subsurface Anomaly - Uncharted Legacy Utility Clash",
        "planned_duration_days": 15,
        "actual_duration_days": 21,
        "variance_days": 6,
        "logged_at": "2026-09-05 10:00"
    },
    {
        "log_id": "MEM-106",
        "task_id": "MEC-L5-5018",
        "task_name": "Heavy Lift Erection of Crude Distillation Main Column (C-401)",
        "discipline": "Mechanical",
        "supervisor_quote": "Sustained wind gusts exceeded 38 km/h at 50m tower elevation; safety officer flagged high rigging risk and stood down heavy crane crew.",
        "root_cause": "Environmental - High Wind Velocities at Elevation",
        "planned_duration_days": 12,
        "actual_duration_days": 15,
        "variance_days": 3,
        "logged_at": "2026-09-10 13:20"
    }
]

# Static Predictive Forecast Variance Matrix Data
STATIC_VARIANCE_MATRIX = [
    {
        "discipline": "Civil",
        "planned_avg_days": 14.5,
        "actual_avg_days": 18.2,
        "variance_days": 3.7,
        "primary_delay_driver": "Monsoon Waterlogging & Subsurface Utility Clashes",
        "ai_risk_forecast": "Moderate Risk (+22% duration on underground trenching)"
    },
    {
        "discipline": "Piping",
        "planned_avg_days": 15.0,
        "actual_avg_days": 20.5,
        "variance_days": 5.5,
        "primary_delay_driver": "Heavy Lift Crane Availability & Mill Certificate Holds",
        "ai_risk_forecast": "High Risk (+36% duration on heavy crude crossover lines)"
    },
    {
        "discipline": "Electrical",
        "planned_avg_days": 11.0,
        "actual_avg_days": 13.5,
        "variance_days": 2.5,
        "primary_delay_driver": "Safety Cell PTW Clearance & Cable Trench Ingress",
        "ai_risk_forecast": "Low-to-Medium Risk (+18% duration on switchgear meggering)"
    },
    {
        "discipline": "Mechanical",
        "planned_avg_days": 13.0,
        "actual_avg_days": 16.0,
        "variance_days": 3.0,
        "primary_delay_driver": "High Elevation Wind Speeds & Rigging Stand-Downs",
        "ai_risk_forecast": "Moderate Risk (+23% on main column heavy lifts)"
    }
]

class InstitutionalMemoryService:
    @classmethod
    def append_memory_log(cls, entry: Dict[str, Any]):
        INSTITUTIONAL_MEMORY_LOGS.insert(0, entry)

    @classmethod
    def query_memory(cls, request: MemoryQueryRequest) -> Dict[str, Any]:
        query = request.query.strip()
        query_embed = MatcherEngine.get_text_embedding(query)

        scored_records = []
        for r in INSTITUTIONAL_MEMORY_LOGS:
            # Discipline filtering if specified
            if request.discipline and request.discipline.upper() != "ALL" and request.discipline.lower() != r.get("discipline", "").lower():
                continue

            # Composite semantic text for embedding
            text_to_embed = f"{r.get('discipline')} {r.get('task_id', '')} {r.get('task_name', '')} {r.get('root_cause', '')} {r.get('supervisor_quote', '')}"
            rec_embed = MatcherEngine.get_text_embedding(text_to_embed)
            
            sim = MatcherEngine.cosine_similarity(query_embed, rec_embed)
            
            # Boost if query mentions explicit discipline or task words
            query_words = set(query.lower().split())
            if any(w in query_words for w in [r.get('discipline', '').lower(), r.get('task_id', '').lower()]):
                sim += 0.15

            # Direct keyword overlap boost
            text_words = set(text_to_embed.lower().split())
            overlap = len(query_words.intersection(text_words))
            if overlap >= 3:
                sim += 0.25
            elif overlap >= 2:
                sim += 0.15
            elif overlap >= 1:
                sim += 0.08

            # Calibrated percentage for presentation
            relevance_score = round(max(35.0, min(98.8, 50.0 + (sim * 55.0))), 1)

            scored_records.append({
                "log_id": r["log_id"],
                "task_id": r.get("task_id"),
                "task_name": r.get("task_name"),
                "discipline": r.get("discipline"),
                "supervisor_quote": r.get("supervisor_quote"),
                "root_cause": r.get("root_cause"),
                "planned_duration_days": r.get("planned_duration_days", 14),
                "actual_duration_days": r.get("actual_duration_days", 18),
                "variance_days": r.get("variance_days", 4),
                "relevance_score": relevance_score,
                "logged_at": r.get("logged_at", datetime.now().strftime("%Y-%m-%d %H:%M"))
            })

        # Sort descending by relevance score
        scored_records.sort(key=lambda x: x["relevance_score"], reverse=True)
        top_3_matches = scored_records[:3]

        return {
            "query": query,
            "top_matches": top_3_matches,
            "variance_matrix": STATIC_VARIANCE_MATRIX
        }
