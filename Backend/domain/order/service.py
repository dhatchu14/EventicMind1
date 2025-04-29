# File: domain/order/service.py
from sqlalchemy.orm import Session
# Use relative imports for files in the same directory
from .schemas import OrderCreate, OrderResponse, DeliveryInfoResponse # Import all needed schemas
from .repository import DeliveryInfoRepository, OrderRepository
# Import models if you need to directly interact with them or for type hints
from .models import Order as OrderModel, DeliveryInfo as DeliveryInfoModel

class OrderService:
    def __init__(self, db: Session):
        self.db = db
        # Instantiate repositories within the service instance
        self.delivery_info_repo = DeliveryInfoRepository()
        self.order_repo = OrderRepository()

    def create_order(self, order_data: OrderCreate) -> OrderResponse:
        # 1. Create delivery info using the repository
        # Pass the specific DeliveryInfoCreate part of order_data
        db_delivery_info: DeliveryInfoModel = self.delivery_info_repo.create(
            self.db, order_data.delivery_info
        )

        # 2. Create order with reference to delivery info ID using the repository
        # Pass the main OrderCreate data and the newly created delivery_info ID
        db_order: OrderModel = self.order_repo.create(
            self.db, order_data, db_delivery_info.id
        )

        # 3. Construct the response Pydantic model from the created SQLAlchemy model
        # Pydantic's orm_mode will handle the mapping if field names match
        return OrderResponse.from_orm(db_order)
        # Manual mapping (alternative if from_orm doesn't work or needs adjustment):
        # return OrderResponse(
        #     id=db_order.id,
        #     delivery_info_id=db_order.delivery_info_id,
        #     subtotal=db_order.subtotal,
        #     shipping_fee=db_order.shipping_fee,
        #     total=db_order.total,
        #     payment_method=db_order.payment_method,
        #     created_at=db_order.created_at
        # )