# Client Information: Urlaub auf Madagaskar

## Company Overview
- **Company Name:** Urlaub auf Madagaskar
- **CEO / Contact:** Herr Klaus Konnerth
- **Location:** Villa Sibylle, Antananarivo, Madagascar
- **Contact Info:** Tel: +261 33 12 048 92, Email: kontakt@urlaub-auf-madagaskar.com, Website: https://www.urlaub-auf-madagaskar.com/
- **Core Business:** Organizing private, customized tours (e.g., honeymoons, nature tours, photography trips, off-road and motorcycle tours) in Madagascar, featuring German and English-speaking guides.

## Current Pain Points
- High reliance on manual copy-pasting across Excel and Word documents for each trip.
- Prone to human error (e.g., a driver missed a trip because manual instructions were forgotten).
- The CEO is tired of the outdated MS Office (Word/Excel) workflow and wants a modernized, digitalized administration system.
- Lack of centralized tracking for reservations, invoices, and driver instructions.

## Current Workflow (Manual)
As described by Herr Klaus in the WhatsApp discussion:

- **Phase 1 (Inquiry):** Receives a message/inquiry from a client via email.
- **Phase 2 (Clarification):** Replies to the client to gather more details about the requested trip before making a proposal.
- **Phase 3 (Proposal):** Sends an itinerary and pricing list (currently using Word/Excel). *Goal: The system should ideally auto-generate an explanatory description based on the itinerary.*
- **Phase 4 (Booking & Preparation):** 
  - If the client agrees, creates a modified copy of the itinerary adapted for the driver (removing pricing, adding logistical locations).
  - Copy/pastes hotel reservation details and sends them via email.
  - Generates an invoice for the client.
- **Phase 5 (Accounting Tracking):**
  - Files hotel invoices as they arrive.
  - Tracks client payments (advances and full payments).
- **Phase 6 (Finalizing Dossier):**
  - Prepares the physical/digital dossier for the trip.
  - Generates Vouchers ("Bon d'échange") for each hotel.
  - Notes the driver's expense budget (Fuel, Vehicle Rental, Driver's accommodation).
  - Follows up on any missing/pending invoices.

## Core Data Entities Identified
Based on the provided PDFs and documents:

1. **Trips / Tours:** Duration, Guest Type (e.g., Honeymoon), Total Price, Flights Details (Arrival/Departure), Inclusions / Exclusions.
2. **Clients:** Name, Number of Pax (Adults/Children).
3. **Daily Itinerary:** Date, Daily Activities, Hotel assigned, Driver assigned, Location details.
4. **Hotels:** Name, Booking Dates, Room Types (Double, Twin, Triple, Family), Meal Plans (e.g., Bed & Breakfast).
5. **Staff (Drivers/Guides):** Names (e.g., Aina).
6. **Documents Generated:**
   - *Reiseplanung:* Client Itinerary with prices.
   - *Planung für [Fahrer]:* Driver Itinerary with logistics.
   - *Reservierungen:* Email requests for hotel bookings.
   - *Bon d'échange:* Official hotel voucher.
