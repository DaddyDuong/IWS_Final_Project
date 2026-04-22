CREATE TRIGGER reviews_bounds_insert
BEFORE INSERT ON reviews
FOR EACH ROW
WHEN NEW.rating < 1 OR NEW.rating > 5
BEGIN
  SELECT RAISE(ABORT, 'reviews.rating must be between 1 and 5');
END;

CREATE TRIGGER reviews_bounds_update
BEFORE UPDATE ON reviews
FOR EACH ROW
WHEN NEW.rating < 1 OR NEW.rating > 5
BEGIN
  SELECT RAISE(ABORT, 'reviews.rating must be between 1 and 5');
END;

CREATE TRIGGER cart_items_bounds_insert
BEFORE INSERT ON cart_items
FOR EACH ROW
WHEN NEW.quantity <= 0
BEGIN
  SELECT RAISE(ABORT, 'cart_items.quantity must be greater than 0');
END;

CREATE TRIGGER cart_items_bounds_update
BEFORE UPDATE ON cart_items
FOR EACH ROW
WHEN NEW.quantity <= 0
BEGIN
  SELECT RAISE(ABORT, 'cart_items.quantity must be greater than 0');
END;

CREATE TRIGGER order_items_bounds_insert
BEFORE INSERT ON order_items
FOR EACH ROW
WHEN NEW.quantity <= 0 OR NEW.unit_price < 0 OR NEW.line_total < 0
BEGIN
  SELECT RAISE(ABORT, 'order_items numeric values are out of bounds');
END;

CREATE TRIGGER order_items_bounds_update
BEFORE UPDATE ON order_items
FOR EACH ROW
WHEN NEW.quantity <= 0 OR NEW.unit_price < 0 OR NEW.line_total < 0
BEGIN
  SELECT RAISE(ABORT, 'order_items numeric values are out of bounds');
END;

CREATE TRIGGER products_bounds_insert
BEFORE INSERT ON products
FOR EACH ROW
WHEN NEW.price < 0 OR NEW.stock_qty < 0
BEGIN
  SELECT RAISE(ABORT, 'products.price and products.stock_qty must be >= 0');
END;

CREATE TRIGGER products_bounds_update
BEFORE UPDATE ON products
FOR EACH ROW
WHEN NEW.price < 0 OR NEW.stock_qty < 0
BEGIN
  SELECT RAISE(ABORT, 'products.price and products.stock_qty must be >= 0');
END;

CREATE TRIGGER orders_bounds_insert
BEFORE INSERT ON orders
FOR EACH ROW
WHEN NEW.subtotal < 0 OR NEW.shipping_fee < 0 OR NEW.total < 0
BEGIN
  SELECT RAISE(ABORT, 'orders monetary values must be >= 0');
END;

CREATE TRIGGER orders_bounds_update
BEFORE UPDATE ON orders
FOR EACH ROW
WHEN NEW.subtotal < 0 OR NEW.shipping_fee < 0 OR NEW.total < 0
BEGIN
  SELECT RAISE(ABORT, 'orders monetary values must be >= 0');
END;
