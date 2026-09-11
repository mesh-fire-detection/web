# Smoke and Air-Quality Sensors for a RAKwireless WisBlock Meshtastic Node

## Target Hardware

This document compares smoke, particulate-matter, and air-quality sensors suitable for use with:

- **RAKwireless WisBlock Base RAK19007**
- **RAKwireless Core RAK4631**
- **Meshtastic**
- **US915 LoRa**
- Target sensor budget: **up to approximately $50 per sensor**

The primary use case is a **battery- or solar-powered remote environmental node**, especially for outdoor monitoring where early detection of wildfire smoke or abnormal air-quality conditions is useful.

---

# 1. Executive Summary

For actual **smoke detection**, a particulate-matter sensor is generally more useful than a generic VOC or “air-quality” sensor.

The strongest options in this price range are:

| Sensor | Typical Price | Main Measurements | WisBlock Integration | Meshtastic Suitability | Smoke Detection |
|---|---:|---|---|---|---|
| **RAK12039 + Plantower PMSA003I** | ~$31.50 | PM1.0, PM2.5, PM10, particle count | Native WisBlock IO module | Very good | **Excellent** |
| **Sensirion SEN55** | ~$33–37 | PM1, PM2.5, PM4, PM10, VOC, NOx, temperature, humidity | External wiring | Good, but more complex | **Excellent** |
| **RAK1906 + Bosch BME680** | ~$15.20 | Temperature, humidity, pressure, gas resistance / IAQ | Native WisBlock sensor slot | Very good | Moderate |
| **RAK12047 + Sensirion SGP40** | ~$10.50 | VOC index | Native WisBlock sensor slot | Possible, depending on firmware support | Low to moderate |
| **RAK12004 + MQ-2** | ~$13 | Smoke and combustible gases | Native WisBlock IO module | Requires more custom handling | Moderate |
| **Plantower PMS5003** | ~$20–40 | PM1.0, PM2.5, PM10 | External UART | Possible, more wiring/software work | **Excellent** |

## Recommended configuration

For a WisBlock-based wildfire / smoke monitoring node, the best starting configuration is:

- **RAK12039 / PMSA003I** as the primary smoke / particulate sensor
- **RAK1906 / BME680** as a secondary environmental sensor

Approximate sensor cost:

```text
RAK12039    ~$31.50
RAK1906     ~$15.20
-------------------
Total       ~$46.70
```

This combination remains under the stated $50 sensor budget and provides two complementary types of information:

1. **Actual airborne particulate concentration**
2. **Temperature, humidity, pressure, and gas-resistance / IAQ changes**

---

# 2. Why PM2.5 Matters for Smoke Detection

Wildfire smoke contains large quantities of fine airborne particles. A large fraction of the health-relevant smoke aerosol falls into the **PM2.5** category.

A PM sensor directly measures the concentration of suspended particles rather than trying to infer smoke from gas chemistry.

A typical outdoor background may look like:

```text
PM2.5

4 µg/m³
5 µg/m³
6 µg/m³
5 µg/m³
```

A smoke event may produce a pattern more like:

```text
PM2.5

6
11
24
57
110 µg/m³
```

For an autonomous monitoring node, the **rate of change** can be as important as the absolute concentration.

For example:

```text
Normal:
5 → 6 → 5 → 7

Possible smoke event:
6 → 10 → 22 → 48 → 91
```

This makes particulate sensors particularly useful for detecting an abnormal plume moving through an area.

---

# 3. Best Overall Option: RAK12039 + Plantower PMSA003I

## Overview

The **RAK12039** is a WisBlock particulate-matter sensor module built around the **Plantower PMSA003I**.

It is particularly attractive because it is already adapted for the WisBlock ecosystem.

### Measurements

The sensor can report:

- PM1.0
- PM2.5
- PM10
- Particle number concentration for several particle-size bins

Typical particle bins include particles above approximately:

- 0.3 µm
- 0.5 µm
- 1.0 µm
- 2.5 µm
- 5.0 µm
- 10 µm

## Why it is a strong choice

The major advantages are:

