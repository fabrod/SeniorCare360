# SeniorCare360 Runbook

## What This App Supports

SeniorCare360 is split into an Expo React Native frontend and a FastAPI backend.

Core user workflows:

- Account registration and login with JWT auth.
- Senior profile, insurance, and delivery address management.
- Medication tracking, refill status, and home delivery requests.
- Health vitals logging for blood pressure, glucose, heart rate, weight, oxygen, and temperature.
- Appointment tracking.
- Emergency contacts and SOS alerts.
- Family Circle trusted contact management.
- Senior benefits/resources lookup.

## Frontend Setup

Required frontend env:

```env
EXPO_PUBLIC_API_URL=https://seniorcare360-api.onrender.com
```

For a local backend on the same computer:

```env
EXPO_PUBLIC_API_URL=http://localhost:8000
```

For Expo Go on a physical phone, use your computer LAN IP instead of `localhost`:

```env
EXPO_PUBLIC_API_URL=http://192.168.x.x:8000
```

Run the frontend:

```bash
npm install
npm run web
```

or:

```bash
npm run ios
npm run android
```

## Backend Setup

Required backend env:

```env
DATABASE_URL=postgresql://seniorcare:seniorcare_pass@localhost:5432/seniorcare360
SECRET_KEY=seniorcare360-dev-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
ENVIRONMENT=development
```

Start Postgres and the API with Docker:

```bash
docker compose up --build
```

API health check:

```bash
curl http://localhost:8000/health
```

API docs:

```text
http://localhost:8000/docs
```

## Production Integrations

These features are currently represented in the app/API but need real provider credentials for live operation:

- Prescription delivery: add a pharmacy/delivery partner API and set `PHARMACY_API_URL` and `PHARMACY_API_KEY`.
- SOS SMS delivery: add Twilio credentials with `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_PHONE_NUMBER`.
- Push notifications: add Expo notification sending with `EXPO_ACCESS_TOKEN`.
- Benefits data: current benefits are static backend data; connect a benefits eligibility/data provider if you want dynamic location-aware results.

## API Coverage

Implemented backend routes:

- `POST /auth/register`
- `POST /auth/login`
- `GET /users/me`
- `PUT /users/me`
- `DELETE /users/me`
- `GET /medications/`
- `POST /medications/`
- `GET /medications/{med_id}`
- `PUT /medications/{med_id}`
- `DELETE /medications/{med_id}`
- `POST /medications/request-delivery`
- `GET /medications/deliveries/history`
- `GET /medications/deliveries/{delivery_id}`
- `GET /vitals/`
- `POST /vitals/`
- `DELETE /vitals/{vital_id}`
- `GET /appointments/`
- `POST /appointments/`
- `PUT /appointments/{appt_id}/complete`
- `DELETE /appointments/{appt_id}`
- `GET /emergency/contacts`
- `POST /emergency/contacts`
- `DELETE /emergency/contacts/{contact_id}`
- `POST /emergency/sos`
- `GET /family/`
- `POST /family/`
- `PUT /family/{member_id}`
- `DELETE /family/{member_id}`
- `GET /benefits/`

## Quick Smoke Test

1. Start backend and frontend.
2. Register a new user.
3. Edit profile and add a delivery address.
4. Add a medication.
5. Request delivery for that medication.
6. Add an emergency contact.
7. Trigger SOS in a non-emergency test context.
8. Add a Family Circle member.
9. Log one vital reading.
10. Add one appointment.
11. Open Benefits and confirm the resource list loads.
