import os
import io
import uuid
import shutil
import logging
from typing import Optional, Tuple
from fastapi import UploadFile, HTTPException
from PIL import Image
import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

# Allowed MIME types and Magic Signatures
ALLOWED_IMAGE_SIGNATURES = {
    "image/jpeg": (b"\xff\xd8\xff",),
    "image/png": (b"\x89PNG\r\n\x1a\n",),
    "image/webp": (b"RIFF",), # with WEBP at offset 8
}
ALLOWED_DOC_SIGNATURES = {
    "application/pdf": (b"%PDF-",),
}

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB per file
MAX_IMAGE_DIMENSION = 4096        # Max 4096px width/height

def sanitize_and_validate_file(
    file_bytes: bytes, 
    filename: str, 
    allow_pdf: bool = False
) -> Tuple[bytes, str, str]:
    """
    Validates file signature, decodes images with Pillow, rejects executables,
    strips location/EXIF metadata, and enforces size and dimension limits.
    Returns: (cleaned_bytes, extension, content_type)
    """
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"ఫైల్ పరిమాణం గరిష్ట పరిమితి 10 MB కంటే ఎక్కువగా ఉంది ({len(file_bytes) / (1024 * 1024):.2f} MB)."
        )

    # 1. Check Magic Bytes
    is_jpeg = file_bytes.startswith(b"\xff\xd8\xff")
    is_png = file_bytes.startswith(b"\x89PNG\r\n\x1a\n")
    is_webp = file_bytes.startswith(b"RIFF") and len(file_bytes) >= 12 and file_bytes[8:12] == b"WEBP"
    is_pdf = file_bytes.startswith(b"%PDF-")

    if is_pdf:
        if not allow_pdf:
            raise HTTPException(
                status_code=400,
                detail="ఫోటోలకు కేవలం JPG, PNG, WebP ఫార్మాట్లు మాత్రమే అనుతించబడతాయి."
            )
        return file_bytes, ".pdf", "application/pdf"

    if not (is_jpeg or is_png or is_webp):
        raise HTTPException(
            status_code=400,
            detail="చెల్లని ఫైల్ ఫార్మాట్. కేవలం వాస్తవమైన JPG, PNG, WebP చిత్రాలు మాత్రమే అనుమతించబడతాయి."
        )

    # 2. Decode Image with Pillow to verify integrity and prevent exploit payloads
    try:
        with Image.open(io.BytesIO(file_bytes)) as img:
            img.verify()
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="చిత్రం పాడైపోయింది లేదా చెల్లని ఫైల్ ఫార్మాట్ కలిగి ఉంది."
        )

    # 3. Strip EXIF & Geolocation Metadata, enforce dimension limits
    try:
        with Image.open(io.BytesIO(file_bytes)) as img:
            width, height = img.size
            if width > MAX_IMAGE_DIMENSION or height > MAX_IMAGE_DIMENSION:
                img.thumbnail((MAX_IMAGE_DIMENSION, MAX_IMAGE_DIMENSION), Image.Resampling.LANCZOS)

            # Determine format & content type
            fmt = img.format if img.format else ("JPEG" if is_jpeg else "PNG" if is_png else "WEBP")
            out_buffer = io.BytesIO()

            # Save without EXIF metadata (stripping GPS, camera tags)
            if fmt == "JPEG" or is_jpeg:
                img = img.convert("RGB")
                img.save(out_buffer, format="JPEG", quality=90, optimize=True)
                ext = ".jpg"
                mime = "image/jpeg"
            elif fmt == "PNG" or is_png:
                img.save(out_buffer, format="PNG", optimize=True)
                ext = ".png"
                mime = "image/png"
            elif fmt == "WEBP" or is_webp:
                img.save(out_buffer, format="WEBP", quality=90)
                ext = ".webp"
                mime = "image/webp"
            else:
                img.save(out_buffer, format=fmt)
                ext = f".{fmt.lower()}"
                mime = f"image/{fmt.lower()}"

            cleaned_bytes = out_buffer.getvalue()
            return cleaned_bytes, ext, mime
    except Exception as e:
        logger.error(f"Image processing error: {e}")
        raise HTTPException(
            status_code=400,
            detail="చిత్రాన్ని ప్రాసెస్ చేయడంలో లోపం ఏర్పడింది."
        )


