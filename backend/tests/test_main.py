import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from decimal import Decimal
import uuid

from app.core.database import Base, get_db
from app.main import app
from app.core.security import hash_password
from app.models.db_models import Organization, User, Event, Donor, DonationCategory, Receipt

# Setup isolated testing in-memory SQLite database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="module")
def db():
    Base.metadata.create_all(bind=engine)
    db_session = TestingSessionLocal()
    try:
        yield db_session
    finally:
        db_session.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="module")
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

def test_multi_tenant_isolation(client, db):
    # Create Organization A
    org_a = Organization(name="Tenant A", slug="t-a", festival_name="Fest A", year="2026")
    # Create Organization B
    org_b = Organization(name="Tenant B", slug="t-b", festival_name="Fest B", year="2026")
    db.add_all([org_a, org_b])
    db.commit()

    # Create Users
    user_a = User(
        organization_id=org_a.id, name="Admin A", email="admin_a@test.com",
        password_hash=hash_password("pass123"), role="ORG_ADMIN"
    )
    user_b = User(
        organization_id=org_b.id, name="Admin B", email="admin_b@test.com",
        password_hash=hash_password("pass123"), role="ORG_ADMIN"
    )
    db.add_all([user_a, user_b])
    db.commit()

    # Generate token for Tenant A
    login_response = client.post("/api/auth/login", json={"email": "admin_a@test.com", "password": "pass123"})
    assert login_response.status_code == 200
    token_a = login_response.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # Create Event for Tenant A
    event_a = Event(organization_id=org_a.id, name="Event A", financial_year="2026")
    db.add(event_a)
    db.commit()

    # Create Donor for Tenant A
    donor_a = Donor(organization_id=org_a.id, name="Donor A", mobile="9000000001")
    db.add(donor_a)
    db.commit()

    # Create Category for Tenant A
    cat_a = DonationCategory(organization_id=org_a.id, name="General")
    db.add(cat_a)
    db.commit()

    # Create receipt for Tenant A
    receipt_data = {
        "event_id": event_a.id,
        "donor_id": donor_a.id,
        "amount": 5000.00,
        "donation_category_id": cat_a.id,
        "payment_method": "UPI"
    }
    create_res = client.post("/api/receipts", json=receipt_data, headers=headers_a)
    assert create_res.status_code == 200
    assert create_res.json()["receipt_number"].startswith("T-A")

    # Now generate token for Tenant B
    login_response_b = client.post("/api/auth/login", json={"email": "admin_b@test.com", "password": "pass123"})
    token_b = login_response_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # Verify Tenant B cannot access Tenant A's receipts
    get_res = client.get("/api/receipts", headers=headers_b)
    assert get_res.status_code == 200
    assert len(get_res.json()) == 0  # Tenant B receives empty list, cannot see Tenant A's records
