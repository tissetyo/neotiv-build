#!/bin/bash
# ═══════════════════════════════════════════════════════
# Neotiv STB Deploy Script
# Builds the APK and installs it on a target STB via ADB
# ═══════════════════════════════════════════════════════
#
# Usage:
#   ./deploy.sh <STB_IP> <HOTEL_SLUG> <ROOM_CODE> [BASE_URL]
#
# Examples:
#   ./deploy.sh 192.168.1.100 amartha-bali 101
#   ./deploy.sh 192.168.1.100 amartha-bali 101 https://tv.neotiv.com
#
# Prerequisites:
#   - Android SDK installed (ANDROID_HOME set)
#   - ADB available in PATH
#   - STB has ADB debugging enabled
# ═══════════════════════════════════════════════════════

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

STB_IP="$1"
HOTEL_SLUG="$2"
ROOM_CODE="$3"
BASE_URL="${4:-https://your-domain.com}"
APK_PATH="app/build/outputs/apk/debug/app-debug.apk"

echo -e "${CYAN}═══════════════════════════════════════${NC}"
echo -e "${CYAN}   Neotiv STB Deploy${NC}"
echo -e "${CYAN}═══════════════════════════════════════${NC}"

# Validate args
if [ -z "$STB_IP" ]; then
    echo -e "${YELLOW}Usage: ./deploy.sh <STB_IP> [HOTEL_SLUG] [ROOM_CODE] [BASE_URL]${NC}"
    echo ""
    echo "If HOTEL_SLUG and ROOM_CODE are provided, the STB"
    echo "will be auto-configured (no manual setup needed)."
    echo ""
    echo "If omitted, the Setup screen will appear on the STB"
    echo "for manual configuration via remote."
    exit 1
fi

# Step 1: Build APK
echo -e "\n${CYAN}[1/4]${NC} Building APK..."
if [ ! -f "gradlew" ]; then
    echo -e "${YELLOW}Generating Gradle wrapper...${NC}"
    gradle wrapper --gradle-version 8.5
fi
chmod +x gradlew
./gradlew assembleDebug

if [ ! -f "$APK_PATH" ]; then
    echo -e "${RED}❌ Build failed — APK not found at $APK_PATH${NC}"
    exit 1
fi

APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
echo -e "${GREEN}✅ APK built ($APK_SIZE)${NC}"

# Step 2: Connect to STB
echo -e "\n${CYAN}[2/4]${NC} Connecting to STB at ${STB_IP}..."
adb connect "${STB_IP}:5555" || {
    echo -e "${RED}❌ Cannot connect to STB. Make sure:${NC}"
    echo "   1. STB and your Mac are on the same network"
    echo "   2. USB Debugging is enabled on the STB"
    echo "   3. Try: adb connect ${STB_IP}:5555"
    exit 1
}
sleep 2

# Check connection
DEVICE=$(adb -s "${STB_IP}:5555" get-state 2>/dev/null || echo "offline")
if [ "$DEVICE" != "device" ]; then
    echo -e "${RED}❌ STB not responding. State: $DEVICE${NC}"
    exit 1
fi

STB_MODEL=$(adb -s "${STB_IP}:5555" shell getprop ro.product.model 2>/dev/null)
STB_ANDROID=$(adb -s "${STB_IP}:5555" shell getprop ro.build.version.release 2>/dev/null)
echo -e "${GREEN}✅ Connected: ${STB_MODEL} (Android ${STB_ANDROID})${NC}"

# Step 3: Install APK
echo -e "\n${CYAN}[3/4]${NC} Installing Neotiv STB Launcher..."
adb -s "${STB_IP}:5555" install -r "$APK_PATH"
echo -e "${GREEN}✅ APK installed${NC}"

# Step 4: Configure and launch
echo -e "\n${CYAN}[4/4]${NC} Configuring..."

if [ -n "$HOTEL_SLUG" ] && [ -n "$ROOM_CODE" ]; then
    # Auto-configure via ADB intent
    echo "   Hotel: $HOTEL_SLUG"
    echo "   Room:  $ROOM_CODE"
    echo "   URL:   $BASE_URL"

    adb -s "${STB_IP}:5555" shell am start -n com.neotiv.stb/.SetupActivity \
        --es base_url "$BASE_URL" \
        --es hotel_slug "$HOTEL_SLUG" \
        --es room_code "$ROOM_CODE"
    echo -e "${GREEN}✅ Auto-configured and launched${NC}"
else
    # Just launch — will show setup screen
    adb -s "${STB_IP}:5555" shell am start -n com.neotiv.stb/.SetupActivity
    echo -e "${YELLOW}⚠ Launched setup screen — configure via remote${NC}"
fi

# Optional: set as default home launcher
echo -e "\n${CYAN}Setting as default launcher...${NC}"
adb -s "${STB_IP}:5555" shell cmd package set-home-activity com.neotiv.stb/.SetupActivity 2>/dev/null || \
    echo -e "${YELLOW}⚠ Could not auto-set as home launcher. Set manually in Settings > Apps > Default Apps > Home${NC}"

# Disable screen timeout
adb -s "${STB_IP}:5555" shell settings put system screen_off_timeout 2147483647 2>/dev/null

echo -e "\n${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}   ✅ Deploy complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "   STB: ${STB_MODEL} @ ${STB_IP}"
if [ -n "$HOTEL_SLUG" ]; then
    echo -e "   Dashboard: ${BASE_URL}/${HOTEL_SLUG}/dashboard/${ROOM_CODE}"
fi
echo ""
echo -e "${CYAN}To reconfigure later:${NC}"
echo "   adb -s ${STB_IP}:5555 shell am start -n com.neotiv.stb/.SetupActivity --es hotel_slug \"new-slug\" --es room_code \"202\""
echo ""
echo -e "${CYAN}To reboot the STB:${NC}"
echo "   adb -s ${STB_IP}:5555 shell reboot"
