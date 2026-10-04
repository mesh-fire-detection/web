# Nearby Devices

Status: first version implemented at `/devices/nearby`. Protocol, session, and
page behavior are covered by automated tests. The open browser page showed a
connected RAK4631 with environmental and device telemetry during verification
on October 3, 2026. Saved device restoration and reconnection of the last active
node on page load are implemented. Simultaneous connections remain deferred.

## Purpose

Give builders a local workspace for checking assembled Mesh Fire Detection nodes
before deployment. A builder should be able to connect a powered node, identify
it, see actual sensor readings, and tell whether new packets are arriving.

The initial hardware target is RAK4631 / nRF52840 running our Meshtastic-based
firmware. Other boards require separate compatibility checks.

## Page placement and copy

- Page title: **Nearby Devices**.
- Proposed route: `/devices/nearby`.
- Entry point: a **Nearby Devices** link in the Build page and the footer's Build
  section. Keep the current main navigation intact.
- Intro: **Connect your nodes over Bluetooth to check their identity, settings,
  and sensor readings before deployment.**
- Primary action: **Add device**.
- Helper text: **Choose each device in your browser's Bluetooth dialog. Only
  devices you add appear here.**

Use the site's existing typography, colors, spacing, and interaction primitives.
Keep the device list visible beside the details on desktop; use a list followed
by a device details view on narrow screens.
Show a details panel only after a device is selected. Once any device is added,
the list keeps its sidebar width so selecting or connecting a device does not
resize it; only the empty state uses the full width. Status text sits on its own
line and status messages stay short, so connection progress does not reflow cards. Omit both the details placeholder and a separate
"No active connection" card when saved devices are present.

## First version

The first version supports adding several devices to the current session and
inspecting one active Bluetooth connection at a time. Previously inspected
devices keep their last observed values with timestamps and a disconnected
label. Switching the active device disconnects the previous one explicitly.

The intended next milestone is simultaneous monitoring of several individually
authorized nodes. Enable this only after testing connection limits and stability
with the actual computer, Bluetooth adapter, browser, and firmware. A list of
added devices must never imply that all of them are currently connected.

The page is available without a project account: browser authorization controls
access to local hardware. It does not call authenticated backend endpoints or
send local observations to the server in the first version.

Included:

- Add a device through the browser's Bluetooth chooser.
- Connect, disconnect, reconnect, and remove a device from the page.
- Read identity and supported non-secret configuration.
- Receive device metrics and sensor telemetry through the Meshtastic client API.
- Inspect a timestamped activity list and packets received from mesh peers.
- Keep connection state and data age visible when readings stop arriving.

Later additions:

- Multiple active connections, after hardware validation.
- Explicit requests for fresh telemetry, after verifying protocol support and
  radio behavior. Do not poll aggressively or change reporting intervals.
- Editing names, deployment roles, telemetry intervals, and other configuration.
- Private-channel provisioning and admin-only backend registration.
- Authenticated comparison with readings received by our backend.
- Firmware installation on a separate page.

## Connection flow

1. Open the page. Show the empty state or the current session's device list.
2. Check for a secure context and the required Web Bluetooth API. If unavailable,
   show setup guidance and disable the connection action.
3. Click **Add device**. Open the browser chooser for compatible Meshtastic devices.
4. Select one device and complete system pairing if requested. The website does
   not collect or save the pairing PIN.
5. Establish the Bluetooth connection, initialize the Meshtastic session, and
   read the local node identity before attributing telemetry to it.
6. Show details as they become available. Connection initialization and waiting
   for the first telemetry packet are separate states.
7. Update readings when valid packets arrive. No page reload is required.
8. On a disconnect, retain the last values, stop indicating live reception, and
   offer **Reconnect**.

Canceling the chooser leaves the page unchanged. Repeated selection of the same
device focuses its existing entry instead of creating a duplicate. Use the
browser device identifier for the connection and the reported Meshtastic node
number for packet attribution; a display name is not a unique identity.

Observations stay in memory for the current page session. Reloading clears
readings, configuration, peers, and activity. Store only the browser device ID,
Bluetooth name, last reported node name and node number, plus the last
successfully connected device ID and successful connection timestamp, in local browser storage.

