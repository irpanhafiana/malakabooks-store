# MalakaBooks Business Process

## 1. Overview
MalakaBooks currently supports these main business flows:
- customer order creation
- DOKU payment initiation and confirmation
- automatic unpaid order expiration
- admin shipment creation and shipment reconciliation through Simasrim
- automatic AWB delivery synchronization
- customer review submission after delivery
- customer complaint submission
- admin promotion banner management and public banner display

## 2. Main Actors
- Customer
- Admin / CMS
- DOKU payment gateway
- Simasrim shipment service
- Background services

## 3. Order Lifecycle
### 3.1 Customer creates an order
Customer submits an order with:
- `UserId`
- delivery address
- selected payment method
- order items
- shipping selection
- optional insurance
- note

System behavior:
1. Load the customer profile from persistence using `UserId`.
2. Validate that the shipping address belongs to the same customer.
3. Load the configured home address used for pickup / sender logistics data.
4. Load the selected payment method.
5. Build the shipment snapshot from the order request and address data.
6. If insurance is requested, recalculate insurance using Simasrim and reject the order when the submitted insurance value is no longer valid.
7. Create the order with:
   - `Status = pending_payment`
   - `PaymentStatus = unpaid`
   - `PaymentGateway = DOKU`
   - expiration time from app settings
8. Call DOKU to generate the payment URL.
9. Save the payment URL and the shipment snapshot into the order.
10. Return the created `OrderId` and payment URL to the customer.

### 3.2 Order status after creation
Initial order state:
- `Status = pending_payment`
- `PaymentStatus = unpaid`

## 4. Payment Process
### 4.1 Payment initiation
After order creation, the customer is redirected or guided to the DOKU payment URL.

### 4.2 Payment confirmation
Payment can be confirmed in two ways:
- DOKU notification flow
- customer manual recheck through `customer/incomingpayments/DOKU/CheckStatus`

### 4.3 Payment processing result
When DOKU confirms a successful payment:
1. System validates the order exists.
2. System normalizes the gateway transaction status.
3. If the order is already expired and still unpaid, the order becomes expired.
4. If payment was already processed before, the system reuses the existing incoming payment record and synchronizes the order if needed.
5. If payment is new, the system creates one `IncomingPayment` record with one detail row for the order.
6. Order is updated to:
   - `Status = ready_to_ship`
   - `PaymentStatus = paid`
   - `ExpiresAt = null`
   - `PaidAt = payment timestamp`
   - `IncomingPaymentId = created incoming payment`

### 4.4 Incoming payment rules
- incoming payment is created only after successful DOKU confirmation
- DOKU correlation uses `OrderId` as reference number
- payment gateway is stored as `DOKU`
- payment method defaults to `QRIS` if not explicitly supplied by the gateway payload

## 5. Automatic Unpaid Order Expiration
A background service periodically checks unpaid orders.

Behavior:
- interval is configurable in app settings
- startup delay is configurable in app settings
- orders whose expiration time has passed and are still unpaid become:
  - `Status = expired`
  - `PaymentStatus = expired`
  - `ExpiresAt = null`

Purpose:
- prevent old unpaid orders from remaining active indefinitely

## 6. Fulfillment and Shipment Process
### 6.1 Admin shipment creation
Only admin / CMS should trigger shipment creation.

Prerequisite:
- order payment must already be confirmed
- operationally the order should be in `ready_to_ship`

Admin capabilities:
- create shipment for one order
- create shipment for multiple orders
- recheck shipment state for one order
- recheck shipment state for multiple orders
- cancel shipment
- query shipment detail by courier and AWB

### 6.2 Shipment creation result
When shipment creation succeeds:
- AWB / resi is stored on the order
- order becomes shipped in fulfillment flow
- shipment metadata is stored for reconciliation and retry purposes

### 6.3 Shipment recheck and reconciliation
Admin can manually recheck shipment status or attempt to recover missing AWB synchronization.

Purpose:
- recover from connection issues
- synchronize local order state with Simasrim
- support safe retrigger behavior in fulfillment operations

