# 🏠 BioSync Appliance Control System

Complete IoT appliance control with ESP8266, WiFi setup portal, and FastAPI backend.

## 📋 Features

### ESP8266 Features
- ✅ **WiFi Setup Portal** - Easy configuration via web interface
- ✅ **EEPROM Storage** - Persistent WiFi credentials
- ✅ **Public MQTT Broker** - Control from anywhere (broker.emqx.io)
- ✅ **Password Protection** - Secure control commands
- ✅ **State Publishing** - Real-time appliance status
- ✅ **9 GPIO Pins** - Control D0-D8 (all ESP8266 pins)
- ✅ **Auto-Reconnect** - WiFi & MQTT fault tolerance
- ✅ **Beautiful Web UI** - Modern setup interface

### Backend API Features
- ✅ **Control Multiple Pins** - Send JSON to control any pins
- ✅ **Get Current State** - Query appliance status
- ✅ **Toggle Pins** - Flip pin state without knowing current state
- ✅ **Control All Pins** - Turn everything on/off at once
- ✅ **MQTT Integration** - Real-time communication
- ✅ **Password Authentication** - Secure API endpoints

## 🚀 Quick Start

### 1. Flash ESP8266

```bash
cd automation-hardware/hardware/appliances_control_hardware
# Copy main_improved.cpp to main.cpp
cp src/main_improved.cpp src/main.cpp
# Flash with PlatformIO
pio run --target upload
```

### 2. Configure WiFi

1. **Hold GPIO0 LOW** (reset button) and power on ESP
2. Connect to WiFi: `ApplianceControl_Setup` (password: `12345678`)
3. Open browser: `http://192.168.4.1`
4. Scan and connect to your WiFi
5. Set control password (default: `appliances123`)
6. ESP will restart and connect to MQTT

### 3. Install Backend Dependencies

```bash
cd BioSync/backend-eyetracker
pip install paho-mqtt
```

### 4. Start Backend

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## 📡 MQTT Topics

- **Control Topic**: `biosync/appliances/control`
- **State Topic**: `biosync/appliances/state`

## 🔌 API Endpoints

### Control Multiple Pins

```bash
POST /api/appliances/control
```

**Request:**
```json
{
  "pins": {
    "d0": "on",
    "d1": "off",
    "d2": "on",
    "d5": "high"
  },
  "password": "appliances123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Control commands sent successfully",
  "pins_updated": ["d0", "d1", "d2", "d5"]
}
```

### Get Current State

```bash
GET /api/appliances/state
```

**Response:**
```json
{
  "pins": {
    "d0": "on",
    "d1": "off",
    "d2": "on",
    "d3": "off",
    "d4": "off",
    "d5": "on",
    "d6": "off",
    "d7": "off",
    "d8": "off"
  },
  "connected": true
}
```

### Toggle Single Pin

```bash
POST /api/appliances/toggle/d0?password=appliances123
```

**Response:**
```json
{
  "success": true,
  "message": "Control commands sent successfully",
  "pins_updated": ["d0"]
}
```

### Control All Pins

```bash
POST /api/appliances/all/on?password=appliances123
```

**Response:**
```json
{
  "success": true,
  "message": "Control commands sent successfully",
  "pins_updated": ["d0", "d1", "d2", "d3", "d4", "d5", "d6", "d7", "d8"]
}
```

## 🧪 Test with cURL

```bash
# Control multiple pins
curl -X POST "http://localhost:8000/api/appliances/control" \
  -H "Content-Type: application/json" \
  -d '{
    "pins": {"d0": "on", "d1": "on", "d2": "off"},
    "password": "appliances123"
  }'

# Get state
curl "http://localhost:8000/api/appliances/state"

# Toggle pin
curl -X POST "http://localhost:8000/api/appliances/toggle/d0?password=appliances123"

# Turn all on
curl -X POST "http://localhost:8000/api/appliances/all/on?password=appliances123"

# Turn all off
curl -X POST "http://localhost:8000/api/appliances/all/off?password=appliances123"
```

## 🧪 Test with Python

```python
import requests

BASE_URL = "http://localhost:8000/api"
PASSWORD = "appliances123"

# Control multiple pins
response = requests.post(
    f"{BASE_URL}/appliances/control",
    json={
        "pins": {
            "d0": "on",
            "d1": "on",
            "d2": "off"
        },
        "password": PASSWORD
    }
)
print(response.json())

# Get state
response = requests.get(f"{BASE_URL}/appliances/state")
print(response.json())

# Toggle pin
response = requests.post(
    f"{BASE_URL}/appliances/toggle/d0",
    params={"password": PASSWORD}
)
print(response.json())
```