- Direct measurement of airborne particulate matter
- Very relevant to smoke detection
- Native WisBlock integration
- No separate microcontroller required
- No custom 5 V regulator design required on the user side
- Compact compared with many standalone PM sensor assemblies
- Compatible with low-power duty-cycled operation

## Connection

The architecture is approximately:

```text
Plantower PMSA003I
        │
        │ sensor cable
        ▼
     RAK12039
        │
        │ WisBlock connector
        ▼
 RAK19007 IO SLOT
        │
        ▼
     RAK4631
        │
        ▼
    Meshtastic
```

The **RAK12039 uses the IO slot**, not one of the smaller standard sensor slots.

## Power

The Plantower sensing element requires a 5 V supply.

The RAK12039 includes the required power conversion, which is one of the reasons it is much easier to integrate than a bare particulate sensor.

Typical characteristics are roughly:

- Active current: tens of milliamps, potentially approaching ~100 mA depending on operating state
- Standby current: much lower
- Suitable for periodic measurements rather than continuous operation in a solar node

## Recommended operating strategy

For a battery-powered forest node, continuous PM sensing may consume unnecessarily large amounts of energy.

A better strategy is often:

```text
sleep
  ↓
wake sensor
  ↓
allow airflow / sensor stabilization
  ↓
take several measurements
  ↓
compute average + rate of change
  ↓
transmit only useful telemetry
  ↓
sleep
```

For example:

```text
Normal conditions:
Measurement every 5–15 minutes

Elevated PM2.5:
Measurement every 1–2 minutes

Rapid PM increase:
Enter alert mode
```

This adaptive strategy can dramatically reduce power consumption.

---

# 4. Most Capable Sensor: Sensirion SEN55

## Overview

The **Sensirion SEN55** is an unusually capable environmental sensor because it combines several sensing technologies in one device.

It measures:

- PM1
- PM2.5
- PM4
- PM10
- VOC index
- NOx index
- Temperature
- Relative humidity

This makes it more informative than a simple PM sensor.

## Advantages

The SEN55 can potentially distinguish environmental conditions better because a single node receives:

```text
particle concentration
+
VOC changes
+
NOx changes
+
temperature
+
humidity
```

For experimental wildfire detection, this is very attractive.

## Disadvantages

The main drawback is integration complexity.

Unlike RAK12039, the SEN55 is not a simple native WisBlock plug-in module.

It requires:

- External wiring
- I²C connection
- 5 V power
- Mechanical mounting
- Appropriate airflow
- Firmware support / configuration

The architecture would look more like:

```text
       RAK19007
          │
          ├── I²C ──────────────┐
          │                     │
          └── power system      │
                    │           │
                 5 V boost      │
                    │           │
                    ▼           ▼
                   SEN55
```

## When to choose SEN55

Choose the SEN55 if:

- You want maximum environmental information from one sensor
- A small custom wiring harness is acceptable
- You are comfortable modifying firmware if necessary
- The node has enough solar and battery capacity
- Mechanical size is not a major constraint

For a prototype research station, the SEN55 may be the most interesting sensor in this list.

For large deployments, the RAK12039 is simpler.

---

# 5. Best Secondary Sensor: RAK1906 + Bosch BME680

## Overview

The **RAK1906** uses the Bosch **BME680** environmental sensor.

It measures:

- Temperature
- Relative humidity
- Atmospheric pressure
- Gas resistance

Software can use the gas resistance, temperature, and humidity data to derive an air-quality indicator.

## Important limitation

The BME680 is **not a particulate-matter sensor**.

It cannot directly measure:

```text
PM1
PM2.5
PM10
```

Therefore it should not be treated as the primary wildfire-smoke detector.

Instead, it is useful as an independent supporting signal.

## Example sensor fusion

Suppose the PM sensor reports:

```text
PM2.5:
6 → 12 → 27 → 61 µg/m³
```

At the same time, the BME680 reports:

```text
gas resistance:
significant change

temperature:
stable

humidity:
stable
```

The system can assign a higher probability that the PM event is caused by smoke or combustion-related pollution rather than a random transient.

A conceptual algorithm could be:

```text
IF PM2.5 rises rapidly
    smoke_probability += high

IF PM10 rises but PM2.5 does not
    dust_probability += high

IF PM2.5 rises AND gas resistance changes
    smoke_probability += additional confidence
```

