import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';

// ─── Auth Slice ───────────────────────────────────────────────────────────────
interface AuthState {
  isLoggedIn: boolean;
  userId: number | null;
  firstName: string | null;
  token: string | null;
}

const authSlice = createSlice({
  name: 'auth',
  initialState: { isLoggedIn: false, userId: null, firstName: null, token: null } as AuthState,
  reducers: {
    loginSuccess: (state, action: PayloadAction<{ userId: number; firstName: string; token: string }>) => {
      state.isLoggedIn = true;
      state.userId = action.payload.userId;
      state.firstName = action.payload.firstName;
      state.token = action.payload.token;
    },
    logout: (state) => {
      state.isLoggedIn = false;
      state.userId = null;
      state.firstName = null;
      state.token = null;
    },
  },
});

// ─── User Slice ───────────────────────────────────────────────────────────────
interface UserState {
  profile: any | null;
  loading: boolean;
}

const userSlice = createSlice({
  name: 'user',
  initialState: { profile: null, loading: false } as UserState,
  reducers: {
    setProfile: (state, action) => { state.profile = action.payload; },
    setLoading: (state, action) => { state.loading = action.payload; },
  },
});

// ─── Medications Slice ────────────────────────────────────────────────────────
const medicationsSlice = createSlice({
  name: 'medications',
  initialState: { list: [] as any[], loading: false },
  reducers: {
    setMedications: (state, action) => { state.list = action.payload; },
    addMedication: (state, action) => { state.list.unshift(action.payload); },
    removeMedication: (state, action) => {
      state.list = state.list.filter(m => m.id !== action.payload);
    },
    setLoading: (state, action) => { state.loading = action.payload; },
  },
});

// ─── Store ────────────────────────────────────────────────────────────────────
export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    user: userSlice.reducer,
    medications: medicationsSlice.reducer,
  },
});

export const { loginSuccess, logout } = authSlice.actions;
export const { setProfile, setLoading: setUserLoading } = userSlice.actions;
export const { setMedications, addMedication, removeMedication } = medicationsSlice.actions;

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
