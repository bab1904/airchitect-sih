import uuid
from datetime import datetime
from app.models.schemas import ProjectRequest, ArchitecturalBlueprintResponse, VentilationMetrics, FloorPlanRoom

class ArchitectEngine:
    @staticmethod
    def generate_plan(req: ProjectRequest) -> ArchitecturalBlueprintResponse:
        project_id = str(uuid.uuid4())[:8]
        
        # Calculate algorithmic metrics based on inputs
        area = req.area_sqft
        floors = req.floors
        per_floor_area = area / floors
        
        # Room distribution heuristics
        rooms = []
        if req.building_type.lower() == "residential":
            rooms.append(FloorPlanRoom(
                name="Living / Great Room",
                dimensions=f"{int(per_floor_area * 0.35)} sq.ft",
                suggested_orientation="North-East",
                ventilation_type="Large Dual-Facing Operable Windows",
                features=["Max Daylight Harvesting", "Low-VOC Finishes"]
            ))
            rooms.append(FloorPlanRoom(
                name="Primary Suite",
                dimensions=f"{int(per_floor_area * 0.25)} sq.ft",
                suggested_orientation="East",
                ventilation_type="Cross-breeze Louvre System",
                features=["Thermal Acoustic Insulation", "En-suite Bath"]
            ))
            rooms.append(FloorPlanRoom(
                name="Kitchen & Dining",
                dimensions=f"{int(per_floor_area * 0.22)} sq.ft",
                suggested_orientation="South-East",
                ventilation_type="High-Volume Exhaust & Negative Pressure Corridor",
                features=["Smart Energy Star Appliances", "Recirculation Hood"]
            ))
            rooms.append(FloorPlanRoom(
                name="Eco-Balcony / Green Atrium",
                dimensions=f"{int(per_floor_area * 0.18)} sq.ft",
                suggested_orientation="South-West",
                ventilation_type="Open Microclimate Bio-Wall",
                features=["Rainwater Catchment", "Air-Purifying Botanicals"]
            ))
        else:
            rooms.append(FloorPlanRoom(
                name="Main Open Workspace / Hall",
                dimensions=f"{int(per_floor_area * 0.50)} sq.ft",
                suggested_orientation="North",
                ventilation_type="Automated Mixed-Mode HVAC & Natural Stack Effect",
                features=["CO2-based Demand Ventilation", "Smart Shading"]
            ))
            rooms.append(FloorPlanRoom(
                name="Conference / Meeting Hubs",
                dimensions=f"{int(per_floor_area * 0.25)} sq.ft",
                suggested_orientation="East",
                ventilation_type="HEPA Air Purification Filtration",
                features=["Smart Occupancy Sensors", "Acoustic Baffles"]
            ))
            rooms.append(FloorPlanRoom(
                name="Utility, Restrooms & Service Core",
                dimensions=f"{int(per_floor_area * 0.25)} sq.ft",
                suggested_orientation="West",
                ventilation_type="Continuous Negative Draft Exhaust",
                features=["Greywater Recycling", "Solar Inverters"]
            ))

        # Dynamic simulation metrics
        natural_score = round(min(98.5, 75.0 + (floors * 2.5) + (10.0 if req.climate_zone == "tropical" else 5.0)), 1)
        cross_eff = round(min(95.0, 68.0 + (per_floor_area / 100)), 1)
        hvac_saving = round(min(45.0, 18.0 + (natural_score * 0.22)), 1)
        aqi_delta = round(32.5 + (natural_score * 0.35), 1)

        cost_multipliers = {"economy": 1400, "medium": 2200, "luxury": 3800}
        rate = cost_multipliers.get(req.budget_level.lower(), 2200)
        est_min = f"₹{int(area * rate * 0.9):,}"
        est_max = f"₹{int(area * rate * 1.2):,}"

        recommendations = [
            f"Orient primary openings along North-East axis to leverage dominant wind vectors in {req.climate_zone} zones.",
            f"Incorporate vertical stack ventilation shafts across all {floors} floor(s) to expel hot rising air.",
            "Deploy low-emissivity double glazing on West facades to minimize solar heat gain coefficient (SHGC).",
            "Integrate living green walls to naturally filter indoor VOCs and particulates."
        ]

        return ArchitecturalBlueprintResponse(
            project_id=project_id,
            title=req.title,
            building_type=req.building_type,
            estimated_cost_range=f"{est_min} - {est_max}",
            sustainability_rating="GRIHA 5-Star / LEED Platinum Ready",
            ventilation_analysis=VentilationMetrics(
                natural_airflow_score=natural_score,
                cross_ventilation_efficiency=cross_eff,
                hvac_load_reduction_percent=hvac_saving,
                estimated_aqi_improvement=aqi_delta
            ),
            recommended_rooms=rooms,
            smart_recommendations=recommendations,
            created_at=datetime.utcnow().isoformat() + "Z"
        )
