# Automations Runbook

## Overview
The automations system allows backoffice users to define rules that trigger actions based on events or schedules. Automations are executed as Temporal workflows, providing durability, retries, and visibility.

## Automation Components

### Triggers
Triggers define when an automation fires:
- **Event-based**: Fires when a specific event occurs (e.g., document uploaded, exception created, status changed)
- **Schedule-based**: Fires on a cron schedule (e.g., daily compliance check, weekly invoice summary)
- **Timer-based**: Fires after a duration relative to an event (e.g., 48 hours after POD expected, 30 days before certificate expiry)

### Conditions
Conditions filter whether the automation should proceed:
- Field value comparisons (e.g., `document_type == "pod"`, `amount > 1000`)
- Entity state checks (e.g., `job.status == "delivered"`, `driver.compliance_status == "expiring"`)
- Time-based conditions (e.g., `days_until_expiry < 30`)

### Actions
Actions define what happens when the automation fires:
- **Send notification**: Email, SMS, or in-app notification to specified recipients or roles
- **Create task**: Generate a task in the backoffice task queue
- **Update status**: Change the status of a document, job, or other entity
- **Create exception**: Flag an item for human review
- **Trigger workflow**: Start another Temporal workflow (e.g., re-process a document)

## Built-in Automation Templates

### POD Chase
- **Trigger**: Timer, 48 hours after job marked as delivered
- **Condition**: No POD document linked to the job
- **Action**: Send notification to the assigned driver and create a backoffice task
- **Escalation**: If still missing after 72 hours, notify the operations manager

### Compliance Renewal Reminder
- **Trigger**: Schedule, daily at 08:00
- **Condition**: Any compliance certificate expiring within 30 days
- **Action**: Send reminder to the compliance team and the affected driver
- **Escalation**: At 14 days, create a high-priority task. At 7 days, notify admin

### Invoice Auto-Match
- **Trigger**: Event, when a remittance advice is processed
- **Condition**: Extracted reference numbers match outstanding invoices
- **Action**: Link the remittance to the invoices and update payment status

### Exception Escalation
- **Trigger**: Timer, 24 hours after exception created
- **Condition**: Exception is still unresolved
- **Action**: Escalate to team lead. After 48 hours, escalate to manager

## Managing Automations

### Create a new automation
1. Navigate to Settings > Automations in the backoffice UI
2. Click "New Automation"
3. Select a trigger type and configure its parameters
4. Add conditions (optional)
5. Define one or more actions
6. Set the automation to active or draft
7. Save

### Via API
```bash
curl -X POST http://localhost:8000/api/automations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "POD Chase - Custom",
    "trigger": {
      "type": "timer",
      "event": "job.status.delivered",
      "delay_hours": 24
    },
    "conditions": [
      {"field": "job.pod_received", "operator": "eq", "value": false}
    ],
    "actions": [
      {"type": "send_notification", "channel": "email", "recipient_role": "driver"}
    ],
    "active": true
  }'
```

### Disable an automation
```bash
curl -X PATCH http://localhost:8000/api/automations/{id} \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"active": false}'
```

## Monitoring

### Key Metrics
- Automations triggered per day (by type)
- Action success/failure rate
- Average execution time
- Notification delivery rate

### Viewing Automation History
1. Navigate to Settings > Automations
2. Click on an automation to view its execution history
3. Each execution shows: trigger time, conditions evaluated, actions taken, result

### Temporal Workflows
Automation workflows are visible in the Temporal UI under the `automations` task queue. Each execution creates a workflow with the ID pattern `automation-{id}-{timestamp}`.

## Troubleshooting

### Automation not firing
1. Verify the automation is set to `active`
2. Check that the trigger event is being emitted (review event logs)
3. Verify conditions are not overly restrictive
4. Check the Temporal worker is running and consuming from the `automations` task queue

### Duplicate notifications
1. Check if multiple automations overlap in scope
2. Verify the deduplication window is configured correctly
3. Review the automation execution history for unexpected re-triggers

### Timer-based automation firing late
1. Check Temporal server health and timer backlog
2. Verify the Temporal worker has capacity (not overloaded with other tasks)
3. Review system clock synchronization across services
