"""Tests for the Business Plan engine (docs/business-model.md section 4)."""
import json
import math
from dataclasses import replace
from decimal import Decimal

import pytest

from business_plan_svc.engine import (
    DEFAULT_INPUTS,
    INPUT_FIELDS,
    PlanInputs,
    PlanResult,
    collections_lag_months,
    compute_plan,
    inputs_from_profile,
)

# Spec 4.8: operating, 3 trucks, everything else at spec defaults.
WORKED_EXAMPLE = PlanInputs(
    stage="operating",
    trucks=3,
    trailers=3,
    drivers=3,
    miles_per_truck_per_week=2500,
    deadhead_pct=0.15,
    rate_per_loaded_mile=2.35,
    fuel_mpg=6.5,
    fuel_price=3.85,
    driver_pay_per_mile=0.62,
    insurance_per_truck_month=1400,
    truck_payment_per_month=2200,
    trailer_payment_per_month=600,
    maintenance_per_mile=0.18,
    tires_per_mile=0.04,
    tolls_permits_per_truck_month=350,
    overhead_per_month=800,
    payment_terms_days=35,
    factoring_enabled=False,
    starting_cash=15000,
)

EXPECTED_RESULTS = {
    "total_miles": 32500.00,
    "loaded_miles": 27625.00,
    "revenue": 64918.75,
    "fuel": 19250.00,
    "driver_pay": 20150.00,
    "maintenance": 7150.00,
    "variable": 46550.00,
    "fixed": 14450.00,
    "total_cost": 61000.00,
    "profit": 3918.75,
    "margin_pct": 6.04,
    "operating_ratio": 0.9396,
    "revenue_per_mile": 1.9975,
    "cost_per_mile": 1.8769,
    "contribution_per_mile": 0.5652,
    "break_even_miles": 25566.52,
    "working_capital_need": 75738.54,
    "runway_months": 0.2459,
}


class TestWorkedExample:
    """Every value in the spec 4.8 table, exactly."""

    def setup_method(self):
        self.plan = compute_plan(WORKED_EXAMPLE)

    @pytest.mark.parametrize("metric,expected", sorted(EXPECTED_RESULTS.items()))
    def test_metric(self, metric, expected):
        assert self.plan.results[metric] == expected

    def test_health(self):
        assert self.plan.health == 41

    def test_recommendations(self):
        assert [r["id"] for r in self.plan.recommendations] == ["thin_margin", "cash_gap"]

    def test_thin_margin_impact_is_five_cents_per_mile(self):
        thin = self.plan.recommendations[0]
        assert thin["impact_per_month"] == 1625.00  # 32,500 miles * $0.05
        assert "$1,625.00" in thin["message"]
        assert self.plan.recommendations[1]["impact_per_month"] is None

    def test_supporting_cash_metrics(self):
        assert self.plan.results["factoring_fee"] == 0.0
        assert self.plan.results["daily_revenue"] == 2163.96
        assert self.plan.results["cash_gap_days"] == 35.0

    def test_worked_example_equals_defaults_with_three_trucks(self):
        assert compute_plan(PlanInputs(trucks=3)).results == self.plan.results

    def test_to_dict_is_json_safe_and_complete(self):
        payload = self.plan.to_dict()
        json.dumps(payload)  # must not raise
        assert set(payload) == {"inputs", "results", "projection", "recommendations", "health", "warnings"}
        assert payload["inputs"]["trucks"] == 3 and payload["inputs"]["trailers"] == 3
        assert len(payload["projection"]) == 12
        assert payload["health"] == 41
        assert payload["warnings"] == []

    def test_results_have_every_spec_metric(self):
        expected_keys = {
            "total_miles", "loaded_miles", "revenue",
            "fuel", "driver_pay", "maintenance", "variable", "fixed", "factoring_fee", "total_cost",
            "profit", "margin_pct", "operating_ratio", "revenue_per_mile", "cost_per_mile",
            "contribution_per_mile", "break_even_miles",
            "daily_revenue", "cash_gap_days", "working_capital_need", "runway_months",
        }
        assert set(self.plan.results) == expected_keys


