"""Task management routes."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from shared.auth import TokenPayload, get_current_user
from shared.audit import write_audit_log
from shared.database import get_db
from shared.events import EVENT_TASK_CREATED, EventBus
from shared.models import Task

router = APIRouter()
_event_bus = EventBus()


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class TaskCreate(BaseModel):
    queue: str = "general"
    title: str
    description: str | None = None
    priority: str = "medium"
    due_date: datetime | None = None
    assignee_id: UUID | None = None
    linked_entity_type: str | None = None
    linked_entity_id: UUID | None = None


class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    priority: str | None = None
    due_date: datetime | None = None
    assignee_id: UUID | None = None
    status: str | None = None


class TaskResponse(BaseModel):
    id: UUID
    org_id: UUID
    queue: str
    title: str
    description: str | None = None
    priority: str
    due_date: datetime | None = None
    assignee_id: UUID | None = None
    linked_entity_type: str | None = None
    linked_entity_id: UUID | None = None
    status: str
    completed_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TaskListResponse(BaseModel):
    items: list[TaskResponse]
    total: int
    page: int
    page_size: int


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("", response_model=TaskListResponse)
async def list_tasks(
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    queue: str | None = None,
    status_filter: str | None = Query(None, alias="status"),
    assignee_id: UUID | None = None,
    priority: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
):
    org_id = UUID(current_user.org_id)
    query = select(Task).where(Task.org_id == org_id)
    count_q = select(func.count()).select_from(Task).where(Task.org_id == org_id)

    if queue:
        query = query.where(Task.queue == queue)
        count_q = count_q.where(Task.queue == queue)
    if status_filter:
        query = query.where(Task.status == status_filter)
        count_q = count_q.where(Task.status == status_filter)
    if assignee_id:
        query = query.where(Task.assignee_id == assignee_id)
        count_q = count_q.where(Task.assignee_id == assignee_id)
    if priority:
        query = query.where(Task.priority == priority)
        count_q = count_q.where(Task.priority == priority)

    total = (await db.execute(count_q)).scalar() or 0
    offset = (page - 1) * page_size
    rows = (await db.execute(
        query.order_by(Task.created_at.desc()).offset(offset).limit(page_size)
    )).scalars().all()

    return TaskListResponse(items=rows, total=total, page=page, page_size=page_size)


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    body: TaskCreate,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    task = Task(
        org_id=UUID(current_user.org_id),
        queue=body.queue,
        title=body.title,
        description=body.description,
        priority=body.priority,
        due_date=body.due_date,
        assignee_id=body.assignee_id,
        linked_entity_type=body.linked_entity_type,
        linked_entity_id=body.linked_entity_id,
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)

    await write_audit_log(
        db,
        org_id=UUID(current_user.org_id),
        actor_id=UUID(current_user.user_id),
        actor_type="user",
        action="task.created",
        entity_type="task",
        entity_id=task.id,
        after_state={"title": task.title, "queue": task.queue.value},
        source="api",
    )

    await _event_bus.publish(EVENT_TASK_CREATED, {
        "task_id": str(task.id),
        "org_id": current_user.org_id,
        "queue": body.queue,
        "title": body.title,
    })

    return task


@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: UUID,
    body: TaskUpdate,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    org_id = UUID(current_user.org_id)
    result = await db.execute(select(Task).where(Task.id == task_id, Task.org_id == org_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(task, field, value)
    await db.commit()
    await db.refresh(task)
    return task


@router.post("/{task_id}/complete", response_model=TaskResponse)
async def complete_task(
    task_id: UUID,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    org_id = UUID(current_user.org_id)
    result = await db.execute(select(Task).where(Task.id == task_id, Task.org_id == org_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    task.status = "completed"
    task.completed_at = datetime.utcnow()
    await db.commit()
    await db.refresh(task)

    await write_audit_log(
        db,
        org_id=org_id,
        actor_id=UUID(current_user.user_id),
        actor_type="user",
        action="task.completed",
        entity_type="task",
        entity_id=task.id,
        after_state={"status": "completed"},
        source="api",
    )

    return task