On page load, restore saved entries and retrieve previously allowed devices
through `Bluetooth.getDevices()` when supported. These permissions do not prove
that a device is powered on or reachable. Attempt to connect only the saved last
active device, using the normal 30-second connection and initialization timeout.
Read identity and readings again; never restore an old connected status. The
latest local reading per metric and the battery-voltage history are kept in
`localStorage` and shown again with their original receipt age. Other saved devices are not probed automatically.

After reload or unexpected connection loss, keep a recently connected device in
its original position above **Previously added** for ten minutes from the last
successful connection. Restore its selected details panel on reload, with the
saved readings. Use muted gray styling and **Recently connected**, never a live green
**Connected** status. Show **Reconnect** on the card. A reload or failed attempt
does not extend the deadline; successful reconnection starts a new ten-minute
window. Manual disconnect clears this retention. Expiry moves the disconnected
entry into **Previously added** without deleting its saved identity. Legacy saved
entries without a connection timestamp are not treated as recent; timestamps in
the future are not treated as recent either. Connected devices remain visible
while their connection is active, regardless of the ten-minute window.

Keep other disconnected entries in a collapsed **Previously added** section with
**Reconnect** and **Remove from list** actions; selecting the card shows its details. An unsuccessful
attempt leaves the entry saved: the device may be temporarily unavailable or
connected to another app. If `getDevices()` is unsupported, fails, or no longer
returns the saved device, **Reconnect** opens the chooser. Do not open a chooser
automatically. Bound the initial allowed-device lookup to five seconds. Browser
storage errors must leave manual connection usable.
If automatic restoration is unsupported or allowed-device lookup fails, expand
**Previously added** by default so manual reconnection is immediately accessible.
The user can still collapse it. Do not promise automatic reconnection in generic
page copy: manual Web Bluetooth support does not imply support for `getDevices()`.
The [Web Bluetooth implementation status](https://github.com/whatwg/bluetooth/blob/main/implementation-status.md)
lists `getDevices()` and persistent permissions behind experimental Chrome flags.
The observed browser reported restoration unsupported after reload on October 3, 2026. Automatic reconnection is therefore still unverified on actual hardware;
its supported-API path is tested with mocked transports.

Explicit **Disconnect** clears the automatic-reconnection preference while
keeping the entry. Unexpected loss retains it for the next page load; no
continuous retry runs in the background. Leaving the page closes owned
connections and removes listeners while retaining saved identities.
**Remove from list** also removes the stored identity; an existing browser
permission must not make the entry reappear. Permission revocation remains a
separate browser setting.

## Page contents

### Device list

Each entry shows:

- Reported node name, falling back to the Bluetooth name and then **Unnamed device**.
- Meshtastic node ID once known, for example `!a1b2c3d4`.
- Connection state in text, with a supporting color or icon.
- Latest reported battery percentage, when available.
- Time of the last packet received from this node during this session.
- **Reconnect** or **Disconnect**, and **Remove from list** actions. Selecting
  anywhere on the card opens its details; the name is the accessible control.

Order entries by the most recent successful connection, with newly added devices
first. The saved list keeps this order across reloads.

Above the list, show counts for devices added and devices connected. Saved
disconnected devices count as added. Do not show an inferred count of all nearby
devices. Disconnected entries live in **Previously added**, collapsed by default.

### Device details

Lead with what a builder checks first and show each value once. Ages update
in place; absolute times use the viewer's local time.

| Order | Section         | Contents                                                                                          |
| ----- | --------------- | ------------------------------------------------------------------------------------------------- |
| 1     | Header          | Name, connection state, node ID, hardware, firmware, last local packet                            |
| 2     | Battery         | Percentage, voltage and age                                                                       |
| 2     | Solar charging  | Battery voltage trend: **Rising**, **Falling**, or **Stable**, with both compared voltages        |
| 2     | Signal          | Best direct LoRa link: quality, SNR, RSSI and the peer it comes from, plus channel utilization    |
| 3     | Sensor readings | Latest environmental and particle metrics with units, receipt age and device measurement time     |
| 4     | Nearest nodes   | Peers reported by the radio: direct neighbors by SNR, then relayed nodes by hop count             |
| 5     | More details    | Collapsed: short name, session connection time, reported configuration, other telemetry, activity |

The **Solar charging** tile uses the battery-voltage direction requested for
this build. It keeps a history of positive, finite, fresh local
`deviceMetrics.voltage` samples in `localStorage`: older samples at least five
minutes apart, the newest one always last, up to 48 hours. The trend compares
the newest sample with the oldest one in the last hour, rounded to the displayed
0.01 V precision, and shows the signed change (**↑ +0.04 V**, **→ ±0.00 V**),
both voltages and the time between them. Show the current voltage while waiting
for a second sample. Cached node records, peer telemetry and repeated or
out-of-order measurement timestamps are not added. The history survives
reconnection and reload. This reports a voltage trend, not solar
power in watts or a confirmed charging source. Actual power-monitor channel
readings remain in **Other reported telemetry** when available.

Above the sensor tiles, one status line per sensor module (environment, particles)
says whether it is reporting, turned off in settings, waiting, or not found. With a
browser connected, firmware sends each enabled module's reading to it about once a
minute even with LoRa transmission off, and a module with no sensor detected at
boot sends nothing; three minutes connected without a reading is shown as not
found, with a prompt to check the wiring and restart the node.

When both environmental and particle telemetry are reported disabled, say so
instead of promising sensor data will arrive. Otherwise explain that sensor
readings appear when the node sends them; connection itself does not generate a
measurement.

Signal quality uses SNR bands of at least −7 dB
(good), at least −15 dB (fair) and below (weak). Link values come only from packets
or node records heard directly over LoRa; relayed and MQTT-delivered nodes show
their hop count or **Route unknown** instead.

### Layout stability

Telemetry must not move the page. Every caption and value slot is rendered in
every state, with **—** or **Not reported** standing in for missing data. Single
values stay on one line and truncate instead of wrapping; tile notes reserve two
lines. Do not reserve space with fixed panel heights.

The node ID's last four hex digits, which Meshtastic uses as the default short
name, are shown as a tag beside the name. The firmware field marks builds of
our fork (`MFD`) by the commit in the reported version; any other version is
labelled **Meshtastic**.

Show the reported Meshtastic firmware role as its own field. The project's
deployment types (`base`, `cellular`, `sensor`, `vision`) are separate concepts;
do not infer a registered deployment type from the firmware role.

### Sensor readings

The sensors of a BOM sensor node (BME680 and PMSA003I) have fixed tiles:
temperature in °C, relative humidity in %, pressure in hPa, gas resistance in kΩ
(the firmware divides ohms by 1000, despite the protobuf comment saying MΩ), IAQ,
and PM1.0, PM2.5 and PM10 in µg/m³. Each tile shows **Not reported** until that
metric arrives, so arriving packets fill slots rather than move the layout; an
empty tile does not claim the sensor exists. Other reported sensor metrics are
appended after them. Particle tiles use Plantower's atmospheric-environment
values, which are meant for outdoor air; the factory "standard" (CF=1) values are
listed under **Other reported telemetry**.

Each sensor tile also shows its trend: the change between the newest sample and
the oldest one in the last hour, with sign and unit (**↑ +0.4 °C over 52 min**).
Samples come from the same `localStorage` history as battery voltage, kept per
metric, five minutes apart and for up to 48 hours. Until a second sample exists
the tile says the trend follows the next reading.

Tiles show a fixed clock time, **Measured** when the packet carries a valid device
time and **Received** otherwise, instead of a ticking age. When no reading has a
device time, one note says the node's clock is not set. Ages under a minute read
**just now**.

Selecting a tile (click, Enter or Space) outlines it in yellow and fills the sensor guide block below with that metric's description, sensor
range and field rules of thumb from `sensorGuide.ts`. All entries are laid out in
the same grid cell, so the block keeps the height of the longest one and never
resizes. These ranges explain readings; they are not alert thresholds.

IAQ comes from Bosch BSEC on the node. BSEC rates its calibration from 0 to 3, but
Meshtastic does not transmit that rating; the guide entry says so. Verify mappings against
the protobuf fields and firmware drivers; preserve distinctions between
standard and environmental particle measurements.

Preserve unknown numeric metrics under their protocol field names without
guessing units. Missing values display **Not reported**, never zero. Invalid
values are rejected. Do not invent sensor presence, derive AQI, or interpret
individual readings as a fire alert. BME680 IAQ, if exposed, needs its reported
calibration accuracy alongside it; if accuracy is unavailable, the sensor guide
says so.

For every reading, retain the sender node ID, browser receipt time, and device
measurement time when supplied and valid. Show **Measurement time unavailable**
when the packet provides no usable time. A cached reading returned during
initialization must not be presented as a newly taken measurement.

Treat device times before January 1, 2000 or after browser receipt as unavailable.
Meshtastic nodes without a set calendar clock can put uptime in the time field;
this must not appear as a measurement taken in 1970. Browser receipt time is
independent and remains available. Internal mesh statistics are shown separately
under **Other reported telemetry**, rather than as sensor measurements.

Device, environmental, and particle telemetry arrive independently. An incoming
battery packet must not refresh the age of a temperature or particle reading.
Our firmware currently configures 900-second telemetry intervals; delivery can
take longer because of firmware scheduling and radio airtime checks. The page
does not promise readings every second or declare a sensor faulty solely because
no packet arrives immediately.

### Activity and mesh peers

The activity list shows readable events such as **Connected**, **Device information
received**, **Environmental telemetry received**, and **Disconnected**. Packet
summaries identify both the sender and the directly connected radio.

Telemetry received through LoRa from another node belongs to that sender, never
to the Bluetooth-connected node's own sensor panel. Mesh peers appear in a
separate **Nearest nodes** section with their own battery and sensor values. The list may
contain old entries and is not evidence that those peers are reachable now or
available over Bluetooth. Display source timestamps when provided.

## State and failure behavior

| State or event                       | What the builder sees                                                                 |
| ------------------------------------ | ------------------------------------------------------------------------------------- |
| No devices added                     | **No devices added yet. Power on a node and select Add device.**                      |
| Connecting                           | **Connecting…** with actions protected against duplicate attempts                     |
| Reading identity                     | **Reading device information…**                                                       |
| Connected, no telemetry              | **Connected. Waiting for sensor data.**                                               |
| Connected, telemetry received        | Latest readings with their individual times and ages                                  |
| Disconnected                         | **Disconnected. Showing previously received data.** and **Reconnect**                 |
| Connection or initialization timeout | A bounded attempt ends with a retry action                                            |
| Pairing failed or permission denied  | Explain that browser or system pairing did not complete; offer retry                  |
| Device unavailable or busy           | Suggest checking power, distance, and another phone or app connection                 |
| Unsupported service or protocol      | Explain that this device or firmware is not supported; do not show fabricated details |
| Malformed packet                     | Ignore that packet, record a safe diagnostic summary, and keep valid readings         |
| Unsupported browser                  | Explain that Web Bluetooth is unavailable and suggest desktop Chrome                  |

Status labels must describe evidence. **Connected** means the Bluetooth session
is established. **Last packet received** describes browser receipt. **Measurement
time** describes the device's reported sample time. Avoid a generic **Online**
badge that conflates these states with the backend's network status.

Define and test connection and initialization timeouts during implementation.
After the initial automatic restoration attempt, retries are user initiated.
Clean up failed attempts so
reconnecting cannot create duplicate listeners or mix data between devices.

## Browser and privacy constraints

Production access requires HTTPS. Adding a device requires a user gesture and
the browser's device chooser; the page cannot enumerate every nearby device.
The initial verification target is desktop Chrome on macOS. Test other browser
and OS combinations before claiming support. See the
[Web Bluetooth documentation](https://developer.chrome.com/docs/capabilities/bluetooth)
and [Meshtastic web-client compatibility guidance](https://meshtastic.org/docs/software/web-client/).

Local telemetry stays in the current browser session. Do not upload it, persist
it, or send it to analytics. Remember only the limited identity fields specified
above on this browser; do not send them to the server. Display only the
configuration fields listed above. Exclude pairing PINs, channel keys, broker
credentials, private keys, and raw configuration dumps from UI, logs, and error
messages.

All controls must work with the keyboard, expose accessible names, and communicate
state changes without relying only on color. Announce connection changes without
announcing every arriving measurement.

## Implementation direction

This is a feature of the existing React site. Keep page rendering,
Bluetooth connection management, protocol decoding, and metric display mappings
separate. Use the site's established feature structure and shared UI primitives.

The implementation uses a small Web Bluetooth transport with the UUIDs defined
by our firmware. It subscribes to FromNum and drains FromRadio serially, sends a
local `wantConfigId` request, and waits for local identity and the matching
configuration-completion nonce. Connection and initialization have a combined
30-second timeout. No persistent settings or mesh packets are written.

`@meshtastic/protobufs` 2.8.0 supplies the official wire types and decoding
schemas; `@bufbuild/protobuf` supplies their runtime. These dependencies remove
the need to maintain handwritten protobuf codecs. `@types/web-bluetooth` supplies
browser API types during development. The 2.7.26 npm package has a broken type
entry point, so the implementation uses the same 2.8 schemas as our backend;
one RAK4631 running 2.7.26 was observed connected and delivering telemetry.
The full [Meshtastic Web SDK](https://github.com/meshtastic/web) is not bundled.
The page interface renders with the regular site bundle, without a separate
route-loading placeholder. Protocol decoding loads as a separate module,
preloaded in the background after the page renders. Connection setup awaits
that module within the same 30-second deadline and never opens GATT after an
attempt has been canceled. Other routes do not request the protocol module.
Dependency license notices are shipped under `/licenses/`.

Builder pages are grouped under `src/components/pages/build/`, with nearby
widgets under `build/nearby/` and corresponding copy under
`src/core/content/build/nearby/`. Transport, decoding, display mappings, and
session state live under `src/core/nearby/`.
Validated device identity storage lives in `src/core/nearby/remembered.ts`.
Initialization runs in an effect and ignores stale discovery results after page
cleanup, including React StrictMode effect replay.

Pressure labels follow the protocol's hPa field definition. Gas resistance is
shown under its raw field name without an assigned unit: the BME680 driver's
scaling and the protobuf unit comment disagree and need a separate firmware
check. Unsupported numeric metrics also retain their raw field names.

Reading local data may require Meshtastic client requests over Bluetooth; it must
not change persistent configuration. This page needs no new backend endpoint,
database table, MQTT downlink, or change to the public map contract. Existing
backend online-status thresholds and ingestion rules remain authoritative for
server data. Any later backend integration needs its own specification update.

## Acceptance criteria

- A builder can connect a real RAK4631, identify it, and receive genuine telemetry.
- Adding and switching between two devices keeps their identities and values separate.
- Battery, environmental, and particle values update independently and retain their ages.
- A missing sensor produces no fabricated readings or claim that the sensor is installed.
- Mesh peer data is clearly separated and attributed to the original sender.
- Disconnecting or powering off the active node changes its state and preserves
  previous values as historical observations.
- Canceling pairing, denied permissions, timeouts, and unsupported services leave
  the page usable and allow another attempt.
- Removing a device, switching devices, and leaving the page release connections
  and listeners without affecting another device's observations.
- Unsupported browsers receive clear guidance instead of broken controls.
- Local readings and secrets are not transmitted to the backend or analytics.
- Reload restores saved identities, reconnects only the last active allowed
  device, and starts with no previous readings or claimed connection status.
- Unavailable or unauthorized saved devices remain accessible in **Previously
  added**, with manual retry; unsupported restoration does not break pairing.
- Explicit disconnect disables automatic reconnection; removal survives reload
  even when browser permission remains granted.
- Connection actions and state changes are usable with keyboard and assistive technology.

Test state transitions, packet attribution, timestamps, validation, and cleanup
with mocked transports. Perform separate real-hardware checks for Bluetooth
pairing, disconnects, firmware compatibility, and sensor reception. Passing
mocked tests alone does not establish hardware support.

Before enabling simultaneous connections, verify at least two real nodes sending
independent telemetry and confirm that disconnecting one does not stop or corrupt
the other session. Record the tested platform and observed connection limit.

## Observed hardware check

The browser page displayed RAK4631 node `!7d258b79`, firmware `2.7.26.7d798c3`,
with environmental telemetry of approximately 27.34 °C, 39.7% relative humidity,
and 953.2 hPa, plus voltage and uptime. The device reported radio transmission
disabled. Its telemetry time was uptime rather than a set calendar time, which
motivated the timestamp validation above. This observation verifies reception
from that node; it does not establish multiple-connection support, delivery to
the backend, or hardware behavior on other platforms. Reconnection and loss
handling are covered by mocked transport tests and still need hardware checks.
