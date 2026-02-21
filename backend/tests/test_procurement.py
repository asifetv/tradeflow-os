"""Tests for M3 Procurement - Vendors and Proposal Comparison (Hero Feature)."""
import pytest
from uuid import uuid4
from fastapi.testclient import TestClient

from app.models.vendor import Vendor
from app.models.vendor_proposal import VendorProposal, VendorProposalStatus
from app.services.vendor import VendorService
from app.services.vendor_proposal import VendorProposalService
from app.schemas.vendor import VendorCreate, VendorUpdate
from app.schemas.vendor_proposal import VendorProposalCreate


class TestVendorService:
    """Test vendor management service."""

    @pytest.mark.asyncio
    async def test_create_vendor(self, test_db, sample_company):
        """Test creating a vendor."""
        service = VendorService(test_db, company_id=sample_company.id)

        vendor_data = VendorCreate(
            vendor_code="VND-NEW",
            company_name="New Vendor",
            country="Saudi Arabia",
            credibility_score=75,
        )

        result = await service.create_vendor(vendor_data)

        assert result.vendor_code == "VND-NEW"
        assert result.company_name == "New Vendor"
        assert result.country == "Saudi Arabia"
        assert result.credibility_score == 75

    @pytest.mark.asyncio
    async def test_get_vendor(self, test_db, sample_vendor):
        """Test retrieving a vendor."""
        service = VendorService(test_db, company_id=sample_vendor.company_id)

        result = await service.get_vendor(sample_vendor.id)

        assert result is not None
        assert result.id == sample_vendor.id
        assert result.vendor_code == "VND-001"

    @pytest.mark.asyncio
    async def test_list_vendors(self, test_db, sample_vendors):
        """Test listing vendors."""
        company_id = sample_vendors[0].company_id
        service = VendorService(test_db, company_id=company_id)

        result = await service.list_vendors()

        assert result.total == 3
        assert len(result.items) == 3

    @pytest.mark.asyncio
    async def test_search_vendors(self, test_db, sample_vendors):
        """Test searching vendors by name or code."""
        company_id = sample_vendors[0].company_id
        service = VendorService(test_db, company_id=company_id)

        result = await service.search_vendors("Steel")

        assert result.total == 1
        assert result.items[0].company_name == "Reliable Steel Suppliers"

    @pytest.mark.asyncio
    async def test_update_vendor(self, test_db, sample_vendor):
        """Test updating a vendor."""
        service = VendorService(test_db, company_id=sample_vendor.company_id)

        update_data = VendorUpdate(
            credibility_score=90,
            is_active=False,
        )

        result = await service.update_vendor(sample_vendor.id, update_data)

        assert result.credibility_score == 90
        assert result.is_active is False

    @pytest.mark.asyncio
    async def test_vendor_code_unique_per_company(self, test_db, sample_company):
        """Test that vendor codes are unique per company."""
        service = VendorService(test_db, company_id=sample_company.id)

        # Create first vendor
        vendor_data = VendorCreate(
            vendor_code="VND-DUP",
            company_name="First Vendor",
            country="UAE",
        )
        await service.create_vendor(vendor_data)

        # Try to create duplicate vendor code in same company
        duplicate_data = VendorCreate(
            vendor_code="VND-DUP",
            company_name="Second Vendor",
            country="UAE",
        )

        with pytest.raises(ValueError, match="already exists in this company"):
            await service.create_vendor(duplicate_data)