class TestInputs:
    def test_defaults_match_spec(self):
        d = DEFAULT_INPUTS
        assert d.stage == "operating"
        assert (d.trucks, d.trailers, d.drivers) == (1, 1, 1)
        assert d.miles_per_truck_per_week == 2500
        assert d.deadhead_pct == 0.15
        assert d.rate_per_loaded_mile == 2.35
        assert (d.fuel_mpg, d.fuel_price) == (6.5, 3.85)
        assert d.driver_pay_per_mile == 0.62
        assert d.insurance_per_truck_month == 1400
        assert d.truck_payment_per_month == 2200
        assert d.trailer_payment_per_month == 600
        assert (d.maintenance_per_mile, d.tires_per_mile) == (0.18, 0.04)
        assert d.tolls_permits_per_truck_month == 350
        assert d.overhead_per_month == 800
        assert d.payment_terms_days == 35
        assert d.factoring_enabled is False
        assert (d.factoring_rate_pct, d.factoring_advance_pct) == (3.0, 95)
        assert d.starting_cash == 15000

    def test_trailers_and_drivers_default_to_trucks(self):
        i = PlanInputs(trucks=4)
        assert i.trailers == 4 and i.drivers == 4
        i = PlanInputs(trucks=4, trailers=6, drivers=5)
        assert i.trailers == 6 and i.drivers == 5

    def test_inputs_from_profile_applies_defaults_for_missing_and_none(self):
        assert inputs_from_profile({}) == DEFAULT_INPUTS
        assert inputs_from_profile(None) == DEFAULT_INPUTS
        i = inputs_from_profile({"trucks": 3, "trailers": None, "deadhead_pct": None, "company_name": "Acme"})
        assert i == PlanInputs(trucks=3)

    def test_inputs_from_profile_coerces_db_types(self):
        i = inputs_from_profile({
            "trucks": Decimal("3"),
            "rate_per_loaded_mile": Decimal("2.35"),
            "miles_per_truck_per_week": "2500",
            "factoring_enabled": "true",
            "stage": "Starting",
        })
        assert i.trucks == 3 and isinstance(i.trucks, int)
        assert i.rate_per_loaded_mile == 2.35
        assert i.miles_per_truck_per_week == 2500
        assert i.factoring_enabled is True
        assert i.stage == "starting"

    def test_unknown_stage_falls_back_to_operating(self):
        assert PlanInputs(stage="bogus").stage == "operating"

    def test_input_fields_cover_spec_section_3(self):
        assert "company_name" not in INPUT_FIELDS
        assert INPUT_FIELDS[:4] == ("stage", "trucks", "trailers", "drivers")
        assert len(INPUT_FIELDS) == 22


class TestProjection:
    def test_operating_runs_at_full_utilization_every_month(self):
        rows = compute_plan(WORKED_EXAMPLE).projection
        assert [r["month"] for r in rows] == list(range(1, 13))
        assert all(r["revenue"] == 64918.75 for r in rows)
        assert all(r["costs"] == 61000.00 for r in rows)
        assert all(r["profit"] == 3918.75 for r in rows)

    def test_starting_stage_ramps_60_80_100(self):
        rows = compute_plan(replace(WORKED_EXAMPLE, stage="starting")).projection
        assert [r["revenue"] for r in rows[:4]] == [38951.25, 51935.00, 64918.75, 64918.75]
        # variable scales with utilization, fixed does not: 14,450 + 46,550 * 0.6
        assert rows[0]["costs"] == 42380.00
        assert rows[1]["costs"] == 51690.00
        assert rows[2]["costs"] == 61000.00

    def test_collections_lag_one_month_without_factoring(self):
        rows = compute_plan(WORKED_EXAMPLE).projection
        assert collections_lag_months(35) == 1
        assert rows[0]["collections"] == 0.0
        assert rows[1]["collections"] == 64918.75
        # cash[1] = 15,000 + 0 - 14,450 - 46,550
        assert rows[0]["cash"] == -46000.00
        assert rows[1]["cash"] == -46000.00 + 64918.75 - 61000.00

    def test_collections_lag_rounds_half_up(self):
        assert collections_lag_months(45) == 2
        assert collections_lag_months(15) == 1
        assert collections_lag_months(0) == 0
        assert collections_lag_months(14) == 0

    def test_zero_terms_collects_same_month(self):
        rows = compute_plan(replace(WORKED_EXAMPLE, payment_terms_days=0)).projection
        assert rows[0]["collections"] == 64918.75

    def test_factoring_advances_most_of_the_month_up_front(self):
        plan = compute_plan(replace(WORKED_EXAMPLE, factoring_enabled=True))
        fee = plan.results["factoring_fee"]
        assert fee == 1947.56  # 3% of 64,918.75
        rows = plan.projection
        # month 1: revenue * 0.95 - fee (lagged remainder is zero)
        assert rows[0]["collections"] == round(64918.75 * 0.95 - fee, 2)
        # month 2 onwards: full revenue minus the fee
        assert rows[1]["collections"] == round(64918.75 - fee, 2)
        assert rows[0]["costs"] == round(61000.00 + fee, 2)
        assert plan.results["cash_gap_days"] == 2.75  # 1 + 35 * 0.05
        assert plan.results["working_capital_need"] == 5950.89

    def test_projection_rows_have_spec_shape(self):
        for row in compute_plan(WORKED_EXAMPLE).projection:
            assert set(row) == {"month", "revenue", "costs", "profit", "collections", "cash"}


