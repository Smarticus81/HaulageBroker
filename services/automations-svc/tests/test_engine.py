"""Tests for automation rules engine."""
import pytest
from datetime import datetime, timedelta
from automations_svc.engine import AutomationEngine
from automations_svc.conditions import evaluate_condition
from automations_svc.actions import ActionExecutor


class TestConditionEvaluation:
    """Test condition evaluation logic."""

    def test_doc_missing_after_hours(self):
        """Detect missing document after time threshold."""
        condition = {
            "type": "doc_missing_after",
            "params": {"doc_type": "POD", "hours": 12}
        }
        context = {
            "load": {
                "delivery_date": (datetime.utcnow() - timedelta(hours=24)).isoformat(),
                "documents": [{"doc_type": "BOL"}, {"doc_type": "RateConf"}]
            }
        }
        assert evaluate_condition(condition, context) is True

    def test_doc_missing_not_yet_due(self):
        """Don't flag if time threshold not reached."""
        condition = {
            "type": "doc_missing_after",
            "params": {"doc_type": "POD", "hours": 12}
        }
        context = {
            "load": {
                "delivery_date": (datetime.utcnow() - timedelta(hours=6)).isoformat(),
                "documents": []
            }
        }
        assert evaluate_condition(condition, context) is False

    def test_doc_present_not_missing(self):
        """Don't flag if document is present."""
        condition = {
            "type": "doc_missing_after",
            "params": {"doc_type": "POD", "hours": 12}
        }
        context = {
            "load": {
                "delivery_date": (datetime.utcnow() - timedelta(hours=24)).isoformat(),
                "documents": [{"doc_type": "POD"}]
            }
        }
        assert evaluate_condition(condition, context) is False

    def test_compliance_expiry_within_days(self):
        """Detect compliance artifact expiring within threshold."""
        condition = {
            "type": "compliance_expiry_within",
            "params": {"days": 30}
        }
        context = {
            "artifact": {
                "expiry_date": (datetime.utcnow() + timedelta(days=15)).strftime("%Y-%m-%d"),
                "status": "active"
            }
        }
        assert evaluate_condition(condition, context) is True

    def test_compliance_not_expiring_soon(self):
        condition = {
            "type": "compliance_expiry_within",
            "params": {"days": 30}
        }
        context = {
            "artifact": {
                "expiry_date": (datetime.utcnow() + timedelta(days=90)).strftime("%Y-%m-%d"),
                "status": "active"
            }
        }
        assert evaluate_condition(condition, context) is False

    def test_amount_mismatch_above_threshold(self):
        """Detect amount mismatch exceeding threshold."""
        condition = {
            "type": "amount_mismatch",
            "params": {"threshold_pct": 0.02}
        }
        context = {
            "load_amount": 2500.00,
            "extracted_amount": 3000.00
        }
        assert evaluate_condition(condition, context) is True

    def test_amount_mismatch_within_threshold(self):
        condition = {
            "type": "amount_mismatch",
            "params": {"threshold_pct": 0.02}
        }
        context = {
            "load_amount": 2500.00,
            "extracted_amount": 2510.00
        }
        assert evaluate_condition(condition, context) is False


class TestAutomationEngine:
    """Test the automation engine rule matching and execution."""

    def test_event_rule_matching(self):
        """Event rules matched by event type."""
        engine = AutomationEngine()
        rules = [
            {"id": "r1", "trigger_type": "event", "trigger_event": "document.uploaded", "is_active": True, "conditions": [], "actions": [{"type": "create_task", "params": {"queue": "docs", "title": "Review doc"}}]},
            {"id": "r2", "trigger_type": "event", "trigger_event": "load.created", "is_active": True, "conditions": [], "actions": []},
            {"id": "r3", "trigger_type": "event", "trigger_event": "document.uploaded", "is_active": False, "conditions": [], "actions": []},
        ]
        matched = engine.match_rules(rules, event_type="document.uploaded")
        assert len(matched) == 1
        assert matched[0]["id"] == "r1"

    def test_no_match_for_wrong_event(self):
        engine = AutomationEngine()
        rules = [
            {"id": "r1", "trigger_type": "event", "trigger_event": "document.uploaded", "is_active": True, "conditions": [], "actions": []},
        ]
        matched = engine.match_rules(rules, event_type="load.created")
        assert len(matched) == 0

    def test_inactive_rules_not_matched(self):
        engine = AutomationEngine()
        rules = [
            {"id": "r1", "trigger_type": "event", "trigger_event": "document.uploaded", "is_active": False, "conditions": [], "actions": []},
        ]
        matched = engine.match_rules(rules, event_type="document.uploaded")
        assert len(matched) == 0
