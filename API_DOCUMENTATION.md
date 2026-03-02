# API Documentation

Base URL: `http://localhost:1337/api`

Authentication:
- Public auth endpoints use the Strapi `users-permissions` plugin.
- Protected endpoints require `Authorization: Bearer <jwt>`.
- Roles are stored on the same `users-permissions` user record. Use `role: "user"` or `role: "admin"` during signup.

## 1. Auth APIs

### Register
- Method: `POST`
- URL: `/auth/local/register`
- Description: Create a user and assign a `user` or `admin` role on the same user model.

Request body:
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "Secret123",
  "bio": "Frontend developer",
  "location": "Lahore",
  "profile_image": 1,
  "role": "user"
}
```

Notes:
- `role` accepts only `user` or `admin`.
- If `user` role does not exist, the system falls back to Strapi's default `authenticated` role.
- `profile_image` should be a media ID already uploaded to Strapi.

### Login
- Method: `POST`
- URL: `/auth/local`

Request body:
```json
{
  "identifier": "john@example.com",
  "password": "Secret123"
}
```

Response includes:
- `jwt`
- `user`

### Logout
- Method: Client-side action
- Description: Remove the stored JWT token on the frontend. No custom backend logout endpoint is required for JWT auth.

## 2. User APIs

### Get My Profile
- Method: `GET`
- URL: `/users/me`
- Auth: Required

Body: none

### Update My Profile
- Method: `PUT`
- URL: `/users/me`
- Auth: Required

Request body:
```json
{
  "username": "john_doe_updated",
  "email": "john.updated@example.com",
  "bio": "Updated bio",
  "location": "Karachi",
  "profile_image": 2
}
```

Allowed fields:
- `username`
- `email`
- `bio`
- `location`
- `profile_image`

### List My Skills
- Method: `GET`
- URL: `/users/me/skills`
- Auth: Required

Optional query params:
- `status=pending|approved|rejected`
- `type=OFFER|REQUEST`

### Create My Skill
- Method: `POST`
- URL: `/users/me/skills`
- Auth: Required

Request body:
```json
{
  "title": "Web Design Basics",
  "type": "OFFER",
  "description_text": "I can teach HTML, CSS and responsive layouts.",
  "skill_level": "Beginner",
  "location": "Remote",
  "category": 1,
  "availability_slots": [
    {
      "date": "2026-03-05",
      "start_time": "10:00:00",
      "end_time": "12:00:00"
    },
    {
      "date": "2026-03-06",
      "start_time": "14:00:00",
      "end_time": "16:00:00"
    }
  ],
  "images": [3, 4]
}
```

Notes:
- New skills are automatically created with `approval_status: "pending"`.
- Metrics fields are initialized automatically.
- `skill_level` accepts `Beginner`, `Intermediate`, or `Expert`.
- `availability_slots` is a JSON array of date/time slot objects.

### Get One of My Skills
- Method: `GET`
- URL: `/users/me/skills/:id`
- Auth: Required

Body: none

### Update My Skill
- Method: `PUT`
- URL: `/users/me/skills/:id`
- Auth: Required

Request body:
```json
{
  "title": "Advanced Web Design",
  "type": "OFFER",
  "description_text": "Updated description.",
  "skill_level": "Expert",
  "location": "Islamabad",
  "category": 2,
  "availability_slots": [
    {
      "date": "2026-03-10",
      "start_time": "09:00:00",
      "end_time": "11:00:00"
    }
  ],
  "images": [5]
}
```

Notes:
- Updating a skill resets it to `approval_status: "pending"` for re-review.

### Delete My Skill
- Method: `DELETE`
- URL: `/users/me/skills/:id`
- Auth: Required

Body: none

## 3. Admin APIs

All admin APIs require a logged-in user whose role contains `admin`.

### Dashboard Stats
- Method: `GET`
- URL: `/admin/dashboard`
- Auth: Required

Body: none

Response includes:
- `totalUsers`
- `totalCategories`
- `totalSkills`
- `pendingSkills`
- `approvedSkills`
- `rejectedSkills`

### List Users
- Method: `GET`
- URL: `/admin/users`
- Auth: Required

Optional query params:
- `q=<search by username/email>`
- `blocked=true|false`
- `status=active|inactive`

### Get User by ID
- Method: `GET`
- URL: `/admin/users/:id`
- Auth: Required

Body: none

### Update User
- Method: `PUT`
- URL: `/admin/users/:id`
- Auth: Required

Request body:
```json
{
  "username": "jane_admin",
  "email": "jane@example.com",
  "bio": "Updated by admin",
  "location": "Multan",
  "blocked": false,
  "confirmed": true,
  "profile_image": 6,
  "role": "admin"
}
```

Allowed fields:
- `username`
- `email`
- `bio`
- `location`
- `blocked`
- `confirmed`
- `profile_image`
- `role` (`user` or `admin`)

### Delete User
- Method: `DELETE`
- URL: `/admin/users/:id`
- Auth: Required

Body: none

### Activate User
- Method: `PUT`
- URL: `/admin/users/:id/activate`
- Auth: Required

Body: none

Response:
```json
{
  "message": "User activated successfully.",
  "user": {
    "id": 12,
    "username": "john_doe",
    "blocked": false
  }
}
```

### Deactivate User
- Method: `PUT`
- URL: `/admin/users/:id/deactivate`
- Auth: Required

Body: none

Response:
```json
{
  "message": "User deactivated successfully.",
  "user": {
    "id": 12,
    "username": "john_doe",
    "blocked": true
  }
}
```

### List Categories
- Method: `GET`
- URL: `/admin/categories`
- Auth: Required

Body: none

### Create Category
- Method: `POST`
- URL: `/admin/categories`
- Auth: Required

Request body:
```json
{
  "name": "Technical Skills",
  "description": "Programming, data, software and IT skills.",
  "icon": 7
}
```

### Update Category
- Method: `PUT`
- URL: `/admin/categories/:id`
- Auth: Required

Request body:
```json
{
  "name": "Digital Skills",
  "description": "Updated category description",
  "icon": 8
}
```

### Delete Category
- Method: `DELETE`
- URL: `/admin/categories/:id`
- Auth: Required

Body: none

### List Skills
- Method: `GET`
- URL: `/admin/skills`
- Auth: Required

Optional query params:
- `status=pending|approved|rejected`
- `type=OFFER|REQUEST`

### Moderate Skill
- Method: `PUT`
- URL: `/admin/skills/:id/moderate`
- Auth: Required

Request body:
```json
{
  "status": "approved"
}
```

Allowed values:
- `pending`
- `approved`
- `rejected`

## 4. Notes for Frontend Integration

- Send `Content-Type: application/json`.
- These custom controllers accept either plain JSON or Strapi-style wrapped JSON:

Plain JSON:
```json
{
  "title": "Web Design Basics"
}
```

Wrapped JSON:
```json
{
  "data": {
    "title": "Web Design Basics"
  }
}
```

- For media fields like `profile_image`, `images`, and `icon`, upload files first, then pass the returned media IDs.