class TestHealth:
    def test_perfect_inputs_clamp_to_100(self):
        plan = compute_plan(PlanInputs(
            trucks=3, rate_per_loaded_mile=4.50, deadhead_pct=0.05,
            miles_per_truck_per_week=3200, starting_cash=1_000_000,
        ))
        assert plan.results["margin_pct"] > 20
        assert plan.results["runway_months"] > 3
        assert plan.health == 100

    def test_terrible_inputs_clamp_to_0(self):
        plan = compute_plan(PlanInputs(
            trucks=1, rate_per_loaded_mile=0.50, deadhead_pct=0.45,
            miles_per_truck_per_week=0, starting_cash=0,
        ))
        assert plan.health == 0

    def test_health_is_int_in_range(self):
        for rate in (0.5, 1.5, 2.35, 3.0, 5.0):
            plan = compute_plan(PlanInputs(trucks=2, rate_per_loaded_mile=rate))
            assert isinstance(plan.health, int)
            assert 0 <= plan.health <= 100

    def test_component_weights(self):
        # only margin and utilization score: margin 20%+ (40), runway 0 (0), deadhead 30% (0), util full (15)
        plan = compute_plan(PlanInputs(trucks=3, rate_per_loaded_mile=4.50, deadhead_pct=0.30, starting_cash=0))
        assert plan.health == 55


class TestRecommendations:
    def test_healthy_only_when_nothing_else_fires(self):
        plan = compute_plan(PlanInputs(trucks=3, rate_per_loaded_mile=3.50, deadhead_pct=0.10, starting_cash=250_000))
        assert [r["id"] for r in plan.recommendations] == ["healthy"]
        assert plan.recommendations[0]["impact_per_month"] is None

    def test_healthy_never_accompanies_other_recommendations(self):
        for inputs in (WORKED_EXAMPLE, PlanInputs(), PlanInputs(trucks=2, deadhead_pct=0.30)):
            ids = [r["id"] for r in compute_plan(inputs).recommendations]
            assert ("healthy" in ids) == (len(ids) == 1 and ids == ["healthy"])

    def test_spec_order_when_several_fire(self):
        plan = compute_plan(PlanInputs(
            trucks=2, rate_per_loaded_mile=1.90, deadhead_pct=0.28, fuel_price=5.50, starting_cash=1000,
        ))
        assert [r["id"] for r in plan.recommendations] == ["thin_margin", "deadhead", "cash_gap", "fuel"]

    def test_deadhead_impact_formula(self):
        inputs = PlanInputs(trucks=2, deadhead_pct=0.25)
        plan = compute_plan(inputs)
        deadhead = next(r for r in plan.recommendations if r["id"] == "deadhead")
        total_miles = plan.results["total_miles"]
        assert deadhead["impact_per_month"] == round((0.25 - 0.15) * total_miles * 2.35, 2)

    def test_drop_factoring_for_healthy_factoring_carrier_with_2x_cash(self):
        inputs = PlanInputs(trucks=3, rate_per_loaded_mile=3.50, deadhead_pct=0.10,
                            factoring_enabled=True, starting_cash=100_000)
        plan = compute_plan(inputs)
        assert plan.results["margin_pct"] > 15
        assert inputs.starting_cash > plan.results["working_capital_need"] * 2
        ids = [r["id"] for r in plan.recommendations]
        assert ids == ["drop_factoring"]
        assert plan.recommendations[0]["impact_per_month"] == plan.results["factoring_fee"]

    def test_cash_gap_does_not_fire_when_factoring(self):
        plan = compute_plan(replace(WORKED_EXAMPLE, factoring_enabled=True))
        assert "cash_gap" not in [r["id"] for r in plan.recommendations]

    def test_recommendation_shape(self):
        for rec in compute_plan(WORKED_EXAMPLE).recommendations:
            assert set(rec) == {"id", "title", "message", "impact_per_month"}
            assert rec["impact_per_month"] is None or isinstance(rec["impact_per_month"], float)


class TestEdgeCases:
    def test_zero_trucks_is_safe_and_json_serialisable(self):
        plan = compute_plan(PlanInputs(trucks=0))
        assert isinstance(plan, PlanResult)
        r = plan.results
        assert r["total_miles"] == 0.0 and r["revenue"] == 0.0
        assert r["fixed"] == 800.0  # overhead only
        assert r["margin_pct"] == 0.0
        for key in ("operating_ratio", "revenue_per_mile", "cost_per_mile", "contribution_per_mile", "break_even_miles"):
            assert r[key] is None
        assert isinstance(plan.health, int) and 0 <= plan.health <= 100
        encoded = json.dumps(plan.to_dict())
        assert "NaN" not in encoded and "Infinity" not in encoded
        assert plan.warnings  # revenue-is-zero warning surfaced, not raised

    def test_negative_contribution_has_no_break_even(self):
        plan = compute_plan(PlanInputs(trucks=2, rate_per_loaded_mile=0.50))
        assert plan.results["contribution_per_mile"] < 0
        assert plan.results["break_even_miles"] is None
        json.dumps(plan.to_dict())

    def test_zero_mpg_does_not_divide_by_zero(self):
        plan = compute_plan(PlanInputs(trucks=1, fuel_mpg=0))
        assert plan.results["fuel"] == 0.0
        assert plan.warnings

    def test_all_numbers_finite(self):
        plan = compute_plan(WORKED_EXAMPLE)
        for value in plan.results.values():
            if isinstance(value, float):
                assert math.isfinite(value)
        for row in plan.projection:
            for value in row.values():
                assert math.isfinite(value)
