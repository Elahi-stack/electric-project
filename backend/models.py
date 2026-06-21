from pydantic import BaseModel
from typing import Optional


class HSCRecord(BaseModel):
    id: int
    hsc: Optional[str] = ""
    name: Optional[str] = ""
    village: Optional[str] = ""
    address: Optional[str] = ""
    agl: Optional[str] = ""
    phone: Optional[str] = ""
    cast: Optional[str] = ""
    pronounce: Optional[str] = ""
    remarks: Optional[str] = ""

    class Config:
        from_attributes = True