## WisBlock integration

The RAK1906 is extremely convenient because it plugs into a normal WisBlock sensor slot.

Example:

```text
RAK19007
   │
   ├── RAK4631
   │
   ├── RAK12039 in IO SLOT
   │
   └── RAK1906 in SENSOR SLOT
```

This is one of the cleanest configurations mechanically.

## Power

The BME680 itself is extremely low power compared with an optical PM sensor.

That makes it suitable for continuous or frequent measurements while the higher-power PM sensor remains asleep.

A useful architecture is:

```text
BME680:
measure frequently

PMSA003I:
measure periodically

If BME680 detects unusual conditions:
wake PMSA003I earlier
```

---

# 6. RAK12047 + Sensirion SGP40

## Overview

The **SGP40** is a dedicated VOC sensor.

It produces a VOC-related signal / index rather than particulate concentration.

It can detect changes caused by many volatile organic compounds.

## Advantages

- Low price
- Small
- Low power
- Native WisBlock module available
- Useful for indoor air-quality monitoring

## Limitations for wildfire detection

VOC is not specific to fire.

A VOC increase can come from:

- Smoke
- Solvents
- Fuel vapors
- Plants
- Cleaning products
- Human activity
- Plastics
- Adhesives
- Various organic emissions

Therefore:

```text
VOC increase ≠ confirmed smoke
```

For a forest node, the SGP40 is best used as a **secondary sensor**, not the primary trigger.

---

# 7. RAK12004 + MQ-2 Gas / Smoke Sensor

## Overview

The MQ-2 is a classic heated metal-oxide gas sensor.

It responds to several combustible gases and smoke-related compounds, including:

- LPG
- Propane
- Methane
- Hydrogen
- Alcohol vapor
- Smoke
- Various combustible gases

## Why it is interesting

The MQ-2 is inexpensive and gives a very obvious analog response to many combustion-related gases.

It is widely used in hobby smoke / gas detectors.

## Why it is not ideal for a solar forest node

The MQ-2 contains an internal heater.

That creates several problems:

- Higher power consumption
- Warm-up time
- Significant temperature dependence
- Calibration drift
- Poor gas selectivity
- Cross-sensitivity
- Less suitable for ultra-low-power operation

The general operating principle is closer to:

```text
heater continuously warms sensing material
            ↓
gas changes surface conductivity
            ↓
analog output changes
```

The heater makes it much less attractive for long-term battery operation than a low-power VOC sensor.

For a research prototype it may still be useful.

For a large solar Meshtastic deployment, it would not be my first choice.

---

# 8. Plantower PMS5003

## Overview

The **PMS5003** is one of the most common inexpensive laser particulate sensors.

It measures:

- PM1.0
- PM2.5
- PM10

It is widely used in DIY air-quality stations.

## Advantages

- Good price
- Large community
- Many libraries
- Proven in hobby air-quality projects
- Good sensitivity to smoke particles

## Disadvantages compared with RAK12039

The PMS5003 is a standalone sensor.

You must handle:

- 5 V power
- UART wiring
- Connector
- Physical mounting
- Firmware integration
- Power switching if duty cycling is required

Conceptually:

```text
PMS5003
  │
  ├── 5 V
  ├── GND
  ├── UART TX
  └── UART RX
       │
       ▼
 custom wiring / adapter
       │
       ▼
 RAK4631 / RAK19007
```

This can absolutely work, but the RAK12039 is considerably cleaner.

---

# 9. Recommended Hardware Architecture

For a practical Meshtastic smoke-monitoring node:

```text
                     ┌──────────────────┐
                     │     Solar Panel   │
                     └────────┬─────────┘
                              │
                              ▼
                     ┌──────────────────┐
                     │ Charger / Battery │
                     └────────┬─────────┘
                              │
                              ▼
                     ┌──────────────────┐
                     │     RAK19007      │
                     │                  │
                     │   ┌──────────┐   │
                     │   │ RAK4631  │   │
                     │   └──────────┘   │
                     │                  │
                     │ IO SLOT          │
                     │    │             │
                     │    ▼             │
                     │ RAK12039         │
                     │    │             │
                     └────┼─────────────┘
                          │
                          ▼
                      PMSA003I

                     Sensor Slot
                          │
                          ▼
                       RAK1906
                          │
                          ▼
                        BME680
```

