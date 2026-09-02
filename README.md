# Krans-Team_Terminal
This repo will serve as the official repo for all the code changes at Krans Hackathon by ACET, Nagpur

AI Grievance Redressal System

An AI powered, multi department grievance management platform that transforms unstructured citizen complaints into actionable, prioritized, routed, and trackable service requests.

Overview

The AI Grievance Redressal System is a centralized platform designed to improve how citizen complaints are submitted, processed, routed, monitored, and resolved.

Instead of requiring citizens to understand which government department is responsible for their problem, they can simply describe the issue using keywords or natural language. An AI Orchestrator coordinates specialized AI agents to transform the input into a structured grievance, identify the relevant departments, determine its priority, assign the applicable SLA, and initiate the appropriate workflow.

The system supports multiple government departments through dedicated dashboards while maintaining a unified complaint lifecycle and audit trail.

Core Workflow

Citizen Input
     |
     v
+-----------------------+
|   AI ORCHESTRATOR     |
+-----------+-----------+
            |
            v
     Complaint Drafter
            |
            v
     Routing Agent
            |
            v
     Priority Agent
            |
            v
        SLA Agent
            |
            v
+-----------------------+
| Backend / Workflow    |
| Engine                |
+-----------+-----------+
            |
            v
     Complaint ID
            |
            v
   Relevant Department
            |
            v
    Officer Action
            |
            v
      Status Tracking
            |
            v
        Resolution





        Key Features
AI Powered Complaint Processing

Citizens do not need to write formal complaints. They can provide simple keywords or an informal description.

Example:

Input:
"pothole fc road big dangerous for bikes"

AI Draft:

"A large pothole has been reported on FC Road, creating
a potential safety hazard for two wheeler riders. Kindly
arrange for the location to be inspected and the pothole
repaired at the earliest."

Input:
"pothole fc road big dangerous for bikes"

AI Draft:

"A large pothole has been reported on FC Road, creating
a potential safety hazard for two wheeler riders. Kindly
arrange for the location to be inspected and the pothole
repaired at the earliest."


The citizen can review the generated complaint before submission.

Multi Agent AI Architecture

The platform uses specialized AI agents coordinated by a central Managerial Orchestrator Agent.

Complaint Drafter Agent

Converts rough citizen input into a clear, professional complaint.

Responsibilities:

Understand informal input
Formulate a proper complaint
Preserve the citizen's intended meaning
Avoid fabricating information
Routing Agent

Determines all departments relevant to a complaint.

A complaint is not restricted to a single department.

For example:

Car accident
     |
     +-- Police       → Accident and traffic management
     +-- Hospital     → Injured persons
     +-- Municipal    → Road obstruction or infrastructure
Priority Agent

Determines the complaint's priority:

CRITICAL
HIGH
MEDIUM
LOW

The decision considers factors such as:

Threat to life
Public safety
Number of people affected
Essential service disruption
Potential consequences of delayed action
SLA Agent

Determines the applicable service level deadline based on:

Complaint priority
Department
Complaint type
Applicable government or service policy

SLA rules are intended to be policy driven rather than invented by the LLM.

Managerial Orchestrator Agent

Acts as the central coordinator.

It:

Receives citizen input
Sends information to specialized agents
Collects their outputs
Maintains complaint context
Passes relevant context between agents
Validates agent responses
Initiates backend workflow
Coordinates multi department routing

The orchestrator does not replace the backend as the source of truth.

Multi Dashboard Architecture

The system provides dedicated interfaces for different stakeholders.

Citizen Dashboard

Citizens can:

Submit complaints
Review AI generated drafts
Receive a unique complaint ID
Track complaint status
View department updates
View the complaint timeline
Escalate eligible complaints
Police Dashboard

Handles complaints related to:

Crime
Public safety
Traffic incidents
Law and order
Other police related grievances
Fire Dashboard

Handles:

Fire incidents
Fire hazards
Emergency situations
Fire safety complaints
RTO Dashboard

Handles:

Vehicle related grievances
Transport issues
Licensing related complaints
RTO services
Hospital and Health Dashboard

Handles:

Healthcare related grievances
Public health issues
Medical service complaints
Health emergencies where applicable
Municipal Dashboard

Handles:

Roads
Garbage and waste
Water supply
Drainage
Streetlights
Sanitation
Civic infrastructure
Admin Dashboard

Provides cross department oversight.

The administrator can monitor:

Total complaints
Active complaints
Resolved complaints
SLA breaches
Escalated complaints
Department performance
Priority distribution
Complaint categories
Resolution times