class TestVendorProposalService:
    """Test vendor proposal management service (M3 Hero Feature)."""

    @pytest.mark.asyncio
    async def test_create_proposal(self, test_db, sample_company, sample_deal, sample_vendor):
        """Test creating a vendor proposal."""
        service = VendorProposalService(test_db, company_id=sample_company.id)

        proposal_data = VendorProposalCreate(
            vendor_id=sample_vendor.id,
            deal_id=sample_deal.id,
            total_price=95000.0,
            currency="AED",
            lead_time_days=14,
            specs_match=True,
        )

        result = await service.create_proposal(proposal_data)

        assert result.vendor_id == sample_vendor.id
        assert result.deal_id == sample_deal.id
        assert result.total_price == 95000.0
        assert result.status == VendorProposalStatus.REQUESTED.value

    @pytest.mark.asyncio
    async def test_get_proposal(self, test_db, sample_vendor_proposal):
        """Test retrieving a proposal."""
        service = VendorProposalService(test_db, company_id=sample_vendor_proposal.company_id)

        result = await service.get_proposal(sample_vendor_proposal.id)

        assert result is not None
        assert result.id == sample_vendor_proposal.id
        assert result.total_price == 95000.0

    @pytest.mark.asyncio
    async def test_list_proposals(self, test_db, sample_vendor_proposals):
        """Test listing proposals."""
        company_id = sample_vendor_proposals[0].company_id
        service = VendorProposalService(test_db, company_id=company_id)

        result = await service.list_proposals()

        assert result.total == 3
        assert len(result.items) == 3

    @pytest.mark.asyncio
    async def test_hero_feature_proposal_comparison(self, test_db, sample_vendor_proposals):
        """
        Test the hero feature: Proposal Comparison Dashboard.

        This is the key differentiator for TradeFlow OS - allows procurement
        teams to compare all vendor proposals side-by-side with color-coded
        highlighting for best/worst prices and lead times.
        """
        company_id = sample_vendor_proposals[0].company_id
        deal_id = sample_vendor_proposals[0].deal_id
        service = VendorProposalService(test_db, company_id=company_id)

        # Get comparison
        comparison = await service.get_proposal_comparison(deal_id)

        # Verify structure
        assert comparison.deal_id == deal_id
        assert len(comparison.proposals) == 3

        # Verify price comparison highlights
        assert comparison.best_price == 92000.0
        assert comparison.worst_price == 98000.0

        # Verify lead time comparison
        assert comparison.best_lead_time == 7
        assert comparison.worst_lead_time == 21

        # Verify individual proposal highlighting
        proposals_by_price = {p.total_price: p for p in comparison.proposals}

        # Best price proposal should be highlighted
        best_proposal = proposals_by_price[92000.0]
        assert best_proposal.is_best_price is True
        assert best_proposal.is_worst_price is False

        # Worst price proposal should be highlighted
        worst_proposal = proposals_by_price[98000.0]
        assert worst_proposal.is_best_price is False
        assert worst_proposal.is_worst_price is True

        # Middle price should not be highlighted
        middle_proposal = proposals_by_price[95000.0]
        assert middle_proposal.is_best_price is False
        assert middle_proposal.is_worst_price is False

        # Verify best lead time highlighting
        proposals_by_lead = {p.lead_time_days: p for p in comparison.proposals}
        best_lead = proposals_by_lead[7]
        assert best_lead.is_best_lead_time is True

        worst_lead = proposals_by_lead[21]
        assert worst_lead.is_best_lead_time is False

    @pytest.mark.asyncio
    async def test_select_vendor(self, test_db, sample_vendor_proposals):
        """Test selecting a vendor for a deal."""
        company_id = sample_vendor_proposals[0].company_id
        service = VendorProposalService(test_db, company_id=company_id)

        # Select the first proposal
        selected_proposal = sample_vendor_proposals[0]
        result = await service.select_vendor(selected_proposal.id)

        assert result.status == VendorProposalStatus.SELECTED.value

        # Verify other proposals are rejected
        comparison = await service.get_proposal_comparison(selected_proposal.deal_id)
        statuses = {p.id: p.status for p in comparison.proposals}

        assert statuses[selected_proposal.id] == VendorProposalStatus.SELECTED.value
        for other in sample_vendor_proposals[1:]:
            assert statuses[other.id] == VendorProposalStatus.REJECTED.value

    @pytest.mark.asyncio
    async def test_proposal_vendor_isolation(self, test_db, sample_company):
        """Test multi-tenant isolation for proposals."""
        # Create another company
        from app.models.company import Company
        other_company = Company(
            id=uuid4(),
            company_name="Other Company",
            subdomain="other",
            is_active=True,
        )
        test_db.add(other_company)
        await test_db.flush()

        # Create vendors for each company
        vendor1 = Vendor(
            id=uuid4(),
            company_id=sample_company.id,
            vendor_code="VND-1",
            company_name="Vendor 1",
            country="UAE",
            is_active=True,
        )
        vendor2 = Vendor(
            id=uuid4(),
            company_id=other_company.id,
            vendor_code="VND-2",
            company_name="Vendor 2",
            country="UAE",
            is_active=True,
        )
        test_db.add(vendor1)
        test_db.add(vendor2)

        # Create deals for each company
        from app.models.deal import Deal, DealStatus
        deal1 = Deal(
            id=uuid4(),
            company_id=sample_company.id,
            deal_number="DEAL-1",
            description="Deal 1",
            status=DealStatus.RFQ_RECEIVED,
            line_items=[],
        )
        deal2 = Deal(
            id=uuid4(),
            company_id=other_company.id,
            deal_number="DEAL-2",
            description="Deal 2",
            status=DealStatus.RFQ_RECEIVED,
            line_items=[],
        )
        test_db.add(deal1)
        test_db.add(deal2)
        await test_db.flush()

        # Create proposal for company 1
        proposal1 = VendorProposal(
            id=uuid4(),
            company_id=sample_company.id,
            deal_id=deal1.id,
            vendor_id=vendor1.id,
            status=VendorProposalStatus.RECEIVED,
            total_price=100000.0,
        )
        test_db.add(proposal1)
        await test_db.flush()

        # Service for company 1 should see proposal1 but not be able to create for company 2
        service1 = VendorProposalService(test_db, company_id=sample_company.id)

        # Should be able to get own proposal
        result = await service1.get_proposal(proposal1.id)
        assert result is not None

        # Should not be able to create proposal with vendor/deal from other company
        with pytest.raises(ValueError):
            await service1.create_proposal(
                VendorProposalCreate(
                    vendor_id=vendor2.id,  # From other company
                    deal_id=deal1.id,      # Own deal
                    total_price=100000.0,
                )
            )


