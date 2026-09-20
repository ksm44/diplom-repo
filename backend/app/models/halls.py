from sqlalchemy.orm import Mapped, mapped_column
from .base import Base

class HallORM(Base):
    __tablename__ = "halls"
    number: Mapped[int] = mapped_column(unique=True)