This provides:

```text
LoRa / Meshtastic
PM1
PM2.5
PM10
particle counts
temperature
humidity
pressure
gas resistance
IAQ trend
```

---

# 10. Suggested Detection Logic

A robust system should avoid using one fixed threshold as the only decision rule.

A better model considers:

- Absolute PM concentration
- Rate of PM increase
- PM2.5 / PM10 relationship
- Duration of the event
- Neighboring sensor nodes
- Wind direction, if available
- Humidity
- VOC / gas-resistance changes

## Example states

```text
STATE 0 — Normal

PM2.5 low
No rapid trend
No alert
```

```text
STATE 1 — Elevated particulate level

PM2.5 exceeds local baseline
Increase measurement frequency
```

```text
STATE 2 — Suspicious event

PM2.5 increasing rapidly
and/or
multiple consecutive elevated samples
```

```text
STATE 3 — Probable smoke event

Rapid PM2.5 increase
+
supporting BME680 change
or
nearby nodes report similar event
```

```text
STATE 4 — High-confidence regional event

Several Meshtastic nodes detect correlated PM increase
```

This distributed approach is especially powerful in a mesh network.

---

# 11. Multi-Node Detection Is More Valuable Than a Single Sensor

A single sensor can produce false alarms due to:

- Dust
- Pollen
- Insects
- Exhaust
- Mechanical contamination
- Local activities
- Moisture / fog
- Sensor drift

A mesh can compare spatial patterns.

Example:

```text
Node A: PM2.5 rising rapidly
Node B: normal
Node C: normal
```

This may be a local dust event.

But:

```text
Node A: rising
Node B: rising 4 minutes later
Node C: rising 8 minutes later
```

This can indicate a moving smoke plume.

With node locations and timestamps, the system can eventually estimate:

- Direction of plume movement
- Approximate propagation speed
- Likely source region
- Confidence level

This is much more powerful than treating each node as an independent smoke alarm.

---

# 12. Power Considerations

For a solar Meshtastic node, power consumption matters enormously.

The RAK4631 can spend most of its time in a low-power state.

The particulate sensor is likely to be one of the largest electrical loads in the system.

A reasonable duty cycle could be:

```text
Every 10 minutes:

wake PM sensor
wait for stable airflow/readings
take multiple samples
calculate median / average
store trend
turn PM sensor off
```

If a suspicious rise is detected:

```text
Every 1 minute:

repeat PM measurement
transmit telemetry
compare against previous values
```

Then after conditions return to normal:

```text
return to 10-minute interval
```

This adaptive sampling strategy can significantly improve battery life.

---

# 13. Outdoor Enclosure Design

PM sensors need access to ambient air.

This means the enclosure cannot simply be completely sealed.

A good design needs:

- Rain protection
- Air exchange
- Insect protection
- Drainage
- No direct sunlight on the sensing chamber
- No direct water path to electronics

A useful geometry is similar to a small radiation shield:

```text
       rain
        ↓

   ┌─────────────┐
   │ upper hood  │
   └──────┬──────┘
          │
     air gap
   ←             →
     air gap
          │
      PM sensor
          │
   ┌─────────────┐
   │ electronics │
   └─────────────┘
```

Avoid placing the PM sensor inside a nearly airtight IP67 box, because it will simply measure the trapped air inside the enclosure.

---

# 14. Condensation and Humidity

Outdoor particulate sensors can be affected by:

- Fog
- Condensation
- Very high humidity
- Water droplets

Optical PM sensors may interpret water droplets as particles.

Therefore humidity should be recorded alongside PM measurements.

This is another reason why pairing the PMSA003I with the BME680 is useful.

For example:

```text
PM2.5 spike
+
RH = 99%
+
temperature near dew point
```

may deserve lower smoke confidence than:

```text
PM2.5 spike
+
RH = 38%
+
VOC/gas trend change
```

---

# 15. Suggested Final Sensor Combination