Normal complaints remain available to the administrator, but they do not require an intrusive alert.

Escalated complaints, however, actively demand administrator attention.

Complaint Lifecycle

Every complaint receives a unique identifier.

Example:

GRV 2026 004821

The complaint then follows a traceable lifecycle:

SUBMITTED
    |
    v
AI PROCESSED
    |
    v
ROUTED
    |
    v
ASSIGNED
    |
    v
IN PROGRESS
    |
    v
RESOLUTION SUBMITTED
    |
    v
RESOLVED
    |
    v
CLOSED

Every state transition can be recorded in the complaint's audit trail.

Example:

02 Sep 10:31  Citizen      Complaint submitted
02 Sep 10:32  AI           Complaint categorized
02 Sep 10:32  AI           Routed to Municipal
02 Sep 10:33  System       Assigned to Officer
03 Sep 14:20  Officer      Action started
04 Sep 17:45  Officer      Resolution submitted
04 Sep 18:00  Citizen      Complaint resolved
Intelligent Escalation System

A key feature of the platform is SLA based escalation.

When a complaint is submitted, the system determines its applicable SLA.

The citizen initially sees a disabled escalation option:

+------------------------------+
|      ESCALATE COMPLAINT      |
|           Locked             |
+------------------------------+

If the responsible department takes no required action within the applicable SLA:

SLA Expired
     |
     v
No Required Action
     |
     v
Escalation Becomes Available
     |
     v
Citizen Escalates
     |
     v
Administrator Receives Alert
     |
     v
Admin Reviews Complaint
     |
     v
High Priority Alert → Department

This creates an accountability mechanism rather than simply providing complaint tracking.

Normal Complaints
Citizen
   |
   v
Department
Escalated Complaints
Citizen
   |
   v
Department
   |
   v
SLA Breach
   |
   v
Citizen Escalation
   |
   v
Administrator Attention
   |
   v
High Priority Department Alert
System Architecture
                    +---------------------+
                    | Citizen / Officer   |
                    | Frontend            |
                    +----------+----------+
                               |
                               v
                    +---------------------+
                    | FastAPI             |
                    | Backend             |
                    +----------+----------+
                               |
                               v
                  +------------------------+
                  | AI Orchestrator        |
                  | Manager                |
                  +-----------+------------+
                              |
             +----------------+----------------+
             |                |                |
             v                v                v
          Drafter          Routing          Priority
           Agent            Agent             Agent
             |                |                |
             +----------------+----------------+
                              |
                              v
                         SLA Agent
                              |
                              v
                    Workflow / Backend
                              |
                              v
                         Database
                              |
             +----------------+----------------+
             |                |                |
             v                v                v
          Citizen       Department          Admin
          Dashboard      Dashboards         Dashboard
Source of Truth

The LLM agents are responsible for reasoning and coordination, not authoritative state management.

The architecture separates responsibilities:

Component	Responsibility
LLM Agents	Understanding, drafting, classification and decision support
Orchestrator	Coordination and context management
FastAPI Backend	Business logic and API operations
Database	Persistent complaint state
Workflow Engine	SLA timers, status transitions and escalation rules
Dashboards	Human interaction and monitoring

This prevents an LLM from directly becoming the authority for critical system operations.

Technology Stack

Update this section according to your actual implementation.

Backend
Python
FastAPI
REST APIs
AI
Large Language Model
Multi agent orchestration
Specialized AI agents
Structured JSON outputs
Frontend
React
Next.js
Dashboard based interfaces
Database
PostgreSQL
Supabase
Authentication
JWT based authentication
Infrastructure
Docker
RESTful service architecture
Example API Response

The orchestrator produces structured output that can be consumed directly by the FastAPI backend.

{
  "originalInput": "large pothole near school on FC Road, dangerous for bikes",
  "draftedComplaint": "A large pothole has been reported on FC Road near the school, creating a potential safety hazard for two wheeler riders. Kindly arrange for the location to be inspected and the pothole repaired at the earliest.",
  "departments": [
    {
      "department": "Municipal",
      "reason": "The complaint concerns road infrastructure and requires municipal intervention."
    }
  ],
  "priority": {
    "level": "HIGH",
    "reason": "The pothole presents a potential safety hazard for road users."
  },
  "sla": [
    {
      "department": "Municipal",
      "duration": "2",
      "unit": "working_days",
      "reason": "Applicable SLA for a high priority municipal road complaint."
    }
  ],
  "complaintId": "GRV 2026 004821",
  "status": "SUBMITTED",
  "message": "Complaint successfully registered and routed to the relevant department."
}
Problem Being Solved

