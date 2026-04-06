"""S3/MinIO storage client."""

from __future__ import annotations

import os
import uuid
from typing import BinaryIO

import boto3
from botocore.client import Config


class MinioStorage:
    """Thin wrapper around an S3-compatible (MinIO) object store."""

    def __init__(self) -> None:
        self.endpoint = os.getenv("S3_ENDPOINT", "http://localhost:9000")
        self.access_key = os.getenv("S3_ACCESS_KEY", "minioadmin")
        self.secret_key = os.getenv("S3_SECRET_KEY", "minioadmin")
        self.bucket = os.getenv("S3_BUCKET", "carrier-docs")
        self.region = os.getenv("S3_REGION", "us-east-1")

        self._client = boto3.client(
            "s3",
            endpoint_url=self.endpoint,
            aws_access_key_id=self.access_key,
            aws_secret_access_key=self.secret_key,
            region_name=self.region,
            config=Config(signature_version="s3v4"),
        )

    def upload_file(
        self,
        file_obj: BinaryIO,
        original_filename: str,
        content_type: str = "application/octet-stream",
        prefix: str = "uploads",
    ) -> str:
        """Upload a file to MinIO and return the object key."""
        ext = original_filename.rsplit(".", 1)[-1] if "." in original_filename else "bin"
        object_key = f"{prefix}/{uuid.uuid4()}.{ext}"

        self._client.upload_fileobj(
            file_obj,
            self.bucket,
            object_key,
            ExtraArgs={"ContentType": content_type},
        )
        return object_key

    def get_signed_url(self, object_key: str, expires_in: int = 3600) -> str:
        """Generate a pre-signed URL for downloading a file."""
        return self._client.generate_presigned_url(
            "get_object",
            Params={"Bucket": self.bucket, "Key": object_key},
            ExpiresIn=expires_in,
        )

    def delete_file(self, object_key: str) -> None:
        """Delete a file from MinIO."""
        self._client.delete_object(Bucket=self.bucket, Key=object_key)
