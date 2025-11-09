"""
Tests for dependency injection functions.
These tests verify that dependencies are properly initialized when main.client and main.consultant_service are None.
"""
import pytest
import weaviate
from unittest.mock import patch, MagicMock
from dependencies import (
    get_weaviate_client,
    get_consultant_service,
    get_storage
)
from services.consultant_service import ConsultantService
from config import reset_settings, get_settings


@pytest.fixture
def clean_main_globals(monkeypatch):
    """Ensure main module globals are None (production-like state)."""
    import main
    # Save original values
    original_client = getattr(main, 'client', None)
    original_consultant_service = getattr(main, 'consultant_service', None)
    
    # Set to None to simulate production state
    main.client = None
    main.consultant_service = None
    
    yield
    
    # Restore original values
    main.client = original_client
    main.consultant_service = original_consultant_service


@pytest.fixture
def mock_weaviate_client(monkeypatch):
    """Mock Weaviate client creation."""
    mock_client = MagicMock()
    # Set up nested attributes for schema
    mock_schema = MagicMock()
    mock_schema.get.return_value = {
        "classes": [{"class": "Consultant"}]
    }
    mock_client.schema = mock_schema
    
    with patch('dependencies.weaviate.Client', return_value=mock_client):
        yield mock_client


def test_get_weaviate_client_creates_when_main_client_is_none(clean_main_globals, mock_weaviate_client, monkeypatch):
    """Test that get_weaviate_client() creates a client when main.client is None."""
    # Reset settings to ensure clean state
    reset_settings()
    
    # Set WEAVIATE_URL environment variable
    monkeypatch.setenv("WEAVIATE_URL", "http://test-weaviate:8080")
    reset_settings()
    
    # Clear the cached client
    import dependencies
    dependencies._weaviate_client = None
    
    # Get client - should create a new one
    client = get_weaviate_client()
    
    # Verify client was created
    assert client is not None
    assert client == mock_weaviate_client
    
    # Verify it was created with correct URL
    from dependencies import weaviate
    weaviate.Client.assert_called_once_with(url="http://test-weaviate:8080")


def test_get_weaviate_client_uses_main_client_when_set(clean_main_globals, mock_weaviate_client):
    """Test that get_weaviate_client() uses main.client when it's explicitly set."""
    import main
    
    # Set main.client to a specific client
    main.client = mock_weaviate_client
    
    # Clear the cached client
    import dependencies
    dependencies._weaviate_client = None
    
    # Get client - should return main.client
    client = get_weaviate_client()
    
    # Verify it returned main.client
    assert client is not None
    assert client == mock_weaviate_client
    assert client == main.client


def test_get_consultant_service_creates_when_main_service_is_none(clean_main_globals, mock_weaviate_client, monkeypatch):
    """Test that get_consultant_service() creates a service when main.consultant_service is None."""
    # Reset settings
    reset_settings()
    
    # Set WEAVIATE_URL environment variable
    monkeypatch.setenv("WEAVIATE_URL", "http://test-weaviate:8080")
    reset_settings()
    
    # Clear cached services
    import dependencies
    dependencies._weaviate_client = None
    dependencies._consultant_service = None
    
    # Get client first (which will be mocked)
    client = get_weaviate_client()
    assert client == mock_weaviate_client
    
    # Get service - should create a new one using the client
    service = get_consultant_service(client)
    
    # Verify service was created
    assert service is not None
    assert isinstance(service, ConsultantService)
    assert service.client == mock_weaviate_client


def test_get_consultant_service_uses_main_service_when_set(clean_main_globals, mock_weaviate_client):
    """Test that get_consultant_service() uses main.consultant_service when it's explicitly set."""
    import main
    
    # Create a service and set it in main
    main_service = ConsultantService(mock_weaviate_client)
    main.consultant_service = main_service
    
    # Clear the cached service
    import dependencies
    dependencies._consultant_service = None
    
    # Get service - should return main.consultant_service
    service = get_consultant_service()
    
    # Verify it returned main.consultant_service
    assert service is not None
    assert service == main_service
    assert service == main.consultant_service


def test_get_consultant_service_returns_none_when_client_is_none(clean_main_globals, monkeypatch):
    """Test that get_consultant_service() returns None when client is None."""
    # Reset settings
    reset_settings()
    
    # Clear cached service
    import dependencies
    dependencies._consultant_service = None
    
    # Get service with None client - should return None
    service = get_consultant_service(None)
    
    # Verify service is None
    assert service is None


