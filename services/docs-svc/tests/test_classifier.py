"""Tests for document classifier."""
import pytest
from docs_svc.classifier import DocumentClassifier


class TestDocumentClassifier:
    """Test document classification logic."""

    def setup_method(self):
        self.classifier = DocumentClassifier()

    def test_classify_pod_by_filename(self):
        """POD documents identified by filename patterns."""
        result = self.classifier.classify(filename="POD_Load12345.pdf", ocr_text="")
        assert result.doc_type == "POD"
        assert result.confidence >= 0.7

    def test_classify_bol_by_filename(self):
        result = self.classifier.classify(filename="bill_of_lading_98765.pdf", ocr_text="")
        assert result.doc_type == "BOL"

    def test_classify_rate_conf_by_filename(self):
        result = self.classifier.classify(filename="rate_confirmation_ABC.pdf", ocr_text="")
        assert result.doc_type == "RateConf"

    def test_classify_pod_by_ocr_content(self):
        """POD identified from OCR text content."""
        ocr_text = "PROOF OF DELIVERY\nReceiver: John Smith\nDate: 2024-01-15\nSignature: [signed]"
        result = self.classifier.classify(filename="document.pdf", ocr_text=ocr_text)
        assert result.doc_type == "POD"

    def test_classify_bol_by_ocr_content(self):
        ocr_text = "BILL OF LADING\nShipper: ABC Corp\nConsignee: XYZ Inc\nPieces: 24\nWeight: 42000 lbs"
        result = self.classifier.classify(filename="scan001.pdf", ocr_text=ocr_text)
        assert result.doc_type == "BOL"

    def test_classify_rate_conf_by_ocr_content(self):
        ocr_text = "RATE CONFIRMATION\nCarrier Rate: $2,500.00\nAccessorials: $150.00\nOrigin: Dallas, TX\nDestination: Atlanta, GA"
        result = self.classifier.classify(filename="email_attachment.pdf", ocr_text=ocr_text)
        assert result.doc_type == "RateConf"

    def test_classify_insurance_cert(self):
        ocr_text = "CERTIFICATE OF INSURANCE\nPolicy Number: GL-12345\nExpiration: 12/31/2024\nCoverage: $1,000,000"
        result = self.classifier.classify(filename="cert.pdf", ocr_text=ocr_text)
        assert result.doc_type == "InsuranceCert"

    def test_classify_cdl(self):
        ocr_text = "COMMERCIAL DRIVER LICENSE\nClass: A\nEndorsements: H, T\nExpires: 06/2025"
        result = self.classifier.classify(filename="license.jpg", ocr_text=ocr_text)
        assert result.doc_type == "CDL"

    def test_classify_medical_card(self):
        ocr_text = "MEDICAL EXAMINER'S CERTIFICATE\nDriver: John Doe\nExpiration Date: 03/15/2025"
        result = self.classifier.classify(filename="med_card.pdf", ocr_text=ocr_text)
        assert result.doc_type == "MedCard"

    def test_classify_lumper_receipt(self):
        ocr_text = "LUMPER RECEIPT\nAmount: $250.00\nWarehouse: ABC Distribution\nDate: 01/15/2024"
        result = self.classifier.classify(filename="receipt.pdf", ocr_text=ocr_text)
        assert result.doc_type == "Lumper"

    def test_classify_unknown_returns_other(self):
        """Unrecognizable documents default to Other."""
        result = self.classifier.classify(filename="random.pdf", ocr_text="some random text content")
        assert result.doc_type == "Other"
        assert result.confidence < 0.5

    def test_classify_empty_inputs(self):
        result = self.classifier.classify(filename="", ocr_text="")
        assert result.doc_type == "Other"

    def test_confidence_higher_with_both_signals(self):
        """Confidence increases when both filename and content match."""
        result_both = self.classifier.classify(
            filename="POD_load123.pdf",
            ocr_text="PROOF OF DELIVERY\nReceiver: John"
        )
        result_name_only = self.classifier.classify(
            filename="POD_load123.pdf",
            ocr_text=""
        )
        assert result_both.confidence >= result_name_only.confidence
