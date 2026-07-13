# {{project_name}} documentation

## Project snapshot

- Purpose: {{project_purpose}}
- Primary users: {{primary_users}}
- Frontend: {{frontend_or_none}}
- Backend: {{backend_or_none}}
- Data stores: {{data_stores_or_none}}
- Runtime: {{runtime}}
- External services: {{external_services_or_none}}

## Read order

1. Read `01-prd.md` for product intent, scope, and non-goals.
2. Read `02-architecture.md` for system boundaries and data flow.
3. Read only the conditional document relevant to the task.
4. Read `openspec/changes/<change>/` for the active change.

## Document map

| Document | Status | Read when |
| --- | --- | --- |
| `01-prd.md` | Current | Product behavior, scope, users, or risk is relevant |
| `02-architecture.md` | Current | Modules, data flow, dependencies, or runtime is relevant |
| `03-api.md` | {{api_doc_status}} | A public or cross-service API contract exists |
| `04-deployment.md` | {{deployment_doc_status}} | Build, migration, deploy, or rollback is relevant |
| `05-operations.md` | {{operations_doc_status}} | Monitoring, incidents, repair, or runbooks are relevant |
| `06-decisions.md` or `decisions/` | {{decisions_doc_status}} | A durable product or architecture decision must be preserved |
