# Copilot Instructions

## Project Guidelines
- In this repository, when the user narrows scope to mediator command creation only, avoid starting an upgrade workflow and focus only on the requested command files.

## Development Process
- Brainstorm and confirm understanding before adding new feature code, especially for larger integrations like payment gateways. For larger integrations, port the architecture pattern from the reference repo and ensure understanding before implementation.
- For payment in MalakaBooks, IncomingPayment mirrors MardikaPortfolio: header + detail + payment mean; DOKU is triggered from UI, backend handles notifications and may support manual re-check by re-invoking notification processing. IncomingPayment is created only after successful DOKU confirmation; each IncomingPayment has one detail per OrderId; DOKU correlation uses OrderId passed as the reference; payment mean can be omitted for now because only QRIS is used and the method can live on the payment header.
- Use optional Mongo ObjectId-backed references as nullable strings with null defaults instead of empty strings.
