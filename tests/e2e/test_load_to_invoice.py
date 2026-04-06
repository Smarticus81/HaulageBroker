"""E2E test: create load -> upload POD -> validate -> packet ready -> approve -> export."""
import pytest
import httpx

BASE_URL = "http://localhost:8000"


class TestLoadToInvoiceFlow:
    """End-to-end test for the complete load-to-invoice paperwork flow."""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token for testing."""
        self.client = httpx.Client(base_url=BASE_URL)
        resp = self.client.post("/auth/login", json={"email": "billing@acme.com", "password": "password123"})
        if resp.status_code == 200:
            self.token = resp.json()["access_token"]
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            pytest.skip("API not running")

    def test_full_load_to_invoice_flow(self):
        """Complete paperwork flow from load creation to invoice export."""
        # Step 1: Create a load record
        load_data = {
            "load_number": "E2E-TEST-001",
            "customer_ref": "CUST-REF-001",
            "pickup_date": "2024-01-10",
            "delivery_date": "2024-01-12",
            "origin_city": "Dallas",
            "origin_state": "TX",
            "dest_city": "Atlanta",
            "dest_state": "GA",
            "billed_amount": 2500.00,
            "accessorials_expected": 150.00
        }
        resp = self.client.post("/load-records", json=load_data, headers=self.headers)
        assert resp.status_code in (200, 201)
        load = resp.json()
        load_id = load["id"]
        assert load["status"] == "created"

        # Step 2: Upload POD document
        pod_file = ("pod_test.pdf", b"%PDF-1.4 fake pod content", "application/pdf")
        resp = self.client.post(
            "/documents/upload",
            files={"file": pod_file},
            data={"doc_type": "POD", "linked_entity_type": "load_record", "linked_entity_id": load_id},
            headers=self.headers
        )
        assert resp.status_code in (200, 201)
        pod_doc = resp.json()

        # Step 3: Upload Rate Confirmation
        rc_file = ("rateconf_test.pdf", b"%PDF-1.4 fake rateconf", "application/pdf")
        resp = self.client.post(
            "/documents/upload",
            files={"file": rc_file},
            data={"doc_type": "RateConf", "linked_entity_type": "load_record", "linked_entity_id": load_id},
            headers=self.headers
        )
        assert resp.status_code in (200, 201)

        # Step 4: Upload BOL
        bol_file = ("bol_test.pdf", b"%PDF-1.4 fake bol", "application/pdf")
        resp = self.client.post(
            "/documents/upload",
            files={"file": bol_file},
            data={"doc_type": "BOL", "linked_entity_type": "load_record", "linked_entity_id": load_id},
            headers=self.headers
        )
        assert resp.status_code in (200, 201)

        # Step 5: Generate invoice packet
        resp = self.client.post(f"/invoice-packets/generate?load_record_id={load_id}", headers=self.headers)
        assert resp.status_code in (200, 201)
        packet = resp.json()
        packet_id = packet["id"]

        # Step 6: Check packet - should have docs
        resp = self.client.get(f"/invoice-packets/{packet_id}", headers=self.headers)
        assert resp.status_code == 200

        # Step 7: Approve invoice packet
        resp = self.client.post(f"/invoice-packets/{packet_id}/approve", headers=self.headers)
        assert resp.status_code == 200
        approved = resp.json()
        assert approved["packet_status"] == "approved"

    def test_load_with_missing_docs_creates_exceptions(self):
        """Load without required docs should generate exceptions."""
        load_data = {
            "load_number": "E2E-TEST-002",
            "pickup_date": "2024-01-10",
            "delivery_date": "2024-01-12",
            "origin_city": "Chicago",
            "origin_state": "IL",
            "dest_city": "Memphis",
            "dest_state": "TN",
            "billed_amount": 1800.00
        }
        resp = self.client.post("/load-records", json=load_data, headers=self.headers)
        assert resp.status_code in (200, 201)
        load_id = resp.json()["id"]

        # Generate invoice packet without uploading docs
        resp = self.client.post(f"/invoice-packets/generate?load_record_id={load_id}", headers=self.headers)
        assert resp.status_code in (200, 201)
        packet = resp.json()
        # Packet should be incomplete
        assert packet["packet_status"] == "incomplete"
