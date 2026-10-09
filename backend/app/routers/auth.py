from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta

from app.core.database import get_db
from app.core.security import (
    hash_password, verify_password, create_access_token, create_refresh_token,
    get_current_user
)
from app.models.db_models import User, Organization
from app.models.schemas import LoginRequest, RegisterRequest, ChangePasswordRequest, Token, UserResponse
from sqlalchemy import or_

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=Token)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    identifier = request.email.strip()
    user = db.query(User).filter(
        or_(User.email == identifier, User.phone == identifier)
    ).first()
    
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email/phone or password"
        )
        
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is deactivated"
        )
        
    access_token = create_access_token(
        data={"sub": user.id, "role": user.role, "org": user.organization_id}
    )
    refresh_token = create_refresh_token(
        data={"sub": user.id}
    )
    
    # Audit log login event
    try:
        from app.services.audit import write_audit_log
        write_audit_log(
            db, user.organization_id, user.id, "LOGIN", "User", user.id,
            new_value={"identifier": identifier}
        )
        db.commit()
    except Exception:
        pass

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

@router.post("/register", response_model=Token)
def register_organization(request: RegisterRequest, db: Session = Depends(get_db)):
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Public organization registration is disabled on this festival website. Authorized committee members can log in."
    )

    existing_user = db.query(User).filter(
        or_(User.email == email, (User.phone == phone if phone else False))
    ).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this email or phone already exists")

    # Create new Organization
    slug = request.organization_name.lower().replace(" ", "-").replace("'", "")
    existing_org = db.query(Organization).filter(Organization.slug == slug).first()
    if existing_org:
        import uuid
        slug = f"{slug}-{uuid.uuid4().hex[:4]}"

    import datetime
    current_year = str(datetime.datetime.utcnow().year)

    org = Organization(
        name=request.organization_name,
        slug=slug,
        festival_name="Ganesh Utsav",
        year=current_year
    )
    db.add(org)
    db.flush()

    # Create Org Admin User
    new_user = User(
        organization_id=org.id,
        name=request.name,
        email=email,
        phone=phone,
        password_hash=hash_password(request.password),
        role="ORG_ADMIN",
        is_active=True
    )
    db.add(new_user)
    
    # Create Default Active Event
    from app.models.db_models import Event, DonationCategory, ExpenseCategory
    event = Event(
        organization_id=org.id,
        name=f"Ganesh Chaturthi {current_year}",
        financial_year=current_year,
        status="ACTIVE"
    )
    db.add(event)

    # Seed Default Donation & Expense Categories
    d_cat = DonationCategory(organization_id=org.id, name="General Chanda", is_active=True)
    e_cat = ExpenseCategory(organization_id=org.id, name="General Expense", is_active=True)
    db.add(d_cat)
    db.add(e_cat)

    db.commit()
    db.refresh(new_user)

    access_token = create_access_token(
        data={"sub": new_user.id, "role": new_user.role, "org": new_user.organization_id}
    )
    refresh_token = create_refresh_token(data={"sub": new_user.id})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

@router.put("/change-password")
def change_password(
    request: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not verify_password(request.old_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(request.new_password.strip()) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters long")
        
    current_user.password_hash = hash_password(request.new_password)
    db.commit()
    return {"message": "Password changed successfully"}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/users", response_model=list[UserResponse])
def get_organization_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.core.security import RoleChecker
    RoleChecker(["SUPER_ADMIN", "ORG_ADMIN"])(current_user)
    
    if current_user.role == "SUPER_ADMIN" and not current_user.organization_id:
        return db.query(User).all()
    return db.query(User).filter(User.organization_id == current_user.organization_id).all()

@router.post("/users", response_model=UserResponse)
def create_team_user(
    request: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.core.security import RoleChecker
    RoleChecker(["SUPER_ADMIN", "ORG_ADMIN"])(current_user)
    
    email = request.get("email")
    name = request.get("name")
    password = request.get("password")
    role = request.get("role", "OPERATOR")
    phone = request.get("phone", "")
    
    if not email or not name or not password:
        raise HTTPException(status_code=400, detail="Name, email and password are required")
        
    if role not in ["ORG_ADMIN", "OPERATOR", "VIEWER"]:
        raise HTTPException(status_code=400, detail="Invalid role specified")
        
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")
        
    new_user = User(
        organization_id=current_user.organization_id,
        name=name,
        email=email,
        phone=phone,
        password_hash=hash_password(password),
        role=role,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Audit log creation
    from app.services.audit import write_audit_log
    write_audit_log(
        db, current_user.organization_id, current_user.id, "CREATE", "User", new_user.id,
        new_value={"name": name, "email": email, "role": role}
    )
    db.commit()
    
    return new_user

@router.put("/users/{user_id}/status", response_model=UserResponse)
def update_user_status(
    user_id: str,
    request: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.core.security import RoleChecker
    RoleChecker(["SUPER_ADMIN", "ORG_ADMIN"])(current_user)
    
    target_user = db.query(User).filter(
        User.id == user_id,
        User.organization_id == current_user.organization_id
    ).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    is_active = request.get("is_active", True)
    old_status = target_user.is_active
    target_user.is_active = is_active
    
    from app.services.audit import write_audit_log
    write_audit_log(
        db, current_user.organization_id, current_user.id, "UPDATE", "User", target_user.id,
        previous_value={"is_active": old_status},
        new_value={"is_active": is_active}
    )
    db.commit()
    db.refresh(target_user)
    return target_user

@router.put("/users/{user_id}", response_model=UserResponse)
def update_team_user(
    user_id: str,
    request: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.core.security import RoleChecker
    RoleChecker(["SUPER_ADMIN", "ORG_ADMIN"])(current_user)
    
    target_user = db.query(User).filter(
        User.id == user_id,
        User.organization_id == current_user.organization_id
    ).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    old_data = {
        "name": target_user.name,
        "email": target_user.email,
        "phone": target_user.phone,
        "role": target_user.role
    }

    name = request.get("name")
    email = request.get("email")
    phone = request.get("phone")
    role = request.get("role")
    password = request.get("password")

    if email and email != target_user.email:
        existing = db.query(User).filter(User.email == email, User.id != user_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Another user with this email already exists")
        target_user.email = email

    if name:
        target_user.name = name
    if phone is not None:
        target_user.phone = phone
    if role and role in ["ORG_ADMIN", "OPERATOR", "VIEWER"]:
        target_user.role = role
    if password and len(password.strip()) > 0:
        target_user.password_hash = hash_password(password)

    new_data = {
        "name": target_user.name,
        "email": target_user.email,
        "phone": target_user.phone,
        "role": target_user.role,
        "password_changed": bool(password)
    }

    from app.services.audit import write_audit_log
    write_audit_log(
        db, current_user.organization_id, current_user.id, "UPDATE", "User", target_user.id,
        previous_value=old_data,
        new_value=new_data
    )
    db.commit()
    db.refresh(target_user)
    return target_user

@router.delete("/users/{user_id}")
def delete_team_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.core.security import RoleChecker
    RoleChecker(["SUPER_ADMIN", "ORG_ADMIN"])(current_user)
    
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
        
    target_user = db.query(User).filter(
        User.id == user_id,
        User.organization_id == current_user.organization_id
    ).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    from app.services.audit import write_audit_log
    write_audit_log(
        db, current_user.organization_id, current_user.id, "DELETE", "User", target_user.id,
        previous_value={"name": target_user.name, "email": target_user.email}
    )
    db.delete(target_user)
    db.commit()
    return {"message": "User deleted successfully"}
