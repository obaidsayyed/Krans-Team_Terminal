# AI Grievance Redressal System — Backend

FastAPI backend for automated grievance processing, AI categorization, multi-department routing, and live tracking.

## Features
- **Lyzr AI Studio Integration**: Connects to Lyzr Chat Inference API (`https://agent-prod.studio.lyzr.ai/v3/inference/chat/`) to analyze citizen complaints, categorize them, calculate priority, extract involved departments, and prepare official drafts.
- **Intelligent Routing**: Haversine distance-based geo-routing to closest regional government departments (Police, Municipal, Electricity, Water, Hospital, Fire, RTO, PWD, etc.).
- **Live Lifecycle Tracking**: Full event log and status synchronization for every stage (SUBMITTED -> ANALYZED -> ROUTING -> ASSIGNED -> IN_PROGRESS -> RESOLVED).

---

## Configuration (`.env`)

Create a `.env` file in the `backend/` directory:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=your-supabase-secret-key

# Lyzr AI Agent Configuration
LYZR_API_URL=https://agent-prod.studio.lyzr.ai/v3/inference/chat/
LYZR_API_KEY=your-lyzr-api-key
LYZR_USER_ID=your-email@example.com
LYZR_AGENT_ID=6a97b13e5579d60760072668
LYZR_TIMEOUT_SECONDS=60.0
```

---

## Running the Backend

1. **Activate Virtual Environment**:
   ```powershell
   cd backend
   .\venv\Scripts\activate
   ```

2. **Run Server**:
   ```powershell
   uvicorn app.main:app --reload --port 8000
   ```

3. **Interactive Swagger Docs**:
   Open [http://localhost:8000/docs](http://localhost:8000/docs) in your browser.

---

## Running Tests

```powershell
pytest -v
```
