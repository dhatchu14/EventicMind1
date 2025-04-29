# File: domain/order/repository.py
from sqlalchemy.orm import Session
from typing import List # Import List
# Use relative imports
from .models import DeliveryInfo, Order
from .schemas import DeliveryInfoCreate, OrderCreate

class DeliveryInfoRepository:
    def create(self, db: Session, delivery_info: DeliveryInfoCreate):
        # ... (create logic as before) ...
        db_delivery_info = DeliveryInfo(**delivery_info.dict())
        db.add(db_delivery_info)
        db.commit()
        db.refresh(db_delivery_info)
        return db_delivery_info

    def get_by_id(self, db: Session, id: int):
        return db.query(DeliveryInfo).filter(DeliveryInfo.id == id).first()

class OrderRepository:
    # Add user_id parameter to create method
    def create(self, db: Session, order: OrderCreate, delivery_info_id: int, user_id: int):
        db_order = Order(
            user_id=user_id, # <-- Assign user_id
            delivery_info_id=delivery_info_id,
            subtotal=order.subtotal,
            shipping_fee=order.shipping_fee,
            total=order.total,
            payment_method="cash_on_delivery" # Or determine based on flow
            # status will use default
            # created_at will use default
        )
        db.add(db_order)
        db.commit()
        db.refresh(db_order)
        return db_order

    def get_by_id(self, db: Session, id: int):
        # Consider filtering by user_id here too for security if needed
        return db.query(Order).filter(Order.id == id).first()

    # --- ADDED: Method to fetch orders for a specific user ---
    def list_orders_by_user(self, db: Session, user_id: int) -> List[Order]:
        """Fetches all orders associated with a specific user ID, ordered by creation date."""
        print(f"Repository: Fetching orders for user_id={user_id}")
        return db.query(Order)\
                 .filter(Order.user_id == user_id)\
                 .order_by(Order.created_at.desc())\
                 .all()
    # ------------------------------------------------------