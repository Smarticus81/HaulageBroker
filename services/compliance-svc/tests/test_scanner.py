"""Tests for compliance expiry scanner."""
import pytest
from datetime import date, timedelta
from compliance_svc.scanner import ComplianceScanner


class TestComplianceScanner:
    """Test compliance artifact expiry scanning."""

    def setup_method(self):
        self.scanner = ComplianceScanner()

    def test_find_expiring_within_30_days(self):
        artifacts = [
            {"id": "a1", "artifact_type": "CDL", "expiry_date": (date.today() + timedelta(days=15)).isoformat(), "status": "active"},
            {"id": "a2", "artifact_type": "MedCard", "expiry_date": (date.today() + timedelta(days=45)).isoformat(), "status": "active"},
            {"id": "a3", "artifact_type": "InsuranceCert", "expiry_date": (date.today() + timedelta(days=5)).isoformat(), "status": "active"},
        ]
        expiring = self.scanner.find_expiring(artifacts, days_ahead=30)
        assert len(expiring) == 2
        assert expiring[0]["id"] == "a3"  # Closest expiry first
        assert expiring[1]["id"] == "a1"

    def test_expired_artifacts_included(self):
        artifacts = [
            {"id": "a1", "artifact_type": "CDL", "expiry_date": (date.today() - timedelta(days=5)).isoformat(), "status": "active"},
        ]
        expiring = self.scanner.find_expiring(artifacts, days_ahead=30)
        assert len(expiring) == 1

    def test_revoked_artifacts_excluded(self):
        artifacts = [
            {"id": "a1", "artifact_type": "CDL", "expiry_date": (date.today() + timedelta(days=5)).isoformat(), "status": "revoked"},
        ]
        expiring = self.scanner.find_expiring(artifacts, days_ahead=30)
        assert len(expiring) == 0

    def test_no_expiry_date_excluded(self):
        artifacts = [
            {"id": "a1", "artifact_type": "CDL", "expiry_date": None, "status": "active"},
        ]
        expiring = self.scanner.find_expiring(artifacts, days_ahead=30)
        assert len(expiring) == 0

    def test_classify_urgency(self):
        assert self.scanner.classify_urgency(days_remaining=3) == "critical"
        assert self.scanner.classify_urgency(days_remaining=10) == "high"
        assert self.scanner.classify_urgency(days_remaining=20) == "medium"
        assert self.scanner.classify_urgency(days_remaining=45) == "low"

    def test_classify_urgency_expired(self):
        assert self.scanner.classify_urgency(days_remaining=-5) == "critical"
