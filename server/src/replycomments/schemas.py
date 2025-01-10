from ninja import Schema
from datetime import datetime
from pydantic import EmailStr

class WaitlistEntryCreateSchema(Schema):
    # Create -> Data
    # WautlistEntryIn
    id:int(id)
    email:EmailStr
    name:str
    

class WaitlistEntryDetailSchema(Schema):
    # Detail get -> Data
    # WaitlistEntryOut
    email:EmailStr
    timestamp: datetime