class StorageService:
    def save_file(self, file: UploadFile, org_id: str, prefix: str, is_public: bool = True) -> str:
        raise NotImplementedError

    def get_file_url(self, storage_key: str, is_public: bool = True) -> str:
        raise NotImplementedError

    def delete_file(self, storage_key: str) -> bool:
        raise NotImplementedError

    def publish_file(self, storage_key: str) -> bool:
        raise NotImplementedError

    def unpublish_file(self, storage_key: str) -> bool:
        raise NotImplementedError

    def replace_file(self, file: UploadFile, old_storage_key: str, org_id: str, prefix: str, is_public: bool = True) -> str:
        raise NotImplementedError


class SupabaseStorageService(StorageService):
    def __init__(self):
        self.supabase_url = settings.SUPABASE_URL.rstrip('/') if settings.SUPABASE_URL else ""
        self.secret = settings.SUPABASE_STORAGE_SECRET
        self.public_bucket = settings.SUPABASE_PUBLIC_BUCKET or "festival-public"
        self.private_bucket = settings.SUPABASE_PRIVATE_BUCKET or "festival-private"

    def _validate_and_get_credential(self) -> Tuple[str, str]:
        """
        Validates the credential without leaking it.
        Returns (auth_type, secret)
        auth_type: 'modern' for sb_secret_...
                   'jwt' for eyJ... (service_role)
        Rejects placeholders, anon keys, etc.
        """
        secret = (self.secret or "").strip().strip('"').strip("'")
        if not secret or "YOUR_" in secret or secret.lower() in ("placeholder", "none", "null"):
            raise HTTPException(
                status_code=500,
                detail="Supabase Storage credential missing or unconfigured: SUPABASE_STORAGE_SECRET contains a placeholder in backend/.env. A valid Supabase service_role key or sb_secret_ key is required for storage operations."
            )
        if secret.startswith("sb_secret_"):
            return "modern", secret
        elif secret.startswith("eyJ") and secret.count(".") == 2:
            return "jwt", secret
        else:
            raise HTTPException(
                status_code=500,
                detail="Invalid Supabase Storage credential format. Privileged operations require either a modern sb_secret_ key or a valid service_role JWT (eyJ...)."
            )

    def _headers(self, content_type: Optional[str] = None) -> dict:
        auth_type, secret = self._validate_and_get_credential()
        headers = {}
        if auth_type == "modern":
            # Modern documented Supabase apikey header
            headers["apikey"] = secret
        elif auth_type == "jwt":
            # Legacy service_role JWT
            headers["Authorization"] = f"Bearer {secret}"
            headers["apikey"] = secret
        if content_type:
            headers["Content-Type"] = content_type
        return headers

    def save_file(self, file: UploadFile, org_id: str, prefix: str, is_public: bool = True) -> str:
        if not self.supabase_url:
            raise HTTPException(
                status_code=500,
                detail="Supabase Storage configuration incomplete: SUPABASE_URL is not configured."
            )
        if not self.secret:
            raise HTTPException(
                status_code=500,
                detail="Supabase Storage credential missing: SUPABASE_STORAGE_SECRET must be configured in backend/.env to upload files."
            )

        file.file.seek(0)
        raw_bytes = file.file.read()
        allow_pdf = "receipt" in prefix.lower() or "bill" in prefix.lower()
        cleaned_bytes, ext, mime = sanitize_and_validate_file(raw_bytes, file.filename or "file", allow_pdf=allow_pdf)

        safe_filename = f"{uuid.uuid4()}{ext}"
        clean_prefix = prefix.strip("/").replace("\\", "/")
        clean_org = org_id.strip("/").replace("\\", "/")
        object_path = f"{clean_org}/{clean_prefix}/{safe_filename}"

        target_bucket = self.public_bucket if is_public else self.private_bucket
        url = f"{self.supabase_url}/storage/v1/object/{target_bucket}/{object_path}"

        try:
            with httpx.Client(timeout=20.0) as client:
                resp = client.post(url, headers=self._headers(mime), content=cleaned_bytes)
                if resp.status_code not in (200, 201):
                    err_msg = "Unknown error"
                    try:
                        err_json = resp.json()
                        err_msg = err_json.get("message") or err_json.get("error") or str(err_json)
                    except Exception:
                        err_msg = resp.text[:200]
                    logger.error(f"Supabase storage upload failed ({resp.status_code}): {err_msg}")
                    raise HTTPException(
                        status_code=502,
                        detail=f"Supabase Storage upload failed ({resp.status_code}): {err_msg}"
                    )
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to connect to Supabase Storage: {e}")
            raise HTTPException(
                status_code=502,
                detail=f"Failed to connect to Supabase Storage: {str(e)}"
            )

        return object_path

    def get_file_url(self, storage_key: str, is_public: bool = True) -> str:
        if not storage_key:
            return ""

        clean_key = storage_key.strip("/").replace("\\", "/")

        if not self.supabase_url:
            raise HTTPException(
                status_code=500,
                detail="Supabase Storage configuration incomplete: SUPABASE_URL is not configured."
            )

        if is_public:
            return f"{self.supabase_url}/storage/v1/object/public/{self.public_bucket}/{clean_key}"
        else:
            if not self.secret:
                raise HTTPException(
                    status_code=500,
                    detail="Supabase Storage credential missing: SUPABASE_STORAGE_SECRET is required to sign private URLs."
                )
            sign_url = f"{self.supabase_url}/storage/v1/object/sign/{self.private_bucket}/{clean_key}"
            try:
                with httpx.Client(timeout=10.0) as client:
                    resp = client.post(sign_url, headers=self._headers("application/json"), json={"expiresIn": 3600})
                    if resp.status_code == 200:
                        signed_path = resp.json().get("signedURL")
                        if signed_path:
                            return f"{self.supabase_url}/storage/v1{signed_path}"
                    raise HTTPException(
                        status_code=502,
                        detail=f"Failed to generate signed URL from Supabase Storage ({resp.status_code})"
                    )
            except HTTPException:
                raise
            except Exception as e:
                logger.error(f"Failed to sign URL: {e}")
                raise HTTPException(
                    status_code=502,
                    detail=f"Failed to connect to Supabase Storage for signed URL: {str(e)}"
                )

    def delete_file(self, storage_key: str) -> bool:
        if not storage_key:
            return False

        if not self.supabase_url or not self.secret:
            logger.warning("Supabase Storage credentials missing, cannot delete remote object.")
            return False

        clean_key = storage_key.strip("/").replace("\\", "/")
        try:
            with httpx.Client(timeout=10.0) as client:
                for bucket in (self.public_bucket, self.private_bucket):
                    client.delete(f"{self.supabase_url}/storage/v1/object/{bucket}/{clean_key}", headers=self._headers())
            return True
        except Exception as e:
            logger.warning(f"Failed to delete {clean_key} from Supabase Storage: {e}")
            return False

    def publish_file(self, storage_key: str) -> bool:
        """Moves/copies object from private bucket to public bucket."""
        if not storage_key:
            return False
        if not self.supabase_url or not self.secret:
            raise HTTPException(
                status_code=500,
                detail="Supabase Storage credential missing: SUPABASE_STORAGE_SECRET is required to publish files."
            )

        clean_key = storage_key.strip("/").replace("\\", "/")
        try:
            copy_url = f"{self.supabase_url}/storage/v1/object/copy"
            with httpx.Client(timeout=15.0) as client:
                resp = client.post(
                    copy_url,
                    headers=self._headers("application/json"),
                    json={
                        "bucketId": self.private_bucket,
                        "sourceKey": clean_key,
                        "destinationBucket": self.public_bucket,
                        "destinationKey": clean_key
                    }
                )
                if resp.status_code not in (200, 201):
                    err_msg = resp.text[:200]
                    logger.error(f"Failed to publish file {clean_key}: {resp.status_code} {err_msg}")
                    raise HTTPException(
                        status_code=502,
                        detail=f"Failed to publish object to Supabase public bucket ({resp.status_code}): {err_msg}"
                    )
                # Remove from private bucket
                client.delete(f"{self.supabase_url}/storage/v1/object/{self.private_bucket}/{clean_key}", headers=self._headers())
                return True
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to publish file {clean_key}: {e}")
            raise HTTPException(
                status_code=502,
                detail=f"Supabase Storage error during publish: {str(e)}"
            )

    def unpublish_file(self, storage_key: str) -> bool:
        """Moves/copies object from public bucket to private bucket."""
        if not storage_key:
            return False
        if not self.supabase_url or not self.secret:
            raise HTTPException(
                status_code=500,
                detail="Supabase Storage credential missing: SUPABASE_STORAGE_SECRET is required to unpublish files."
            )

        clean_key = storage_key.strip("/").replace("\\", "/")
        try:
            copy_url = f"{self.supabase_url}/storage/v1/object/copy"
            with httpx.Client(timeout=15.0) as client:
                # Copy from public to private
                resp = client.post(
                    copy_url,
                    headers=self._headers("application/json"),
                    json={
                        "bucketId": self.public_bucket,
                        "sourceKey": clean_key,
                        "destinationBucket": self.private_bucket,
                        "destinationKey": clean_key
                    }
                )
                # Delete from public
                del_resp = client.delete(f"{self.supabase_url}/storage/v1/object/{self.public_bucket}/{clean_key}", headers=self._headers())
                if del_resp.status_code not in (200, 204):
                    logger.warning(f"Unpublish delete from public returned {del_resp.status_code}")
                return True
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to unpublish file {clean_key}: {e}")
            raise HTTPException(
                status_code=502,
                detail=f"Supabase Storage error during unpublish: {str(e)}"
            )

    def replace_file(self, file: UploadFile, old_storage_key: str, org_id: str, prefix: str, is_public: bool = True) -> str:
        new_key = self.save_file(file, org_id, prefix, is_public=is_public)
        if old_storage_key and old_storage_key != new_key:
            self.delete_file(old_storage_key)
        return new_key