@pytest.mark.asyncio
async def test_consultant_service_can_query_when_auto_initialized(test_app, clean_main_globals):
    """Test that consultant service auto-initialized from dependencies can query Weaviate."""
    # Clear cached services to force re-initialization
    import dependencies
    dependencies._weaviate_client = None
    dependencies._consultant_service = None
    
    # Insert a test consultant using the test_app's weaviate client
    # We need to get the weaviate client from the test_app fixture
    # But since we're testing auto-initialization, we'll use the test_app's client
    # to insert data, then verify the API uses auto-initialized services
    
    async with test_app as client:
        # First verify we can get consultants (even if empty)
        response = await client.get("/api/consultants")
        assert response.status_code == 200
        data = response.json()
        assert "consultants" in data


@pytest.mark.asyncio
async def test_get_all_consultants_with_auto_initialized_service(clean_weaviate, test_app, clean_main_globals):
    """Test that /api/consultants endpoint works with auto-initialized services."""
    # Clear cached services to force re-initialization
    import dependencies
    dependencies._weaviate_client = None
    dependencies._consultant_service = None
    
    # Insert test consultants
    consultant1 = {
        "name": "Developer 1",
        "email": "dev1@example.com",
        "phone": "111-111-1111",
        "skills": ["Python"],
        "availability": "available",
        "experience": "5 years",
        "education": "BS"
    }
    
    consultant2 = {
        "name": "Developer 2",
        "email": "dev2@example.com",
        "phone": "222-222-2222",
        "skills": ["Java"],
        "availability": "available",
        "experience": "3 years",
        "education": "BS"
    }
    
    import uuid
    id1 = str(uuid.uuid4())
    id2 = str(uuid.uuid4())
    
    clean_weaviate.data_object.create(data_object=consultant1, class_name="Consultant", uuid=id1)
    clean_weaviate.data_object.create(data_object=consultant2, class_name="Consultant", uuid=id2)
    
    # Use test_app to test the API endpoint
    async with test_app as client:
        response = await client.get("/api/consultants")
        
        # Should succeed
        assert response.status_code == 200
        data = response.json()
        assert "consultants" in data
        assert len(data["consultants"]) >= 2
        
        # Verify structure
        for consultant in data["consultants"]:
            assert "id" in consultant
            assert "name" in consultant
            assert "email" in consultant
            assert "skills" in consultant


@pytest.mark.asyncio
async def test_overview_endpoint_with_auto_initialized_service(clean_weaviate, test_app, clean_main_globals):
    """Test that /api/overview endpoint works with auto-initialized services."""
    # Clear cached services to force re-initialization
    import dependencies
    dependencies._weaviate_client = None
    dependencies._consultant_service = None
    dependencies._overview_service = None
    
    # Insert test consultants with different skills
    consultant1 = {
        "name": "Developer 1",
        "email": "dev1@example.com",
        "phone": "111-111-1111",
        "skills": ["Python", "FastAPI"],
        "availability": "available",
        "experience": "5 years",
        "education": "BS"
    }
    
    consultant2 = {
        "name": "Developer 2",
        "email": "dev2@example.com",
        "phone": "222-222-2222",
        "skills": ["Python", "Docker"],
        "availability": "available",
        "experience": "3 years",
        "education": "BS"
    }
    
    import uuid
    id1 = str(uuid.uuid4())
    id2 = str(uuid.uuid4())
    
    clean_weaviate.data_object.create(data_object=consultant1, class_name="Consultant", uuid=id1)
    clean_weaviate.data_object.create(data_object=consultant2, class_name="Consultant", uuid=id2)
    
    # Use test_app to test the API endpoint
    async with test_app as client:
        response = await client.get("/api/overview")
        
        # Should succeed
        assert response.status_code == 200
        data = response.json()
        assert data["cvCount"] == 2
        assert data["uniqueSkillsCount"] >= 3  # Python, FastAPI, Docker
        assert len(data["topSkills"]) > 0
        
        # Verify Python appears in top skills (should have count of 2)
        python_skill = next((s for s in data["topSkills"] if s["skill"] == "Python"), None)
        assert python_skill is not None
        assert python_skill["count"] == 2

