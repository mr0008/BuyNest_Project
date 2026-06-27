CREATE DATABASE IF NOT EXISTS shopping_db;
USE shopping_db;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('customer', 'admin') NOT NULL DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  description TEXT DEFAULT '',
  price DECIMAL(10,2) NOT NULL,
  image_url VARCHAR(255) DEFAULT '',
  category VARCHAR(100) DEFAULT 'General',
  stock INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS carts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

INSERT INTO products (name, description, price, image_url, category, stock)
VALUES
  ('Wireless Headphones', 'Noise-cancelling over-ear headphones', 89.99, '/uploads/headphones.jpg', 'Electronics', 15),
  ('Running Shoes', 'Comfortable everyday running shoes', 59.50, '/uploads/shoes.jpg', 'Fashion', 20),
  ('Coffee Maker', 'Compact coffee maker for home use', 49.00, '/uploads/coffee-maker.jpg', 'Home', 10)
ON DUPLICATE KEY UPDATE
  description = VALUES(description),
  price = VALUES(price),
  image_url = VALUES(image_url),
  category = VALUES(category),
  stock = VALUES(stock);
