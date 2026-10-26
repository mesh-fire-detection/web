# Satellite Receiver

Status: first version implemented. Automated checks cover the page logic and
components; connection to the physical satellite receiver still needs a USB and
Bluetooth smoke test.

## Purpose

Connect to the RAK4631 satellite receiver locally, inspect LoRa reception and
station state, manage receiver modes, and provide the time, location, and TLEs
needed for pass tracking. The page does not send observations to the backend.

## Connection and compatibility

- Route: `/satellite`.
- Supports Web Bluetooth Nordic UART Service and Web Serial.
- firmware-satellite 0.0.1 or newer enables mode and tracking controls. Older firmware can
  still show compatible packet and record data.
- On connect, synchronize wall-clock time and request status. When station
  inventory arrives, send a newer saved location/TLE when needed, then request
  history, profiles, statistics, and passes.
- USB and Bluetooth carry newline-delimited JSON records and command strings.
  The page does not pair devices or send radio payloads.

## Receiver controls

- Show the requested and active modes, selected profile and transition reason.
- Support `auto`, `fixed`, Profile Scan, and Range Scan. Fixed mode selects a
  profile. Range Scan accepts frequency bounds, BW, SF, CAD-symbol count and RX
  timeout, and shows the estimated combinations and cycle time before start.
- Manual modes suspend automatic pass selection until the user returns to
  `auto`.
- Tracking controls set minimum elevation and toggle Doppler correction. The
  station reports saved values in typed records and status.
- When `tx_build` is true, show that the compile-time TX flag is enabled and
  that the current station remains receive-only without an approved profile.

## Pass tracking inputs

- Show whether the station clock is synchronized for this boot.
- Let users edit coordinates or request browser geolocation. Keep coordinates
  in local storage and send them to the receiver only when connected.
- Fetch amateur satellite TLEs from CelesTrak or load a TLE file, keep parsed
  elements in local storage, and send newer entries for satellites in the
  receiver's catalogue. The firmware validates checksums and stores TLEs in
  flash.
- Show station TLE epoch and age, missing or stale state, calculation status,
  and pass events with AOS/TCA/LOS, maximum elevation, and TLE age.
- A receiver without time, location, or usable TLEs runs Profile Scan in `auto`.

## Observation log

- Show the current station summary, decoded packet cards, and all received
  records. New live packets are highlighted and play a short tone.
- During or after a Range Scan in the current page session, aggregate live CAD
  and packet events by frequency/BW/SF. Sort by decoded packets, CAD hits, then
  best RSSI. These CAD aggregates are not persisted in station flash.
- Keep `CAD detected`, `Packet decoded`, and `Satellite identified` distinct.
  This firmware has no mission payload decoder; valid LoRa reception alone
  never names a satellite.
- Packet cards include profile/mode and radio metrics. Show predicted Doppler
  when the firmware supplies `df_pred`.
- Support replaying station history, clearing the page view, and downloading
  JSONL. The station's bounded flash history is the only persistent packet
  history; the browser stores only local station coordinates and TLEs.

## Limitations

- A single SX1262 listens to one channel at a time; CAD is not a wideband
  spectrum display.
- `Satellite identified` remains unconfirmed until a mission-specific payload
  decoder exists.
- CelesTrak does not provide every cataloged satellite. Users can load a file
  produced by `firmware-satellite/tools/catalog.py tle` for the remaining
  spacecraft.
- Hardware RF performance, pass timing, and Doppler sign require physical
  receiver validation.
