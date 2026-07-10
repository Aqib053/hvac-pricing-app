from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.import_service import ExcelImportService

router = APIRouter(prefix="/import", tags=["Import"])


@router.post("")
async def import_excel(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="Only Excel files (.xlsx, .xls) are supported")

    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    service = ExcelImportService(db)
    try:
        result = service.import_from_bytes(content)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    return {
        "success": True,
        "message": f"Import complete: {result['products_imported']} inserted, {result['products_updated']} updated",
        "details": result,
    }
