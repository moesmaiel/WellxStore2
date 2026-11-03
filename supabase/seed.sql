-- Demo catalog. Every fulfillment type is represented so all four customer
-- journeys can be walked immediately after a fresh boot.

insert into categories (id, name, slug, parent_id, sort_order) values
  ('11111111-0000-4000-8000-000000000001','Devices','devices',null,1),
  ('11111111-0000-4000-8000-000000000002','Nutrition','nutrition',null,2),
  ('11111111-0000-4000-8000-000000000003','Gyms','gyms',null,3),
  ('11111111-0000-4000-8000-000000000004','Health Testing','health-testing',null,4),
  ('11111111-0000-4000-8000-000000000005','Insurance','insurance',null,5),
  ('11111111-0000-4000-8000-000000000006','Supplements','supplements',null,6)
on conflict (slug) do nothing;

insert into categories (id, name, slug, parent_id, sort_order) values
  ('22222222-0000-4000-8000-000000000001','Fitness Trackers','fitness-trackers','11111111-0000-4000-8000-000000000001',1),
  ('22222222-0000-4000-8000-000000000002','Vagus Nerve Stimulator','vagus-nerve-stimulator','11111111-0000-4000-8000-000000000001',2),
  ('22222222-0000-4000-8000-000000000003','Recovery','recovery','11111111-0000-4000-8000-000000000001',3),
  ('22222222-0000-4000-8000-000000000004','Meal Plans','meal-plans','11111111-0000-4000-8000-000000000002',1),
  ('22222222-0000-4000-8000-000000000005','Memberships','memberships','11111111-0000-4000-8000-000000000003',1),
  ('22222222-0000-4000-8000-000000000006','Blood Panels','blood-panels','11111111-0000-4000-8000-000000000004',1),
  ('22222222-0000-4000-8000-000000000007','Health Cover','health-cover','11111111-0000-4000-8000-000000000005',1),
  ('22222222-0000-4000-8000-000000000008','Daily Essentials','daily-essentials','11111111-0000-4000-8000-000000000006',1)
on conflict (slug) do nothing;

insert into brands (id, name, slug, logo_url, website_url, is_active, sort_order) values
  ('33333333-0000-4000-8000-000000000001','Whoop','whoop',null,'https://www.whoop.com',true,1),
  ('33333333-0000-4000-8000-000000000002','Pulsetto','pulsetto',null,'https://pulsetto.tech',true,2),
  ('33333333-0000-4000-8000-000000000003','Oura','oura',null,'https://ouraring.com',true,3),
  ('33333333-0000-4000-8000-000000000004','FitFuel','fitfuel',null,'https://example.com/fitfuel',true,4),
  ('33333333-0000-4000-8000-000000000005','Core Collective','core-collective',null,'https://example.com/core',true,5),
  ('33333333-0000-4000-8000-000000000006','Valeo Health','valeo-health',null,'https://example.com/valeo',true,6),
  ('33333333-0000-4000-8000-000000000007','Sukoon Insurance','sukoon',null,'https://example.com/sukoon',false,7)
on conflict (slug) do nothing;

-- Own inventory — Wellx holds stock and ships.
insert into products (name, slug, tagline, description, brand_id, category_id, subcategory_id,
  regular_price, wellx_price, currency, commission, fulfillment_type, images, badges, stock_qty, sort_order)
values
  ('Whoop One','whoop-one','24/7 strain, recovery and sleep coaching',
   'The Whoop One band tracks strain, recovery and sleep continuously, with no screen to distract you. Includes the SuperKnit band and wireless charger. Membership billed separately by Whoop.',
   '33333333-0000-4000-8000-000000000001','11111111-0000-4000-8000-000000000001','22222222-0000-4000-8000-000000000001',
   1200.00, 960.00, 'AED', 120.00, 'own_inventory', '{}', '{In stock,New}', 25, 1),
  ('Oura Ring Gen 4','oura-ring-gen-4','Sleep and readiness in a titanium ring',
   'Continuous temperature, heart rate and sleep staging from a ring you forget you are wearing. Sizing kit shipped first.',
   '33333333-0000-4000-8000-000000000003','11111111-0000-4000-8000-000000000001','22222222-0000-4000-8000-000000000001',
   1550.00, 1290.00, 'AED', 155.00, 'own_inventory', '{}', '{In stock}', 12, 2),
  ('Pulsetto Vagus Nerve Stimulator','pulsetto-vagus','Four minutes a day to downshift your nervous system',
   'A wearable neck device that stimulates the vagus nerve to reduce stress and improve sleep quality. App-guided sessions.',
   '33333333-0000-4000-8000-000000000002','11111111-0000-4000-8000-000000000001','22222222-0000-4000-8000-000000000002',
   1100.00, 825.00, 'AED', 137.50, 'own_inventory', '{}', '{New}', 8, 3);