## 7. Automatic Delivered Synchronization
A second background service periodically checks shipped orders that already have an AWB.

Behavior:
1. Find orders where:
   - `Status = shipped`
   - `AWBNo` is present
2. Call the same Simasrim detail-resi flow using the stored courier and AWB.
3. If Simasrim returns `response.data.status = delivered`, update the order to:
   - `Status = delivered`

Purpose:
- keep customer delivery state synchronized automatically
- enable post-delivery activities such as reviews

## 8. Order Status Summary
Current implemented order statuses in practice:
- `pending_payment`
- `ready_to_ship`
- `shipped`
- `delivered`
- `expired`
- `cancelled`

Payment statuses:
- `unpaid`
- `paid`
- `expired`

## 9. Customer Review Process
### 9.1 Review submission
Customer can create a review from `customer/reviews`.

### 9.2 Review eligibility rules
Review is allowed only when all conditions are true:
- order exists
- order belongs to the same customer
- order status is `delivered`
- reviewed book exists in that order items
- no previous review exists for the same `user + order + book`

### 9.3 Review data
Review currently stores:
- `UserId`
- `BookId`
- `OrderId`
- `Rating`
- `Comment`
- `AdditionalImages`
- `CreatedAt`

Business meaning:
- only customers who have received the item can review it
- one delivered purchase item can only be reviewed once per order context

## 10. Customer Complaint Process
### 10.1 Complaint submission
Customer can submit a complaint from `customer/complaints`.

### 10.2 Complaint data
Complaint currently stores:
- `UserId`
- `OrderId`
- `Subject`
- `Description`
- `Status`
- `AdminResponse`
- `AdditionalImages`
- `CreatedAt`
- `UpdatedAt`

Business meaning:
- complaint acts as a post-order issue channel
- image attachments can be used as supporting evidence

## 11. Promotion Banner Process
### 11.1 Admin management
Admin can manage promotion banners through admin endpoints.

Supported actions:
- create banner
- update banner
- delete banner

Banner fields:
- `Title`
- `Subtitle`
- `ImageBase64`
- `TargetUrl`
- `ButtonText`
- `TargetType`
- `IsActive`
- `DisplayOrder`
- `StartAt`
- `EndAt`
- `CreatedAt`
- `UpdatedAt`

### 11.2 Public banner read
Public users can read promotion banners from the public endpoint.

Public visibility rules:
- banner must be active
- `StartAt` is null or already started
- `EndAt` is null or not expired yet
- banners are ordered by `DisplayOrder`, then newest creation time

Business meaning:
- banner scheduling and activation can be controlled by admin without code changes
- only banners currently eligible for display are returned to storefront clients

## 12. Responsibilities by Actor
### Customer
- create order
- pay through DOKU
- manually recheck payment if needed
- view own orders
- create review after delivery
- submit complaint

### Admin / CMS
- monitor orders
- update order status when needed
- create and manage shipment AWB
- recheck or cancel shipment
- manage promotion banners

### Background Services
- expire unpaid orders automatically
- synchronize shipped orders to delivered automatically based on AWB tracking

### External Services
- DOKU: payment session and payment confirmation source
- Simasrim: insurance calculation, shipment creation, shipment recheck, and shipment tracking source

## 13. High-Level End-to-End Scenario
1. Customer creates order.
2. System stores order as `pending_payment` and returns DOKU payment URL.
3. Customer completes payment in DOKU.
4. System receives payment confirmation or customer triggers payment recheck.
5. System creates incoming payment and moves order to `ready_to_ship`.
6. Admin prepares goods and creates shipment in Simasrim.
7. Order becomes `shipped` with AWB.
8. Background service checks shipment tracking periodically.
9. When carrier reports delivered, order becomes `delivered`.
10. Customer can now submit a review and can also submit a complaint if needed.

## 14. Notes
- This document reflects the currently implemented backend behavior.
- Status names and transitions should be kept aligned with API and background-service implementation.
- If the business flow changes later, this document should be updated together with the related handlers, controllers, and validators.
