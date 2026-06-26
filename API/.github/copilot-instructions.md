# Copilot Instructions

## Project Guidelines
- In this repository, when the user narrows scope to mediator command creation only, avoid starting an upgrade workflow and focus only on the requested command files.

## Development Process
- Brainstorm and confirm understanding before adding new feature code, especially for larger integrations like payment gateways. For larger integrations, port the architecture pattern from the reference repo and ensure understanding before implementation.
- For payment in MalakaBooks, IncomingPayment mirrors MardikaPortfolio: header + detail + payment mean; DOKU is triggered from UI, backend handles notifications and may support manual re-check by re-invoking notification processing. IncomingPayment is created only after successful DOKU confirmation; each IncomingPayment has one detail per OrderId; DOKU correlation uses OrderId passed as the reference; payment mean can be omitted for now because only QRIS is used and the method can live on the payment header.
- In MalakaBooks, for order creation, do not send an embedded OrderUserRequest payload; use UserId in the request and load the user object from persistence when creating the order.
- In MalakaBooks, most shipment/logistics fields are chosen by the customer during order creation, so shipping fare is included in the final total; these shipping inputs should be preserved with the order for later Simasrim processing. The customer-selected Simasrim shipment snapshot should also be persisted with the order and exposed in OrderResponse so customers can review the shipment details later.
- In MalakaBooks, CreateOrderHandler should only create the order and initiate payment; unpaid orders expire, payment success is confirmed by DOKU recheck/notification, and Simasrim processing happens later in CMS/Admin after payment is confirmed and goods are ready to be sent.
- In MalakaBooks, the order expiration timeout should be configurable via appsettings rather than hardcoded.
- Use optional Mongo ObjectId-backed references as nullable strings with null defaults instead of empty strings.
- In MalakaBooks, Simasrim create-resi must be triggered from the Admin/CMS fulfillment flow and be safely re-triggerable to recover from connection loss, similar to DOKU status recheck.
- In MalakaBooks, keep fulfillment statuses simplified for now: pending_payment, ready_to_ship, shipped, expired, and cancelled; do not add detailed processing/delivered steps yet, and add a Simasrim reconcile/recheck flow.
- In MalakaBooks order creation, Simasrim shipment data should be built by the API: Courier maps from ShippingCourier; pickup fields come from HomeAddress; sender fields come from the current user's Address; ItemWeight is hardcoded to 1; Volume to '10x10x10'; ItemCategory to 'buku'; ReceiverNote to 'tolong video unboxing'; BPIK is null; long/lat and postal codes come from the respective address entities.
- Prefer strongly typed Simasrim response models over JObject when the API contract is known.
- Continue implementation through the approved plan without waiting for additional prompts or check-ins between steps.