Traditional grievance systems often place the burden on citizens to:

Identify the correct department
Understand government processes
Write formal complaints
Follow up manually
Determine whether action has actually been taken

This system shifts that burden from the citizen to an intelligent workflow.

Traditional Workflow
Citizen
   |
   v
Which department handles this?
   |
   v
Submit manually
   |
   v
Wait
   |
   v
Follow up
   |
   v
Repeat
Proposed Workflow
Citizen describes the problem
             |
             v
        AI understands
             |
             v
      AI drafts complaint
             |
             v
     AI identifies departments
             |
             v
       AI assigns priority
             |
             v
       SLA is determined
             |
             v
      Complaint is routed
             |
             v
        Action is tracked
             |
             v
    SLA breach → Escalation
             |
             v
       Admin intervention
Key Differentiators
1. Natural Language Grievance Submission

Citizens do not need to understand government terminology or departmental structures.

2. Multi Department Routing

A single grievance can be intelligently routed to multiple departments when necessary.

3. Multi Agent AI Architecture

Specialized agents handle specialized responsibilities rather than relying on one monolithic AI prompt.

4. SLA Aware Tracking

Complaints are monitored against defined service level requirements.

5. Citizen Controlled Escalation

Escalation becomes available when the defined conditions are met.

6. Exception Driven Administration

Administrators do not need to manually inspect every complaint. Escalations and SLA breaches surface the cases requiring intervention.

7. End to End Accountability

Every complaint has a unique ID and traceable lifecycle.

Project Structure
ai grievance redressal/
|
├── backend/
│   ├── main.py
│   ├── api/
│   ├── models/
│   ├── services/
│   ├── agents/
│   │   ├── drafter.py
│   │   ├── router.py
│   │   ├── priority.py
│   │   ├── sla.py
│   │   └── orchestrator.py
│   └── database/
│
├── frontend/
│   ├── citizen/
│   ├── admin/
│   ├── police/
│   ├── fire/
│   ├── rto/
│   ├── hospital/
│   └── municipal/
│
├── docs/
│
├── tests/
│
├── .env.example
├── requirements.txt
├── Dockerfile
└── README.md
Getting Started
1. Clone the Repository
git clone <your repository url>
cd ai grievance redressal
2. Create a Virtual Environment
python -m venv venv

Activate it:

Windows:

venv\Scripts\activate

Linux or macOS:

source venv/bin/activate
3. Install Dependencies
pip install -r requirements.txt
4. Configure Environment Variables

Create a .env file:

DATABASE_URL=
JWT_SECRET=
LLM_API_KEY=
5. Start the FastAPI Server
uvicorn backend.main:app --reload
6. Start the Frontend
cd frontend
npm install
npm run dev
Example Scenario
Citizen Input
"accident near bus stand, two injured, traffic blocked"
AI Processing

Drafter Agent:

A road accident has occurred near the main bus stand.
Two individuals appear to be injured and traffic is
currently blocked in the area.

Routing Agent:

Police
Hospital/Health

Priority Agent:

CRITICAL

SLA Agent:

Emergency response SLA according to applicable policy.
System
Complaint ID:
GRV 2026 004821

Status:
SUBMITTED

Departments:
Police
Hospital/Health

Priority:
CRITICAL

The respective department dashboards receive the complaint, while the citizen can track its progress using the generated complaint ID.

Future Enhancements
Voice based complaint submission
Multilingual complaint processing
Image and video evidence analysis
Geospatial complaint heatmaps
Duplicate complaint detection
Automated resolution summaries
Department performance analytics
Predictive SLA breach detection
Automated status notifications
Citizen satisfaction feedback
Integration with existing government service APIs
User Roles
Role	Access
Citizen	Submit, track and escalate complaints
Police Officer	Manage police routed complaints
Fire Officer	Manage fire related complaints
RTO Officer	Manage RTO complaints
Health Officer	Manage healthcare complaints
Municipal Officer	Manage civic complaints
Administrator	Monitor departments, escalations and system wide performance
Design Principles

AI assists. Humans remain accountable.

LLMs reason. Backend systems enforce.

Citizens provide the problem. The system handles the complexity.

Normal complaints stay with departments. Exceptions reach administrators.

Every complaint has a traceable lifecycle.

License
MIT License
AI Grievance Redressal System

From citizen complaint to accountable resolution, powered by AI.
