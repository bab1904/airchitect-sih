import sqlite3
import json
import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any

DB_FILE = ":memory:"

class DatabaseManager:
    _instance = None

    def __init__(self):
        self.conn = sqlite3.connect("oil_schedule_data.db", check_same_thread=False)
        self.conn.row_factory = sqlite3.Row
        self.create_tables()
        self.seed_initial_data()

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = DatabaseManager()
        return cls._instance

    def create_tables(self):
        cursor = self.conn.cursor()
        
        # WBS Master Baseline Schedule
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS wbs_tasks (
            id TEXT PRIMARY KEY,
            wbs_level TEXT NOT NULL,
            wbs_code TEXT NOT NULL,
            discipline TEXT NOT NULL,
            activity_name TEXT NOT NULL,
            planned_start TEXT NOT NULL,
            planned_finish TEXT NOT NULL,
            actual_start TEXT,
            actual_finish TEXT,
            status TEXT NOT NULL DEFAULT 'NOT_STARTED',
            progress_percent INTEGER DEFAULT 0,
            critical_path INTEGER DEFAULT 0,
            audit_trail TEXT DEFAULT '[]'
        )
        """)

        # Review Queue (HITL & Unlinked)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS review_queue (
            queue_id TEXT PRIMARY KEY,
            raw_text TEXT NOT NULL,
            source_type TEXT NOT NULL DEFAULT 'text',
            reported_by TEXT NOT NULL,
            discipline TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            action TEXT NOT NULL,
            progress_percent INTEGER,
            delay_reason TEXT,
            confidence_score REAL NOT NULL,
            suggested_task_id TEXT,
            suggested_task_name TEXT,
            top_candidates TEXT DEFAULT '[]',
            status TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
            created_at TEXT NOT NULL
        )
        """)

        # Institutional Memory Logs
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS institutional_memory (
            log_id TEXT PRIMARY KEY,
            task_id TEXT,
            task_name TEXT,
            discipline TEXT NOT NULL,
            log_text TEXT NOT NULL,
            delay_category TEXT NOT NULL,
            variance_days INTEGER DEFAULT 0,
            logged_at TEXT NOT NULL
        )
        """)
        
        self.conn.commit()

    def seed_initial_data(self):
        cursor = self.conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM wbs_tasks")
        if cursor.fetchone()[0] > 0:
            return # Already seeded

        initial_tasks = [
            # Civil
            ("CIV-L5-1041", "L5", "1.3.2.1", "Civil", "CDU-4 Column Main Raft Foundation Concrete Pouring", "2026-09-01", "2026-09-15", "2026-09-02", None, "IN_PROGRESS", 70, 1, 
             json.dumps([{
                 "timestamp": "2026-09-02 08:30:00",
                 "source_dpr": "Mobilized batching plant. Pouring started for Raft foundation grid A-C.",
                 "action_detected": "START",
                 "confidence_score": 94.2,
                 "auto_applied": True,
                 "author": "TimeAgent AI"
             }])),
            ("CIV-L6-1042", "L6", "1.3.2.1.1", "Civil", "Reinforcement Binding and Shuttering for Column Pedestals", "2026-09-05", "2026-09-12", "2026-09-06", "2026-09-11", "COMPLETED", 100, 0,
             json.dumps([{
                 "timestamp": "2026-09-11 17:00:00",
                 "source_dpr": "All 18 column pedestals reinforcement and formwork inspected and cleared by QC.",
                 "action_detected": "FINISH",
                 "confidence_score": 91.5,
                 "auto_applied": True,
                 "author": "TimeAgent AI"
             }])),
            ("CIV-L5-1043", "L5", "1.3.2.2", "Civil", "Underground Oily Water Sewer (OWS) Trenching and Pipe Laying", "2026-09-10", "2026-09-25", None, None, "NOT_STARTED", 0, 0, "[]"),
            ("CIV-L6-1044", "L6", "1.3.2.2.1", "Civil", "Backfilling and Compaction of Pipe Rack Bay-3 Area", "2026-09-20", "2026-09-30", None, None, "NOT_STARTED", 0, 0, "[]"),
            
            # Piping
            ("PIP-L5-2015", "L5", "1.4.1.1", "Piping", "12-inch Crude Distillation Overhead Vapor Line Hydrotesting", "2026-09-12", "2026-09-22", None, None, "NOT_STARTED", 0, 1, "[]"),
            ("PIP-L6-2016", "L6", "1.4.1.1.1", "Piping", "Spool Fabrication and Fit-up for Column Feed Preheater Line", "2026-09-02", "2026-09-14", "2026-09-03", None, "IN_PROGRESS", 85, 0,
             json.dumps([{
                 "timestamp": "2026-09-03 10:15:00",
                 "source_dpr": "Spool fit-up started at yard for feed preheater line.",
                 "action_detected": "START",
                 "confidence_score": 88.7,
                 "auto_applied": True,
                 "author": "TimeAgent AI"
             }])),
            ("PIP-L5-2017", "L5", "1.4.1.2", "Piping", "Heavy Crude Furnace Crossover Piping Erection and Tie-in", "2026-09-18", "2026-10-05", None, None, "NOT_STARTED", 0, 1, "[]"),
            ("PIP-L6-2018", "L6", "1.4.1.2.1", "Piping", "Flange Bolting and Torque Verification for Desalter Header", "2026-09-22", "2026-09-28", None, None, "NOT_STARTED", 0, 0, "[]"),

            # Electrical
            ("ELE-L5-3022", "L5", "1.5.3.1", "Electrical", "Substation-4 6.6kV Switchgear Panel Installation and Megger Testing", "2026-09-08", "2026-09-20", "2026-09-09", None, "IN_PROGRESS", 60, 1,
             json.dumps([{
                 "timestamp": "2026-09-09 14:00:00",
                 "source_dpr": "Unloaded switchgear panels in Substation-4, commenced base channel alignment.",
                 "action_detected": "START",
                 "confidence_score": 93.0,
                 "auto_applied": True,
                 "author": "TimeAgent AI"
             }])),
            ("ELE-L6-3023", "L6", "1.5.3.1.1", "Electrical", "HT Cable Pulling through Main Cable Trench Bay-1 to Substation", "2026-09-15", "2026-09-26", None, None, "NOT_STARTED", 0, 0, "[]"),
            ("ELE-L5-3024", "L5", "1.5.3.2", "Electrical", "Emergency Diesel Generator (EDG) Synchronization and Load Bank Test", "2026-09-25", "2026-10-10", None, None, "NOT_STARTED", 0, 0, "[]"),
            ("ELE-L6-3025", "L6", "1.5.3.2.1", "Electrical", "Motor Control Center (MCC) Internal Busbar Earthing Connection", "2026-09-12", "2026-09-18", None, None, "NOT_STARTED", 0, 0, "[]"),

            # Instrumentation & Mechanical
            ("INS-L5-4011", "L5", "1.6.1.1", "Instrumentation", "DCS Control System Loop Checking for Distillation Column Pressure Transmitters", "2026-09-24", "2026-10-06", None, None, "NOT_STARTED", 0, 0, "[]"),
            ("MEC-L5-5018", "L5", "1.7.2.1", "Mechanical", "Heavy Lift Erection of Crude Distillation Main Column (C-401) using 600T Crane", "2026-09-16", "2026-09-28", None, None, "NOT_STARTED", 0, 1, "[]"),
        ]

        cursor.executemany("""
        INSERT INTO wbs_tasks (id, wbs_level, wbs_code, discipline, activity_name, planned_start, planned_finish, actual_start, actual_finish, status, progress_percent, critical_path, audit_trail)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, initial_tasks)

        # Seed Pending Review Queue Items
        initial_queue = [
            (
                "RQ-8901",
                "Fitters carried out nitrogen leak test on line PIP-2015 overhead joints, awaiting QA stamp.",
                "text",
                "Amitabh Sen (Piping Supervisor)",
                "Piping",
                "2026-09-19 16:20",
                "IN_PROGRESS",
                75,
                None,
                78.5,
                "PIP-L5-2015",
                "12-inch Crude Distillation Overhead Vapor Line Hydrotesting",
                json.dumps([
                    {"task_id": "PIP-L5-2015", "activity_name": "12-inch Crude Distillation Overhead Vapor Line Hydrotesting", "discipline": "Piping", "wbs_level": "L5", "similarity_score": 78.5},
                    {"task_id": "PIP-L6-2016", "activity_name": "Spool Fabrication and Fit-up for Column Feed Preheater Line", "discipline": "Piping", "wbs_level": "L6", "similarity_score": 52.1}
                ]),
                "PENDING_REVIEW",
                "2026-09-19 16:25:00"
            ),
            (
                "RQ-8902",
                "Subcontractor mobilized hydraulic breaker for unexpected hard rock patch near flare line trench.",
                "voice",
                "Pranab Gogoi (Site Lead)",
                "Civil",
                "2026-09-20 11:45",
                "IN_PROGRESS",
                20,
                "Geotechnical hard rock anomaly encountered",
                42.3,
                None,
                None,
                json.dumps([]),
                "UNLINKED_ACTIVITY",
                "2026-09-20 11:50:00"
            )
        ]

        cursor.executemany("""
        INSERT INTO review_queue (queue_id, raw_text, source_type, reported_by, discipline, timestamp, action, progress_percent, delay_reason, confidence_score, suggested_task_id, suggested_task_name, top_candidates, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, initial_queue)

        # Seed Institutional Memory Logs
        initial_memory = [
            ("MEM-101", "CIV-L5-1041", "CDU-4 Column Main Raft Foundation Concrete Pouring", "Civil", "Continuous monsoon downpour caused severe waterlogging in raft pit. RMC transit mixers halted for 48 hours.", "Weather - Monsoon Rain", 3, "2026-08-15 14:00"),
            ("MEM-102", "PIP-L5-2017", "Heavy Crude Furnace Crossover Piping Erection and Tie-in", "Piping", "600T crawler crane hydraulic hose burst during main spool positioning; maintenance team required replacement from Guwahati depot.", "Equipment Failure - Crane Breakdown", 4, "2026-08-22 09:30"),
            ("MEM-103", "ELE-L5-3022", "Substation-4 6.6kV Switchgear Panel Installation and Megger Testing", "Electrical", "Delayed Hot Work and Energization Permit to Work (PTW) clearance from Safety Cell due to concurrent hydrotest in adjacent zone.", "Permit to Work (PTW) Regulatory Hold", 2, "2026-08-28 11:15"),
            ("MEM-104", "PIP-L6-2016", "Spool Fabrication and Fit-up for Column Feed Preheater Line", "Piping", "Vendor delayed delivery of ASTM A335 P9 alloy steel seamless fittings with 3.1 mill test certificates.", "Supply Chain - Material Mill Test Certificate Delay", 5, "2026-09-02 16:45"),
            ("MEM-105", "CIV-L5-1043", "Underground Oily Water Sewer (OWS) Trenching and Pipe Laying", "Civil", "Discovered unmapped legacy cooling water piping during mechanical excavation at chainage 0+240.", "Subsurface Anomaly / Uncharted Utility Clash", 6, "2026-09-05 10:00"),
            ("MEM-106", "MEC-L5-5018", "Heavy Lift Erection of Crude Distillation Main Column (C-401)", "Mechanical", "Wind velocity exceeded 35 km/h at 45m elevation; safety officer flagged high risk and stood down rigging crew.", "Weather - High Wind Speeds at Elevation", 2, "2026-09-10 13:20"),
        ]

        cursor.executemany("""
        INSERT INTO institutional_memory (log_id, task_id, task_name, discipline, log_text, delay_category, variance_days, logged_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, initial_memory)

        self.conn.commit()

    def get_all_tasks(self) -> List[Dict[str, Any]]:
        cursor = self.conn.cursor()
        cursor.execute("SELECT * FROM wbs_tasks ORDER BY wbs_code ASC")
        rows = cursor.fetchall()
        result = []
        for r in rows:
            d = dict(r)
            d["audit_trail"] = json.loads(d.get("audit_trail") or "[]")
            d["critical_path"] = bool(d.get("critical_path"))
            result.append(d)
        return result

    def get_task_by_id(self, task_id: str) -> Optional[Dict[str, Any]]:
        cursor = self.conn.cursor()
        cursor.execute("SELECT * FROM wbs_tasks WHERE id = ?", (task_id,))
        row = cursor.fetchone()
        if not row:
            return None
        d = dict(row)
        d["audit_trail"] = json.loads(d.get("audit_trail") or "[]")
        d["critical_path"] = bool(d.get("critical_path"))
        return d

    def update_task_actuals(self, task_id: str, action: str, timestamp: str, progress: Optional[int], audit_entry: Dict[str, Any]):
        cursor = self.conn.cursor()
        task = self.get_task_by_id(task_id)
        if not task:
            return False

        actual_start = task.get("actual_start")
        actual_finish = task.get("actual_finish")
        status = task.get("status")
        current_progress = task.get("progress_percent", 0)

        date_str = timestamp.split(" ")[0] if " " in timestamp else timestamp

        if action.upper() == "START":
            if not actual_start:
                actual_start = date_str
            status = "IN_PROGRESS"
            current_progress = max(current_progress, progress if progress is not None else 20)
        elif action.upper() == "FINISH":
            if not actual_start:
                actual_start = task.get("planned_start") or date_str
            actual_finish = date_str
            status = "COMPLETED"
            current_progress = 100
        elif action.upper() == "IN_PROGRESS":
            if not actual_start:
                actual_start = date_str
            status = "IN_PROGRESS"
            if progress is not None:
                current_progress = progress
            elif current_progress == 0:
                current_progress = 40

        audit_trail = task.get("audit_trail", [])
        audit_trail.append(audit_entry)

        cursor.execute("""
        UPDATE wbs_tasks
        SET actual_start = ?, actual_finish = ?, status = ?, progress_percent = ?, audit_trail = ?
        WHERE id = ?
        """, (actual_start, actual_finish, status, current_progress, json.dumps(audit_trail), task_id))
        self.conn.commit()
        return True

    def create_l6_task(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        cursor = self.conn.cursor()
        task_id = task_data.get("id") or f"{task_data.get('discipline')[:3].upper()}-L6-{uuid.uuid4().hex[:4].upper()}"
        wbs_code = task_data.get("wbs_code") or "1.9.9.1"
        audit = [{
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "source_dpr": "Created from Field Ingestion / Unlinked Activity Review",
            "action_detected": "MANUAL_CREATION",
            "confidence_score": 100.0,
            "auto_applied": False,
            "author": "Project Planner"
        }]

        cursor.execute("""
        INSERT INTO wbs_tasks (id, wbs_level, wbs_code, discipline, activity_name, planned_start, planned_finish, actual_start, actual_finish, status, progress_percent, critical_path, audit_trail)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            task_id,
            task_data.get("wbs_level", "L6"),
            wbs_code,
            task_data.get("discipline"),
            task_data.get("activity_name"),
            task_data.get("planned_start"),
            task_data.get("planned_finish"),
            task_data.get("actual_start"),
            task_data.get("actual_finish"),
            task_data.get("status", "IN_PROGRESS"),
            task_data.get("progress_percent", 20),
            0,
            json.dumps(audit)
        ))
        self.conn.commit()
        return self.get_task_by_id(task_id)

    def get_review_queue(self) -> List[Dict[str, Any]]:
        cursor = self.conn.cursor()
        cursor.execute("SELECT * FROM review_queue ORDER BY created_at DESC")
        rows = cursor.fetchall()
        result = []
        for r in rows:
            d = dict(r)
            d["top_candidates"] = json.loads(d.get("top_candidates") or "[]")
            result.append(d)
        return result

    def add_to_review_queue(self, item: Dict[str, Any]) -> str:
        cursor = self.conn.cursor()
        queue_id = item.get("queue_id") or f"RQ-{uuid.uuid4().hex[:6].upper()}"
        cursor.execute("""
        INSERT INTO review_queue (queue_id, raw_text, source_type, reported_by, discipline, timestamp, action, progress_percent, delay_reason, confidence_score, suggested_task_id, suggested_task_name, top_candidates, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            queue_id,
            item["raw_text"],
            item.get("source_type", "text"),
            item.get("reported_by", "Site Engineer"),
            item.get("discipline", "Civil"),
            item.get("timestamp", datetime.now().strftime("%Y-%m-%d")),
            item.get("action", "IN_PROGRESS"),
            item.get("progress_percent"),
            item.get("delay_reason"),
            item.get("confidence_score", 0.0),
            item.get("suggested_task_id"),
            item.get("suggested_task_name"),
            json.dumps(item.get("top_candidates", [])),
            item.get("status", "PENDING_REVIEW"),
            datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        ))
        self.conn.commit()
        return queue_id

    def delete_review_queue_item(self, queue_id: str):
        cursor = self.conn.cursor()
        cursor.execute("DELETE FROM review_queue WHERE queue_id = ?", (queue_id,))
        self.conn.commit()

    def add_institutional_memory(self, record: Dict[str, Any]):
        cursor = self.conn.cursor()
        log_id = record.get("log_id") or f"MEM-{uuid.uuid4().hex[:5].upper()}"
        cursor.execute("""
        INSERT INTO institutional_memory (log_id, task_id, task_name, discipline, log_text, delay_category, variance_days, logged_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            log_id,
            record.get("task_id"),
            record.get("task_name"),
            record.get("discipline", "General"),
            record.get("log_text"),
            record.get("delay_category", "General Operational Log"),
            record.get("variance_days", 0),
            record.get("logged_at", datetime.now().strftime("%Y-%m-%d %H:%M"))
        ))
        self.conn.commit()

    def get_all_memory_records(self) -> List[Dict[str, Any]]:
        cursor = self.conn.cursor()
        cursor.execute("SELECT * FROM institutional_memory ORDER BY logged_at DESC")
        return [dict(r) for r in cursor.fetchall()]

    def reset_database(self):
        cursor = self.conn.cursor()
        cursor.execute("DROP TABLE IF EXISTS wbs_tasks")
        cursor.execute("DROP TABLE IF EXISTS review_queue")
        cursor.execute("DROP TABLE IF EXISTS institutional_memory")
        self.conn.commit()
        self.create_tables()
        self.seed_initial_data()
