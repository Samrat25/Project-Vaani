"""
Model Downloader for Project Vaani - DPDFNet-8 (48 kHz HR)
Downloads and verifies the ONNX model in pretuned/pretrained directories.
"""

import os
import sys
import logging
import urllib.request
from pathlib import Path
from typing import Optional, List

logger = logging.getLogger("vaani.downloader")

MODEL_FILENAME = "dpdfnet2_48khz_hr.onnx"
DEFAULT_HF_URL = "https://huggingface.co/Ceva-IP/DPDFNet/resolve/main/onnx/dpdfnet2_48khz_hr.onnx"
MIN_FILE_SIZE = 8_000_000  # ~10.4 MB for DPDFNet-2, ~14.8 MB for DPDFNet-8

# Search paths in order of preference
CANDIDATE_DIRS = [
    Path("models/pretuned/dpdfnet"),
    Path("pretuned"),
    Path("models/pretrained/dpdfnet"),
    Path("models/pretuned"),
]


def find_model(model_filename: str = MODEL_FILENAME) -> Optional[Path]:
    """Check if model exists in candidate directories with valid size."""
    for candidate_dir in CANDIDATE_DIRS:
        path = candidate_dir / model_filename
        if path.is_file() and path.stat().st_size >= MIN_FILE_SIZE:
            return path.resolve()
    return None


def download_model(
    destination_dir: str = "models/pretuned/dpdfnet",
    model_filename: str = MODEL_FILENAME,
    url: str = DEFAULT_HF_URL,
    force: bool = False,
) -> Path:
    """
    Ensures the model is available.
    If already cached and not force, returns existing model path.
    Otherwise downloads the ONNX model from Hugging Face into destination_dir.
    """
    dest_path = Path(destination_dir) / model_filename

    # If already exists and valid, skip download unless forced
    if not force:
        existing = find_model(model_filename)
        if existing:
            logger.info("DPDFNet model already cached at: %s (%d bytes)", existing, existing.stat().st_size)
            # If target destination doesn't have it, copy for consistency
            if not dest_path.is_file() or dest_path.stat().st_size < MIN_FILE_SIZE:
                os.makedirs(dest_path.parent, exist_ok=True)
                try:
                    import shutil
                    shutil.copy2(existing, dest_path)
                    logger.info("Copied cached model to requested pretuned folder: %s", dest_path)
                except Exception as e:
                    logger.warning("Could not copy model to %s: %s", dest_path, e)
            return dest_path.resolve() if dest_path.exists() else existing

    dest_path.parent.mkdir(parents=True, exist_ok=True)
    temp_path = dest_path.with_suffix(".tmp")

    logger.info("Downloading %s from Hugging Face: %s", model_filename, url)
    print(f"[*] Downloading {model_filename} from Hugging Face...")
    print(f"    URL: {url}")
    print(f"    Destination: {dest_path}")

    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Project-Vaani/1.0 (Python/urllib; Speech Enhancement)"}
    )

    try:
        with urllib.request.urlopen(req, timeout=180) as response, open(temp_path, "wb") as f_out:
            total_size = int(response.headers.get("Content-Length", 0))
            downloaded = 0
            block_size = 1024 * 64  # 64 KB

            while True:
                buffer = response.read(block_size)
                if not buffer:
                    break
                f_out.write(buffer)
                downloaded += len(buffer)
                if total_size > 0:
                    percent = downloaded / total_size * 100
                    print(f"\r    Progress: {downloaded / 1024 / 1024:.2f} MB / {total_size / 1024 / 1024:.2f} MB ({percent:.1f}%)", end="", flush=True)

            print()

        # Validate file size
        actual_size = temp_path.stat().st_size
        if actual_size < MIN_FILE_SIZE:
            if temp_path.exists():
                temp_path.unlink()
            raise ValueError(f"Downloaded model size ({actual_size} bytes) is smaller than expected ({MIN_FILE_SIZE} bytes)")

        # Rename temp to destination
        if dest_path.exists():
            dest_path.unlink()
        temp_path.rename(dest_path)
        logger.info("Model successfully downloaded to: %s (%d bytes)", dest_path, actual_size)
        print(f"[x] Model successfully downloaded to: {dest_path} ({actual_size:,} bytes)")
        return dest_path.resolve()

    except Exception as exc:
        if temp_path.exists():
            temp_path.unlink()
        logger.error("Download failed: %s", exc)
        print(f"[!] Model download failed: {exc}")
        raise


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    dest = sys.argv[1] if len(sys.argv) > 1 else "models/pretuned/dpdfnet"
    path = download_model(destination_dir=dest)
    print(f"[Ready] DPDFNet-8 Model ready at: {path}")
