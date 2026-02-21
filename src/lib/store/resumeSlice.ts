import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface BasicInfo {
  fullName: string;
  title: string;
  yearsOfExperience: string;
  email: string;
  phone: string;
  location: string;
}

export interface Experience {
  id: string;
  position: string;
  company: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
}

export interface Preferences {
  language: string;
  tone: string;
}

export interface ResumeState {
  template: string;
  basicInfo: BasicInfo;
  experience: Experience[];
  skills: string[];
  education: Education[];
  preferences: Preferences;
}

const initialState: ResumeState = {
  template: "professional",
  basicInfo: {
    fullName: "",
    title: "",
    yearsOfExperience: "",
    email: "",
    phone: "",
    location: "",
  },
  experience: [],
  skills: [],
  education: [],
  preferences: {
    language: "English",
    tone: "Professional",
  },
};

// Load from localStorage if available
const loadState = (): ResumeState => {
  if (typeof window === "undefined") return initialState;
  try {
    const serializedState = localStorage.getItem("resume_builder_state");
    if (serializedState === null) return initialState;
    return JSON.parse(serializedState);
  } catch (err) {
    return initialState;
  }
};

const resumeSlice = createSlice({
  name: "resume",
  initialState: loadState(),
  reducers: {
    setTemplate: (state, action: PayloadAction<string>) => {
      state.template = action.payload;
    },
    updateBasicInfo: (state, action: PayloadAction<Partial<BasicInfo>>) => {
      state.basicInfo = { ...state.basicInfo, ...action.payload };
    },
    setExperience: (state, action: PayloadAction<Experience[]>) => {
      state.experience = action.payload;
    },
    addExperience: (state, action: PayloadAction<Experience>) => {
      state.experience.push(action.payload);
    },
    updateExperience: (state, action: PayloadAction<{ id: string; data: Partial<Experience> }>) => {
      const index = state.experience.findIndex((exp) => exp.id === action.payload.id);
      if (index !== -1) {
        state.experience[index] = { ...state.experience[index], ...action.payload.data };
      }
    },
    removeExperience: (state, action: PayloadAction<string>) => {
      state.experience = state.experience.filter((exp) => exp.id !== action.payload);
    },
    setSkills: (state, action: PayloadAction<string[]>) => {
      state.skills = action.payload;
    },
    addSkill: (state, action: PayloadAction<string>) => {
      if (!state.skills.includes(action.payload)) {
        state.skills.push(action.payload);
      }
    },
    removeSkill: (state, action: PayloadAction<string>) => {
      state.skills = state.skills.filter((skill) => skill !== action.payload);
    },
    setEducation: (state, action: PayloadAction<Education[]>) => {
      state.education = action.payload;
    },
    addEducation: (state, action: PayloadAction<Education>) => {
      state.education.push(action.payload);
    },
    updateEducation: (state, action: PayloadAction<{ id: string; data: Partial<Education> }>) => {
      const index = state.education.findIndex((edu) => edu.id === action.payload.id);
      if (index !== -1) {
        state.education[index] = { ...state.education[index], ...action.payload.data };
      }
    },
    removeEducation: (state, action: PayloadAction<string>) => {
      state.education = state.education.filter((edu) => edu.id !== action.payload);
    },
    updatePreferences: (state, action: PayloadAction<Partial<Preferences>>) => {
      state.preferences = { ...state.preferences, ...action.payload };
    },
    resetResume: () => initialState,
  },
});

export const {
  setTemplate,
  updateBasicInfo,
  setExperience,
  addExperience,
  updateExperience,
  removeExperience,
  setSkills,
  addSkill,
  removeSkill,
  setEducation,
  addEducation,
  updateEducation,
  removeEducation,
  updatePreferences,
  resetResume,
} = resumeSlice.actions;

export default resumeSlice.reducer;
