# SalesFlow CRM Dashboard

A modern CRM (Customer Relationship Management) dashboard for managing leads, contacts, pipelines, activities, and sales performance.

## Features

### Dashboard

* KPI cards

  * Total Leads
  * Open Deals
  * Revenue
  * Conversion Rate
* Revenue analytics
* Deal stage distribution
* Recent activities

### Contacts Management

* Create contact
* Edit contact
* Delete contact
* Search contacts
* Filter contacts
* Sort contacts
* Contact profile page

### Contact Detail

* Personal information
* Notes timeline
* Activity history
* Related deals

### Sales Pipeline

* Kanban board
* Drag & drop deals
* Stages:

  * New
  * Qualified
  * Proposal
  * Won
  * Lost

### Activity Feed

* Calls
* Emails
* Meetings
* Notes

### User Management

* Authentication
* Authorization
* Role-based access
* Admin dashboard
* Sales representative dashboard

### Settings

* Profile management
* Password change
* Theme preferences
* Notification settings

### UI Features

* Dark mode
* Light mode
* Responsive design
* Mobile friendly

---

## Tech Stack

### Frontend

* React
* Vite
* Tailwind CSS
* React Query
* React Router
* React Hook Form
* DnD Kit
* Recharts
* Axios

### Backend

* Node.js
* Express.js
* PostgreSQL
* JWT Authentication
* Prisma ORM

---

## Folder Structure

### Frontend

```bash
src/
├── api/
├── components/
│   ├── common/
│   ├── dashboard/
│   ├── contacts/
│   ├── pipeline/
│   └── activities/
├── hooks/
├── layouts/
├── pages/
│   ├── Dashboard/
│   ├── Contacts/
│   ├── ContactDetail/
│   ├── Pipeline/
│   ├── Activities/
│   └── Settings/
├── routes/
├── store/
├── utils/
└── App.jsx
```

### Backend

```bash
src/
├── controllers/
├── middleware/
├── routes/
├── services/
├── prisma/
├── validations/
├── utils/
└── server.js
```

---

## Database Schema

### Users

```sql
id
name
email
password
role
created_at
```

### Contacts

```sql
id
first_name
last_name
email
phone
company
job_title
status
owner_id
created_at
```

### Deals

```sql
id
title
value
stage
contact_id
owner_id
expected_close_date
created_at
```

### Activities

```sql
id
type
description
contact_id
user_id
created_at
```

### Notes

```sql
id
content
contact_id
created_by
created_at
```

---

## API Endpoints

### Authentication

```http
POST /api/auth/login
POST /api/auth/register
GET  /api/auth/profile
```

### Contacts

```http
GET    /api/contacts
POST   /api/contacts
GET    /api/contacts/:id
PUT    /api/contacts/:id
DELETE /api/contacts/:id
```

### Deals

```http
GET    /api/deals
POST   /api/deals
PUT    /api/deals/:id
DELETE /api/deals/:id
```

### Activities

```http
GET    /api/activities
POST   /api/activities
```

---

## Roles

### Admin

* View all contacts
* View all deals
* Manage users
* View analytics

### Sales Representative

* View own contacts
* Manage own deals
* Manage own activities

---

## Installation

### Frontend

```bash
cd crm-dashboard-frontend

npm install

npm run dev
```

### Backend

```bash
cd crm-dashboard-backend

npm install

npm run dev
```

---

## Future Improvements

* Email integration
* Calendar integration
* AI lead scoring
* Automated workflows
* Team reporting
* Customer segmentation
* WebSocket real-time updates
* Export reports (CSV/PDF)

---

## Demo Credentials

```text
Admin
admin@example.com
password123

Sales Rep
sales@example.com
password123
```

---

## License

MIT
