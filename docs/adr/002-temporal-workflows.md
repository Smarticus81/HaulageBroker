# ADR-002: Temporal for Workflow Orchestration

## Status
Accepted

## Context
The CarrierBackOffice platform requires reliable orchestration of multi-step document processing pipelines, automation rules, and compliance workflows. These workflows must survive process restarts, handle transient failures gracefully, and provide visibility into their current state.

## Decision
Use Temporal as the workflow orchestration engine for all long-running and multi-step processes.

## Rationale
- **Durable execution**: Workflow state is persisted automatically, so multi-step document processing (OCR, extraction, validation, linking) survives crashes and restarts without manual checkpointing
- **Retry policies for OCR/extraction**: Built-in configurable retry policies with exponential backoff allow fine-grained control over how OCR and data extraction activities handle transient failures from external services
- **Visibility into workflow state**: Temporal provides a query API and web UI for inspecting the current state of any workflow, making it straightforward to debug stuck or failed document pipelines
- **Timer-based automation triggers**: Native support for durable timers enables automation rules such as "send reminder if POD not received within 48 hours" or "escalate compliance renewal 30 days before expiry" without external cron infrastructure

## Consequences
- Temporal server must be deployed and maintained as core infrastructure
- Workflow and activity code written in Python using the Temporal Python SDK
- All long-running processes (document pipelines, automations, scheduled tasks) are modeled as Temporal workflows
- Developers must understand Temporal concepts (workflows, activities, task queues, signals, queries)
- Temporal UI is exposed for operational visibility and debugging