class LocalStorageService(StorageService):
    def __init__(self):
        self.base_dir = settings.LOCAL_STORAGE_DIR
        os.makedirs(self.base_dir, exist_ok=True)

    def save_file(self, file: UploadFile, org_id: str, prefix: str, is_public: bool = True) -> str:
        file.file.seek(0)
        raw_bytes = file.file.read()
        allow_pdf = "receipt" in prefix.lower() or "bill" in prefix.lower()
        cleaned_bytes, ext, _ = sanitize_and_validate_file(raw_bytes, file.filename or "file", allow_pdf=allow_pdf)

        org_dir = os.path.join(self.base_dir, org_id, prefix)
        os.makedirs(org_dir, exist_ok=True)
        
        safe_filename = f"{uuid.uuid4()}{ext}"
        filepath = os.path.join(org_dir, safe_filename)
        
        with open(filepath, "wb") as buffer:
            buffer.write(cleaned_bytes)
            
        return f"{org_id}/{prefix}/{safe_filename}"

    def get_file_url(self, storage_key: str, is_public: bool = True) -> str:
        if not storage_key:
            return ""
        return f"/api/files/download/{storage_key}"

    def delete_file(self, storage_key: str) -> bool:
        if not storage_key:
            return False
        path = os.path.join(self.base_dir, storage_key)
        if os.path.exists(path):
            try:
                os.remove(path)
                return True
            except Exception:
                return False
        return False

    def publish_file(self, storage_key: str) -> bool:
        return True

    def unpublish_file(self, storage_key: str) -> bool:
        return True


def get_storage_service() -> StorageService:
    if settings.STORAGE_TYPE == "supabase":
        return SupabaseStorageService()
    elif settings.STORAGE_TYPE == "s3":
        from app.services.storage import S3StorageService
        return S3StorageService()
    return LocalStorageService()
