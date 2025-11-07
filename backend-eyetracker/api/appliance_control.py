"""
Appliance Control API
Control ESP8266 appliances via MQTT
"""

import os
import json
import logging
from typing import Dict, List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
import paho.mqtt.client as mqtt
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)
router = APIRouter(
    prefix="/appliances",
    tags=["appliances"]
)

# MQTT Configuration
MQTT_BROKER = os.getenv("MQTT_BROKER", "broker.emqx.io")
MQTT_PORT = int(os.getenv("MQTT_PORT", "1883"))
MQTT_CONTROL_TOPIC = os.getenv("MQTT_CONTROL_TOPIC", "biosync/appliances/control")
MQTT_STATE_TOPIC = os.getenv("MQTT_STATE_TOPIC", "biosync/appliances/state")
APPLIANCE_PASSWORD = os.getenv("APPLIANCE_PASSWORD", "appliances123")

# Global MQTT client
mqtt_client: Optional[mqtt.Client] = None
latest_state: Dict[str, str] = {}


# ===== SCHEMAS =====
class PinControl(BaseModel):
    """Individual pin control"""
    name: str = Field(..., description="Pin name (d0-d8)", pattern="^d[0-8]$")
    state: str = Field(..., description="Pin state (on/off or high/low)")


class ApplianceControlRequest(BaseModel):
    """Request to control appliances"""
    pins: Dict[str, str] = Field(
        ...,
        description="Pin states to set. Key: pin name (d0-d8), Value: state (on/off)",
        example={"d0": "on", "d1": "off", "d2": "on"}
    )
    password: str = Field(..., description="Control password for security")


class ApplianceStateResponse(BaseModel):
    """Current state of all appliances"""
    pins: Dict[str, str] = Field(..., description="Current pin states")
    connected: bool = Field(..., description="Whether ESP is connected")


class ApplianceControlResponse(BaseModel):
    """Response after controlling appliances"""
    success: bool
    message: str
    pins_updated: List[str]


# ===== MQTT CALLBACKS =====
def on_connect(client, userdata, flags, rc):
    """Called when connected to MQTT broker"""
    if rc == 0:
        logger.info(f"✅ Connected to MQTT broker: {MQTT_BROKER}")
        client.subscribe(MQTT_STATE_TOPIC)
        logger.info(f"📡 Subscribed to state topic: {MQTT_STATE_TOPIC}")
    else:
        logger.error(f"❌ MQTT connection failed with code: {rc}")


def on_message(client, userdata, msg):
    """Called when receiving MQTT message"""
    global latest_state
    try:
        payload = json.loads(msg.payload.decode())
        latest_state = payload
        logger.info(f"📥 Received state update: {payload}")
    except Exception as e:
        logger.error(f"❌ Error parsing state message: {e}")


def on_disconnect(client, userdata, rc):
    """Called when disconnected from MQTT broker"""
    logger.warning(f"⚠️ Disconnected from MQTT broker. Code: {rc}")


# ===== MQTT INITIALIZATION =====
def init_mqtt():
    """Initialize MQTT client"""
    global mqtt_client
    
    if mqtt_client is not None:
        return mqtt_client
    
    try:
        mqtt_client = mqtt.Client(client_id="biosync_backend")
        mqtt_client.on_connect = on_connect
        mqtt_client.on_message = on_message
        mqtt_client.on_disconnect = on_disconnect
        
        logger.info(f"🔄 Connecting to MQTT broker: {MQTT_BROKER}:{MQTT_PORT}")
        mqtt_client.connect(MQTT_BROKER, MQTT_PORT, 60)
        mqtt_client.loop_start()
        
        return mqtt_client
    except Exception as e:
        logger.error(f"❌ Failed to initialize MQTT: {e}")
        raise


# ===== API ENDPOINTS =====
@router.post("/control", response_model=ApplianceControlResponse)
async def control_appliances(request: ApplianceControlRequest):
    """
    Control appliance pins via MQTT
    
    Send commands to turn pins on/off. Multiple pins can be controlled at once.
    
    Example:
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
    """
    try:
        # Initialize MQTT if not already
        client = init_mqtt()
        if client is None:
            raise HTTPException(status_code=503, detail="MQTT client not available")
        
        # Validate password
        if request.password != APPLIANCE_PASSWORD:
            raise HTTPException(status_code=401, detail="Invalid password")
        
        # Validate pin names
        valid_pins = [f"d{i}" for i in range(9)]
        for pin_name in request.pins.keys():
            if pin_name.lower() not in valid_pins:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid pin name: {pin_name}. Must be d0-d8"
                )
        
        # Prepare MQTT message
        mqtt_payload = {
            "password": request.password,
            "pins": request.pins
        }
        
        # Publish to MQTT
        result = client.publish(
            MQTT_CONTROL_TOPIC,
            json.dumps(mqtt_payload),
            qos=1,
            retain=False
        )
        
        if result.rc != mqtt.MQTT_ERR_SUCCESS:
            raise HTTPException(
                status_code=500,
                detail="Failed to publish MQTT message"
            )
        
        logger.info(f"✅ Published control command: {mqtt_payload}")
        
        return ApplianceControlResponse(
            success=True,
            message="Control commands sent successfully",
            pins_updated=list(request.pins.keys())
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error controlling appliances: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/state", response_model=ApplianceStateResponse)
async def get_appliance_state():
    """
    Get current state of all appliance pins
    
    Returns the last known state received from the ESP8266 via MQTT.
    """
    try:
        # Initialize MQTT if not already
        client = init_mqtt()
        
        return ApplianceStateResponse(
            pins=latest_state,
            connected=client is not None and client.is_connected()
        )
        
    except Exception as e:
        logger.error(f"❌ Error getting appliance state: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/toggle/{pin_name}")
async def toggle_pin(pin_name: str, password: str):
    """
    Toggle a single pin on/off
    
    Convenience endpoint to flip a pin's state without knowing current state.
    """
    try:
        # Validate pin name
        pin_name = pin_name.lower()
        if pin_name not in [f"d{i}" for i in range(9)]:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid pin name: {pin_name}. Must be d0-d8"
            )
        
        # Get current state
        current_state = latest_state.get(pin_name, "off")
        new_state = "off" if current_state == "on" else "on"
        
        # Control the pin
        request = ApplianceControlRequest(
            pins={pin_name: new_state},
            password=password
        )
        
        return await control_appliances(request)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error toggling pin: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/all/{state}")
async def control_all_pins(state: str, password: str):
    """
    Turn all pins on or off at once
    
    State must be 'on' or 'off'
    """
    try:
        if state.lower() not in ["on", "off", "high", "low"]:
            raise HTTPException(
                status_code=400,
                detail="State must be 'on' or 'off'"
            )
        
        # Create control for all pins
        all_pins = {f"d{i}": state.lower() for i in range(9)}
        
        request = ApplianceControlRequest(
            pins=all_pins,
            password=password
        )
        
        return await control_appliances(request)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error controlling all pins: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ===== CLEANUP =====
def shutdown_mqtt():
    """Cleanup MQTT connection"""
    global mqtt_client
    if mqtt_client is not None:
        mqtt_client.loop_stop()
        mqtt_client.disconnect()
        logger.info("👋 MQTT client disconnected")
