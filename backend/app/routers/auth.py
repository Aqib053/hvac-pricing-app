from fastapi import APIRouter

# Login is now handled by Supabase Auth on the frontend.
# This router is kept as a placeholder.
router = APIRouter(prefix="/auth", tags=["Authentication"])
