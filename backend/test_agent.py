"""
Interactive Terminal Test Script for Lyzr AI Agent
===================================================
Run directly from terminal:
    python test_agent.py
or with custom complaint:
    python test_agent.py "Road accident near chowk, ambulance and traffic police needed."
"""

import os
import sys
import json

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Configure UTF-8 encoding for Windows terminals
if sys.stdout.encoding != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

from app.core.config import settings
from app.ai.client import AIAgentClient


def print_separator(title=""):
    width = 65
    if title:
        padding = max(0, (width - len(title) - 2) // 2)
        print("\n" + "=" * padding + f" {title} " + "=" * padding, flush=True)
    else:
        print("=" * width, flush=True)


def main():
    if len(sys.argv) > 1 and sys.argv[1] in ("-h", "--help"):
        print("Usage:", flush=True)
        print("    python test_agent.py                      (runs with default test complaint)", flush=True)
        print('    python test_agent.py "Your complaint text" (runs with custom complaint)', flush=True)
        sys.exit(0)

    api_key = (settings.LYZR_API_KEY or "").strip().strip('"\'')
    user_id = (settings.LYZR_USER_ID or "").strip().strip('"\'')

    print_separator("LYZR AI AGENT LIVE TERMINAL TEST")
    print(f"[*] API Endpoint : {settings.LYZR_API_URL}", flush=True)
    print(f"[*] Agent ID     : {settings.LYZR_AGENT_ID}", flush=True)
    print(f"[*] User ID      : {user_id or '(Not configured in .env)'}", flush=True)
    print(f"[*] API Key      : {'*' * 8 + api_key[-4:] if api_key else '(NOT SET)'}", flush=True)

    # If API Key is missing in .env, prompt the user in the terminal
    if not api_key:
        print("\n[!] LYZR_API_KEY is not set in backend/.env", flush=True)
        api_key = input("[>] Enter your Lyzr API Key (or press Ctrl+C to exit): ").strip().strip('"\'')
        if not api_key:
            print("[X] API Key cannot be empty. Exiting.", flush=True)
            sys.exit(1)

    if not user_id:
        user_id = input("[>] Enter your Email / User ID (default: user@example.com): ").strip().strip('"\'') or "user@example.com"

    # Determine complaint text
    if len(sys.argv) > 1:
        complaint_text = " ".join(sys.argv[1:])
    else:
        complaint_text = (
            "Severe water pipe leakage and road flooding on Wardha Road near Metro Pillar 45 "
            "for the past 2 days. Traffic is completely jammed and water is entering nearby shops."
        )

    print_separator("TEST COMPLAINT")
    print(complaint_text, flush=True)

    print("\n[*] Sending request to Lyzr AI Agent...", flush=True)
    
    client = AIAgentClient(
        api_key=api_key,
        user_id=user_id,
        agent_id=settings.LYZR_AGENT_ID,
        api_url=settings.LYZR_API_URL,
    )

    try:
        result = client.analyze(complaint_text)
        
        print_separator("AI ANALYSIS RESULT (SUCCESS)")
        print(f"[+] Title        : {result.title}")
        print(f"[+] Category     : {result.category}")
        print(f"[+] Priority     : {result.priority.value}")
        print(f"[+] Departments  : {', '.join(result.departments)}")
        print(f"\n[+] Summary:\n    {result.summary}")
        print(f"\n[+] Formal Draft:\n    {result.formal_draft}")
        
        if result.raw_payload:
            print(f"\n[+] Raw Response from Lyzr:")
            print(f"    {json.dumps(result.raw_payload, indent=2)}")

        print_separator("TEST PASSED")
        print("[SUCCESS] Everything is configured and working perfectly!\n")

    except Exception as exc:
        print_separator("TEST FAILED")
        print(f"[ERROR] Error during AI agent call: {exc}")
        print("\nTroubleshooting Tips:")
        print(" 1. Check if your LYZR_API_KEY is correct and active.")
        print(" 2. Verify that your agent ID '6a97b13e5579d60760072668' is published/accessible in Lyzr Studio.")
        print(" 3. Check your internet connectivity.\n")
        sys.exit(1)


if __name__ == "__main__":
    main()

