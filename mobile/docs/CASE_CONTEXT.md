# Project Overview

This project is a mobile inspection application for industrial / energy facility equipment.
The main field user is an inspector / field worker / обходчик.
The app is used during equipment rounds and inspections in production environments.

# Product Goal

Digitize the current paper-based inspection workflow and turn it into a fast, traceable, mobile-first process.
The app should help field personnel:

- receive assigned tasks
- follow an inspection route
- inspect equipment
- fill checklists
- enter measurements
- attach photo evidence
- report defects / anomalies
- send results back to the system

# Current Scope

Only Stage 1 MVP is in scope right now.
This is not a full enterprise platform.
Do not build Stage 2 or Stage 3 features unless explicitly requested later.

# Stage 1 MVP Focus

The current mobile app should focus on the inspector flow only.
Core Stage 1 capabilities:

- task list
- task details
- route / equipment list
- equipment inspection flow
- checklist filling
- measurement input
- photo attachment
- defect / issue reporting
- simple offline-first behavior
- result submission / sync state
- clear task completion status

# Primary User

## Inspector / Обходчик

Main responsibilities in the app:

- view assigned inspection tasks
- open a task
- follow route / equipment sequence
- inspect each equipment item
- fill checklist items
- enter measurements
- attach photo evidence
- report defects
- complete and submit the task

# Secondary Context User

## Supervisor / Manager

This role is context only for the mobile product at this stage.
The supervisor:

- creates and assigns rounds
- monitors execution
- reviews results
- reviews defects

But supervisor UI is not the current focus of this Flutter mobile app.

# Real-World Workflow

The intended business flow is:

1. Supervisor creates and assigns a round / task
2. Inspector receives the assigned task
3. Inspector opens the task on the mobile app
4. Inspector performs the inspection
5. Inspector fills checklist items
6. Inspector enters readings / measurements
7. Inspector attaches photos when needed
8. Inspector reports defects if found
9. Inspector submits results
10. Results are later reviewed by management

# Problem Being Solved

The current process is mostly paper-based and manual.
That causes:

- delayed data transfer
- human error
- incomplete or inconsistent information
- slow reporting
- weak traceability
- delayed defect escalation
- extra manual re-entry into systems

# Language Rule

The app must support **three user-facing languages**:

- **Russian** (default)
- **Turkish**
- **English**

All visible product UI strings (titles, labels, buttons, statuses, placeholders, section titles, empty states, dialogs, snackbars, and demo/mock copy shown to the user) must be provided through the **central in-app localization layer** (`lib/core/localization/`, e.g. `AppStrings` / `stringsFor` / `context.strings`). **Do not hardcode** user-visible text directly in feature widgets for new work; add or extend entries in that system instead.

Technical identifiers (class names, file names, APIs, variables) remain in **English**.

# Product Principles

The app must feel practical for real industrial field use:

- fast
- clear
- minimal
- reliable
- low cognitive load
- large tap targets
- simple forms
- no unnecessary decorative complexity
- professional industrial look
- suitable for quick use during rounds

# UI/UX Guidelines

The mobile interface should:

- prioritize clarity over decoration
- use large touch-friendly controls
- support quick one-hand data entry where possible
- minimize typing friction
- make status obvious
- make task progress obvious
- keep screens clean and structured
- avoid overloaded dashboards inside the mobile app
- avoid excessive animations
- feel like a serious industrial tool, not a social/productivity toy

# Required Mobile Screens for Stage 1

The future app should eventually contain these core screens:

1. Splash / app start
2. Login or simple access screen
3. Task list screen
4. Task details screen
5. Route / equipment list screen
6. Equipment inspection screen
7. Checklist section
8. Measurements entry section
9. Photo attachment section
10. Defect report form
11. Review / submit screen
12. Simple offline / sync status visibility

# Suggested Visible Labels (Russian examples)

Russian is the default language; the same concepts should exist for Turkish and English in the localization source. Example Russian vocabulary:

- Задачи
- Маршрут обхода
- Оборудование
- Чек-лист
- Показания
- Фотофиксация
- Дефект
- Отправить
- Сохранено локально
- Ожидает синхронизации
- Выполнено
- В процессе
- Есть проблема

These are examples, not a final locked glossary.

# Data Model Direction

The app should be designed around entities conceptually similar to:

- User
- InspectionTask
- Assignment
- Equipment
- ChecklistItem
- ChecklistResult
- Measurement
- DefectReport
- PhotoAttachment
- SyncStatus

Names do not have to be exactly these later, but the domain model should reflect this logic.

# Example Measurement Types

Measurement fields should be generic and extensible.
Examples:

- temperature
- pressure
- vibration
- status note
- observation

Do not hardcode the whole system around a single equipment type.

# Technical Guidance

For future implementation:

- stay aligned with Flutter best practices
- do not overengineer
- keep the architecture simple and extendable
- prefer a clean modular structure
- begin with mock data if needed
- think offline-first
- keep future backend integration possible
- avoid unnecessary heavy abstractions too early
- do not introduce major state management or architecture shifts without clear need
- **Supabase** may be used for **inspection report persistence** and **real media uploads** (e.g. photos, voice notes) in Stage 1; keep storage paths, table writes, and metadata in small reusable helpers, and keep the multilingual UI rule

# Out of Scope for Stage 1

Do not implement these now unless explicitly requested:

- SCADA / PLC integration
- IoT integration
- digital twin
- predictive maintenance
- real AI anomaly prediction
- enterprise-grade role matrix
- full ERP integration
- complex web admin inside this mobile project
- heavy analytics platform behavior

# Development Discipline

For every future code generation step, check:

1. Does this directly support the Stage 1 inspector mobile MVP?
2. Is this the minimum clean implementation?
3. Does this avoid unnecessary complexity?
4. Does it preserve future extensibility?

If the answer is no, state that clearly before proposing changes.

# What Should NOT Happen

Do not:

- rebuild the whole project without reason
- change architecture prematurely
- add many packages early without necessity
- implement Stage 2 / Stage 3 ideas too early
- create fake enterprise complexity
- mix supervisor web/admin features into the mobile app unless explicitly requested
- turn the MVP into a generic demo unrelated to industrial inspections

# Future Working Style

Every next implementation request should follow this order:

1. re-read this case context
2. confirm alignment with Stage 1 scope
3. implement the smallest clean useful slice
4. preserve multilingual UI via the centralized localization system (Russian default; Turkish and English supported)
5. avoid unrelated modifications
