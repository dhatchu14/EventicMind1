# File: domain/order/service.py
from sqlalchemy.orm import Session
from typing import List # Import List
# Use relative imports
# Import only schemas needed for method signatures/return types if not converting here
from .schemas import OrderCreate
# Import models for type hints and returning instances
from .models import Order as OrderModel, DeliveryInfo as DeliveryInfoModel
from .repository import DeliveryInfoRepository, OrderRepository


class OrderService:
    def __init__(self, db: Session):
        self.db = db
        self.delivery_info_repo = DeliveryInfoRepository()
        self.order_repo = OrderRepository()

    # Update create_order signature and implementation
    def create_order(self, order_data: OrderCreate, user_id: int) -> OrderModel:
        """Creates DeliveryInfo and Order records, returning the Order model instance."""
        print(f"Service: Creating order for user_id={user_id}")
        # 1. Create delivery info
        db_delivery_info: DeliveryInfoModel = self.delivery_info_repo.create(
            self.db, order_data.delivery_info
        )
        if not db_delivery_info:
             raise ValueError("Failed to create delivery information.")

        # 2. Create order with reference to delivery info ID and user ID
        db_order: OrderModel = self.order_repo.create(
            self.db, order_data, db_delivery_info.id, user_id=user_id
        )
        if not db_order:
             raise ValueError("Failed to create order record.")

        print(f"Service: Order {db_order.id} created successfully.")
        # 3. Return the SQLAlchemy model instance
        return db_order

    # --- ADDED: Method to get order history ---
    def get_order_history(self, user_id: int) -> List[OrderModel]:
        """Gets the order history for a given user, returning a list of Order model instances."""
        print(f"Service: Getting order history for user_id={user_id}")
        orders = self.order_repo.list_orders_by_user(self.db, user_id=user_id)
        print(f"Service: Found {len(orders)} orders for user_id={user_id}")
        return orders
    # -----------------------------------------