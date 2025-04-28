# domain/order/service.py
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import List, Optional

from . import models, schemas, repository as order_repo # Use alias

# --- Cross-Domain Dependencies ---
# Import repositories/services from other domains needed for order creation
# Adjust paths and handling based on your project's dependency strategy

try:
    # Cart Repository (to get items and clear cart)
    from domain.cart.repository import CartRepository # Adjust import path
    cart_repository = CartRepository() # Use singleton or injected instance
except ImportError:
    print("Warning: CartRepository not found. Using dummy implementation.")
    class DummyCartRepo:
        def get_active_cart_items_by_user(self, db: Session, user_id: int): return []
        def clear_cart(self, db: Session, user_id: int): print(f"Dummy: Clearing cart for user {user_id}")
    cart_repository = DummyCartRepo()

try:
    # Product Repository (to get product details like price)
    from domain.product.repository import ProductRepository # Adjust import path
    product_repository = ProductRepository() # Use singleton or injected instance
except ImportError:
    print("Warning: ProductRepository not found. Using dummy implementation.")
    # Dummy product needs attributes accessed in place_order_from_cart
    class DummyProduct: id: int; price: float = 0.0
    class DummyProductRepo:
        def get_product_by_id(self, db: Session, product_id: int) -> Optional[DummyProduct]:
             # Return a dummy product for logic flow, or None to test error handling
             # return DummyProduct(id=product_id, price=10.0) # Example dummy
             return None
    product_repository = DummyProductRepo()

# Optional: Inventory Service/Repository (to check/decrement stock)
# try:
#     from domain.inventory.service import inventory_service
# except ImportError:
#     inventory_service = None


class DeliveryService:
    """Service layer for delivery information logic."""
    def __init__(self, repo: order_repo.DeliveryRepository = order_repo.delivery_repository):
        """Initialize with delivery repository."""
        self.repo = repo

    def create_delivery_info(self, db: Session, *, delivery_in: schemas.DeliveryCreate, user_id: int) -> models.Delivery:
        """
        Handles the business logic for saving delivery information.
        Currently, just calls the repository, but could include validation rules, etc.
        """
        # Example: Add potential future validation logic here
        # if not self._is_address_valid(delivery_in):
        #     raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid address provided.")

        print(f"Service: Saving delivery info for user_id: {user_id}")
        return self.repo.save_delivery(db=db, delivery_in=delivery_in, user_id=user_id)

    def get_delivery_info(self, db: Session, *, delivery_id: int, user_id: int) -> models.Delivery:
        """
        Retrieves delivery info, ensuring it belongs to the requesting user.
        Raises HTTPException if not found or not owned by the user.
        """
        delivery = self.repo.get_delivery_by_id_and_user(db=db, delivery_id=delivery_id, user_id=user_id)
        if not delivery:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Delivery information not found or access denied.",
            )
        return delivery