## 🔧 Configuration

### Environment Variables

Add to `.env`:

```env
# MQTT Configuration
MQTT_BROKER=broker.emqx.io
MQTT_PORT=1883
MQTT_CONTROL_TOPIC=biosync/appliances/control
MQTT_STATE_TOPIC=biosync/appliances/state
APPLIANCE_PASSWORD=appliances123
```

### Change MQTT Topic

To avoid conflicts with other users on public broker:

1. **In ESP code** (`main_improved.cpp`):
```cpp
const char* control_topic = "YOUR_UNIQUE_TOPIC/control";
const char* state_topic = "YOUR_UNIQUE_TOPIC/state";
```

2. **In .env file**:
```env
MQTT_CONTROL_TOPIC=YOUR_UNIQUE_TOPIC/control
MQTT_STATE_TOPIC=YOUR_UNIQUE_TOPIC/state
```

## 🔐 Security

1. **Change Default Password**:
   - Via web interface after WiFi setup
   - Or modify `control_password_stored` in code

2. **Use Private MQTT Broker** (Production):
   - Setup your own MQTT broker with authentication
   - Update `MQTT_BROKER`, `MQTT_USER`, `MQTT_PASS`

3. **API Authentication**:
   - All control endpoints require password
   - Password validated before MQTT publish

## 📊 Pin Mapping

| Pin Name | GPIO | Default State |
|----------|------|---------------|
| d0       | D0   | LOW (OFF)     |
| d1       | D1   | LOW (OFF)     |
| d2       | D2   | LOW (OFF)     |
| d3       | D3   | LOW (OFF)     |
| d4       | D4   | LOW (OFF)     |
| d5       | D5   | LOW (OFF)     |
| d6       | D6   | LOW (OFF)     |
| d7       | D7   | LOW (OFF)     |
| d8       | D8   | LOW (OFF)     |

## 🐛 Troubleshooting

### ESP won't connect to WiFi
- Hold GPIO0 LOW during power-on to enter config mode
- Clear EEPROM via web interface
- Check WiFi credentials

### MQTT not connecting
- Verify internet connection
- Check MQTT broker availability: `broker.emqx.io:1883`
- Monitor serial output at 115200 baud

### API returns 503
- Check MQTT client is initialized
- Verify backend has internet access
- Check MQTT broker connectivity

### Wrong state reported
- Wait a few seconds for state update
- Check ESP serial monitor for state publishing
- Verify MQTT subscriptions are active

## 📝 Serial Monitor Output

```
========================================
    🏠 APPLIANCE CONTROL SYSTEM
========================================
✅ All pins initialized to LOW
📖 Loading WiFi credentials...
✅ SSID: YourWiFi
📡 Connecting to WiFi: YourWiFi
......
✅ WiFi connected!
📍 IP address: 192.168.1.100
🔄 Connecting to MQTT... ✅ Connected!
📡 Subscribed to: biosync/appliances/control
📤 Published state: {"d0":"off","d1":"off",...}
========================================
📩 MQTT Message Received
📍 Topic: biosync/appliances/control
✅ Password validated
✅ d0 → HIGH
✅ d1 → HIGH
⚫ d2 → LOW
📤 Published state: {"d0":"on","d1":"on","d2":"off",...}
========================================
```

## 🎯 Use Cases

1. **Home Automation** - Control lights, fans, appliances
2. **Smart Agriculture** - Water pumps, lights, ventilation
3. **Lab Equipment** - Power control, experiment automation
4. **Industrial IoT** - Machine control, monitoring
5. **Smart Office** - Power management, security systems

## 📚 API Documentation

Once backend is running, visit:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

## 🤝 Integration Examples

### Node.js / React
```javascript
const controlAppliances = async (pins) => {
  const response = await fetch('http://localhost:8000/api/appliances/control', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pins: pins,
      password: 'appliances123'
    })
  });
  return response.json();
};

// Usage
controlAppliances({ d0: 'on', d1: 'off' });
```

### Home Assistant
```yaml
rest_command:
  appliance_control:
    url: "http://localhost:8000/api/appliances/control"
    method: POST
    content_type: "application/json"
    payload: >
      {
        "pins": { "{{ pin }}": "{{ state }}" },
        "password": "appliances123"
      }
```

## 📞 Support

For issues or questions:
- Check serial monitor output
- Review MQTT broker logs
- Enable DEBUG mode in backend
- Check API documentation at `/docs`

## 🔄 Updates

To update ESP firmware:
```bash
pio run --target upload
```

To update backend:
```bash
git pull
pip install -r requirements.txt
```

---

**Created for BioSync Project** 🏠✨
