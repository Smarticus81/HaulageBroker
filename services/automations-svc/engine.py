"""Automation engine - evaluates rules, matches conditions, executes actions."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from shared.models import AutomationRule, AutomationRun

from .conditions import evaluate_conditions
from .actions import execute_action

logger = logging.getLogger(__name__)


class AutomationEngine:
    """Evaluates automation rules against events or on schedules."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def evaluate_event_rules(
        self, event_type: str, payload: dict[str, Any]
    ) -> dict[str, Any]:
        """Find and execute matching event-triggered rules.

        Args:
            event_type: The event type that was fired.
            payload: Event payload dict.

        Returns:
            Summary dict with rules_evaluated, rules_matched, and run details.
        """
        result = await self.db.execute(
            select(AutomationRule).where(
                AutomationRule.trigger_type == "event",
                AutomationRule.trigger_event == event_type,
                AutomationRule.is_active == True,  # noqa: E712
            )
        )
        rules = result.scalars().all()

        runs = []
        matched = 0

        for rule in rules:
            if evaluate_conditions(rule.conditions, payload):
                matched += 1
                run_result = await self._execute_actions(rule, payload)
                runs.append(run_result)

        return {
            "rules_evaluated": len(rules),
            "rules_matched": matched,
            "runs": runs,
        }

    async def evaluate_scheduled_rules(self) -> dict[str, Any]:
        """Execute all active scheduled rules.

        In production, this would be called by a cron scheduler
        and would check schedule_cron to decide which rules to run.

        Returns:
            Summary dict with rules_evaluated and run details.
        """
        result = await self.db.execute(
            select(AutomationRule).where(
                AutomationRule.trigger_type == "schedule",
                AutomationRule.is_active == True,  # noqa: E712
            )
        )
        rules = result.scalars().all()

        runs = []
        for rule in rules:
            # For scheduled rules, conditions evaluate against current DB state
            run_result = await self._execute_actions(rule, {"trigger": "schedule"})
            runs.append(run_result)

        return {
            "rules_evaluated": len(rules),
            "runs": runs,
        }

    async def _execute_actions(
        self, rule: AutomationRule, trigger_data: dict[str, Any]
    ) -> dict[str, Any]:
        """Execute all actions defined in a rule and log the run.

        Returns:
            Dict with rule info and execution results.
        """
        started_at = datetime.now(timezone.utc)
        actions_executed: list[dict] = []
        status = "success"
        error_message = None

        for action_def in rule.actions:
            try:
                result = await execute_action(self.db, action_def, trigger_data, rule.org_id)
                actions_executed.append({
                    "action_type": action_def.get("type", "unknown"),
                    "status": "success",
                    "result": result,
                })
            except Exception as exc:
                logger.exception("Action execution failed: %s", action_def)
                actions_executed.append({
                    "action_type": action_def.get("type", "unknown"),
                    "status": "failed",
                    "error": str(exc),
                })
                status = "partial"
                error_message = str(exc)

        if not actions_executed:
            status = "skipped"

        # Persist the run record
        run = AutomationRun(
            rule_id=rule.id,
            trigger_data=trigger_data,
            actions_executed=actions_executed,
            status=status,
            error_message=error_message,
            started_at=started_at,
            completed_at=datetime.now(timezone.utc),
        )
        self.db.add(run)
        await self.db.commit()
        await self.db.refresh(run)

        return {
            "run_id": str(run.id),
            "rule_id": str(rule.id),
            "rule_name": rule.name,
            "status": status,
            "actions_executed": actions_executed,
        }