class OrderService:
    """Service layer for order creation and retrieval logic."""
    def __init__(self,
                 order_repo: order_repo.OrderRepository = order_repo.order_repository,
                 delivery_repo: order_repo.DeliveryRepository = order_repo.delivery_repository,
                 cart_repo = cart_repository, # Injecting potentially dummy repo
                 product_repo = product_repository): # Injecting potentially dummy repo
        """Initialize with necessary repositories."""
        self.order_repo = order_repo
        self.delivery_repo = delivery_repo
        self.cart_repo = cart_repo
        self.product_repo = product_repo
        # self.inventory_service = inventory_service # If using inventory check

    def place_order_from_cart(self, db: Session, *, delivery_id: int, user_id: int) -> models.Order:
        """
        Orchestrates the creation of an order based on user's cart and delivery info.

        Steps:
        1. Verify delivery info exists and belongs to the user.
        2. Fetch active cart items for the user.
        3. Validate cart items (product existence, potentially stock).
        4. Calculate total amount based on current product prices.
        5. Prepare order item data (capturing price at time of order).
        6. Create the Order record within a transaction.
        7. Create OrderItem records linked to the Order.
        8. Optional: Decrement stock via Inventory service.
        9. Clear the user's cart.
        10. Commit the transaction.
        11. Return the created Order details.
        """
        print(f"Service: Placing order for user_id: {user_id} using delivery_id: {delivery_id}")

        # 1. Verify Delivery Info
        delivery_info = self.delivery_repo.get_delivery_by_id_and_user(db=db, delivery_id=delivery_id, user_id=user_id)
        if not delivery_info:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, # 400 might be better than 404 if ID was syntactically valid
                detail="Invalid or inaccessible delivery information ID provided.",
            )

        # 2. Get Cart Items
        cart_items = self.cart_repo.get_active_cart_items_by_user(db=db, user_id=user_id)
        if not cart_items:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot place order: Your cart is empty.",
            )

        # 3. Prepare Order Items, Validate Products, Calculate Total
        order_items_data = []
        total_amount = 0.0
        product_ids_to_check = [item.product_id for item in cart_items]

        # Optional: Fetch all needed products in one go if ProductRepo supports it
        # products_in_cart = self.product_repo.get_products_by_ids(db=db, product_ids=product_ids_to_check)
        # products_map = {p.id: p for p in products_in_cart}

        for item in cart_items:
            # Fetch product details (or use pre-fetched map)
            product = self.product_repo.get_product_by_id(db=db, product_id=item.product_id)
            # product = products_map.get(item.product_id) # If using map

            if not product or not hasattr(product, 'price'): # Check if product exists and has price
                 # Decide whether to skip or fail the entire order
                 print(f"Warning: Product ID {item.product_id} not found or invalid in DB. Skipping item.")
                 # To fail the order instead:
                 # db.rollback() # Ensure transaction consistency before raising
                 # raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Product ID {item.product_id} is unavailable.")
                 continue # Skip this item

            # 3a. Optional: Check stock via Inventory Service
            # if self.inventory_service:
            #     try:
            #         self.inventory_service.check_stock(db=db, product_id=item.product_id, quantity=item.quantity)
            #     except HTTPException as e:
            #         # If stock check fails, re-raise the error to stop order placement
            #         db.rollback()
            #         raise HTTPException(status_code=e.status_code, detail=f"Item '{product.name}' (ID: {product.id}): {e.detail}")

            current_price = float(product.price) # Ensure price is float/numeric
            item_total = current_price * item.quantity
            total_amount += item_total

            order_items_data.append({
                # order_id will be set later
                "product_id": item.product_id,
                "quantity": item.quantity,
                "price_per_unit": current_price, # Store price at time of order
            })

        if not order_items_data:
             # This happens if all cart items referred to non-existent products
             raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No valid items found in the cart to place an order.",
            )

        # --- Transaction Block ---
        try:
            # 4. Create the Order record
            order_data = {
                "user_id": user_id,
                "delivery_id": delivery_id,
                "total_amount": round(total_amount, 2), # Ensure 2 decimal places
                # Statuses use DB Enums or rely on model defaults
                "order_status": models.OrderStatusEnum.PLACED,
                "payment_status": models.PaymentStatusEnum.SUCCESS,
            }
            db_order = self.order_repo.create_order(db=db, order_data=order_data)
            order_id = db_order.id # Get the generated ID

            # 5. Prepare and Add Order Items (linking them to the created order)
            for item_data in order_items_data:
                item_data["order_id"] = order_id # Link item to the order

            created_items = self.order_repo.add_order_items(db=db, order_items_data=order_items_data)

            # 6. Optional: Update Inventory (decrement stock)
            # if self.inventory_service:
            #    self.inventory_service.decrease_stock_for_order(db=db, order_items=created_items) # Pass created items

            # 7. Clear the user's cart
            self.cart_repo.clear_cart(db=db, user_id=user_id)

            # 8. Commit the transaction
            db.commit()
            print(f"Service: Order {order_id} created successfully for user {user_id}.")

        except HTTPException as e:
            # Catch known exceptions (like stock check failure if it happens here)
            print(f"Service Error (HTTPException): Rolling back transaction. Detail: {e.detail}")
            db.rollback()
            raise e # Re-raise the original HTTP exception
        except Exception as e:
            # Catch unexpected errors during the transaction
            print(f"Service Error (Exception): Rolling back transaction. Error: {e}")
            db.rollback()
            # Raise a generic server error to avoid leaking details
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"An unexpected error occurred while placing the order.",
            )

        # 9. Return the newly created order details
        # Fetch again using the repo method that includes relationships
        # This ensures the response object matches the OrderRead schema structure
        final_order = self.order_repo.get_order_by_id_and_user(db=db, order_id=order_id, user_id=user_id)
        if not final_order:
             # Should not happen if commit was successful, but good practice to check
             print(f"Error: Could not retrieve newly created order {order_id} after commit.")
             raise HTTPException(status_code=500, detail="Failed to retrieve order details after creation.")

        return final_order


    def get_order_details(self, db: Session, *, order_id: int, user_id: int) -> models.Order:
        """
        Retrieves full details for a specific order, ensuring user ownership.
        Raises HTTPException if not found or not owned by the user.
        """
        order = self.order_repo.get_order_by_id_and_user(db=db, order_id=order_id, user_id=user_id)
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found or access denied.",
            )
        return order

    def list_user_orders(self, db: Session, *, user_id: int, skip: int = 0, limit: int = 10) -> List[models.Order]:
        """Lists orders placed by the specified user."""
        return self.order_repo.get_user_orders(db=db, user_id=user_id, skip=skip, limit=limit)


# Instantiate services for use in endpoints (or use FastAPI's dependency injection)
delivery_service = DeliveryService()
order_service = OrderService()