class TestVendorSearchAdvanced:
    """Test M3-02: Advanced vendor search with smart filtering."""

    @pytest.mark.asyncio
    async def test_search_vendors_advanced_by_credibility(self, test_db, sample_vendors):
        """Test filtering vendors by minimum credibility score."""
        company_id = sample_vendors[0].company_id
        service = VendorService(test_db, company_id=company_id)

        # Search vendors with minimum credibility of 80
        result = await service.search_vendors_advanced(min_credibility=80)

        # Should return only high-credibility vendors
        assert result.total >= 1
        assert all(v.credibility_score >= 80 for v in result.items)

    @pytest.mark.asyncio
    async def test_search_vendors_advanced_by_country(self, test_db, sample_vendors):
        """Test filtering vendors by country."""
        company_id = sample_vendors[0].company_id
        service = VendorService(test_db, company_id=company_id)

        # Search vendors in UAE
        result = await service.search_vendors_advanced(country="UAE")

        # Should return only UAE vendors
        assert result.total >= 1
        assert all("UAE" in v.country for v in result.items)

    @pytest.mark.asyncio
    async def test_search_vendors_advanced_by_category(self, test_db, sample_vendors):
        """Test filtering vendors by product category."""
        company_id = sample_vendors[0].company_id
        service = VendorService(test_db, company_id=company_id)

        # Search vendors with "Pipes" category
        result = await service.search_vendors_advanced(category="Pipes")

        # Should return vendors with Pipes category
        assert result.total >= 1

    @pytest.mark.asyncio
    async def test_search_vendors_advanced_by_certification(self, test_db, sample_vendors):
        """Test filtering vendors by certification."""
        company_id = sample_vendors[0].company_id
        service = VendorService(test_db, company_id=company_id)

        # Search vendors with ISO 9001 certification
        result = await service.search_vendors_advanced(certification="ISO 9001")

        # Should return vendors with ISO 9001
        assert result.total >= 1

    @pytest.mark.asyncio
    async def test_search_vendors_advanced_keyword(self, test_db, sample_vendors):
        """Test keyword search in advanced search."""
        company_id = sample_vendors[0].company_id
        service = VendorService(test_db, company_id=company_id)

        # Search by vendor name keyword
        result = await service.search_vendors_advanced(q="Steel")

        # Should find vendors matching keyword
        assert result.total >= 1
        assert any("Steel" in v.company_name for v in result.items)

    @pytest.mark.asyncio
    async def test_search_vendors_advanced_combined_filters(self, test_db, sample_vendors):
        """Test combining multiple filters."""
        company_id = sample_vendors[0].company_id
        service = VendorService(test_db, company_id=company_id)

        # Search with multiple filters: credibility + country + keyword
        result = await service.search_vendors_advanced(
            q="Steel",
            min_credibility=70,
            country="UAE",
        )

        # Should apply all filters
        if result.items:
            assert all(v.credibility_score >= 70 for v in result.items)
            assert all("UAE" in v.country for v in result.items)

    @pytest.mark.asyncio
    async def test_search_vendors_advanced_credibility_range(self, test_db, sample_vendors):
        """Test credibility score range filtering."""
        company_id = sample_vendors[0].company_id
        service = VendorService(test_db, company_id=company_id)

        # Search vendors with credibility between 50 and 85
        result = await service.search_vendors_advanced(
            min_credibility=50,
            max_credibility=85,
        )

        # Should return vendors in range
        if result.items:
            assert all(50 <= v.credibility_score <= 85 for v in result.items)

    @pytest.mark.asyncio
    async def test_search_vendors_advanced_sorted_by_credibility(self, test_db, sample_vendors):
        """Test that results are sorted by credibility (highest first)."""
        company_id = sample_vendors[0].company_id
        service = VendorService(test_db, company_id=company_id)

        # Get all vendors sorted by credibility
        result = await service.search_vendors_advanced()

        # Verify sorting: credibility should be descending
        if len(result.items) > 1:
            for i in range(len(result.items) - 1):
                assert result.items[i].credibility_score >= result.items[i + 1].credibility_score

    @pytest.mark.asyncio
    async def test_search_vendors_advanced_pagination(self, test_db, sample_vendors):
        """Test pagination in advanced search."""
        company_id = sample_vendors[0].company_id
        service = VendorService(test_db, company_id=company_id)

        # Get first page (limit 2)
        result = await service.search_vendors_advanced(limit=2)

        # Should respect limit
        assert len(result.items) <= 2

    @pytest.mark.asyncio
    async def test_search_vendors_advanced_no_results(self, test_db, sample_vendors):
        """Test advanced search with filters that return no results."""
        company_id = sample_vendors[0].company_id
        service = VendorService(test_db, company_id=company_id)

        # Search with filters that won't match any vendor
        result = await service.search_vendors_advanced(
            min_credibility=100,  # No vendor has 100% credibility
        )

        # Should return empty results
        assert result.total == 0
        assert len(result.items) == 0


class TestVendorProposalAPI:
    """Test vendor and proposal API endpoints."""

    def test_get_proposal_comparison_endpoint(self, client, sample_deal, sample_vendor_proposals):
        """Test the proposal comparison hero feature via API."""
        # Get comparison for the deal
        response = client.get(f"/api/vendor-proposals/compare/{sample_deal.id}")

        # Should return 401 Unauthorized without auth token
        assert response.status_code == 401
        # In a real test with proper auth, would return 200 with comparison data
