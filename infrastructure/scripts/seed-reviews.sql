-- ============================================================================
-- TruckBites - Sample Customer Reviews
-- ============================================================================
-- Inserts sample reviews for a set of trucks (no FK on reviews table, so orders
-- are not required). Then recomputes each truck's cached average_rating using
-- the same rounding the app does (ROUND(AVG(rating), 1)).
--
-- Usage:  docker exec -i truckbites-truck-mysql mysql -uroot -p<truckbites_root> \
--             truckbites_truck_db < scripts/seed-reviews.sql
-- ============================================================================

-- ── Biryani Wheels (truck 1) ────────────────────────────────────────────────
INSERT INTO reviews (comment, created_at, customer_id, order_id, rating, truck_id) VALUES
('The chicken dum biryani was packed with flavor and the raita was fresh. A Charminar classic!', NOW(6) - INTERVAL 6 DAY, 1, 90001, 5, 1),
('Best biryani I have had on wheels. Mutton pieces were tender and the masala was spot on.', NOW(6) - INTERVAL 4 DAY, 2, 90002, 5, 1),
('Solid Hyderabadi biryani, generous portion. Irani chai to finish was a lovely touch.', NOW(6) - INTERVAL 2 DAY, 3, 90003, 4, 1);

-- ── Tandoori Tadka (truck 2) ────────────────────────────────────────────────
INSERT INTO reviews (comment, created_at, customer_id, order_id, rating, truck_id) VALUES
('Tandoori chicken was smoky and juicy, dal makhani rich and buttery. Loved it.', NOW(6) - INTERVAL 5 DAY, 4, 90004, 4, 2),
('Butter chicken with garlic naan was superb. Easily the best North Indian truck in Jubilee Hills.', NOW(6) - INTERVAL 3 DAY, 5, 90005, 5, 2);

-- ── Dosa Delight (truck 3) ──────────────────────────────────────────────────
INSERT INTO reviews (comment, created_at, customer_id, order_id, rating, truck_id) VALUES
('Crispiest masala dosa at Tank Bund. Ghee roast is a must-try!', NOW(6) - INTERVAL 7 DAY, 6, 90006, 5, 3),
('Great filter coffee to go with a classic Mysore dosa. Quick service.', NOW(6) - INTERVAL 4 DAY, 7, 90007, 4, 3),
('Mysore dosa was spicy and delicious, medu vada fluffy. Perfect weekend breakfast.', NOW(6) - INTERVAL 1 DAY, 1, 90008, 4, 3);

-- ── Wok on Wheels (truck 6) ─────────────────────────────────────────────────
INSERT INTO reviews (comment, created_at, customer_id, order_id, rating, truck_id) VALUES
('Hakka noodles were fresh and had good wok-hei. Nice quick lunch option near Cyber Towers.', NOW(6) - INTERVAL 6 DAY, 2, 90009, 4, 6),
('Manchurian was a bit oily for my taste, but the portion size was generous.', NOW(6) - INTERVAL 3 DAY, 3, 90010, 3, 6),
('Schezwan noodles had proper heat. Would come back for the spring rolls.', NOW(6) - INTERVAL 1 DAY, 4, 90011, 4, 6);

-- ── Ramen Rush (truck 9) ────────────────────────────────────────────────────
INSERT INTO reviews (comment, created_at, customer_id, order_id, rating, truck_id) VALUES
('Tonkotsu broth was rich and creamy, noodles perfectly chewy. As good as any ramen bar.', NOW(6) - INTERVAL 5 DAY, 5, 90012, 5, 9),
('Best ramen in Knowledge City. The chashu melts in your mouth.', NOW(6) - INTERVAL 3 DAY, 6, 90013, 5, 9),
('Gyoza and karaage combo was perfect for a cold evening. Highly recommend.', NOW(6) - INTERVAL 2 DAY, 7, 90014, 5, 9),
('Veg ramen was light but tasty, great broth depth. Matcha latte was a nice end.', NOW(6) - INTERVAL 1 DAY, 11, 90015, 4, 9);

-- ── Sushi Station (truck 10) ────────────────────────────────────────────────
INSERT INTO reviews (comment, created_at, customer_id, order_id, rating, truck_id) VALUES
('Salmon sushi was buttery fresh. Impressed they kept it this fresh on a truck!', NOW(6) - INTERVAL 4 DAY, 1, 90016, 5, 10),
('California roll was great, tempura roll crunchy. A little pricey but worth it.', NOW(6) - INTERVAL 2 DAY, 2, 90017, 4, 10);

-- ── Seoul BBQ (truck 11) ────────────────────────────────────────────────────
INSERT INTO reviews (comment, created_at, customer_id, order_id, rating, truck_id) VALUES
('Korean fried chicken was crunchy and well sauced. Bibimbap was wholesome too.', NOW(6) - INTERVAL 5 DAY, 3, 90018, 4, 11),
('Tteokbokki was spicy and comforting, just like back home. Good bubble tea as well.', NOW(6) - INTERVAL 2 DAY, 4, 90019, 4, 11);

-- ── Pizza Perfetta (truck 15) ───────────────────────────────────────────────
INSERT INTO reviews (comment, created_at, customer_id, order_id, rating, truck_id) VALUES
('Wood-fired margherita was outstanding — blistered crust, fresh basil. Chef''s kiss!', NOW(6) - INTERVAL 6 DAY, 5, 90020, 5, 15),
('Pepperoni pizza had the perfect crispy-yet-soft crust. Best pizza truck in Banjara Hills.', NOW(6) - INTERVAL 3 DAY, 6, 90021, 5, 15);

-- ── Burger Bay (truck 17) ───────────────────────────────────────────────────
INSERT INTO reviews (comment, created_at, customer_id, order_id, rating, truck_id) VALUES
('Double smash burger was juicy with a great char. Fries were loaded with cheese.', NOW(6) - INTERVAL 5 DAY, 7, 90022, 4, 17),
('Loaded fries portion was huge. Onion rings crispy. Solid late-night spot in HITEC.', NOW(6) - INTERVAL 2 DAY, 11, 90023, 4, 17),
('Crispy chicken burger is my new favourite. Crunchy, saucy, satisfying.', NOW(6) - INTERVAL 1 DAY, 1, 90024, 5, 17);

-- ── Waffle House Express (truck 20) ─────────────────────────────────────────
INSERT INTO reviews (comment, created_at, customer_id, order_id, rating, truck_id) VALUES
('Nutella waffle was heaven — crisp outside, fluffy inside. Hot chocolate was rich.', NOW(6) - INTERVAL 4 DAY, 2, 90025, 5, 20),
('Belgian waffle with strawberry topping and a thick milkshake. Best dessert at Necklace Road.', NOW(6) - INTERVAL 2 DAY, 3, 90026, 5, 20);

-- ── Recompute cached average ratings (same logic as ReviewService) ──────────
UPDATE trucks t
SET t.average_rating = COALESCE(
    (SELECT ROUND(AVG(r.rating), 1) FROM reviews r WHERE r.truck_id = t.id),
    0.0
);
