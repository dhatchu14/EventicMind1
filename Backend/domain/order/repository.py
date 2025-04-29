# File: domain/order/repository.py
from sqlalchemy.orm import Session
# Use relative imports for files in the same directory
from .models import DeliveryInfo, Order
from .schemas import DeliveryInfoCreate, OrderCreate # Assuming schemas.py is in domain/order/

class DeliveryInfoRepository:
    def create(self, db: Session, delivery_info: DeliveryInfoCreate):
        # Make sure DeliveryInfoCreate matches DeliveryInfo model fields
        db_delivery_info = DeliveryInfo(
            first_name=delivery_info.first_name,
            last_name=delivery_info.last_name,
            email=delivery_info.email,
            phone=delivery_info.phone,
            street=delivery_info.street,
            city=delivery_info.city,
            state=delivery_info.state,
            zip_code=delivery_info.zip_code,
            country=delivery_info.country
            # created_at is handled by default
        )
        db.add(db_delivery_info)
        db.commit()
        db.refresh(db_delivery_info)
        return db_delivery_info

    def get_by_id(self, db: Session, id: int):
        return db.query(DeliveryInfo).filter(DeliveryInfo.id == id).first()

class OrderRepository:
    def create(self, db: Session, order: OrderCreate, delivery_info_id: int):
        db_order = Order(
            delivery_info_id=delivery_info_id,
            subtotal=order.subtotal,         # Ensure these come from order_data
            shipping_fee=order.shipping_fee, # Ensure these come from order_data
            total=order.total,             # Ensure these come from order_data
            payment_method="cash_on_delivery" # Default is okay
            # created_at is handled by default
        )
        db.add(db_order)
        db.commit()
        db.refresh(db_order)
        return db_order

    def get_by_id(self, db: Session, id: int):
        return db.query(Order).filter(Order.id == id).first()