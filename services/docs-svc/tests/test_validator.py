"""Tests for document validation."""
import pytest
from docs_svc.validator import DocumentValidator


class TestDocumentValidator:
    """Test document validation against load records."""

    def setup_method(self):
        self.validator = DocumentValidator()

    def test_validate_pod_with_matching_data(self):
        """Valid POD passes validation."""
        load = {
            "load_number": "LD-001",
            "delivery_date": "2024-01-15",
            "dest_city": "Atlanta",
            "dest_state": "GA",
            "billed_amount": 2500.00
        }
        extracted = {
            "delivery_date": "2024-01-15",
            "receiver_name": "John Smith",
            "signature_present": True
        }
        result = self.validator.validate_pod(extracted, load)
        assert result.is_valid
        assert len(result.errors) == 0

    def test_validate_pod_missing_signature(self):
        """POD without signature fails validation."""
        load = {"load_number": "LD-001", "delivery_date": "2024-01-15", "dest_city": "Atlanta", "dest_state": "GA", "billed_amount": 2500.00}
        extracted = {"delivery_date": "2024-01-15", "receiver_name": "John", "signature_present": False}
        result = self.validator.validate_pod(extracted, load)
        assert not result.is_valid
        assert any("signature" in e.lower() for e in result.errors)

    def test_validate_pod_date_mismatch(self):
        """POD with wrong delivery date fails."""
        load = {"load_number": "LD-001", "delivery_date": "2024-01-15", "dest_city": "Atlanta", "dest_state": "GA", "billed_amount": 2500.00}
        extracted = {"delivery_date": "2024-01-20", "receiver_name": "John", "signature_present": True}
        result = self.validator.validate_pod(extracted, load)
        assert not result.is_valid
        assert any("date" in e.lower() for e in result.errors)

    def test_validate_rate_conf_amount_match(self):
        """Rate confirmation with matching amount passes."""
        load = {"load_number": "LD-001", "billed_amount": 2500.00}
        extracted = {"rate": 2500.00, "accessorials": 0, "origin": "Dallas, TX", "destination": "Atlanta, GA"}
        result = self.validator.validate_rate_conf(extracted, load)
        assert result.is_valid

    def test_validate_rate_conf_amount_mismatch(self):
        """Rate confirmation with mismatched amount fails."""
        load = {"load_number": "LD-001", "billed_amount": 2500.00}
        extracted = {"rate": 3000.00, "accessorials": 0, "origin": "Dallas, TX", "destination": "Atlanta, GA"}
        result = self.validator.validate_rate_conf(extracted, load)
        assert not result.is_valid
        assert any("amount" in e.lower() or "mismatch" in e.lower() for e in result.errors)

    def test_validate_rate_conf_within_threshold(self):
        """Small amount differences within threshold pass."""
        load = {"load_number": "LD-001", "billed_amount": 2500.00}
        extracted = {"rate": 2510.00, "accessorials": 0}
        result = self.validator.validate_rate_conf(extracted, load, threshold_pct=0.01)
        assert result.is_valid

    def test_validate_bol_required_fields(self):
        """BOL must have shipper, consignee, and date."""
        extracted = {"shipper": "ABC Corp", "consignee": "XYZ Inc", "pickup_date": "2024-01-10", "pieces": 24, "weight": 42000}
        result = self.validator.validate_bol(extracted)
        assert result.is_valid

    def test_validate_bol_missing_fields(self):
        """BOL missing required fields fails."""
        extracted = {"shipper": "ABC Corp"}
        result = self.validator.validate_bol(extracted)
        assert not result.is_valid