## Recommended

### Primary sensor

**RAK12039 + Plantower PMSA003I**

Purpose:

- Detect airborne particulate matter
- Detect smoke plume signatures
- Measure PM1 / PM2.5 / PM10

Approximate price:

**~$31.50**

### Secondary sensor

**RAK1906 + Bosch BME680**

Purpose:

- Temperature
- Humidity
- Pressure
- Gas-resistance / IAQ trend
- Context for PM measurements

Approximate price:

**~$15.20**

### Combined cost

```text
$31.50
$15.20
-------
$46.70
```

This is the strongest sub-$50 sensor combination for the stated WisBlock smoke-monitoring use case.

---

# 16. Alternative Configurations

## Cheapest useful smoke node

```text
RAK4631
+
RAK19007
+
RAK12039 PMSA003I
```

Sensor cost:

**~$31.50**

This is the configuration I would use for a large number of nodes.

---

## Higher-information research node

```text
RAK4631
+
RAK19007
+
Sensirion SEN55
```

Provides:

```text
PM1
PM2.5
PM4
PM10
VOC
NOx
temperature
humidity
```

Better for experiments, but mechanically and electrically more complex.

---

## Ultra-low-power environmental node

```text
RAK4631
+
RAK19007
+
RAK1906 BME680
```

Very low power, but not a direct smoke-particle detector.

Best for:

- Weather telemetry
- Environmental baseline
- General air-quality trend

Not recommended as the only wildfire sensor.

---

# 17. Recommendation for a Forest Meshtastic Network

For a distributed forest monitoring system, I would use two node classes.

## Standard Node

```text
RAK4631
RAK19007
RAK1906
temperature/humidity/pressure
solar
battery
Meshtastic
```

Low cost and very low power.

## Smoke Node

```text
RAK4631
RAK19007
RAK12039 / PMSA003I
RAK1906 / BME680
solar
larger battery
Meshtastic
```

Deploy fewer smoke nodes at strategically important locations.

For example:

```text
S = standard node
P = particulate/smoke node

S ----- S ----- P ----- S
        |             /
        S ----- S ---P
        |           /
        P ----- S --S
```

This reduces cost and energy consumption while still providing particulate sensing coverage.

---

# 18. Final Ranking

## For actual smoke detection

1. **RAK12039 / PMSA003I**
2. **Sensirion SEN55**
3. **Plantower PMS5003**
4. **RAK12004 / MQ-2**
5. **BME680**
6. **SGP40**

## For easiest RAK19007 integration

1. **RAK12039**
2. **RAK1906**
3. **RAK12047**
4. **RAK12004**
5. **SEN55**
6. **PMS5003**

## For low power

1. **RAK1906 / BME680**
2. **SGP40**
3. **RAK12039 with aggressive duty cycling**
4. **SEN55**
5. **PMS5003**
6. **MQ-2**

## Best overall choice

**RAK12039 / PMSA003I**

## Best two-sensor combination under approximately $50

**RAK12039 + RAK1906**

---

# 19. Important Safety Note

This system should be treated as an **experimental environmental monitoring network**, not as a certified life-safety fire alarm.

A DIY Meshtastic node can be excellent for:

- Environmental research
- Early anomaly detection
- Wildfire-smoke monitoring
- Remote telemetry
- Distributed sensing

It should not replace:

- Certified residential smoke alarms
- Commercial fire-alarm systems
- Official wildfire detection infrastructure
- Emergency alert systems

The most useful design philosophy is:

```text
detect anomaly early
        ↓
increase measurement frequency
        ↓
cross-check neighboring nodes
        ↓
raise confidence
        ↓
send alert / request verification
```

rather than treating a single raw sensor threshold as proof of fire.

---

# 20. Short Recommendation

For the **RAKwireless WisBlock Meshtastic Starter Kit (RAK19007 + RAK4631)**:

> Use the **RAK12039 / Plantower PMSA003I** as the primary smoke sensor.

If budget allows:

> Add the **RAK1906 / BME680** as a secondary environmental sensor.

This gives a compact, relatively inexpensive and WisBlock-native sensing package that is well suited to a solar-powered Meshtastic forest-monitoring node.