-- Access code — admin emails a code after purchase.
insert into products (name, slug, tagline, description, brand_id, category_id, subcategory_id,
  regular_price, wellx_price, currency, commission, fulfillment_type, images, badges, sort_order)
values
  ('Core Collective — 10 Class Pass','core-collective-10-class','Ten classes across all Dubai studios',
   'Redeemable at any Core Collective location. Your access code is emailed after purchase and activates on first use. Valid 6 months.',
   '33333333-0000-4000-8000-000000000005','11111111-0000-4000-8000-000000000003','22222222-0000-4000-8000-000000000005',
   1000.00, 700.00, 'AED', 210.00, 'access_code', '{}', '{New}', 4),
  ('Sukoon Wellness Cover — 12 Months','sukoon-wellness-cover','Outpatient and wellness cover for individuals',
   'Twelve months of outpatient cover including annual screening. Your policy activation code arrives by email; the Sukoon team completes onboarding.',
   '33333333-0000-4000-8000-000000000007','11111111-0000-4000-8000-000000000005','22222222-0000-4000-8000-000000000007',
   4800.00, 3960.00, 'AED', 480.00, 'access_code', '{}', '{}', 5);

-- Drop shipping — the order is emailed to the vendor for fulfillment.
insert into products (name, slug, tagline, description, brand_id, category_id, subcategory_id,
  regular_price, wellx_price, currency, commission, fulfillment_type, vendor_email, images, badges, sort_order)
values
  ('FitFuel 7-Day Meal Plan','fitfuel-7-day-meal-plan','Chef-prepared macros, delivered daily',
   'Seven days of calorie- and macro-matched meals prepared fresh and delivered each morning. Choose your plan when FitFuel contacts you to schedule.',
   '33333333-0000-4000-8000-000000000004','11111111-0000-4000-8000-000000000002','22222222-0000-4000-8000-000000000004',
   1400.00, 1120.00, 'AED', 168.00, 'drop_shipping', 'orders@fitfuel.example.com', '{}', '{In stock}', 6),
  ('Valeo Advanced Blood Panel','valeo-advanced-blood-panel','80+ biomarkers, at-home collection',
   'A nurse visits you to draw the sample; results land in the Valeo app within 48 hours with a clinician review call included.',
   '33333333-0000-4000-8000-000000000006','11111111-0000-4000-8000-000000000004','22222222-0000-4000-8000-000000000006',
   1800.00, 1260.00, 'AED', 252.00, 'drop_shipping', 'bookings@valeohealth.example.com', '{}', '{New}', 7);

-- Affiliate — no cart. Customer copies a code and buys on the partner site.
insert into products (name, slug, tagline, description, brand_id, category_id, subcategory_id,
  regular_price, wellx_price, currency, commission, fulfillment_type, affiliate_code, affiliate_url, images, badges, sort_order)
values
  ('Whoop 12-Month Membership','whoop-12-month-membership','A year of Whoop coaching at member pricing',
   'Use your Wellx code at checkout on whoop.com for 20% off a 12-month membership. Purchase completes on Whoop''s site.',
   '33333333-0000-4000-8000-000000000001','11111111-0000-4000-8000-000000000001','22222222-0000-4000-8000-000000000003',
   1080.00, 864.00, 'AED', 108.00, 'affiliate', 'WELLX20', 'https://www.whoop.com/membership', '{}', '{}', 8),
  ('Oura Membership — 6 Months','oura-membership-6-months','Half a year of Oura insights, discounted',
   'Copy your Wellx code and redeem it in the Oura app or on ouraring.com. Applies to new memberships only.',
   '33333333-0000-4000-8000-000000000003','11111111-0000-4000-8000-000000000001','22222222-0000-4000-8000-000000000003',
   400.00, 300.00, 'AED', 45.00, 'affiliate', 'WELLXOURA25', 'https://ouraring.com/membership', '{}', '{New}', 9);
